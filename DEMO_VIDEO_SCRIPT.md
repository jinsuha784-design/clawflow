# ByrealFlow Demo Video Script

## Demo Goal

Show that ByrealFlow is a wrapped Byreal Perps skill with a ClawFlow auction layer.

The user or agent still submits a Byreal-style order, but before execution the order flow is sent to an MCP auction. Resolver agents compete for the flow, the winning resolver handles execution, and Mantle records the rebate and settlement proof on-chain.

## Recommended Screen Setup

Use four panes for the main recording:

1. Landing page
2. Auction MCP server logs
3. Resolver Agent A
4. Resolver Agent B

Then switch to:

5. User agent / skill command
6. Mantle Explorer transaction page

Optional: add Resolver Agent C if you want the auction to look more competitive.

## Scene 1: Product Context

Show the landing page.

Voiceover:

```text
This is ByrealFlow, our proposal for the Byreal Perps skill.

We forked the Byreal skill path and wrapped it with ClawFlow, an MCP-based order-flow auction. The agent still places a Byreal-style order, but patient limit orders can first be auctioned to resolver agents.
```

Show the install section.

Voiceover:

```text
The same wrapper skill can be added to Codex or Claude Code. From the user's point of view, this is still a Byreal execution skill. The difference is that the wrapper can intercept the order, run the auction, and return the winning execution path.
```

Command shown on screen:

```bash
npx skills add jinsuha784-design/clawflow --agent codex --agent claude-code --yes
```

## Scene 2: Start The Auction MCP

Show Terminal 1.

Command:

```bash
pnpm dev:mcp
```

Voiceover:

```text
This is the auction MCP server. It is the coordination layer between the user agent and resolver agents.

The MCP server receives the Byreal-style order intent, broadcasts it as an auction, accepts resolver bids, selects the winner, and returns the result back to the skill.
```

Expected visual:

```text
Local: http://localhost:3001
POST /mcp 200
```

## Scene 3: Start Resolver Agents

Show Terminal 2 and Terminal 3.

Common environment:

```bash
export MCP_URL=http://localhost:3001/mcp
export MANTLE_RPC=https://rpc.mantle.xyz
export FLOW_RECEIPT_ADDRESS=0xf7F78BfCddA8cddB24c0915495257E593f47B117
export REBATE_MNT=0.000001
export PRIVATE_KEY=0x...
```

Resolver Agent A:

```bash
PROFILE=aggressive node packages/agents/src/maker-agent.mjs
```

Resolver Agent B:

```bash
PROFILE=neutral node packages/agents/src/maker-agent.mjs
```

Optional Resolver Agent C:

```bash
PROFILE=conservative node packages/agents/src/maker-agent.mjs
```

Voiceover:

```text
These resolver agents are competing to handle the user's Byreal order flow.

The important point is that the resolver is not just claiming a rebate. The resolver handles the execution path on behalf of the submitter and attaches a rebate bid fee to make its bid competitive.
```

Do not show the real private key or mnemonic in the recording.

## Scene 4: Submit A Byreal-Style Order

Show Terminal 4 or the user agent pane.

Command:

```bash
MCP_URL=http://localhost:3001/mcp \
USER_ADDRESS=0x8619624a7F4d0Cc79Cc565B0E35CFb242389fd93 \
pnpm --filter @clawflow/byreal-skill auction-order -- \
  --side buy --coin BTC --size 0.5 --limit 95000 --fair 94850 --window 8000
```

Voiceover:

```text
Now the user submits a Byreal-style limit order through the wrapper skill.

Instead of sending the order directly to execution, the skill submits an encrypted intent to the auction MCP server. The resolvers can bid, but only the winner receives the execution handoff.
```

Expected output to highlight:

```json
{
  "auctionId": "auc_...",
  "encryptedPayloadHash": "0x...",
  "winner": {
    "maker": "policy:aggressive",
    "fillPrice": 94868.97,
    "rebateEscrowTx": "0x..."
  },
  "settlement": {
    "userSavingUsd": 65.51,
    "rebateUsd": 4.74,
    "userTotalUsd": 70.26
  }
}
```

## Scene 5: Show The Auction Flow

Return to the landing page workflow animation.

Voiceover:

```text
The user agent does not talk directly to the winning resolver. The exchange goes through the auction system.

The user submits the intent to the MCP auction. The auction broadcasts the opportunity to resolver agents. The winner is selected, then the encrypted execution payload and result are routed back through the auction system.
```

Point out:

- The submitter creates the order and rebate opportunity.
- Resolvers compete to handle execution.
- The winner routes the Byreal execution path.
- The submitter earns the rebate bid fee.
- Mantle stores the settlement proof.

## Scene 6: Show Mantle Transactions

Open Mantle Explorer with the tx hash from the terminal output.

Voiceover:

```text
The rebate and settlement are not just UI events. They are visible on Mantle mainnet.

Here we can see the resolver's rebate escrow transaction, and then the final settlement receipt emitted after the auction result is confirmed.
```

Show:

- `rebateEscrowTx`
- settlement tx hash
- contract address: `0xf7F78BfCddA8cddB24c0915495257E593f47B117`

## Scene 7: Closing

Return to landing page hero.

Voiceover:

```text
ByrealFlow is our proposed extension to the Byreal Perps skill.

It keeps the Byreal execution path, but adds an agentic order-flow auction before execution. That lets patient order flow receive resolver competition, rebate bids, and verifiable Mantle settlement.

For Byreal, this turns the skill into a smarter execution layer for autonomous agents.
```

## Short Version

Use this if the demo must fit under one minute:

```text
ByrealFlow is a wrapped Byreal Perps skill powered by ClawFlow.

The user submits a Byreal-style limit order from Codex or Claude. Instead of immediately executing, the wrapper sends the encrypted intent to an MCP auction. Resolver agents compete to handle the order, attach rebate bids, and route the winning execution path back through the auction system.

The submitter earns the rebate bid fee, the resolver gets valuable flow, and Mantle records the rebate and settlement proof on-chain.
```

