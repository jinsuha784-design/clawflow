#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHash } from "node:crypto";

function readArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === "--") continue;
    if (!key.startsWith("--")) continue;
    out[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return out;
}

const args = readArgs(process.argv.slice(2));
const required = ["side", "coin", "size", "limit", "fair"];
const missing = required.filter((key) => !args[key]);
if (missing.length) {
  console.error(`Missing required args: ${missing.map((key) => `--${key}`).join(", ")}`);
  process.exit(1);
}

const mcpUrl = process.env.MCP_URL ?? "http://localhost:3001/mcp";
const client = new Client({ name: "clawflow-byreal-skill", version: "0.1.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(mcpUrl)));

const call = async (name, toolArgs = {}) => {
  const response = await client.callTool({ name, arguments: toolArgs });
  return JSON.parse(response.content?.[0]?.text ?? "null");
};

const order = {
  side: args.side,
  coin: args.coin,
  size: Number(args.size),
  limitPrice: Number(args.limit),
  fairValue: Number(args.fair),
  windowMs: Number(args.window ?? process.env.WINDOW_MS ?? 30000),
  user: args.user ?? process.env.USER_ADDRESS ?? "0x000000000000000000000000000000000000dEaD",
};
const payload = args.payload ?? JSON.stringify({
  route: "byreal-perps",
  side: order.side,
  coin: order.coin,
  size: order.size,
  limitPrice: order.limitPrice,
});
order.encryptedPayloadHash = args.payloadHash ?? "0x" + createHash("sha256")
  .update(JSON.stringify({ payload, encryptedFor: "winning-resolver-pubkey" }))
  .digest("hex");

const { auctionId } = await call("submit_intent", order);
const deadline = Date.now() + order.windowMs + 1000;

let result;
while (Date.now() < deadline) {
  result = await call("get_result", { auctionId });
  if (result?.status === "closed") break;
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

if (!result || result.status !== "closed") {
  result = await call("get_result", { auctionId });
}

console.log(JSON.stringify({ auctionId, encryptedPayloadHash: order.encryptedPayloadHash, ...result }, null, 2));
await client.close();
