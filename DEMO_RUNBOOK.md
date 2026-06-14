# ClawFlow Live Demo Runbook

This runbook is for recording the demo video.

The goal is to show four agents interacting through the ClawFlow Auction MCP server:

- 3 resolver agents compete for the order flow.
- 1 user agent submits a Byreal limit-order intent.
- The winning resolver escrows rebate and settles on Mantle mainnet.
- Mantle Explorer shows the on-chain `lockRebate` and `AuctionSettled` transactions.

## Demo Message

ClawFlow is a forked Byreal Perps skill proposal.

We are not replacing Byreal. We are proposing a new Byreal skill path:

```text
patient limit order -> resolver auction -> Byreal Perps execution -> Mantle rebate receipt
```

This lets Byreal agent users get better execution for non-urgent orders, while resolver agents compete for valuable order flow.

## What To Show On Screen

Use five panes or terminal tabs:

1. Auction MCP server
2. Resolver agent A
3. Resolver agent B
4. Resolver agent C
5. User agent / skill command

Then switch to:

6. Mantle Explorer
7. Landing page workflow

## Prerequisites

Install dependencies:

```bash
pnpm install
```

Install the public skill from GitHub:

```bash
npx skills add jinsuha784-design/clawflow
```

Use the deployed Mantle mainnet contract:

```bash
export FLOW_RECEIPT_ADDRESS=0xf7F78BfCddA8cddB24c0915495257E593f47B117
```

For the real mainnet tx path, the resolver needs a funded private key:

```bash
export PRIVATE_KEY=0x...
```

Do not show the private key or mnemonic in the video. Type it off screen, load it from your shell history, or keep the env already prepared before recording.

Use a tiny rebate because this is Mantle mainnet:

```bash
export REBATE_MNT=0.000001
```

## Terminal 1: Start The Auction MCP Server

```bash
pnpm dev:mcp
```

Expected signal:

```text
Local: http://localhost:3001
POST /mcp 200
```

Voiceover:

```text
This is the ClawFlow Auction MCP server. It is the shared venue where agents submit intents, discover open auctions, place bids, and fetch results.
```

## Terminals 2-4: Start Three Resolver Agents

All resolvers connect to the same MCP server. Each resolver uses a different strategy profile.

Common environment:

```bash
export MCP_URL=http://localhost:3001/mcp
export MANTLE_RPC=https://rpc.mantle.xyz
export FLOW_RECEIPT_ADDRESS=0xf7F78BfCddA8cddB24c0915495257E593f47B117
export REBATE_MNT=0.000001
export PRIVATE_KEY=0x...
```

Terminal 2:

```bash
PROFILE=aggressive node packages/agents/src/maker-agent.mjs
```

Terminal 3:

```bash
PROFILE=neutral node packages/agents/src/maker-agent.mjs
```

Terminal 4:

```bash
PROFILE=passive node packages/agents/src/maker-agent.mjs
```

Expected signal:

```text
[policy:aggressive] connected to http://localhost:3001/mcp  (mantle rebate: ON)
[policy:neutral] connected to http://localhost:3001/mcp  (mantle rebate: ON)
[policy:passive] connected to http://localhost:3001/mcp  (mantle rebate: ON)
```

Voiceover:

```text
These are three resolver agents. They represent market makers. Each one watches the auction MCP server, computes a bid, escrows a rebate on Mantle, and competes to win the user's order flow.
```

## Terminal 5: Submit The User Agent Order

Run the user-facing forked Byreal skill command:

```bash
MCP_URL=http://localhost:3001/mcp \
USER_ADDRESS=0x8619624a7F4d0Cc79Cc565B0E35CFb242389fd93 \
pnpm --filter @clawflow/byreal-skill auction-order -- \
  --side buy --coin BTC --size 0.5 --limit 95000 --fair 94850 --window 12000
```

What this represents:

```text
The user wants to place a non-urgent Byreal Perps limit order.
Instead of going straight to the book, the forked Byreal skill submits it to the auction first.
```

Expected output fields:

```json
{
  "auctionId": "auc_...",
  "encryptedPayloadHash": "0x...",
  "winner": {
    "maker": "policy:aggressive",
    "fillPrice": 94868.97,
    "improvementBps": 13.79,
    "rebateBps": 1,
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
The user agent submitted one limit-order intent. The auction returned a winner, the resolver pubkey, the escrow id, the rebate escrow transaction, and the user's expected improvement.
```

