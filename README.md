Neobookings — Hackathon README

Brief


Who we are

- Team: VAN developers
- Context: First hackathon participation; focused on combining LLMs, MCP and blockchain for travel bookings.
- One-liner: An intelligent booking engine for hotels and travel suppliers, designed to aggregate multiple providers and simplify booking workflows.

The challenge

Build an "intelligent travel itinerary booking platform" that allows travel agents, AI agents or authorized parties to compose and book travel services across multiple suppliers. Key expectations:
- Intelligent matching by destination, service type, price, quality metrics and availability
- Supplier discovery / up-to-date catalogue and realtime synchronization
- Routing based on availability, quality scoring, compliance and commercial rules
- Instant on-chain payments (USDC or Monerium EURe) with transparency and auditability
- Optimize for speed, cost-effectiveness and traceability

Solution summary

We built a hybrid interaction model combining a conversational AI and a classic form-based UI. The core components are:

- FrontEnd (Vue): conversational UI + classic search form
- MCP API: orchestrates the LLM (GPT-4o) and exposes Tools to the model
- Proxy API (Node/Express): an intelligent translator/adaptor that connects with multiple suppliers (Camino Messenger, Neobookings, Expedia, etc.) and returns normalized JSON
- Camino Messenger: used as a B2B-proven dispatcher & supplier standardization layer
- Blockchain layer: enables instant settlement with USDC or EURe for demoed decentralised payments

Architecture (high level)

FrontEnd (Vue) → REST API → MCP (LLM + Tools) → Proxy API → Supplier APIs (Camino/Neobookings/Expedia...) → Proxy → MCP (refine) → FrontEnd (render)

How it works — The flow

1. Input: the user writes in natural language (example: "Find hotels in Barcelona for 2 people from June 1 to June 7, 2025").
2. Interpretation: FrontEnd sends the text to the MCP REST API. The LLM (GPT-4o) interprets the intent and knows the available Tools.
3. Decision: the LLM extracts parameters (location, dates, guests, filters) and decides which Tool to call (e.g. `search_availability`).
4. Execute (MCP): the MCP executes the Tool; instead of calling a supplier directly, it calls our Proxy API.
5. Proxy API (Translator): the Proxy adapts the MCP call to the specific supplier API (Camino, Neobookings, Expedia...) and returns raw supplier JSON.
6. Refine (LLM): the LLM receives raw results, filters out unavailable items, sorts by price/quality, converts technical fields into friendly text and applies post-filters (e.g. "only hotels with a pool") if not natively supported by the supplier.
7. Render: the FrontEnd receives a clean, humanized JSON with structured data ready to display.

Hybrid Interaction Model — value

- Users can interact via chat (AI) or a traditional search form.
- AI agents, human operators and B2B workflows use the MCP to orchestrate bookings and payments.
- The Proxy API isolates supplier specifics — adding new suppliers doesn’t require retraining or changing the LLM/MCP logic.

Limitations & challenges

- We didn’t have time to implement combined hotel+travel package searches in the demo, but the architecture supports it.
- Significant time was spent building the Camino Messenger bot, wallets and reading documentation.
- Integration friction: wallets, CORS and frontend-backend connectivity required troubleshooting and consumed dev time.

Next steps / Roadmap

- Add transfers and activities to the supplier catalogue.
- Move from single-prompt flow to a persistent conversational session for richer planning.
- Implement a supplier catalogue with real-time sync and intelligent caching.
- Add on-chain payment flows with EUDI Wallet support and delegated booking credentials.
- Add quality scoring, reputation metrics and richer routing rules for supplier selection.

Repository structure (high-level)

- FrontEnd/: Vue application (chat + classic search)
- MCP API/: LLM orchestration and Tools
- Proxy API/: Node/Express translator for supplier integrations
- MCP API, FrontEnd and Proxy API folders contain their own README / module docs with implementation details

Quick development notes (adapt to the repo scripts)

To run the frontend or backend, inspect each package.json for exact scripts. Typical commands (adjust if your repo uses yarn/pnpm):

cd FrontEnd; npm install; npm run dev
cd "MCP API"; npm install; npm run dev
cd "Proxy API"; npm install; npm run dev
