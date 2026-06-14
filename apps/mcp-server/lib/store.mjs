// In-memory auction store. Shared across all client connections within a single process
// (local `next dev` or one warm Vercel instance) — perfect for the multi-terminal demo.
// For multi-instance production, back this with Upstash/Redis.
import { selectWinner, baseline, settlement } from "@clawflow/core";

const auctions = new Map();
let seq = 1;

const orderHash = (id) => "0x" + Buffer.from(id).toString("hex").padEnd(64, "0").slice(0, 64);

export const store = {
  createAuction(order) {
    const id = `auc_${seq++}`;
    const windowMs = order.windowMs ?? 8000;
    const fairValue = order.fairValue ?? order.limitPrice;
    const a = {
      id,
      orderHash: orderHash(id),
      order: {
        side: order.side,
        size: order.size,
        coin: order.coin,
        limitPrice: order.limitPrice,
        fairValue,
        user: order.user ?? null, // rebate recipient (Mantle address)
        encryptedPayloadHash: order.encryptedPayloadHash ?? null,
      },
      bids: [],
      createdAt: Date.now(),
      deadline: Date.now() + windowMs,
    };
    auctions.set(id, a);
    return a;
  },
  openAuctions() {
    const now = Date.now();
    return [...auctions.values()]
      .filter((a) => now < a.deadline)
      .map((a) => ({ id: a.id, orderHash: a.orderHash, order: a.order, deadline: a.deadline }));
  },
  addBid(id, bid) {
    const a = auctions.get(id);
    if (!a || Date.now() > a.deadline) return false;
    a.bids.push({
      maker: bid.maker,
      fillPrice: bid.fillPrice,
      improvementBps: bid.improvementBps,
      rebateBps: bid.rebateBps,
      resolverPubkey: bid.resolverPubkey ?? null,
      escrowId: bid.escrowId ?? null,
      rebateEscrowTx: bid.rebateEscrowTx ?? null,
      rebateWei: bid.rebateWei ?? null,
    });
    return true;
  },
  result(id) {
    const a = auctions.get(id);
    if (!a) return { error: "not found" };
    if (Date.now() < a.deadline) return { status: "open", auctionId: a.id, orderHash: a.orderHash, deadline: a.deadline, bids: a.bids.length };
    const winner = selectWinner(a.bids);
    const base = baseline(a.order);
    if (!winner) return { status: "closed", auctionId: a.id, orderHash: a.orderHash, winner: null, note: "no bids — rest natively on Byreal book", baseline: base };
    return { status: "closed", auctionId: a.id, orderHash: a.orderHash, order: a.order, winner, baseline: base, settlement: settlement(a.order, winner) };
  },
  settlePayload(id) {
    const r = this.result(id);
    if (r.status !== "closed" || !r.winner) return r;
    return {
      ...r,
      onchain: {
        escrowId: r.winner.escrowId,
        orderHash: r.orderHash,
        encryptedPayloadHash: r.order.encryptedPayloadHash ?? "0x" + Buffer.from(`encrypted:${id}`).toString("hex").padEnd(64, "0").slice(0, 64),
        user: r.order.user,
        improvementBps: Math.round(r.winner.improvementBps),
        rebateBps: Math.round(r.winner.rebateBps),
        flowFeeBps: r.settlement.flowFeeBps,
        notionalUsd1e6: Math.round(r.settlement.notionalUsd * 1e6),
        rebateEscrowTx: r.winner.rebateEscrowTx,
        rebateWei: r.winner.rebateWei,
      },
    };
  },
};
