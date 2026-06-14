export default function Page() {
  return (
    <main style={{ padding: 40, lineHeight: 1.7, maxWidth: 720 }}>
      <h1>🦞 ClawFlow MCP Server</h1>
      <p>Agentic order-flow auction venue. Maker and taker agents connect over MCP (Streamable HTTP).</p>
      <pre style={{ background: "#16161d", padding: 16, borderRadius: 8 }}>endpoint:  /mcp</pre>
      <p>Tools:</p>
      <ul>
        <li><code>submit_intent</code> — taker posts a limit-order intent</li>
        <li><code>list_open_auctions</code> — makers discover open flow</li>
        <li><code>place_bid</code> — makers compete on price improvement + rebate</li>
        <li><code>get_result</code> — winner + settlement once the window closes</li>
        <li><code>settle</code> — on-chain payload for the Mantle FlowReceipt</li>
      </ul>
    </main>
  );
}
