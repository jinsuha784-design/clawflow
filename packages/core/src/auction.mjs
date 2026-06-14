// Sealed-bid auction: rank maker bids by total value delivered to the user.
const r2 = (x) => Math.round(x * 100) / 100;

const FLOW_FEE_BPS = 1; // router's cut — the "payment" in payment-for-order-flow

// Total value to the user = price improvement (bps) + rebate (bps).
export function scoreBid(bid) {
  return (bid.improvementBps ?? 0) + (bid.rebateBps ?? 0);
}

export function selectWinner(bids) {
  if (!bids || bids.length === 0) return null;
  return [...bids].sort((a, b) => scoreBid(b) - scoreBid(a))[0];
}

// Baseline: a passive limit order resting on the book — fills at the limit, no rebate.
export function baseline(order) {
  return { fillPrice: order.limitPrice, improvementBps: 0, rebateBps: 0 };
}

export function settlement(order, winner) {
  const notional = order.size * winner.fillPrice;
  const userSavingUsd =
    order.side === "buy"
      ? order.size * (order.limitPrice - winner.fillPrice)
      : order.size * (winner.fillPrice - order.limitPrice);
  const rebateUsd = (notional * (winner.rebateBps ?? 0)) / 10000;
  const flowFeeUsd = (notional * FLOW_FEE_BPS) / 10000;
  return {
    notionalUsd: r2(notional),
    userSavingUsd: r2(userSavingUsd),
    rebateUsd: r2(rebateUsd),
    userTotalUsd: r2(userSavingUsd + rebateUsd),
    flowFeeBps: FLOW_FEE_BPS,
    flowFeeUsd: r2(flowFeeUsd),
  };
}
