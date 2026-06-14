# ClawFlow Byreal Skill

Route a Byreal Perps limit order through a ClawFlow MCP auction before execution.

This skill is intended to be copied into, or layered on top of, the existing Byreal/OpenClaw perps skill. Keep the original Byreal commands for final execution; replace the user-facing limit-order entrypoint with the auction wrapper below. Public install repo: `jinsuha784-design/clawflow`.

## What It Does

1. Accepts a user limit-order intent.
2. Hashes the encrypted execution payload as `encryptedPayloadHash`.
3. Submits the intent to the ClawFlow Auction MCP server.
4. Lets resolver agents escrow rebate and bid for the order flow.
5. Returns the winning resolver, expected fill price, user rebate, and settlement fields.
6. The winning resolver executes the final order through the existing Byreal perps command path.

## Demo Command

```bash
MCP_URL=http://localhost:3001/mcp \
USER_ADDRESS=0xYourMantleAddress \
clawflow-auction-order --side buy --coin BTC --size 0.5 --limit 95000 --fair 94850 --window 8000
```

## Forking Existing Byreal Skill

Use the existing Byreal perps skill as the base, then make one narrow change:

- Before: user intent -> Byreal `order limit`
- After: user intent -> `clawflow-auction-order` -> Auction MCP -> resolver escrow + bid -> winning resolver -> Byreal `order limit` -> Mantle settlement

Keep the original Byreal install/auth/config instructions unchanged. ClawFlow only adds the auction venue and resolver selection layer.

## Required Environment

```bash
MCP_URL=https://your-clawflow-mcp.vercel.app/mcp
USER_ADDRESS=0xUserRebateAddress
```

Optional:

```bash
WINDOW_MS=30000
```

## Output

The command prints a JSON result suitable for a RealClaw/OpenClaw tool response:

```json
{
  "auctionId": "auction_...",
  "winner": "resolver-aggressive",
  "fillPrice": 94870,
  "rebate": 22,
  "userGain": 70,
  "status": "closed"
}
```
