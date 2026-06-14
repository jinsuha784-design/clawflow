// LLM-driven resolver (maker) agent — genuine reasoning; policy fallback without a key.
//   ANTHROPIC_API_KEY=... MCP_URL=http://localhost:3001/mcp node packages/agents/src/llm-maker.mjs
import { policyBid } from "@clawflow/core";
import { runResolver } from "./resolver.mjs";

const KEY = process.env.ANTHROPIC_API_KEY;

async function decide(order, fairValue) {
  if (!KEY) return policyBid(order, fairValue, "neutral");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const a = new Anthropic({ apiKey: KEY });
  const prompt =
    `You are a market-maker agent competing for order flow.\n` +
    `Order: ${JSON.stringify(order)}\nReference fair value: ${fairValue}\n` +
    `Return ONLY JSON {"fillPrice":number,"improvementBps":number,"rebateBps":number} ` +
    `that is profitable for you yet competitive for the user.`;
  const msg = await a.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 200, messages: [{ role: "user", content: prompt }],
  });
  try {
    const text = msg.content.find((c) => c.type === "text")?.text ?? "{}";
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
  } catch {
    return policyBid(order, fairValue, "neutral");
  }
}

await runResolver({ makerId: "llm:claude", decide });