## What The Resolver Terminals Should Show

Each resolver should print a bid:

```text
[policy:aggressive] bid auc_1: fill 94868.97 (+13.79bps, +1bps rebate)
[policy:neutral] bid auc_1: fill ...
[policy:passive] bid auc_1: fill ...
```

The winning resolver should print:

```text
[policy:aggressive] >>> WON auc_1 — executing fill + rebate
[policy:aggressive]   byreal: byreal-perps-cli order limit buy 0.5 BTC 94869 --tif Ioc
[policy:aggressive]   mantle rebate tx: 0x...
[policy:aggressive]   explorer: https://explorer.mantle.xyz/tx/0x...
```

Voiceover:

```text
The winning resolver executes through the Byreal Perps command path. In this local demo the CLI command is printed if the Byreal CLI is not installed, but the auction and Mantle settlement path are real.
```

## Show Mantle Mainnet Proof

Open the contract:

```text
https://explorer.mantle.xyz/address/0xf7F78BfCddA8cddB24c0915495257E593f47B117
```

Then open the tx hash printed by the winning resolver:

```text
https://explorer.mantle.xyz/tx/<mantle-rebate-tx>
```

For the already verified skill-flow demo, use:

```text
lockRebate:
https://explorer.mantle.xyz/tx/0x93666e30d9fe5bfad48e95606ac77b30dbd367278e7852e47813c8f9f5c66073

settleWithEncryptedPayload / AuctionSettled:
https://explorer.mantle.xyz/tx/0xe9a69644476b124920277d220d0d1433caba2c4d03711dd7c76182053c39e181
```

What to point at:

- `to`: `FlowReceipt`
- event: `RebateEscrowed`
- event: `AuctionSettled`
- resolver address
- user address
- `encryptedPayloadHash`
- rebate amount

Voiceover:

```text
This is the important proof. The rebate is not just promised by the resolver. It appears on Mantle as a lockRebate transaction, and the final settlement appears as an AuctionSettled event.
```

## Show The Landing Page

Start the web app:

```bash
pnpm dev:web
```

Open:

```text
http://localhost:3000
```

Show these sections:

1. Hero: ClawFlow as Byreal order-flow auction
2. Workflow: escrow first, encrypted handoff, verifiable settlement
3. Live auction animation
4. Install section:

```bash
npx skills add byreal-git/byreal-perps-cli
npx skills add jinsuha784-design/clawflow
```

Voiceover:

```text
This is the product proposal. Byreal can expose this as a native auctioned-limit-order skill path. Users keep using Byreal Perps, but patient orders get an auction layer that returns price improvement and rebate.
```

## Recommended Video Timeline

### 0-10s: Start With The Proposal

```text
We forked the Byreal Perps skill and added an auction step for patient limit orders.
```

Show the landing page hero.

### 10-25s: Show The Four-Agent Setup

```text
Here is the auction MCP server, three resolver agents, and one user agent.
```

Show all terminals.

### 25-45s: Submit The Order

```text
The user submits a Byreal limit order through the ClawFlow forked skill.
```

Run the user command.

### 45-65s: Show Competition

```text
Resolvers see the same intent, escrow rebate, and compete on price improvement plus rebate.
```

Point to resolver logs.

### 65-80s: Show Result

```text
The winner is selected, the Byreal execution command is produced, and the user gets better fill plus rebate.
```

Point to JSON result.

### 80-105s: Show Mantle Proof

```text
The escrow and settlement are visible on Mantle mainnet. This proves the rebate and receipt are on-chain.
```

Open Mantle Explorer tx pages.

### 105-120s: Close With The Ask

```text
Our hackathon proposal is for Byreal to add this as a native skill feature: auctioned limit orders for agentic execution.
```

Show install commands and workflow.

## Backup Demo If Mainnet Is Slow

If Mantle RPC or sequencer confirmation is slow during recording:

1. Run the local auction flow with resolver env missing `PRIVATE_KEY`.
2. The resolver will still print the Byreal command path.
3. Use the already confirmed mainnet tx links above as proof.

Say:

```text
For recording stability, this local run can use dry-run settlement, but here are the confirmed Mantle mainnet transactions from the same skill flow.
```

## One-Sentence Close

ClawFlow turns a Byreal Perps limit order into an agent auction where resolvers compete for the flow, prepay rebate on Mantle, and settle the final receipt on-chain.

