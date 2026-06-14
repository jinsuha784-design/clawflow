// Offline end-to-end demo of ONE ClawFlow auction. No network, no install required.
//   node packages/agents/src/run-demo.mjs
import { policyBids } from "../../core/src/maker.mjs";
import { selectWinner, baseline, settlement } from "../../core/src/auction.mjs";

const order = { side: "buy", size: 0.5, coin: "BTC", limitPrice: 95000 };
const fairValue = 94850; // reference price (would come from Byreal signal / perps mark price)

const bids = policyBids(order, fairValue);
const winner = selectWinner(bids);
const base = baseline(order);
const s = settlement(order, winner);

const line = "-".repeat(64);
console.log(`\n  ClawFlow — agentic order-flow auction (offline demo)\n${line}`);
console.log(`  Intent : ${order.side.toUpperCase()} ${order.size} ${order.coin} @ limit ${order.limitPrice}`);
console.log(`  Ref FV : ${fairValue}   (Byreal signal / mark price)\n`);
console.log(`  Maker agents bid:`);
for (const b of bids) {
  const star = b === winner ? "  <-- WINNER" : "";
  console.log(
    `    ${b.maker.padEnd(18)} fill ${String(b.fillPrice).padStart(9)}` +
      `  +${String(b.improvementBps).padStart(5)}bps improve` +
      `  +${b.rebateBps}bps rebate` +
      `  score ${scoreOf(b).toFixed(2)}${star}`
  );
}
function scoreOf(b) { return b.improvementBps + b.rebateBps; }

console.log(`\n  Winner : ${winner.maker}  fills at ${winner.fillPrice}`);
console.log(line);
console.log(`  vs. resting limit order @ ${base.fillPrice}:`);
console.log(`    price improvement : $${s.userSavingUsd}`);
console.log(`    rebate to user    : $${s.rebateUsd}`);
console.log(`    => USER GAINS     : $${s.userTotalUsd}  on $${s.notionalUsd} notional`);
console.log(`    router flow fee   : $${s.flowFeeUsd}  (${s.flowFeeBps}bp)`);
console.log(line);
console.log(`  Execute on Byreal : byreal-perps-cli order limit ${order.side} ${order.size} ${order.coin} ${Math.round(winner.fillPrice)} --tif Ioc`);
console.log(`  Escrow on Mantle  : FlowReceipt.lockRebate(escrowId, orderHash, user)`);
console.log(`  User payload      : encrypted tx hash submitted to the winning resolver only`);
console.log(`  Settle on Mantle  : FlowReceipt.settleWithEncryptedPayload(...) -> AuctionSettled event\n`);
