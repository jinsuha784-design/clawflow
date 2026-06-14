import AuctionDemo from "../components/AuctionDemo";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-8">
      <Nav />
      <Hero />
      <Marquee />
      <Insight />
      <HowItWorks />
      <Workflow />
      <TwoSided />

      <section id="demo" className="py-20">
        <H eyebrow="Live auction" title="Watch order intents get auctioned in real time" />
        <p className="mb-8 max-w-2xl text-ink-soft">
          Agents stream order intents into ClawFlow. Each one is broadcast to competing resolvers, scored on
          rebate bid fee <span className="text-ink">+</span> execution terms, placed on Byreal, and settled on Mantle —
          autonomously, on loop.
        </p>
        <AuctionDemo />
      </section>

      <Install />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="flex items-center justify-between py-6">
      <div className="flex items-center gap-2 font-display text-xl font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-flow-600 text-white shadow-card">◳</span>
        ClawFlow
      </div>
      <div className="flex items-center gap-6 text-sm text-ink-soft">
        <a href="#how" className="hidden hover:text-ink sm:inline">How it works</a>
        <a href="#workflow" className="hidden hover:text-ink sm:inline">Workflow</a>
        <a href="#demo" className="hidden hover:text-ink sm:inline">Demo</a>
        <a
          href="#install"
          className="rounded-2xl bg-flow-600 px-4 py-2 font-medium text-white shadow-card transition hover:bg-flow-700"
        >
          Install the skill
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-flow-200 bg-white px-3 py-1 text-xs font-medium text-flow-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-flow-500" /> Byreal × Mantle · Agentic Economy Track
      </div>
      <h1 className="max-w-4xl text-[2.7rem] font-extrabold leading-[1.02] sm:text-7xl">
        Order flow,
        <br />
        rebuilt for the{" "}
        <span className="relative whitespace-nowrap text-flow-600">
          agent economy
          <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 300 10" fill="none" preserveAspectRatio="none">
            <path d="M2 7 C 80 2, 220 2, 298 6" stroke="#10151b" strokeWidth="3" strokeLinecap="round" opacity="0.28" />
          </svg>
        </span>
        .
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
        ClawFlow introduces a PFOF auction system for agentic trading by wrapping the Byreal Perps
        skill with a sealed-bid resolver market before execution. Resolvers compete for order flow,
        <span className="font-medium text-ink"> the rebate flows back to you</span>, and the winner
        executes through Byreal.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-3">
        <a
          href="#demo"
          className="rounded-2xl bg-flow-600 px-6 py-3.5 font-medium text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-flow-700"
        >
          Watch a live auction →
        </a>
        <a
          href="#install"
          className="rounded-2xl border border-flow-200 bg-white px-6 py-3.5 font-medium text-ink transition hover:border-flow-400 hover:bg-flow-50"
        >
          Install the skill
        </a>
      </div>
      <p className="mt-8 font-mono text-xs uppercase tracking-widest text-ink-faint">
        wrapped Byreal skill · execution on Byreal Perps · settlement on Mantle
      </p>
    </section>
  );
}

