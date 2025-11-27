#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { z } from 'zod';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

// Import all tools
import * as searchAccommodation from './tools/searchAccommodation.js';
import * as searchFlights from './tools/searchFlights.js';
import * as getAccommodationList from './tools/getAccommodationList.js';
import * as getAccommodationInfo from './tools/getAccommodationInfo.js';
import * as getFlightList from './tools/getFlightList.js';
import * as validateOption from './tools/validateOption.js';
import * as createBooking from './tools/createBooking.js';
import { env } from './config/env.js';

// ==================== TOOLS SETUP ====================

const tools = [
  searchAccommodation,
  searchFlights,
  getAccommodationList,
  getAccommodationInfo,
  getFlightList,
  validateOption,
  createBooking,
];

// Convert a single Zod type to JSON Schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodTypeToJsonSchema(zodType: z.ZodType): Record<string, unknown> {
  const prop: Record<string, unknown> = {};

  // Unwrap optional/default to get base type
  let baseType = zodType;

  // Check for optional wrapper
  if (zodType.isOptional && zodType.isOptional()) {
    // @ts-expect-error - accessing internal
    baseType = zodType.def?.innerType || zodType;
  }

  // Check for default wrapper
  // @ts-expect-error - accessing internal
  if (baseType.def?.defaultValue !== undefined) {
    // @ts-expect-error - accessing internal
    baseType = baseType.def?.innerType || baseType;
  }

  // Determine the JSON Schema type
  const typeName = baseType.constructor.name;

  if (typeName.includes('String')) {
    prop.type = 'string';
  } else if (typeName.includes('Number') || typeName.includes('Int')) {
    prop.type = 'number';
  } else if (typeName.includes('Boolean')) {
    prop.type = 'boolean';
  } else if (typeName.includes('Array')) {
    prop.type = 'array';
    // Get the array element type
    // @ts-expect-error - accessing internal
    const elementType = baseType.def?.element || baseType.def?.type;
    if (elementType) {
      prop.items = zodTypeToJsonSchema(elementType);
    } else {
      // Fallback: try to infer from constructor name
      prop.items = { type: 'string' };
    }
  } else if (typeName.includes('Object')) {
    prop.type = 'object';
    // @ts-expect-error - accessing internal
    if (baseType.shape) {
      // @ts-expect-error - accessing internal
      const nested = zodObjectToJsonSchema(baseType);
      Object.assign(prop, nested);
    }
  } else if (typeName.includes('Enum')) {
    prop.type = 'string';
    // @ts-expect-error - accessing internal
    if (baseType.def?.values) {
      // @ts-expect-error - accessing internal
      prop.enum = baseType.def.values;
    }
  } else {
    prop.type = 'string'; // fallback
  }

  // Get description
  // @ts-expect-error - accessing internal
  const description = zodType.def?.description;
  if (description) {
    prop.description = description;
  }

  return prop;
}

// Convert Zod v4 object schema to JSON Schema for OpenAI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodObjectToJsonSchema(schema: z.ZodObject<any>): Record<string, unknown> {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodType = value as z.ZodType;

    // Check if optional or has default
    let isOptional = false;
    let hasDefault = false;

    if (zodType.isOptional && zodType.isOptional()) {
      isOptional = true;
    }

    // @ts-expect-error - accessing internal
    if (zodType.def?.defaultValue !== undefined) {
      hasDefault = true;
    }

    properties[key] = zodTypeToJsonSchema(zodType);

    // Add to required if not optional and no default
    if (!isOptional && !hasDefault) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

// Convert Zod schemas to OpenAI function format
function getOpenAITools(): ChatCompletionTool[] {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parameters: zodObjectToJsonSchema(tool.schema as any),
    },
  }));
}

// Handler lookup map
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolHandlers = new Map<string, (params: any) => Promise<{ content: Array<{ type: string; text: string }> }>>();
for (const tool of tools) {
  toolHandlers.set(tool.name, tool.handler as (params: unknown) => Promise<{ content: Array<{ type: string; text: string }> }>);
}

// ==================== SESSION MANAGEMENT ====================

interface Session {
  messages: ChatCompletionMessageParam[];
  createdAt: Date;
  lastActivity: Date;
}

const sessions = new Map<string, Session>();

// Cleanup old sessions every 5 minutes
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.lastActivity.getTime() < oneHourAgo) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ==================== TOKEN MANAGEMENT ====================

// Approximate token limits (GPT-4o-mini has 128K context)
const MAX_CONTEXT_TOKENS = 100000; // Leave buffer for response
const MAX_TOOL_RESULT_CHARS = 8000; // ~2000 tokens per tool result
const MAX_SESSION_MESSAGES = 10; // Maximum conversation turns to keep

