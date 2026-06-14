---
name: clawflow-byreal
description: >-
  Use when a user wants to route a Byreal Perps limit order through a ClawFlow MCP auction before execution.
  The skill submits the order intent plus encrypted payload hash, lets resolver agents escrow rebate and bid,
  then returns the winning resolver, Byreal execution path, and Mantle settlement proof.
metadata:
  openclaw:
    homepage: https://github.com/jinsuha784-design/clawflow
    requires:
      env:
        - USER_ADDRESS
---

# ClawFlow Byreal Skill

Route Byreal Perps limit orders through ClawFlow's agentic order-flow auction.

This skill is a narrow fork/wrapper of the Byreal Perps skill pattern:

- Base execution path: `byreal-git/byreal-perps-cli`
- Added routing layer: ClawFlow Auction MCP
- Added settlement proof: Mantle `FlowReceipt`

## When To Use

Use this skill when the user wants to place a non-urgent Byreal Perps limit order and is willing to auction the order flow for price improvement and rebate.

Do not use this for urgent market orders. Those should go directly through the normal Byreal Perps skill.

## Flow

1. Convert the user's limit order into a ClawFlow intent.
2. Include `encryptedPayloadHash` with the intent. The actual payload should be encrypted for the winning resolver's pubkey.
3. Submit the intent to the default public ByrealFlow MCP endpoint. Override with `MCP_URL` only for local demos.
4. Resolver agents escrow rebate with `FlowReceipt.lockRebate`, then bid with `resolverPubkey`, `escrowId`, and `rebateEscrowTx`.
5. ClawFlow selects the best bid by price improvement + rebate.
6. The winning resolver executes through Byreal Perps and settles with `settleWithEncryptedPayload`.

## Demo Command

From the ClawFlow repo:

```bash
USER_ADDRESS=0xYourMantleAddress \
pnpm --filter @clawflow/byreal-skill auction-order -- \
  --side buy --coin BTC --size 0.5 --limit 95000 --fair 94850 --window 8000
```

## Required Environment

```bash
USER_ADDRESS=0xUserRebateAddress
```

Optional:

```bash
MCP_URL=https://mcp-server-vert-sigma.vercel.app/mcp
WINDOW_MS=30000
```

## Expected Output

The command returns JSON with the auction id, encrypted payload hash, winner, settlement values, and on-chain payload fields when available.

```json
{
  "auctionId": "auc_1",
  "encryptedPayloadHash": "0x...",
  "status": "closed",
  "winner": {
    "maker": "policy:aggressive",
    "fillPrice": 94868.97,
    "rebateEscrowTx": "0x..."
  },
  "settlement": {
    "userTotalUsd": 70.26
  }
}
```
