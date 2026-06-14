// In-memory auction store. Shared across all client connections within a single process
// (local `next dev` or one warm Vercel instance) — perfect for the multi-terminal demo.
// For multi-instance production, back this with Upstash/Redis.
import { selectWinner, baseline, settlement } from "@clawflow/core";

const auctions = new Map();
let seq = 1;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisReady = !!(redisUrl && redisToken);
const prefix = process.env.CLAWFLOW_REDIS_PREFIX ?? "clawflow";

const orderHash = (id) => "0x" + Buffer.from(id).toString("hex").padEnd(64, "0").slice(0, 64);

async function redis(command, ...args) {
  const res = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command, ...args]),
  });
  if (!res.ok) throw new Error(`Redis ${command} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (data.error) throw new Error(`Redis ${command} failed: ${data.error}`);
  return data.result;
}

const auctionKey = (id) => `${prefix}:auction:${id}`;
const seqKey = `${prefix}:seq`;
const idsKey = `${prefix}:auction_ids`;

async function saveAuction(a) {
  if (!redisReady) {
    auctions.set(a.id, a);
    return;
  }
  await redis("SET", auctionKey(a.id), JSON.stringify(a));
}

async function loadAuction(id) {
  if (!redisReady) return auctions.get(id);
  const raw = await redis("GET", auctionKey(id));
  return raw ? JSON.parse(raw) : null;
}

async function loadAuctions() {
  if (!redisReady) return [...auctions.values()];
  const ids = (await redis("LRANGE", idsKey, 0, -1)) ?? [];
  if (ids.length === 0) return [];
  const raws = (await redis("MGET", ...ids.map(auctionKey))) ?? [];
  return raws.filter(Boolean).map((raw) => JSON.parse(raw));
}

export const store = {
  async createAuction(order) {
    const n = redisReady ? await redis("INCR", seqKey) : seq++;
    const id = `auc_${n}`;
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
    await saveAuction(a);
    if (redisReady) await redis("LPUSH", idsKey, id);
    return a;
  },
  async openAuctions() {
    const now = Date.now();
    return (await loadAuctions())
      .filter((a) => now < a.deadline)
      .map((a) => ({ id: a.id, orderHash: a.orderHash, order: a.order, deadline: a.deadline }));
  },
  async addBid(id, bid) {
    const a = await loadAuction(id);
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
    await saveAuction(a);
    return true;
  },
  async result(id) {
    const a = await loadAuction(id);
    if (!a) return { error: "not found" };
    if (Date.now() < a.deadline) return { status: "open", auctionId: a.id, orderHash: a.orderHash, deadline: a.deadline, bids: a.bids.length };
    const winner = selectWinner(a.bids);
    const base = baseline(a.order);
    if (!winner) return { status: "closed", auctionId: a.id, orderHash: a.orderHash, winner: null, note: "no bids — rest natively on Byreal book", baseline: base };
    return { status: "closed", auctionId: a.id, orderHash: a.orderHash, order: a.order, winner, baseline: base, settlement: settlement(a.order, winner) };
  },
  async settlePayload(id) {
    const r = await this.result(id);
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