/**
 * Estimate tokens from text (rough approximation: 4 chars = 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate total tokens in messages array
 */
function estimateMessagesTokens(messages: ChatCompletionMessageParam[]): number {
  let total = 0;
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if ('text' in part) {
          total += estimateTokens(part.text);
        }
      }
    }
    // Add overhead for role, tool_calls, etc.
    total += 10;
  }
  return total;
}

/**
 * Truncate tool result to prevent context overflow
 */
function truncateToolResult(content: string): string {
  if (content.length <= MAX_TOOL_RESULT_CHARS) {
    return content;
  }

  // Try to parse as JSON and summarize
  try {
    const data = JSON.parse(content);
    if (data.success && data.results && Array.isArray(data.results)) {
      // Keep only first 3 results with minimal info
      const summarized = {
        success: true,
        searchId: data.searchId,
        resultsCount: data.resultsCount,
        results: data.results.slice(0, 3).map((r: Record<string, unknown>) => ({
          resultId: r.resultId,
          hotelCode: r.hotelCode,
          hotel: r.hotel ? {
            name: (r.hotel as Record<string, unknown>).name,
            stars: (r.hotel as Record<string, unknown>).stars,
            city: ((r.hotel as Record<string, unknown>).location as Record<string, unknown>)?.city,
          } : null,
          roomName: r.roomName,
          totalPrice: r.totalPrice,
          refundable: r.refundable,
        })),
        note: data.resultsCount > 3 ? `Showing 3 of ${data.resultsCount} results` : undefined,
      };
      return JSON.stringify(summarized, null, 2);
    }
  } catch {
    // Not JSON or parse error, just truncate
  }

  return content.substring(0, MAX_TOOL_RESULT_CHARS) + '\n... [truncated]';
}

/**
 * Truncate session messages to prevent context overflow
 * Uses both message count and token estimation
 */
function truncateSessionMessages(messages: ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
  // Always keep system message
  if (messages.length <= 1) return messages;

  const systemMessage = messages[0];
  let conversationMessages = messages.slice(1);

  // First pass: truncate tool results in existing messages
  conversationMessages = conversationMessages.map(msg => {
    if (msg.role === 'tool' && typeof msg.content === 'string') {
      return { ...msg, content: truncateToolResult(msg.content) };
    }
    return msg;
  });

  // Second pass: limit by message count
  if (conversationMessages.length > MAX_SESSION_MESSAGES * 2) {
    conversationMessages = conversationMessages.slice(-MAX_SESSION_MESSAGES * 2);
  }

  // Third pass: check tokens and remove oldest if needed
  let result = [systemMessage, ...conversationMessages];
  let tokens = estimateMessagesTokens(result);

  while (tokens > MAX_CONTEXT_TOKENS && conversationMessages.length > 2) {
    // Remove oldest pair (user + assistant/tool)
    conversationMessages = conversationMessages.slice(2);
    result = [systemMessage, ...conversationMessages];
    tokens = estimateMessagesTokens(result);
  }

  return result;
}

// ==================== SYSTEM PROMPT ====================

// Dynamic function to get current date in SYSTEM_PROMPT
function getSystemPrompt(): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[today.getDay()];

  return `You are a travel assistant connected to Camino Network. You MUST respond in English only.

══════════════════════════════════════════════════════════════
CURRENT DATE - IMPORTANT FOR RELATIVE DATES
══════════════════════════════════════════════════════════════

TODAY IS: ${todayStr} (${dayOfWeek})

When users say:
- "next week" → Calculate dates starting from next Monday (${getNextMonday()})
- "this weekend" → The coming Saturday/Sunday
- "tomorrow" → ${getTomorrow()}
- "in X days" → Add X days to today

ALWAYS convert relative dates to YYYY-MM-DD format before calling tools.

══════════════════════════════════════════════════════════════
SCOPE RESTRICTION - VERY IMPORTANT
══════════════════════════════════════════════════════════════`;
}

function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

const SYSTEM_PROMPT = getSystemPrompt();

