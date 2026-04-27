// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../interfaces/IComplianceModule.sol";

/// @title MaxWalletBalance
/// @notice Prevents any single wallet from holding more than maxBalance tokens.
///         Tracks internal balances via the compliance lifecycle hooks.
contract MaxWalletBalance is IComplianceModule {
    address public owner;
    uint256 public maxBalance;

    mapping(address => uint256) private _tracked;

    event MaxBalanceUpdated(uint256 newMax);

    modifier onlyOwner() {
        require(msg.sender == owner, "MaxWalletBalance: not owner");
        _;
    }

    /// @notice Deploys the module with an initial per-wallet balance cap.
    /// @dev    The _tracked mapping starts empty (all zeros). The module only
    ///         accumulates accurate tracking from the point it is added to
    ///         ModularCompliance — balances held before this module was added
    ///         will not be reflected in _tracked until tokens are moved.
    ///         For correct enforcement at launch, add this module BEFORE any
    ///         tokens are minted, or seed _tracked with existing balances.
    /// @param  _owner      Address that can update the maxBalance cap.
    /// @param  _maxBalance Initial maximum token balance in wei that any single
    ///                     wallet may hold (e.g. 10_000 * 1e18 for 10,000 grams).
    constructor(address _owner, uint256 _maxBalance) {
        owner = _owner;
        maxBalance = _maxBalance;
    }

    /// @notice Updates the maximum token balance any single wallet may hold.
    /// @dev    Takes effect immediately for all future transfers and mints.
    ///         Existing wallets that already exceed the new limit are NOT
    ///         retroactively blocked — they simply cannot receive more tokens
    ///         until their balance drops below the new cap. Zero is rejected
    ///         because a cap of zero would block all transfers and mints.
    /// @param  _max New maximum balance in wei. Must be greater than zero.
    function setMaxBalance(uint256 _max) external onlyOwner {
        require(_max > 0, "MaxWalletBalance: zero max");
        maxBalance = _max;
        emit MaxBalanceUpdated(_max);
    }

    // ─── IComplianceModule ────────────────────────────────────────────────────

    /// @notice Checks whether adding `amount` to `to`'s tracked balance would
    ///         exceed the maxBalance cap.
    /// @dev    Uses _tracked[to] (internal accounting) rather than the ERC-20
    ///         balanceOf because this module is called before the ERC-20 state
    ///         change completes, so balanceOf would still reflect the pre-transfer
    ///         value. The `from` address is ignored — only the recipient is capped.
    /// @param  to     The recipient whose balance would increase.
    /// @param  amount The token amount being transferred or minted, in wei.
    /// @return True if the transfer is within the cap, false if it would exceed it.
    function canTransfer(address, address to, uint256 amount) external view override returns (bool) {
        return _tracked[to] + amount <= maxBalance;
    }

    /// @notice Updates internal accounting after a completed transfer.
    /// @dev    Called by ModularCompliance.transferred() after every successful
    ///         Token.transfer() or Token.transferFrom(). Deducts from the sender
    ///         and adds to the recipient so future canTransfer() checks reflect
    ///         current balances. This is the only source of truth for _tracked —
    ///         it is never synced from the ERC-20 balanceOf directly.
    /// @param  from   The address that sent tokens; its tracked balance is reduced.
    /// @param  to     The address that received tokens; its tracked balance is increased.
    /// @param  amount The token amount transferred, in wei.
    function transferred(address from, address to, uint256 amount) external override {
        _tracked[from] -= amount;
        _tracked[to]   += amount;
    }

    /// @notice Updates internal accounting after tokens are minted.
    /// @dev    Called by ModularCompliance.created() after every Token.mint() or
    ///         Token.batchMint(). Adds the minted amount to the recipient's tracked
    ///         balance so canTransfer() correctly enforces the cap on the next
    ///         inbound transfer attempt.
    /// @param  to     The address that received newly minted tokens.
    /// @param  amount The number of tokens minted, in wei.
    function created(address to, uint256 amount) external override {
        _tracked[to] += amount;
    }

    /// @notice Updates internal accounting after tokens are burned.
    /// @dev    Called by ModularCompliance.destroyed() after every Token.burn() or
    ///         GoldToken.fulfillRedemption(). Reduces the burned wallet's tracked
    ///         balance, freeing capacity for future mints or inbound transfers
    ///         up to the maxBalance cap.
    /// @param  from   The address whose tokens were burned.
    /// @param  amount The number of tokens burned, in wei.
    function destroyed(address from, uint256 amount) external override {
        _tracked[from] -= amount;
    }
}
