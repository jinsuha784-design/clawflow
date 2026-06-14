"use client";
import { useEffect, useRef, useState } from "react";

const INTENTS = [
  { agent: "patient-whale", side: "buy", size: 0.5, coin: "BTC", limitPrice: 95000, fairValue: 94850 },
  { agent: "delta-neutral", side: "sell", size: 12, coin: "ETH", limitPrice: 3320, fairValue: 3338 },
  { agent: "twap-agent", side: "buy", size: 2.0, coin: "BTC", limitPrice: 96200, fairValue: 96010 },
];

const RESOLVERS = [
  { name: "alpha-quant", edgeBps: 2 },
  { name: "vega-mm", edgeBps: 5 },
  { name: "carry-bot", edgeBps: 9 },
];

const r2 = (x) => Math.round(x * 100) / 100;
const usd = (x) => "$" + (Math.round(x * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });

function computeBids(order) {
  const fv = order.fairValue;
  return RESOLVERS.map(({ name, edgeBps }) => {
    const edge = (fv * edgeBps) / 10000;
    const fill = order.side === "buy" ? Math.min(order.limitPrice, fv + edge) : Math.max(order.limitPrice, fv - edge);
    const improvementBps =
      order.side === "buy"
        ? Math.max(0, ((order.limitPrice - fill) / order.limitPrice) * 10000)
        : Math.max(0, ((fill - order.limitPrice) / order.limitPrice) * 10000);
    const rebateBps = edgeBps / 2;
    return { name, edgeBps, fill: r2(fill), improvementBps: r2(improvementBps), rebateBps, score: r2(improvementBps + rebateBps) };
  });
}

/* node anchors in the 820 x 540 viewBox */
const N = {
  agent: { x: 40, y: 208, w: 132, h: 96 },
  auction: { x: 305, y: 196, w: 200, h: 120 },
  resolvers: [
    { x: 656, y: 60, w: 132, h: 92 },
    { x: 656, y: 210, w: 132, h: 92 },
    { x: 656, y: 360, w: 132, h: 92 },
  ],
};
const cy = (n) => n.y + n.h / 2;

const STEPS = [
  { actor: "Your Agent", color: "ink", title: "Submit intent", desc: "Your agent sends a limit order plus encryptedPayloadHash to the auction venue over MCP." },
  { actor: "Auction System", color: "ink", title: "Broadcast orderHash", desc: "ClawFlow broadcasts the order terms and orderHash to every connected resolver." },
  { actor: "Resolvers", color: "flow", title: "Lock rebate", desc: "Resolvers escrow rebate MNT in FlowReceipt before their bids become executable." },
  { actor: "Resolvers", color: "ink", title: "Bid with pubkey", desc: "Each bid includes fill price, rebate, resolver pubkey, escrowId, and escrow tx." },
  { actor: "Auction System", color: "red", title: "Winner selected", desc: "Best total value wins: price improvement plus escrow-backed rebate." },
  { actor: "Your Agent", color: "flow", title: "Encrypted handoff", desc: "The execution payload is routed only for the winning resolver's pubkey." },
  { actor: "Resolver", color: "ink", title: "Execute on Byreal", desc: "The winner decrypts the payload and executes the fill through Byreal Perps." },
  { actor: "Mantle", color: "flow", title: "Release rebate", desc: "FlowReceipt settles with encryptedPayloadHash, pays escrow to the user, and emits AuctionSettled." },
];

const CHART = {
  ink: "#3f485a",
  active: "#10151b",
  border: "#cfd8e6",
  muted: "#7b869e",
  panel: "#eef1f5",
  white: "#ffffff",
};