const SYSTEM_PROMPT_STATIC = `You are a travel assistant connected to Camino Network. You MUST respond in English only.

══════════════════════════════════════════════════════════════
SCOPE RESTRICTION - VERY IMPORTANT
══════════════════════════════════════════════════════════════

You can ONLY help with travel-related queries:
- Hotel/accommodation searches and bookings
- Flight searches and bookings
- Travel planning (destinations, dates, guests)

If the user asks about ANYTHING else (weather, news, coding, recipes, etc.):
→ Respond: "I'm a travel assistant and can only help with hotel and flight bookings. How can I assist you with your travel plans?"

DO NOT attempt to answer non-travel questions.

══════════════════════════════════════════════════════════════
REQUIRED DATA - ASK BEFORE CALLING TOOLS
══════════════════════════════════════════════════════════════

BEFORE calling search_accommodation, you MUST have:
- ✓ Destination (city or location)
- ✓ Check-in date (explicit or relative like "next week")
- ✓ Check-out date (or number of nights)
- ✓ Number of guests

If ANY of these is missing, ASK the user:
- "What is your destination?"
- "What are your check-in and check-out dates?"
- "How many guests will be staying?"

BEFORE calling search_flights, you MUST have:
- ✓ Origin airport/city
- ✓ Destination airport/city
- ✓ Departure date
- ✓ Number of passengers (adults, children with ages)

If ANY of these is missing, ASK the user:
- "Which city are you departing from?"
- "What is your departure date?"
- "How many passengers? (adults and children)"

══════════════════════════════════════════════════════════════
TOOLS - WHEN TO USE EACH
══════════════════════════════════════════════════════════════

| Tool                    | When to use                              |
|-------------------------|------------------------------------------|
| get_accommodation_list  | Browse hotels WITHOUT dates              |
| search_accommodation    | Search availability WITH dates           |
| get_accommodation_info  | Details of ONE hotel by code             |
| search_flights          | Search flights WITH dates                |
| get_flight_list         | Route catalog (no dates)                 |
| validate_option         | Validate before booking                  |
| create_booking          | Create booking and pay                   |

══════════════════════════════════════════════════════════════
KEY RULE: AVAILABILITY vs CATALOG
══════════════════════════════════════════════════════════════

search_accommodation (REAL-TIME) - USE IF:
- "available", "availability", "what's available"
- "price", "how much", "rates", "cost"
- Explicit dates: "from 15th to 20th", "January", "December"
- Relative dates: "next week", "tomorrow", "this weekend"
- "for X people/guests" (implies real search)

get_accommodation_list (CATALOG) - ONLY IF:
- "what hotels exist", "list of hotels", "show me hotels"
- NO mention of availability, dates, or prices

CRITICAL EXAMPLE:
"available hotels in Mallorca for next week"
→ search_accommodation (has "available" + "next week")

══════════════════════════════════════════════════════════════
DATE CONVERSION
══════════════════════════════════════════════════════════════

Convert to YYYY-MM-DD format:
- "next week" → next Monday to Sunday
- "tomorrow" → tomorrow's date
- "this weekend" → next Saturday-Sunday
- "next month" → 1st to last day of next month
- "3 nights from March 10" → checkIn: 2025-03-10, checkOut: 2025-03-13

══════════════════════════════════════════════════════════════
CITY CODES (3-letter) - For Hotels
══════════════════════════════════════════════════════════════

Spain: MAD=Madrid, BCN=Barcelona, PMI=Mallorca/Palma, MAL=Marbella, IBZ=Ibiza, SEV=Sevilla, VAL=Valencia
France: PAR=Paris, NIC=Nice, CAN=Cannes, LYO=Lyon, MON=Monaco
Italy: ROM=Rome, MIL=Milan, VEN=Venice, FLO=Florence, NAP=Naples
Germany: BER=Berlin, MUN=Munich, FRA=Frankfurt, HAM=Hamburg
UK: LON=London, EDI=Edinburgh, MAN=Manchester
Portugal: LIS=Lisbon, POR=Porto, ALG=Algarve
Greece: ATH=Athens, SAN=Santorini, MYK=Mykonos
Switzerland: ZUR=Zurich, GEN=Geneva, ZER=Zermatt
Austria: VIE=Vienna, SAL=Salzburg, INS=Innsbruck
Netherlands: AMS=Amsterdam, ROT=Rotterdam
Turkey: IST=Istanbul, ANT=Antalya, BOD=Bodrum
USA: NYC=New York, MIA=Miami, LAX=Los Angeles, LAS=Las Vegas
Mexico: CUN=Cancun, RIV=Riviera Maya, CDM=Mexico City
Caribbean: PUJ=Punta Cana, AUA=Aruba
Asia: BKK=Bangkok, PHU=Phuket, SIN=Singapore, TYO=Tokyo, DPS=Bali
Emirates: DXB=Dubai, AUH=Abu Dhabi

The system automatically converts city names to codes and determines the country.

══════════════════════════════════════════════════════════════
AIRPORT CODES (IATA 3-letter) - For Flights
══════════════════════════════════════════════════════════════

- Madrid=MAD, Barcelona=BCN, Palma=PMI, Ibiza=IBZ
- Malaga=AGP, Valencia=VLC, Seville=SVQ, Bilbao=BIO
- London=LHR, Paris=CDG, Amsterdam=AMS, Rome=FCO

══════════════════════════════════════════════════════════════
BOOKING FLOW (MANDATORY)
══════════════════════════════════════════════════════════════

1. SEARCH → search_accommodation / search_flights
   └─ Returns: searchId + options with resultId

2. VALIDATE → validate_option(searchId, resultId)
   └─ Returns: validationId + current price
   ⚠️ ALWAYS validate before booking

3. CONFIRM → Show price, ask for explicit OK

4. BOOK → create_booking(validationId, travellers, expectedPrice)
   └─ Only if user confirmed

══════════════════════════════════════════════════════════════
EXAMPLES
══════════════════════════════════════════════════════════════

User: "Hotels in Mallorca for next week for 2 people"
→ search_accommodation({ destination: "Mallorca", checkIn: "[monday]", checkOut: "[sunday]", guests: 2 })

User: "What hotels are in Barcelona?" (no dates)
→ get_accommodation_list({ location: "Barcelona" })

User: "Hotels in Paris" (missing: dates, guests)
→ ASK: "What are your check-in and check-out dates, and how many guests?"

User: "Flight to London tomorrow"
→ ASK: "Which city are you departing from, and how many passengers?"

══════════════════════════════════════════════════════════════
GENERAL RULES
══════════════════════════════════════════════════════════════

- Always use validate_option BEFORE create_booking
- Confirm the amount with user before booking
- Show tx_hash after payment for blockchain transparency
- Default to 2 adults if guests not specified (mention it)
- Default currency is EUR`;

