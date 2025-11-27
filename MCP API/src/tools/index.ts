import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as searchAccommodation from './searchAccommodation.js';
import * as searchFlights from './searchFlights.js';
import * as getAccommodationList from './getAccommodationList.js';
import * as getAccommodationInfo from './getAccommodationInfo.js';
import * as getFlightList from './getFlightList.js';
import * as validateOption from './validateOption.js';
import * as createBooking from './createBooking.js';

const tools = [
  searchAccommodation,
  searchFlights,
  getAccommodationList,
  getAccommodationInfo,
  getFlightList,
  validateOption,
  createBooking,
];

export function registerTools(server: McpServer): void {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.schema.shape,
      },
      tool.handler
    );
  }
}
