// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IIdentityRegistry - On-chain KYC / identity verification interface
interface IIdentityRegistry {
    function isVerified(address user) external view returns (bool);
    function registerIdentity(address user, bool verified) external;
}
