// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ClawFlow FlowReceipt
/// @notice Resolver first escrows the promised rebate, then settles after receiving the user's
///         encrypted execution payload. The settlement forwards escrowed MNT to the user and
///         records the encrypted payload hash as the verifiable proof shown in the demo.
contract FlowReceipt {
    struct Escrow {
        bytes32 orderHash;
        address resolver;
        address user;
        uint256 amountWei;
        bool settled;
    }

    struct Receipt {
        bytes32 orderHash;
        bytes32 encryptedPayloadHash;
        address resolver;       // winning maker (msg.sender)
        address user;           // rebate recipient
        uint64 improvementBps;
        uint64 rebateBps;
        uint64 flowFeeBps;
        uint256 notionalUsd1e6; // notional in USD, scaled by 1e6
        uint256 rebatePaidWei;  // actual MNT forwarded to the user
        uint256 timestamp;
    }

    uint256 public count;
    mapping(uint256 => Receipt) public receipts;
    mapping(bytes32 => Escrow) public escrows;

    event RebateEscrowed(
        bytes32 indexed escrowId,
        bytes32 indexed orderHash,
        address indexed resolver,
        address user,
        uint256 amountWei
    );

    event AuctionSettled(
        uint256 indexed id,
        bytes32 indexed orderHash,
        bytes32 encryptedPayloadHash,
        address indexed resolver,
        address user,
        uint64 improvementBps,
        uint64 rebateBps,
        uint64 flowFeeBps,
        uint256 notionalUsd1e6,
        uint256 rebatePaidWei,
        uint256 timestamp
    );

    /// @notice Called by a resolver before its bid is considered executable.
    function lockRebate(bytes32 escrowId, bytes32 orderHash, address user) external payable {
        require(user != address(0), "missing user");
        require(msg.value > 0, "missing rebate");
        Escrow storage e = escrows[escrowId];
        require(e.amountWei == 0, "rebate already locked");
        e.orderHash = orderHash;
        e.resolver = msg.sender;
        e.user = user;
        e.amountWei = msg.value;
        emit RebateEscrowed(escrowId, orderHash, msg.sender, user, msg.value);
    }

    /// @notice Called by the winning resolver after the user submits the encrypted execution
    ///         payload. Only the resolver that locked the rebate can settle this order.
    function settleWithEncryptedPayload(
        bytes32 escrowId,
        bytes32 orderHash,
        bytes32 encryptedPayloadHash,
        uint64 improvementBps,
        uint64 rebateBps,
        uint64 flowFeeBps,
        uint256 notionalUsd1e6
    ) external returns (uint256 id) {
        Escrow storage e = escrows[escrowId];
        require(e.orderHash == orderHash, "wrong order");
        require(e.resolver == msg.sender, "not escrow resolver");
        require(!e.settled, "already settled");
        e.settled = true;

        (bool ok, ) = payable(e.user).call{value: e.amountWei}("");
        require(ok, "rebate transfer failed");

        id = ++count;
        receipts[id] = Receipt(
            orderHash, encryptedPayloadHash, msg.sender, e.user, improvementBps, rebateBps, flowFeeBps,
            notionalUsd1e6, e.amountWei, block.timestamp
        );
        emit AuctionSettled(
            id, orderHash, encryptedPayloadHash, msg.sender, e.user, improvementBps, rebateBps, flowFeeBps,
            notionalUsd1e6, e.amountWei, block.timestamp
        );
    }
}