export default function AuctionDemo() {
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const timers = useRef([]);

  const order = INTENTS[idx];
  const bids = computeBids(order);
  const winner = [...bids].sort((a, b) => b.score - a.score)[0];
  const wIndex = bids.findIndex((b) => b.name === winner.name);

  const notional = order.size * winner.fill;
  const saving = Math.abs(order.size * (order.limitPrice - winner.fill));
  const rebateUsd = (notional * winner.rebateBps) / 10000;
  const grossEdge = (notional * winner.edgeBps) / 10000;
  const resolverAlpha = grossEdge - rebateUsd;
  const youReceive = saving + rebateUsd;

  function run(i) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setIdx(i);
    setStep(0);
    const t = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    STEPS.forEach((_, k) => k > 0 && t(1350 * k, () => setStep(k)));
    t(1350 * STEPS.length + 2600, () => run((i + 1) % INTENTS.length));
  }

  useEffect(() => {
    run(0);
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-flow-100 bg-white shadow-lift">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-flow-100 bg-flow-50 px-5 py-4 sm:px-7">
        <div className="font-mono text-sm">
          <span className="rounded-md bg-flow-600 px-1.5 py-0.5 text-xs font-semibold text-white">{order.agent}</span>
          <span className="ml-2 font-semibold text-ink">
            {order.side.toUpperCase()} {order.size} {order.coin}
          </span>
          <span className="text-ink-soft"> @ {order.limitPrice.toLocaleString()}</span>
          <span className="text-ink-faint"> · ref {order.fairValue.toLocaleString()}</span>
        </div>
        <button
          onClick={() => run(idx)}
          className="rounded-2xl border border-flow-200 bg-white px-3 py-1.5 text-xs font-medium text-flow-700 transition hover:bg-flow-50"
        >
          ↻ Replay
        </button>
      </div>

      {/* protocol flow diagram */}
      <FlowGraph step={step} wIndex={wIndex} winner={winner} order={order} />

      {/* active step caption */}
      <div className="flex items-center gap-3 border-y border-flow-100 bg-white px-5 py-4 sm:px-7">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-flow-600 font-mono text-xs font-bold text-white">
          {step + 1}
        </span>
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">{STEPS[step].title}.</span> {STEPS[step].desc}
        </p>
      </div>

      {/* payoff */}
      <div className="px-5 py-6 sm:px-7">
        <Payoff
          show={step >= STEPS.length - 1}
          order={order}
          winner={winner}
          saving={saving}
          rebateUsd={rebateUsd}
          grossEdge={grossEdge}
          resolverAlpha={resolverAlpha}
          youReceive={youReceive}
        />
      </div>
    </div>
  );
}

