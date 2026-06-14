# ClawFlow Contracts — FlowReceipt (Mantle mainnet)

Resolvers must escrow their promised rebate before their bid is executable:

1. Resolver calls `lockRebate(escrowId, orderHash, user)` with native MNT.
2. User submits an encrypted execution payload for the winning resolver.
3. Winner calls `settleWithEncryptedPayload(...)`.
4. The contract forwards escrowed MNT to the user and emits `AuctionSettled`.

The demo proof is: rebate escrow tx + encrypted payload hash + final `AuctionSettled` tx.

> ⚠️ **Mainnet = real money.** Gas and the rebate are paid in real MNT. Keep `REBATE_MNT` tiny
> (e.g. 0.001) and only fund the resolver/deployer with what you need for the demo.

## Build
```bash
cd packages/contracts
forge build
```

## Deploy to Mantle mainnet (you provide gas)
```bash
export MANTLE_RPC=https://rpc.mantle.xyz        # chainId 5000
export PRIVATE_KEY=0x...                          # funded with real MNT

forge create src/FlowReceipt.sol:FlowReceipt \
  --rpc-url $MANTLE_RPC --private-key $PRIVATE_KEY --broadcast
```
Copy the deployed address into the repo-root `.env` as `FLOW_RECEIPT_ADDRESS`. Resolver agents then
escrow rebates before bidding and settle via `packages/agents/src/settle-mantle.mjs`.

Current Mantle mainnet deployment:

```bash
FLOW_RECEIPT_ADDRESS=0xf7F78BfCddA8cddB24c0915495257E593f47B117
```

Deployment and test tx metadata are recorded in `deployments/mantle-mainnet.json`.

Explorer: https://explorer.mantle.xyz · RPC/chainId: confirm current values in Mantle's docs.
