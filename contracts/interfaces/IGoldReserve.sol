// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGoldReserve - Physical gold bar registry interface
interface IGoldReserve {
    struct GoldBar {
        string barId;
        uint256 weightGrams;
        uint16 purityBps;   // 9999 = 99.99%, 9160 = 91.6%
        string vaultId;
        address custodian;
        string assayRef;
        bool active;
        uint256 registeredAt;
    }

    event BarRegistered(string indexed barId, uint256 weightGrams, uint16 purityBps, string vaultId);
    event BarDeactivated(string indexed barId);

    function registerBar(
        string calldata barId,
        uint256 weightGrams,
        uint16 purityBps,
        string calldata vaultId,
        string calldata assayRef
    ) external;

    function deactivateBar(string calldata barId) external;

    function getBar(string calldata barId) external view returns (GoldBar memory);
    function getTotalActiveWeightGrams() external view returns (uint256);
    function getBarCount() external view returns (uint256);
    function getBarIdAt(uint256 index) external view returns (string memory);
}
