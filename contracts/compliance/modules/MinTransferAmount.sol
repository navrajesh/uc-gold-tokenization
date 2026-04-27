// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../interfaces/IComplianceModule.sol";

/// @title MinTransferAmount
/// @notice Blocks any transfer below the configured minimum amount.
///         Default of 1e18 (with 18 decimals) = 1 gram minimum.
contract MinTransferAmount is IComplianceModule {
    address public owner;
    uint256 public minAmount;

    event MinAmountUpdated(uint256 newMin);

    modifier onlyOwner() {
        require(msg.sender == owner, "MinTransferAmount: not owner");
        _;
    }

    /// @notice Deploys the module with an initial minimum transfer threshold.
    /// @dev    The default deployment in this POC uses 1e18, which with 18 decimals
    ///         equates to 1 gram. This prevents dust transfers and aligns with the
    ///         physical redemption minimum (can't deliver fractional grams).
    ///         Unlike MaxWalletBalance, this module is stateless — no per-wallet
    ///         tracking is needed, so there is no concern about bootstrap ordering.
    /// @param  _owner     Address that can update the minimum transfer threshold.
    /// @param  _minAmount Initial minimum token amount in wei. For an 18-decimal
    ///                    token, 1e18 = 1 gram, 50e18 = 50 grams, etc.
    constructor(address _owner, uint256 _minAmount) {
        owner = _owner;
        minAmount = _minAmount;
    }

    /// @notice Updates the minimum transfer amount threshold.
    /// @dev    Takes effect immediately for all future transfers. Setting minAmount
    ///         to 0 effectively disables the restriction (amount >= 0 is always true).
    ///         No zero-check is applied here — a zero minimum is a valid way to
    ///         disable the rule without removing the module from ModularCompliance.
    /// @param  _min New minimum transfer amount in wei.
    function setMinAmount(uint256 _min) external onlyOwner {
        minAmount = _min;
        emit MinAmountUpdated(_min);
    }

    // ─── IComplianceModule ────────────────────────────────────────────────────

    /// @notice Returns true if the transfer amount meets the minimum threshold.
    /// @dev    Simple threshold check — completely stateless. The from and to
    ///         addresses are ignored; only the amount matters. This module is
    ///         evaluated by ModularCompliance.canTransfer() before any ERC-20
    ///         state changes, so it correctly blocks the transaction before gas
    ///         is consumed on the transfer itself.
    /// @param  amount The token amount being transferred, in wei.
    /// @return True if amount >= minAmount, false if the transfer is too small.
    function canTransfer(address, address, uint256 amount) external view override returns (bool) {
        return amount >= minAmount;
    }

    /// @notice No-op: MinTransferAmount is stateless and needs no transfer accounting.
    function transferred(address, address, uint256) external override {}

    /// @notice No-op: MinTransferAmount is stateless and needs no mint accounting.
    function created(address, uint256) external override {}

    /// @notice No-op: MinTransferAmount is stateless and needs no burn accounting.
    function destroyed(address, uint256) external override {}
}
