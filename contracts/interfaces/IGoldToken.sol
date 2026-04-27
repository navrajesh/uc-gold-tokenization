// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGoldToken - Gold-specific extensions to the ERC-3643 token
interface IGoldToken {
    event RedemptionRequested(
        address indexed investor,
        uint256 grams,
        string deliveryAddress,
        uint256 timestamp
    );
    event RedemptionFulfilled(
        address indexed investor,
        uint256 amountWei,
        string redemptionRef
    );
    event GoldReserveUpdated(address indexed reserve);

    function purityStandard() external view returns (string memory);
    function goldReserveAddress() external view returns (address);

    function setGoldReserve(address reserve) external;
    function requestRedemption(uint256 grams, string calldata deliveryAddress) external;
    function fulfillRedemption(address investor, uint256 amountWei, string calldata redemptionRef) external;
}
