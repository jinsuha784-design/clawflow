import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { store } from "../../lib/store.mjs";

export const maxDuration = 60;

const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj) }] });

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "submit_intent",
      "Submit a limit-order intent to be auctioned to maker/resolver agents.",
      {
        side: z.enum(["buy", "sell"]),
        size: z.number().positive(),
        coin: z.string(),
        limitPrice: z.number().positive(),
        fairValue: z.number().positive().optional(),
        windowMs: z.number().int().positive().optional(),
        user: z.string().optional(), // rebate recipient (Mantle address)
        encryptedPayloadHash: z.string().optional(),
      },
      async (args) => {
        const a = store.createAuction(args);
        return text({ auctionId: a.id, deadline: a.deadline });
      }
    );

    server.tool("list_open_auctions", "List currently open auctions.", {}, async () =>
      text(store.openAuctions())
    );

    server.tool(
      "place_bid",
      "Place a bid to fill an open auction (price improvement + rebate).",
      {
        auctionId: z.string(),
        maker: z.string(),
        fillPrice: z.number().positive(),
        improvementBps: z.number(),
        rebateBps: z.number(),
        resolverPubkey: z.string().optional(),
        escrowId: z.string().optional(),
        rebateEscrowTx: z.string().optional(),
        rebateWei: z.string().optional(),
      },
      async (b) => text({ ok: store.addBid(b.auctionId, b) })
    );

    server.tool(
      "get_result",
      "Get the auction result (winner + settlement) once the window has closed.",
      { auctionId: z.string() },
      async ({ auctionId }) => text(store.result(auctionId))
    );

    server.tool(
      "settle",
      "Finalize an auction and return the on-chain settlement payload for FlowReceipt.",
      { auctionId: z.string() },
      async ({ auctionId }) => text(store.settlePayload(auctionId))
    );
  },
  {},
  { basePath: "", maxDuration: 60, verboseLogs: true }
);

export { handler as GET, handler as POST, handler as DELETE };