// ==================== OPENAI PROCESSING ====================

const openai = new OpenAI({ apiKey: env.openai.apiKey });

interface ProcessResult {
  text: string;
  successResult: unknown | null;
}

async function processWithOpenAI(messages: ChatCompletionMessageParam[]): Promise<ProcessResult> {
  const openAITools = getOpenAITools();
  const currentMessages = [...messages];
  let successResult: unknown | null = null;

  // Function calling loop
  while (true) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: currentMessages,
      tools: openAITools,
      tool_choice: 'auto',
    });

    const assistantMessage = completion.choices[0].message;

    // No tool calls = final response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        text: assistantMessage.content || '',
        successResult,
      };
    }

    // Add assistant message with tool calls to history
    currentMessages.push(assistantMessage);

    // Execute each tool call
    for (const toolCall of assistantMessage.tool_calls) {
      // Handle function type tool calls
      if (toolCall.type !== 'function') continue;
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      const handler = toolHandlers.get(functionName);
      let resultContent: string;

      if (!handler) {
        resultContent = JSON.stringify({ error: `Unknown function: ${functionName}` });
      } else {
        try {
          const result = await handler(functionArgs);
          resultContent = result.content[0]?.text || JSON.stringify(result);

          // Capture first successful result
          if (!successResult) {
            try {
              const parsed = JSON.parse(resultContent);
              if (parsed.success === true) {
                successResult = parsed;
              }
            } catch {
              // Not JSON, ignore
            }
          }
        } catch (error) {
          resultContent = JSON.stringify({
            error: error instanceof Error ? error.message : 'Execution error',
          });
        }
      }

      currentMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: resultContent,
      });
    }
  }
}

// ==================== EXPRESS SERVER ====================

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

// Main endpoint
app.post('/prompts', async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required (string)' });
    }

    // Get or create session
    const sid = sessionId || crypto.randomUUID();
    let session = sessions.get(sid);

    if (!session) {
      session = {
        messages: [{ role: 'system', content: SYSTEM_PROMPT }],
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      sessions.set(sid, session);
    }

    // Add user message
    session.messages.push({ role: 'user', content: prompt });
    session.lastActivity = new Date();

    // Truncate history to prevent context overflow
    session.messages = truncateSessionMessages(session.messages);

    // Process with OpenAI (with retry on context overflow)
    let text: string;
    let successResult: unknown | null;

    try {
      const result = await processWithOpenAI(session.messages);
      text = result.text;
      successResult = result.successResult;
    } catch (error) {
      // Check if it's a context overflow error
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('maximum context length') || errorMessage.includes('too many tokens')) {
        console.log('Context overflow detected, resetting session...');

        // Reset session with fresh context
        session.messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ];

        // Retry with clean session
        const result = await processWithOpenAI(session.messages);
        text = result.text;
        successResult = result.successResult;
      } else {
        throw error;
      }
    }

    // Add assistant response to session history
    session.messages.push({ role: 'assistant', content: text });

    // Return JSON data if tool succeeded, otherwise return GPT text
    const response = successResult || text;

    return res.json({
      sessionId: sid,
      response,
    });
  } catch (error) {
    console.error('Error processing prompt:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Start server
const PORT = env.http.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Camino Travel HTTP Server running on 0.0.0.0:${PORT}`);
  console.log(`POST /prompts - Send prompts to ChatGPT with travel tools`);
  console.log(`GET /health - Health check`);
});
