// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC3643 - Interface for compliant security tokens (T-REX standard)
interface IERC3643 {
    function identityRegistry() external view returns (address);
    function compliance() external view returns (address);
    function onchainID() external view returns (address);
    function isFrozen(address wallet) external view returns (bool);

    function forcedTransfer(address from, address to, uint256 amount) external returns (bool);
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function setAddressFrozen(address wallet, bool freeze) external;
}