function FlowGraph({ step, wIndex, winner, order }) {
  const a = N.agent, au = N.auction, rs = N.resolvers;
  const win = rs[wIndex];

  return (
    <div className="px-3 pt-4 sm:px-6">
      <svg viewBox="0 0 820 540" className="w-full" style={{ maxHeight: 460 }}>
        <defs>
          <marker id="ah-ink" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0 0 L7 3 L0 6 Z" fill={CHART.ink} />
          </marker>
          <marker id="ah-red" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0 0 L7 3 L0 6 Z" fill={CHART.active} />
          </marker>
          <marker id="ah-flow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0 0 L7 3 L0 6 Z" fill={CHART.active} />
          </marker>
        </defs>

        {/* ---- edges (rendered before nodes) ---- */}
        {/* 0: agent -> auction */}
        <Edge active={step === 0} done={step > 0} color="ink"
          d={`M ${a.x + a.w} ${cy(a) - 6} L ${au.x} ${cy(au) - 18}`} label="submit intent" lx={235} ly={222} />

        {/* 1: auction -> resolvers (broadcast) */}
        {rs.map((r, i) => (
          <Edge key={"b" + i} active={step === 1} done={step > 1} color="ink"
            d={`M ${au.x + au.w} ${cy(au) - 10} L ${r.x} ${cy(r) - 6}`}
            label={i === 0 ? "broadcast" : null} lx={560} ly={150} />
        ))}

        {/* 2: resolvers lock rebate before executable bids */}
        {rs.map((r, i) => (
          <Edge key={"escrow" + i} active={step === 2} done={step > 2} color="flow"
            d={`M ${r.x + 10} ${cy(r) + 32} Q 555 500 ${au.x + au.w - 18} ${cy(au) + 46}`}
            label={i === 1 ? "lockRebate tx" : null} lx={560} ly={486} flow />
        ))}

        {/* 3: resolvers -> auction (bids) */}
        {rs.map((r, i) => (
          <Edge key={"bid" + i} active={step === 3} done={step > 3} color="ink"
            d={`M ${r.x} ${cy(r) + 8} L ${au.x + au.w} ${cy(au) + 12}`}
            label={i === 1 ? "bid + pubkey" : null} lx={560} ly={300} />
        ))}

        {/* 4: auction -> winner */}
        <Edge active={step === 4} done={step > 4} color="red"
          d={`M ${au.x + au.w} ${cy(au) + 26} L ${win.x} ${cy(win)}`}
          label="winner selected" lx={(au.x + au.w + win.x) / 2} ly={cy(win) - 14} red />

        {/* 5: agent -> winner (encrypted payload handoff) */}
        <Edge active={step === 5} done={step > 5} color="flow"
          d={`M ${win.x} ${cy(win) + 14} Q 400 430 ${a.x + a.w} ${cy(a) + 16}`}
          label="encrypted payload" lx={400} ly={398} flow />

        {/* 6: winner executes on Byreal */}
        <Edge active={step === 6} done={step > 6} color="ink"
          d={`M ${a.x + a.w} ${cy(a) + 28} Q 400 478 ${win.x} ${cy(win) + 26}`}
          label="Byreal order id" lx={400} ly={462} />

        {/* 7: settlement result returns */}
        <Edge active={step === 7} done={step > 7} color="flow"
          d={`M ${win.x} ${cy(win) + 38} Q 400 526 ${a.x + a.w} ${cy(a) + 40}`}
          label="rebate released + receipt" lx={400} ly={520} flow />

        {/* ---- nodes ---- */}
        <Node n={a} title="Your Agent" sub={order.agent} active={[0, 5, 7].includes(step)} tone="agent" />
        <Node n={au} title="Auction System" sub="ClawFlow MCP" big active={[1, 3, 4].includes(step)} tone="auction" />
        {rs.map((r, i) => (
          <Node
            key={i}
            n={r}
            title={`Resolver ${i + 1}`}
            sub={RESOLVERS[i].name}
            active={[1, 2, 3].includes(step) || (step >= 4 && i === wIndex)}
            winner={step >= 4 && i === wIndex}
            tone="resolver"
          />
        ))}
      </svg>
    </div>
  );
}

