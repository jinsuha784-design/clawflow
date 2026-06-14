// Policy-based resolver (maker) agent.
//   MCP_URL=http://localhost:3001/mcp PROFILE=aggressive node packages/agents/src/maker-agent.mjs
import { policyBid } from "@clawflow/core";
import { runResolver } from "./resolver.mjs";

const PROFILE = process.env.PROFILE ?? "neutral";
await runResolver({
  makerId: `policy:${PROFILE}`,
  decide: (order, fv) => policyBid(order, fv, PROFILE),
});
