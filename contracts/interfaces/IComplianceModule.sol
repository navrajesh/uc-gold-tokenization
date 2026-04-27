// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IComplianceModule - Interface for pluggable compliance rule modules
interface IComplianceModule {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
    function transferred(address from, address to, uint256 amount) external;
    function created(address to, uint256 amount) external;
    function destroyed(address from, uint256 amount) external;
}
