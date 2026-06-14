const r2 = (x) => Math.round(x * 100) / 100;

const FLOW_FEE_BPS = 1;

function scoreBid(bid) {
  return (bid.improvementBps ?? 0) + (bid.rebateBps ?? 0);
}

export function selectWinner(bids) {
  if (!bids || bids.length === 0) return null;
  return [...bids].sort((a, b) => scoreBid(b) - scoreBid(a))[0];
}

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
