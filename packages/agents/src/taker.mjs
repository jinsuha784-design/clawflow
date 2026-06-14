// The user agent (taker): submits a limit-order intent and prints the auction result.
//   USER_ADDRESS=0x... WINDOW_MS=30000 MCP_URL=http://localhost:3001/mcp node packages/agents/src/taker.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHash } from "node:crypto";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3001/mcp";
const client = new Client({ name: "clawflow-taker", version: "0.1.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL)));

const call = async (name, args = {}) =>
  JSON.parse((await client.callTool({ name, arguments: args })).content?.[0]?.text ?? "null");

const order = {
  side: "buy",
  size: 0.5,
  coin: "BTC",
  limitPrice: 95000,
  fairValue: 94850,
  windowMs: Number(process.env.WINDOW_MS ?? 30000), // 30s auction
  user: process.env.USER_ADDRESS ?? "0x000000000000000000000000000000000000dEaD",
};
order.encryptedPayloadHash = "0x" + createHash("sha256")
  .update(JSON.stringify({ route: "byreal-perps", order, encryptedFor: "winning-resolver-pubkey" }))
  .digest("hex");

const { auctionId, deadline } = await call("submit_intent", order);
console.log(`[taker] submitted ${order.side} ${order.size} ${order.coin} @ ${order.limitPrice} -> ${auctionId}`);
console.log(`[taker] auction closes in ${Math.round((deadline - Date.now()) / 1000)}s; resolvers are bidding...`);

const t = setInterval(async () => {
  const res = await call("get_result", { auctionId });
  if (res.status === "closed") {
    clearInterval(t);
    console.log("[taker] RESULT:\n" + JSON.stringify(res, null, 2));
    process.exit(0);
  }
  console.log(`[taker] waiting... (${res.bids ?? 0} bids in)`);
}, 3000);