function Edge({ d, active, done, label, lx, ly, red, flow }) {
  if (!active && !done) return null;
  const stroke = red || flow ? CHART.active : CHART.ink;
  const marker = red ? "url(#ah-red)" : flow ? "url(#ah-flow)" : "url(#ah-ink)";
  return (
    <g opacity={active ? 1 : 0.22}>
      <path
        key={active ? "a" : "d"}
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={active ? 2.4 : 1.6}
        markerEnd={marker}
        pathLength="1"
        className={active ? "flow-draw" : ""}
      />
      {label && (active || done) && (
        <text
          x={lx}
          y={ly}
          textAnchor="middle"
          className="font-mono"
          fontSize="12"
          fontWeight={active ? 600 : 400}
          fill={red || flow ? CHART.active : CHART.muted}
          opacity={active ? 1 : 0.5}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Node({ n, title, sub, big, active, winner, tone }) {
  const fill = winner ? CHART.panel : CHART.white;
  const stroke = winner ? CHART.active : active ? CHART.muted : CHART.border;
  return (
    <g style={{ transition: "all .3s" }}>
      <rect
        x={n.x}
        y={n.y}
        width={n.w}
        height={n.h}
        rx="16"
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 2.4 : 1.4}
        style={{ filter: active ? "drop-shadow(0 10px 22px rgba(9,9,11,0.16))" : "none" }}
      />
      <text x={n.x + n.w / 2} y={cy(n) - (sub ? 6 : 0)} textAnchor="middle"
        fontFamily="Bricolage Grotesque, sans-serif" fontWeight="700"
        fontSize={big ? 18 : 14} fill={CHART.active}>
        {title}
      </text>
      {sub && (
        <text x={n.x + n.w / 2} y={cy(n) + 14} textAnchor="middle" className="font-mono" fontSize="11" fill={CHART.muted}>
          {sub}
        </text>
      )}
      {winner && (
        <g>
          <rect x={n.x + n.w / 2 - 30} y={n.y - 12} width="60" height="20" rx="10" fill={CHART.active} />
          <text x={n.x + n.w / 2} y={n.y + 2} textAnchor="middle" className="font-mono" fontSize="10" fontWeight="700" fill="#fff">
            WINNER
          </text>
        </g>
      )}
    </g>
  );
}

function Payoff({ show, order, winner, saving, rebateUsd, grossEdge, resolverAlpha, youReceive }) {
  return (
    <div className={"transition-all duration-500 " + (show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-40")}>
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-faint">Settlement payout</div>
      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {/* submitter */}
        <div className="rounded-2xl bg-rebate-soft/70 p-5 ring-1 ring-rebate/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint">You · submitter</span>
            <span className="font-mono text-xs text-ink-soft">{order.agent}</span>
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-widest text-ink-faint">Order filled + you get paid</div>
          <div className="font-display text-3xl font-extrabold text-rebate">+{usd(youReceive)}</div>
          <div className="mt-3 space-y-1.5 font-mono text-xs">
            <Row label={`filled at ${winner.fill.toLocaleString()} (vs ${order.limitPrice.toLocaleString()} limit)`} value={"+" + usd(saving)} good />
            <Row label="rebate paid to you" value={"+" + usd(rebateUsd)} good />
          </div>
          <div className="mt-2 text-[11px] text-ink-faint">you pay nothing — pure upside on flow you had anyway</div>
        </div>

        {/* connector */}
        <div className="flex items-center justify-center sm:flex-col sm:px-1">
          <div className="flex flex-col items-center rounded-xl border border-flow-200 bg-white px-3 py-2 text-center shadow-card">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">resolver pays</span>
            <span className="font-mono text-sm font-semibold text-flow-600">{usd(rebateUsd)}</span>
            <span className="text-base leading-none text-flow-400 sm:rotate-180">←</span>
            <span className="font-mono text-[10px] text-ink-faint">rebate to you</span>
          </div>
        </div>

        {/* resolver */}
        <div className="rounded-2xl bg-flow-50 p-5 ring-1 ring-flow-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Resolver · winner</span>
            <span className="font-mono text-xs text-ink-soft">{winner.name}</span>
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-widest text-ink-faint">Net profit after paying you</div>
          <div className="font-display text-3xl font-extrabold text-flow-600">+{usd(resolverAlpha)}</div>
          <div className="mt-3 space-y-1.5 font-mono text-xs">
            <Row label={`alpha from filling your flow (${winner.edgeBps}bps)`} value={"+" + usd(grossEdge)} />
            <Row label="− rebate + price given to you" value={"−" + usd(rebateUsd)} bad />
          </div>
          <div className="mt-2 text-[11px] text-ink-faint">resolver pays out of its own edge to win the flow</div>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[11px] text-ink-faint">
        the resolver escrows rebate first, then earns from its market-making alpha after the Byreal fill settles
      </p>
    </div>
  );
}

function Row({ label, value, good, bad }) {
  const tone = good ? "text-rebate" : bad ? "text-ink-faint" : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-ink-soft">{label}</span>
      <span className={"shrink-0 font-semibold " + tone}>{value}</span>
    </div>
  );
}
