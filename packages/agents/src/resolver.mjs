// Shared resolver agent loop: connect over MCP, bid on open auctions, detect its OWN win,
// then autonomously execute the fill on Byreal Perps and pay the rebate on Mantle.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ethers } from "ethers";
import { byrealFill } from "./byreal-exec.mjs";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3001/mcp";
const mantleReady = !!(process.env.FLOW_RECEIPT_ADDRESS && process.env.PRIVATE_KEY && process.env.MANTLE_RPC);
const rebateWei = ethers.parseEther(process.env.REBATE_MNT ?? "0.001");

function resolverPubkey() {
  if (process.env.RESOLVER_PUBKEY) return process.env.RESOLVER_PUBKEY;
  if (!process.env.PRIVATE_KEY) return `demo-pubkey:${Math.random().toString(16).slice(2)}`;
  return new ethers.Wallet(process.env.PRIVATE_KEY).signingKey.publicKey;
}

export async function runResolver({ makerId, decide }) {
  const client = new Client({ name: makerId, version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL)));
  console.log(`[${makerId}] connected to ${MCP_URL}  (mantle rebate: ${mantleReady ? "ON" : "off"})`);

  const call = async (name, args = {}) =>
    JSON.parse((await client.callTool({ name, arguments: args })).content?.[0]?.text ?? "null");

  const bidded = new Map(); // auctionId -> order
  const resolved = new Set();

  setInterval(async () => {
    // 1) bid on newly opened auctions
    for (const a of (await call("list_open_auctions")) ?? []) {
      if (bidded.has(a.id)) continue;
      const fv = a.order.fairValue ?? a.order.limitPrice;
      const bid = await decide(a.order, fv);
      const escrowId = ethers.id(`${a.orderHash}:${makerId}`);
      let rebateEscrowTx = null;
      if (mantleReady && a.order.user) {
        try {
          const { lockRebateOnMantle } = await import("./settle-mantle.mjs");
          rebateEscrowTx = await lockRebateOnMantle({
            escrowId,
            orderHash: a.orderHash,
            user: a.order.user,
            rebateWei,
          });
          console.log(`[${makerId}] locked rebate for ${a.id}: ${rebateEscrowTx}`);
        } catch (e) {
          console.log(`[${makerId}] skip ${a.id}: rebate escrow failed (${e.message})`);
          continue;
        }
      }
      await call("place_bid", {
        auctionId: a.id, maker: makerId,
        fillPrice: bid.fillPrice, improvementBps: bid.improvementBps, rebateBps: bid.rebateBps,
        resolverPubkey: resolverPubkey(),
        escrowId,
        rebateEscrowTx,
        rebateWei: rebateWei.toString(),
      });
      bidded.set(a.id, a.order);
      console.log(`[${makerId}] bid ${a.id}: fill ${bid.fillPrice} (+${bid.improvementBps}bps, +${bid.rebateBps}bps rebate)`);
    }
    // 2) resolve auctions I bid on
    for (const [id, order] of bidded) {
      if (resolved.has(id)) continue;
      const res = await call("get_result", { auctionId: id });
      if (res?.status !== "closed") continue;
      resolved.add(id);
      if (!res.winner || res.winner.maker !== makerId) {
        console.log(`[${makerId}] lost ${id}${res.winner ? ` (winner ${res.winner.maker})` : ""}`);
        continue;
      }
      console.log(`[${makerId}] >>> WON ${id} — executing fill + rebate`);
      const fill = await byrealFill(order, res.winner.fillPrice);
      console.log(`[${makerId}]   byreal: ${fill.cmd}${fill.executed ? "" : "  (" + fill.note + ")"}`);
      await payRebate(id, order, res);
    }
  }, 1500);

  async function payRebate(id, order, res) {
    const user = order.user ?? process.env.USER_ADDRESS;
    if (!mantleReady || !user) {
      console.log(`[${makerId}]   mantle: set MANTLE_RPC/PRIVATE_KEY/FLOW_RECEIPT_ADDRESS + user addr to send the real rebate tx`);
      return;
    }
    try {
      const { settleOnMantle } = await import("./settle-mantle.mjs");
      const rebateWei = ethers.parseEther(process.env.REBATE_MNT ?? "0.001");
      const hash = await settleOnMantle({
        escrowId: res.winner.escrowId,
        orderHash: res.orderHash,
        encryptedPayloadHash: order.encryptedPayloadHash ?? ethers.id(`encrypted:${id}:${makerId}`),
        improvementBps: res.winner.improvementBps,
        rebateBps: res.winner.rebateBps,
        flowFeeBps: res.settlement?.flowFeeBps ?? 1,
        notionalUsd: res.settlement?.notionalUsd ?? 0,
      });
      console.log(`[${makerId}]   mantle rebate tx: ${hash}`);
      console.log(`[${makerId}]   explorer: https://explorer.mantle.xyz/tx/${hash}`);
    } catch (e) {
      console.log(`[${makerId}]   mantle settle error: ${e.message}`);
    }
  }
}
