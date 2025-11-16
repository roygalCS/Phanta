// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for a Chainlink Price Feed
interface IPriceFeed {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

// ----------------------------------------------------------------------------
// Contract 1: TimeHook for Daily TWAP Orders
// ----------------------------------------------------------------------------

/**
 * @title TimeHook for 1inch Limit Orders
 * @author Wattlink Hackathon Team
 * @notice This contract serves as both a predicate and a post-interaction hook
 * for time-locked TWAP (Time-Weighted Average Price) orders. It ensures that a specific
 * order can only be filled once every 24 hours.
 */
contract TimeHook is Ownable {
    // Mapping to store the last execution timestamp for a given order series.
    mapping(bytes32 => uint256) public lastExecutionTime;

    // The minimum time that must pass between executions.
    uint256 public constant TIME_INTERVAL = 24 hours;

    event OrderSeriesRegistered(bytes32 indexed seriesId, address indexed user);
    event TimestampUpdated(bytes32 indexed seriesId, uint256 newTimestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice The predicate function called by the 1inch Limit Order Protocol.
     * @param seriesId A unique identifier for the user's series of TWAP orders.
     * @return A boolean indicating if the order can be filled.
     */
    function checkTime(bytes32 seriesId) external view returns (bool) {
        uint256 lastTime = lastExecutionTime[seriesId];
        if (lastTime == 0) {
            return true; // First execution is always valid after registration.
        }
        return (block.timestamp >= lastTime + TIME_INTERVAL);
    }

    /**
     * @notice The post-interaction hook called by the 1inch LOP after a successful fill.
     * @param seriesId A unique identifier for the user's series of TWAP orders.
     */
    function updateTimestamp(bytes32 seriesId) external {
        // In a production environment, you would add `require(msg.sender == 1INCH_LOP_ADDRESS)`
        // for enhanced security.
        lastExecutionTime[seriesId] = block.timestamp;
        emit TimestampUpdated(seriesId, block.timestamp);
    }

    /**
     * @notice A function for the user to initialize their order series.
     * @param seriesId The unique identifier the user will use for all their TWAP orders.
     */
    function registerOrderSeries(bytes32 seriesId) external {
        require(lastExecutionTime[seriesId] == 0, "Series already registered");
        // Setting to 0 allows the first `checkTime` call to succeed.
        lastExecutionTime[seriesId] = 0;
        emit OrderSeriesRegistered(seriesId, msg.sender);
    }
}


// ----------------------------------------------------------------------------
// Contract 2: PricePredicate for Dip-Buying Orders
// ----------------------------------------------------------------------------

/**
 * @title PricePredicate for 1inch Limit Orders
 * @author Wattlink Hackathon Team
 * @notice A stateless predicate that checks if the current market price from a
 * Chainlink oracle is below a specified maximum price.
 */
contract PricePredicate {
    /**
     * @notice The predicate function called by the 1inch Limit Order Protocol.
     * @param oracleAddress The on-chain address of the Chainlink price feed.
     * @param maxPrice The maximum price (in the oracle's denomination) at which
     * the order is allowed to be filled. The oracle's price must be BELOW this value.
     * @return A boolean indicating if the price condition is met.
     */
    function checkPrice(address oracleAddress, uint256 maxPrice) external view returns (bool) {
        IPriceFeed priceFeed = IPriceFeed(oracleAddress);
        (, int256 price, , , ) = priceFeed.latestRoundData();

        require(price > 0, "Invalid oracle price");

        return uint256(price) < maxPrice;
    }
}