function Marquee() {
  const agents = [
    "alpha-quant", "vega-mm", "patient-whale", "delta-neutral", "byreal-native",
    "carry-bot", "spread-hunter", "lp-rebalancer", "basis-trader", "twap-agent",
  ];
  const row = [...agents, ...agents];
  return (
    <div className="fade-edges overflow-hidden border-y border-flow-100 py-4">
      <div className="flex w-max animate-marquee gap-3">
        {row.map((a, i) => (
          <span
            key={i}
            className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-flow-100 bg-white px-3.5 py-1.5 font-mono text-xs text-ink-soft"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-flow-400" />
            {a}
            <span className="text-ink-faint">submitted intent</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Insight() {
  const items = [
    ["A resting limit order is free alpha.", "Passive orders get adversely selected — you capture none of the spread you create for the market."],
    ["Patient flow is valuable.", "Non-toxic, uninformed order flow is exactly what market makers will pay real money to access."],
    ["So we auction it.", "Resolvers compete for your order; the rebate bid fee is routed straight back to you."],
  ];
  return (
    <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-flow-100 bg-flow-100 py-px sm:grid-cols-3">
      {items.map(([t, d], i) => (
        <div key={t} className="bg-white p-7">
          <div className="mb-3 font-mono text-sm text-flow-500">0{i + 1}</div>
          <div className="font-display text-lg font-bold text-ink">{t}</div>
          <div className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</div>
        </div>
      ))}
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Intent", "An agent submits “buy 0.5 BTC @ 95,000” over MCP with a hash of the encrypted execution payload."],
    ["Escrowed auction", "Resolvers must lock rebate MNT in FlowReceipt before their bid is executable."],
    ["Winner handoff", "ClawFlow selects the best rebate-backed bid and routes the payload only to the winner's pubkey."],
    ["Execute & settle", "The winner places the order on Byreal Perps; Mantle releases escrow to the user and records the receipt."],
  ];
  return (
    <section id="how" className="py-20">
      <H eyebrow="How it works" title="From intent to on-chain proof — autonomously" />
      <div className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([t, d], i) => (
          <div
            key={t}
            className="group relative rounded-2xl border border-flow-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-flow-400"
          >
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-flow-50 font-mono text-sm font-semibold text-flow-600 ring-1 ring-flow-100">
              {i + 1}
            </div>
            <div className="font-display font-bold text-ink">{t}</div>
            <div className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</div>
            {i < steps.length - 1 && (
              <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-flow-200 lg:block">→</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    {
      lane: "User agent",
      title: "Submit intent",
      body: "Sends the limit order plus encrypted payload hash to ClawFlow MCP.",
      proof: "private payload",
      tone: "rebate",
    },
    {
      lane: "Auction MCP",
      title: "Open auction",
      body: "Broadcasts order terms and orderHash to connected resolver agents.",
      proof: "shared venue",
      tone: "neutral",
    },
    {
      lane: "Resolvers",
      title: "Lock rebate",
      body: "Each executable resolver bid first escrows MNT in FlowReceipt.",
      proof: "lockRebate tx",
      tone: "flow",
    },
    {
      lane: "Resolvers",
      title: "Bid with pubkey",
      body: "Bids include execution terms, rebate bid fee, resolver pubkey, escrowId, and escrow tx.",
      proof: "no escrow, no bid",
      tone: "flow",
    },
    {
      lane: "Auction MCP",
      title: "Select winner",
      body: "Scores rebate bid fee + execution terms, then routes the encrypted payload to the winning resolver.",
      proof: "best user value",
      tone: "neutral",
    },
    {
      lane: "Byreal Perps",
      title: "Place order",
      body: "Winner decrypts the payload and places the order through the forked Byreal skill path.",
      proof: "Byreal order id",
      tone: "muted",
    },
    {
      lane: "Mantle",
      title: "Release rebate",
      body: "FlowReceipt settles with encryptedPayloadHash, pays escrow to the user, and emits AuctionSettled.",
      proof: "settlement tx",
      tone: "rebate",
    },
  ];

  return (
    <section id="workflow" className="py-20">
      <H eyebrow="Workflow" title="Escrow first, encrypted handoff, then verifiable settlement" />
      <p className="mt-3 max-w-2xl text-ink-soft">
        The bid is only trusted after money is locked. The order payload is only useful to the winner. The final
        tx proves who won, which order was placed, and where the rebate went.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-flow-100 bg-white shadow-card">
        <div className="grid border-b border-flow-100 bg-flow-50/70 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-ink-faint sm:grid-cols-[120px_1fr_160px] sm:px-6">
          <span>Actor</span>
          <span className="hidden sm:block">Action</span>
          <span className="hidden sm:block">Proof</span>
        </div>
        <div className="divide-y divide-flow-100">
          {steps.map((s, i) => (
            <WorkflowRow key={s.title} index={i + 1} {...s} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Assurance
          label="Economic guarantee"
          title="Resolvers prepay the rebate"
          body="A bid without a lockRebate tx is non-executable, so the user does not rely on a resolver promise."
        />
        <Assurance
          label="Privacy guarantee"
          title="Only the winner gets the payload"
          body="The user submits an encrypted payload hash first; the actual execution payload is routed for the winner's pubkey."
        />
        <Assurance
          label="Proof guarantee"
          title="Settlement is inspectable"
          body="The final Mantle receipt links orderHash, encryptedPayloadHash, resolver, user, and rebate paid."
        />
      </div>

      <ValueFlow />
    </section>
  );
}

function WorkflowRow({ index, lane, title, body, proof, tone }) {
  const tones = {
    rebate: "bg-rebate-soft text-rebate ring-rebate/20",
    flow: "bg-flow-50 text-flow-600 ring-flow-200",
    neutral: "bg-white text-ink-soft ring-flow-100",
    muted: "bg-white text-ink-faint ring-flow-100",
  };
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[120px_1fr_160px] sm:items-center sm:px-6">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-flow-600 font-mono text-xs font-bold text-white">
          {index}
        </span>
        <span className="text-sm font-semibold text-ink">{lane}</span>
      </div>
      <div>
        <div className="font-display text-lg font-bold text-ink">{title}</div>
        <div className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</div>
      </div>
      <div className={"inline-flex w-fit rounded-2xl px-3 py-1 font-mono text-xs font-medium ring-1 " + tones[tone]}>
        {proof}
      </div>
    </div>
  );
}

function Assurance({ label, title, body }) {
  return (
    <div className="rounded-2xl border border-flow-100 bg-white p-5 shadow-card">
      <div className="font-mono text-[11px] uppercase tracking-widest text-flow-500">{label}</div>
      <div className="mt-2 font-display text-lg font-bold text-ink">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

function ValueFlow() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-flow-100 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <span className="flex h-9 shrink-0 items-center rounded-lg bg-flow-600 px-3 font-mono text-xs font-semibold text-white">
            INTENT →
          </span>
          <p className="text-sm text-ink-soft">
            Order flow moves <span className="font-medium text-flow-600">forward</span>: agent → ClawFlow →
            resolver → Byreal → Mantle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-9 shrink-0 items-center rounded-lg bg-rebate px-3 font-mono text-xs font-semibold text-white">
            ← VALUE
          </span>
          <p className="text-sm text-ink-soft">
            The captured edge splits <span className="font-medium text-rebate">back</span>: the rebate bid fee goes
            to the submitter, and any remaining alpha stays with the winning resolver.
          </p>
        </div>
      </div>
    </div>
  );
}

function TwoSided() {
  return (
    <section className="grid gap-5 py-8 sm:grid-cols-2">
      <Card
        accent="rebate"
        tag="For intent submitters"
        title="Get paid to be patient"
        body="Place the order you were going to place anyway, then earn the rebate bid fee attached by the winning resolver."
        chip="you earn → rebate"
      />
      <Card
        accent="flow"
        tag="For resolvers"
        title="Handle valuable flow"
        body="Win a stream of patient, uninformed intents, handle the Byreal execution path, and attach a rebate bid fee that makes your bid competitive."
        chip="you earn → alpha"
      />
    </section>
  );
}

function Install() {
  return (
    <section id="install" className="py-20">
      <H eyebrow="Install" title="Add ByrealFlow to Codex or Claude" />
      <p className="mt-3 max-w-2xl text-ink-soft">
        ByrealFlow is the Byreal execution skill with the ClawFlow auction layer wrapped around it. Agents keep
        calling a Byreal-style order skill; the wrapper intercepts patient limit orders, runs the resolver auction,
        then hands the winning payload back to Byreal Perps execution.
      </p>
      <div className="mt-7 space-y-3">
        <Code title="Install for Codex">npx skills add jinsuha784-design/clawflow --agent codex --yes</Code>
        <Code title="Install for Claude Code">npx skills add jinsuha784-design/clawflow --agent claude-code --yes</Code>
        <Code title="Install for both demo agents">
          npx skills add jinsuha784-design/clawflow --agent codex --agent claude-code --yes
        </Code>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-flow-100 py-10 text-sm text-ink-faint">
      Built for the Mantle Turing Test Hackathon — Agentic Economy Track (Byreal). Execution on Byreal Perps,
      settlement on Mantle.
    </footer>
  );
}

/* ---------- helpers ---------- */
function H({ eyebrow, title }) {
  return (
    <div>
      <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-flow-500">{eyebrow}</div>
      <h2 className="mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">{title}</h2>
    </div>
  );
}

function Card({ tag, title, body, chip, accent }) {
  const accents = {
    rebate: "bg-rebate-soft text-rebate ring-rebate/20",
    flow: "bg-flow-50 text-flow-600 ring-flow-200",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-flow-100 bg-white p-7 shadow-card">
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-widest text-ink-faint">{tag}</div>
        <div className="mt-3 font-display text-2xl font-bold text-ink">{title}</div>
        <div className="mt-3 text-sm leading-relaxed text-ink-soft">{body}</div>
        <div className={"mt-5 inline-flex rounded-2xl px-3 py-1 font-mono text-xs font-medium ring-1 " + accents[accent]}>
          {chip}
        </div>
      </div>
    </div>
  );
}

function Code({ title, children }) {
  return (
    <div className="rounded-2xl border border-flow-100 bg-white p-4 shadow-card">
      <div className="mb-2 text-xs text-ink-faint">{title}</div>
      <code className="font-mono text-sm text-flow-700">
        <span className="select-none text-ink-faint">$ </span>
        {children}
      </code>
    </div>
  );
}
