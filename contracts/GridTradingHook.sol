// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GridTradingHook for 1inch Limit Order Protocol
 * @author Wattlink Hackathon Team
 * @notice This contract enables a grid trading strategy. It manages a series of
 * buy and sell orders, activating the corresponding order after one is filled.
 * It serves as both a predicate and a post-interaction hook.
 */
contract GridTradingHook is Ownable {
    // Mapping to link a buy order hash to its corresponding sell order hash, and vice-versa.
    mapping(bytes32 => bytes32) public pairedOrders;

    // Mapping to track which orders in the grid are currently active and fillable.
    mapping(bytes32 => bool) public isActive;

    event GridRegistered(address indexed user, uint256 numberOfPairs);
    event OrderActivated(bytes32 indexed orderHash);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice PREDICATE function called by the 1inch LOP before filling an order.
     * @dev Checks if a specific order hash has been marked as active in the grid.
     * @param orderHash The hash of the limit order being checked.
     * @return A boolean indicating if the order can be filled.
     */
    function checkIsActive(bytes32 orderHash) external view returns (bool) {
        return isActive[orderHash];
    }

    /**
     * @notice POST-INTERACTION HOOK function called by the 1inch LOP after a fill.
     * @dev When an order is filled, this function deactivates it and activates its
     * corresponding pair in the grid.
     * @param filledOrderHash The hash of the order that was just successfully filled.
     */
    function activatePairedOrder(bytes32 filledOrderHash) external {
        // In a production app, you would add a check to ensure only the 1inch LOP
        // contract can call this function for maximum security.
        // require(msg.sender == 1INCH_LOP_ADDRESS, "Caller is not the 1inch LOP");

        // Deactivate the order that was just filled to prevent it from being filled again.
        isActive[filledOrderHash] = false;

        // Find the corresponding order in the grid.
        bytes32 orderToActivate = pairedOrders[filledOrderHash];

        // Ensure a paired order exists before trying to activate it.
        require(orderToActivate != bytes32(0), "No paired order found");

        // Activate the new order, making it fillable.
        isActive[orderToActivate] = true;
        emit OrderActivated(orderToActivate);
    }

    /**
     * @notice INITIALIZATION function called directly by the user's wallet once.
     * @dev This on-chain transaction registers the entire grid, linking all buy
     * and sell orders and setting the initial active orders.
     * @param buyOrderHashes An array of all the buy order hashes in the grid.
     * @param sellOrderHashes An array of all the sell order hashes in the grid.
     * @param initialActiveHashes An array of hashes for the orders that should be
     * active immediately upon registration (e.g., all buy orders below the current
     * price and all sell orders above the current price).
     */
    function registerGrid(
        bytes32[] calldata buyOrderHashes,
        bytes32[] calldata sellOrderHashes,
        bytes32[] calldata initialActiveHashes
    ) external {
        require(buyOrderHashes.length == sellOrderHashes.length, "Mismatched order pairs");

        // Pair up each buy order with a corresponding sell order.
        for (uint256 i = 0; i < buyOrderHashes.length; i++) {
            bytes32 buyHash = buyOrderHashes[i];
            bytes32 sellHash = sellOrderHashes[i];
            pairedOrders[buyHash] = sellHash;
            pairedOrders[sellHash] = buyHash;
        }

        // Set the initial state of the grid by activating the first set of orders.
        for (uint256 i = 0; i < initialActiveHashes.length; i++) {
            isActive[initialActiveHashes[i]] = true;
            emit OrderActivated(initialActiveHashes[i]);
        }

        emit GridRegistered(msg.sender, buyOrderHashes.length);
    }
}
