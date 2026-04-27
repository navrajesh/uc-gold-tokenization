// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IIdentityRegistry.sol";

/// @title IdentityRegistry
/// @notice Tracks on-chain KYC verification status per investor address.
///         POC implementation — in production this integrates with ONCHAINID.
contract IdentityRegistry is IIdentityRegistry {
    address public owner;
    mapping(address => bool) private _verified;

    event IdentityRegistered(address indexed user, bool verified);
    event OwnershipTransferred(address indexed previous, address indexed next);

    modifier onlyOwner() {
        require(msg.sender == owner, "IdentityRegistry: not owner");
        _;
    }

    /// @notice Deploys the registry and sets the initial owner.
    /// @dev    Uses a simple owner pattern (not AccessControl) to keep the KYC
    ///         registry lightweight. In production this would be replaced by
    ///         ONCHAINID (ERC-734/735) where claims are issued and verified by
    ///         identity providers, not a single owner address.
    /// @param  _owner Address that will have exclusive rights to register identities.
    constructor(address _owner) {
        owner = _owner;
    }

    /// @notice Sets or revokes KYC verification for a wallet address.
    /// @dev    Called by the backend after admin approves or revokes KYC in the
    ///         Admin Panel. Pass verified=true to whitelist, false to revoke.
    ///         Revoking a wallet's KYC does not freeze or burn their tokens —
    ///         existing holders keep their balance but cannot receive new transfers
    ///         because Token._checkTransferAllowed() calls isVerified(to).
    ///         In a full T-REX implementation this would be replaced by an
    ///         ONCHAINID claim issuance / revocation flow.
    /// @param  user     The investor wallet address to register or update.
    /// @param  verified True to approve KYC (whitelist), false to revoke.
    function registerIdentity(address user, bool verified) external override onlyOwner {
        _verified[user] = verified;
        emit IdentityRegistered(user, verified);
    }

    /// @notice Returns whether a wallet address is KYC-verified.
    /// @dev    Called by Token._checkTransferAllowed() before every transfer.
    ///         Only the recipient (to address) is checked — the sender is not
    ///         required to be verified at the point of transfer (they were verified
    ///         at mint time). Unregistered addresses return false by default
    ///         (Solidity mapping default for bool).
    /// @param  user The wallet address to query.
    /// @return True if the address has been registered with verified=true.
    function isVerified(address user) external view override returns (bool) {
        return _verified[user];
    }

    /// @notice Transfers owner privileges to a new address.
    /// @dev    The new owner immediately gains the ability to call registerIdentity().
    ///         Zero address is rejected to prevent locking the registry permanently.
    ///         Unlike OpenZeppelin Ownable, there is no two-step accept pattern —
    ///         double-check the new owner address before calling.
    /// @param  newOwner The address that will become the new owner.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "IdentityRegistry: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
