// Post escrow + settlement to the FlowReceipt contract on Mantle (ethers v6).
// Env: MANTLE_RPC, PRIVATE_KEY (resolver), FLOW_RECEIPT_ADDRESS
import { ethers } from "ethers";

const ABI = [
  "function lockRebate(bytes32 escrowId,bytes32 orderHash,address user) payable",
  "function settleWithEncryptedPayload(bytes32 escrowId,bytes32 orderHash,bytes32 encryptedPayloadHash,uint64 improvementBps,uint64 rebateBps,uint64 flowFeeBps,uint256 notionalUsd1e6) returns (uint256)",
  "event RebateEscrowed(bytes32 indexed escrowId,bytes32 indexed orderHash,address indexed resolver,address user,uint256 amountWei)",
  "event AuctionSettled(uint256 indexed id,bytes32 indexed orderHash,bytes32 encryptedPayloadHash,address indexed resolver,address user,uint64 improvementBps,uint64 rebateBps,uint64 flowFeeBps,uint256 notionalUsd1e6,uint256 rebatePaidWei,uint256 timestamp)",
];

function contract() {
  const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return new ethers.Contract(process.env.FLOW_RECEIPT_ADDRESS, ABI, wallet);
}

export async function lockRebateOnMantle({ escrowId, orderHash, user, rebateWei }) {
  if (!user) throw new Error("missing user (rebate recipient) address");
  const tx = await contract().lockRebate(escrowId, orderHash, user, { value: rebateWei ?? 0n });
  const r = await tx.wait();
  return r.hash;
}

export async function settleOnMantle({ escrowId, orderHash, encryptedPayloadHash, improvementBps, rebateBps, flowFeeBps, notionalUsd }) {
  const tx = await contract().settleWithEncryptedPayload(
    escrowId,
    orderHash,
    encryptedPayloadHash ?? ethers.id(`encrypted:${orderHash}`),
    Math.round(improvementBps), Math.round(rebateBps), Math.round(flowFeeBps),
    Math.round(notionalUsd * 1e6)
  );
  const r = await tx.wait();
  return r.hash;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const escrowId = ethers.id("demo-order-1:resolver");
  const orderHash = ethers.id("demo-order-1");
  const lockHash = await lockRebateOnMantle({
    escrowId,
    orderHash,
    user: process.env.USER_ADDRESS ?? "0x000000000000000000000000000000000000dEaD",
    rebateWei: ethers.parseEther(process.env.REBATE_MNT ?? "0.001"),
  });
  console.log("rebate locked, tx:", lockHash, "\nexplorer:", `https://explorer.mantle.xyz/tx/${lockHash}`);
  const hash = await settleOnMantle({
    escrowId,
    orderHash,
    encryptedPayloadHash: ethers.id("demo-encrypted-payload"),
    improvementBps: 14, rebateBps: 1, flowFeeBps: 1, notionalUsd: 47434,
  });
  console.log("settled, tx:", hash, "\nexplorer:", `https://explorer.mantle.xyz/tx/${hash}`);
}
