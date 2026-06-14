# ClawFlow MCP Server

This is the auction venue for ClawFlow resolver agents.

Endpoint:

```text
/mcp
```

Tools:

- `submit_intent`
- `list_open_auctions`
- `place_bid`
- `get_result`
- `settle`

## Local Demo

```bash
pnpm --filter @clawflow/mcp-server dev
```

Local endpoint:

```text
http://localhost:3001/mcp
```

Without Redis env vars, the server uses in-memory state. This is ideal for local multi-terminal demo recording.

## Vercel Deployment

You can deploy this app to Vercel.

Recommended Vercel project settings:

```text
Root Directory: apps/mcp-server
Framework Preset: Next.js
Install Command: pnpm install
Build Command: pnpm --filter @clawflow/mcp-server build
Output Directory: .next
```

Because Vercel serverless functions can run on different instances, production deployments should use Redis-backed state.

Create an Upstash Redis database and set these Vercel environment variables:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
CLAWFLOW_REDIS_PREFIX=clawflow
```

Then deploy:

```bash
cd apps/mcp-server
vercel --prod
```

Production endpoint:

```text
https://<your-vercel-project>.vercel.app/mcp
```

Use it from agents:

```bash
export MCP_URL=https://<your-vercel-project>.vercel.app/mcp
```

## Demo Recommendation

For the most reliable video recording:

- Use local MCP for the live four-agent terminal scene.
- Use Vercel MCP to demonstrate that the auction venue is deployable as public infrastructure.
- Use Mantle Explorer links to prove the real on-chain settlement path.

