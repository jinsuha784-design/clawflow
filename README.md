# 🦞 ClawFlow — agentic order-flow auction (PFOF for agents)

> Turn every limit order into a sealed-bid **price-improvement auction** among autonomous
> resolver-agents. Robinhood's payment-for-order-flow — except the rebate is paid back to the user.
> **Execution on Byreal Perps · rebate + receipt settled on Mantle · agents connect over MCP.**

Built for the **Mantle Turing Test Hackathon — Agentic Economy Track (Byreal)**.
Full spec & rubric mapping: `../ClawFlow_spec.md`.

## How it works
1. **Intent** — the user agent submits `buy 0.5 BTC @ 95,000` (with its Mantle payout address).
2. **Auction (MCP)** — ClawFlow broadcasts it to resolver-agents through the MCP server.
3. **Bids** — resolvers compete on *price improvement + rebate*; executable bids first escrow the rebate on Mantle.
4. **Encrypted handoff** — the user submits the execution payload encrypted for the winning resolver's pubkey.
5. **Execute & settle** — the winner fills on **Byreal Perps**, then `FlowReceipt` releases escrowed rebate to the user and emits `AuctionSettled`.

## Monorepo layout
```
apps/web           Next.js landing + skill guide + live auction animation (Vercel)
apps/mcp-server    MCP server = the auction venue, 5 tools (Vercel, mcp-handler)
packages/core      auction engine: maker policy, scoring, settlement
packages/agents    resolver loop, user agent (taker), Byreal exec, Mantle rebate tx
packages/contracts FlowReceipt.sol — payable rebate + on-chain receipt (Mantle, Foundry)
packages/skills    OpenClaw/Byreal skill wrapper: user intent -> Auction MCP -> Byreal execution
```

## Quickstart
```bash
pnpm install
pnpm demo        # zero-dependency offline auction (always works — video b-roll)
pnpm dev:web     # landing -> http://localhost:3000
pnpm dev:mcp     # MCP auction server -> http://localhost:3001/mcp
```

## Byreal skill fork
Fork the existing Byreal/OpenClaw perps skill and keep its install/auth/final-execution path.
Replace only the user-facing limit-order entrypoint with:

```bash
MCP_URL=http://localhost:3001/mcp USER_ADDRESS=0xYourMantleAddress \
  pnpm --filter @clawflow/byreal-skill exec clawflow-auction-order \
  --side buy --coin BTC --size 0.5 --limit 95000 --fair 94850 --window 8000
```

That gives the demo a clean story: RealClaw skill receives the order, ClawFlow MCP auctions it
to resolver agents, and the winning resolver executes through the original Byreal perps command.

Public skill install:

```bash
npx skills add jinsuha784-design/clawflow
```

## The 4-agent live demo
The MCP server keeps auction state in memory, shared across every terminal that connects — so the
user agent and resolvers can each run in their own terminal.

```bash
# Terminal 0 — the auction venue
pnpm dev:mcp

# Terminals 1-3 — resolver agents (each funded with MNT to pay a rebate if it wins)
export MCP_URL=http://localhost:3001/mcp
export MANTLE_RPC=https://rpc.mantle.xyz PRIVATE_KEY=0x... FLOW_RECEIPT_ADDRESS=0x... REBATE_MNT=0.001
PROFILE=aggressive node packages/agents/src/maker-agent.mjs
PROFILE=passive    node packages/agents/src/maker-agent.mjs
ANTHROPIC_API_KEY=... node packages/agents/src/llm-maker.mjs     # LLM resolver (optional)

# Terminal 4 — the user agent: fires a 30s auction
USER_ADDRESS=0xYourPayoutAddr WINDOW_MS=30000 MCP_URL=http://localhost:3001/mcp \
  node packages/agents/src/taker.mjs
```
The user agent submits → resolvers escrow rebate + bid for 30s → the winner receives the encrypted
payload, fills on Byreal, and settles the escrow on Mantle. Each resolver prints the Byreal command
+ Mantle tx hash (`https://explorer.mantle.xyz/tx/...`). Drop to 2 resolvers if you want exactly 4 terminals.

> ⚠️ **Mainnet = real MNT.** Keep `REBATE_MNT` tiny. Without the Mantle env vars set, resolvers
> still run the full auction and print the exact tx they *would* send (safe dry run).

## Deploy the contract (you provide gas)
```bash
cd packages/contracts
forge create src/FlowReceipt.sol:FlowReceipt --rpc-url $MANTLE_RPC --private-key $PRIVATE_KEY --broadcast
```
See `packages/contracts/README.md`.

## Deploy web + MCP (Vercel)
Two projects from this repo: root dir `apps/web` and `apps/mcp-server` (keep "Include files
outside root directory" ON). MCP endpoint: `https://<mcp>.vercel.app/mcp`.
For multi-instance serverless, back the store with Upstash/Vercel KV.

## Scoring focus
- **Byreal integration depth (18)** — Perps fill + MCP/skill packaging + signal-based pricing.
- **Agent autonomy (14)** — taker/resolver agents transact over MCP; the winner self-executes fill + rebate, no human.
- **Verifiability (8)** — Byreal order id + Mantle `AuctionSettled` tx (real rebate transfer) + improvement-vs-baseline.
