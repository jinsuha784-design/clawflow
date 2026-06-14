// Maker pricing policy (simplified, for the hackathon demo).
//
// A maker fills the user's limit order and keeps an `edge` (its margin / alpha), then rebates
// part of that edge back to the user to win the flow. Patient, non-toxic limit-order flow is
// profitable to fill, which is exactly why a maker is willing to pay for it.
//
//   BUY  limit L: maker SELLS to user at fill F = min(L, fairValue + edge).  improvement = L - F
//   SELL limit L: maker BUYS from user at fill F = max(L, fairValue - edge). improvement = F - L
//
// Lower edge => more price improvement passed to the user => more competitive bid.

export const PROFILES = { aggressive: 2, neutral: 5, passive: 9 }; // edge in bps

const r2 = (x) => Math.round(x * 100) / 100;

export function policyBid(order, fairValue, profile = "neutral") {
  const edgeBps = PROFILES[profile] ?? 5;
  const edge = (fairValue * edgeBps) / 10000;

  const fillPrice =
    order.side === "buy"
      ? Math.min(order.limitPrice, fairValue + edge)
      : Math.max(order.limitPrice, fairValue - edge);

  const improvementBps =
    order.side === "buy"
      ? Math.max(0, ((order.limitPrice - fillPrice) / order.limitPrice) * 10000)
      : Math.max(0, ((fillPrice - order.limitPrice) / order.limitPrice) * 10000);

  const rebateBps = r2(edgeBps / 2); // share half the captured edge back to the user

  return {
    maker: `policy:${profile}`,
    profile,
    fillPrice: r2(fillPrice),
    improvementBps: r2(improvementBps),
    rebateBps,
  };
}

export function policyBids(order, fairValue) {
  return Object.keys(PROFILES).map((p) => policyBid(order, fairValue, p));
}
