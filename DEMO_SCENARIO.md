# ClawFlow Demo Scenario

## Core Message

ClawFlow is a proposed extension to the Byreal Perps skill.

Instead of sending every limit order directly to the book, a forked Byreal skill can first auction patient order flow to resolver agents. Resolvers compete with price improvement and prepaid rebate, then the winning resolver executes through Byreal Perps and settles the rebate on Mantle.

In short:

> We forked the Byreal Perps skill and added an agentic order-flow auction layer before execution.

## Demo Narrative

### 1. The Problem

User wants to place a non-urgent limit order:

```text
Buy 0.5 BTC if price is around 95,000.
I do not need instant execution.
```

Normal Byreal skill flow:

```text
User intent -> Byreal Perps limit order
```

ClawFlow proposal:

```text
User intent -> ClawFlow auction -> resolver competition -> Byreal Perps execution -> Mantle rebate settlement
```

The point is not to replace Byreal. The point is to make Byreal's agent skill smarter for patient order flow.

### 2. Skill Fork

Show the install section on the landing page:

```bash
npx skills add jinsuha784-design/clawflow
```

Explain:

- `jinsuha784-design/clawflow` is our wrapped/forked Byreal skill path.
- It behaves like the Byreal execution skill from the agent's point of view.
- It intercepts patient limit orders before Byreal execution.
- The final fill still goes through Byreal Perps.
- ClawFlow only adds auction, resolver selection, and rebate proof.

### 3. Start The Auction MCP

Terminal 1:

```bash
pnpm dev:mcp
```

Voiceover:

```text
This MCP server is the auction venue. Any resolver agent can connect to it, inspect open intents, escrow rebate, and place a bid.
```

### 4. Start A Resolver Agent

Terminal 2:

```bash
export MCP_URL=http://localhost:3001/mcp
export MANTLE_RPC=https://rpc.mantle.xyz
export FLOW_RECEIPT_ADDRESS=0xf7F78BfCddA8cddB24c0915495257E593f47B117
export REBATE_MNT=0.000001
export PROFILE=aggressive
node packages/agents/src/maker-agent.mjs
```

Voiceover:

```text
The resolver is a market-maker agent. Before its bid is accepted, it must escrow the rebate on Mantle. This removes trust from the rebate promise.
```

For the live demo, use the funded demo key only through environment variables. Do not show the private key or mnemonic on screen.

### 5. Submit A Byreal Skill Order Through ClawFlow

Terminal 3:

```bash
MCP_URL=http://localhost:3001/mcp \
USER_ADDRESS=0x8619624a7F4d0Cc79Cc565B0E35CFb242389fd93 \
pnpm --filter @clawflow/byreal-skill auction-order -- \
  --side buy --coin BTC --size 0.5 --limit 95000 --fair 94850 --window 8000
```

Expected output fields to highlight:

```json
{
  "auctionId": "auc_...",
  "encryptedPayloadHash": "0x...",
  "winner": {
    "maker": "policy:aggressive",
    "fillPrice": 94868.97,
    "resolverPubkey": "0x...",
    "escrowId": "0x...",
    "rebateEscrowTx": "0x..."
  },
  "settlement": {
    "userSavingUsd": 65.51,
    "rebateUsd": 4.74,
    "userTotalUsd": 70.26
  }
}
```

Voiceover:

```text
The user submitted the same Byreal limit order, but the forked skill first routed it to the auction. The resolver returned a better fill and a rebate. The payload hash proves the order handoff, and the escrow tx proves the rebate was prepaid.
```

### 6. Show Mantle Proof

Open these mainnet links:

- Contract: https://explorer.mantle.xyz/address/0xf7F78BfCddA8cddB24c0915495257E593f47B117
- Deployment tx: https://explorer.mantle.xyz/tx/0x5b311e807486edaaf2ec7369752e18bb269177258c44cdb853e5cefb7fb0c0cf
- Skill-flow lock tx: https://explorer.mantle.xyz/tx/0x93666e30d9fe5bfad48e95606ac77b30dbd367278e7852e47813c8f9f5c66073
- Skill-flow settle tx: https://explorer.mantle.xyz/tx/0xe9a69644476b124920277d220d0d1433caba2c4d03711dd7c76182053c39e181

Voiceover:

```text
This is the on-chain proof. The resolver prepaid rebate with lockRebate, then settled with encryptedPayloadHash. The user does not need to trust the resolver's off-chain promise.
```

### 7. Show Landing Page Workflow

Open:

```bash
pnpm dev:web
```

Show:

- Install commands
- Workflow table
- Live auction animation
- Settlement payout panel

Voiceover:

```text
This is how we propose Byreal can expose order-flow auctions as a native agent skill feature: patient orders get price improvement and rebate; resolver agents get valuable non-toxic flow; Byreal remains the execution layer.
```

## 90-Second Video Script

### 0-10s: Hook

```text
Byreal already has a powerful Perps agent skill. We asked: what if a Byreal skill could sell patient order flow before execution, so users get paid for not being urgent?
```

Show landing hero.

### 10-25s: Problem

```text
A normal limit order just rests on the book. It creates value for market makers, but the user captures none of that value.
```

Show normal flow:

```text
intent -> Byreal limit order
```

### 25-45s: Our Proposal

```text
We forked the Byreal Perps skill and added a ClawFlow auction step. Resolver agents bid for the order with price improvement and rebate.
```

Show workflow:

```text
intent -> auction MCP -> resolver bids -> Byreal execution
```

### 45-65s: Trust Model

```text
Before bidding, the resolver escrows rebate on Mantle. The user submits an encrypted payload hash, and only the winning resolver receives the execution payload.
```

Show `lockRebate` tx and auction output fields.

### 65-80s: Result

```text
The winning resolver fills through Byreal Perps and settles the receipt on Mantle. In this demo, the user gets both price improvement and rebate.
```

Show:

```text
price improvement: $65.51
rebate: $4.74
total user gain: $70.26
```

### 80-90s: Hackathon Ask

```text
ClawFlow is our proposal for Byreal: make order-flow auctions a native feature of agent skills, so autonomous trading agents can compete to give users better execution.
```

## Judge-Facing Framing

### What We Built

We built a public fork-style Byreal skill extension that routes limit orders through an MCP-based resolver auction before final Byreal Perps execution.

### Why It Matters

Patient order flow is valuable. Market-maker agents can pay for it because it is less toxic than urgent market flow. Users get a better fill plus rebate. Resolvers get alpha. Byreal gets a stronger agentic execution primitive.

### Why It Fits Byreal

- It uses the Byreal Perps skill as the execution base.
- It follows the skill model: user intent becomes an agent-executable command.
- It adds RealClaw/MCP-style agent coordination.
- It preserves verifiability with Byreal execution output and Mantle settlement receipts.

### What We Want Byreal To Adopt

Add a native `auctioned limit order` path to Byreal agent skills:

```text
order limit auctioned buy 0.5 BTC 95000 --min-rebate 1bp --window 30s
```

Under the hood:

1. Broadcast intent to resolver agents.
2. Require rebate escrow.
3. Select best price improvement + rebate.
4. Execute through Byreal Perps.
5. Emit settlement receipt.

## One-Liner

ClawFlow is a forked Byreal Perps skill that lets agents auction patient limit-order flow before execution, so resolvers compete to give users better fills and prepaid rebates.
