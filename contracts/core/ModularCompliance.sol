// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IModularCompliance.sol";
import "../interfaces/IComplianceModule.sol";

/// @title ModularCompliance
/// @notice Orchestrates multiple pluggable compliance modules.
///         A transfer is allowed only when ALL modules approve (AND logic).
contract ModularCompliance is IModularCompliance {
    address public owner;
    address[] private _modules;

    event ModuleAdded(address indexed module);
    event ModuleRemoved(address indexed module);

    modifier onlyOwner() {
        require(msg.sender == owner, "Compliance: not owner");
        _;
    }

    /// @notice Deploys the compliance orchestrator with a single owner.
    /// @dev    Uses a simple owner pattern for module management. In production,
    ///         this would typically be owned by the token's DEFAULT_ADMIN_ROLE
    ///         multisig or a DAO governance contract to prevent unilateral
    ///         compliance changes.
    /// @param  _owner Address that can add and remove compliance modules.
    constructor(address _owner) {
        owner = _owner;
    }

    /// @notice Adds a new compliance module to the enforcement list.
    /// @dev    Every module in the list must approve ALL future transfers.
    ///         Adding a restrictive module immediately affects all subsequent
    ///         transfer attempts — there is no grace period.
    ///         Duplicate modules are rejected with a linear scan; the list is
    ///         expected to be short (< 10 modules) so the O(n) check is acceptable.
    /// @param  module Address of the IComplianceModule contract to add.
    function addModule(address module) external onlyOwner {
        for (uint256 i = 0; i < _modules.length; i++) {
            require(_modules[i] != module, "Compliance: already added");
        }
        _modules.push(module);
        emit ModuleAdded(module);
    }

    /// @notice Removes a compliance module from the enforcement list.
    /// @dev    Uses swap-and-pop: replaces the target element with the last element,
    ///         then pops the array. This is O(n) to find and O(1) to remove, but
    ///         changes the iteration order of remaining modules — acceptable because
    ///         module evaluation is commutative (AND logic).
    ///         Reverts if the module address is not in the list.
    /// @param  module Address of the IComplianceModule contract to remove.
    function removeModule(address module) external onlyOwner {
        for (uint256 i = 0; i < _modules.length; i++) {
            if (_modules[i] == module) {
                _modules[i] = _modules[_modules.length - 1];
                _modules.pop();
                emit ModuleRemoved(module);
                return;
            }
        }
        revert("Compliance: module not found");
    }

    /// @notice Returns the list of all currently active compliance module addresses.
    /// @dev    Used by off-chain tooling to inspect which rules are enforced without
    ///         reading storage slots directly. The order reflects insertion order
    ///         minus any swap-and-pop removals.
    /// @return Array of IComplianceModule contract addresses.
    function getModules() external view returns (address[] memory) {
        return _modules;
    }

    /// @notice Checks whether a transfer is permitted by all active modules.
    /// @dev    Iterates modules and short-circuits (returns false) as soon as any
    ///         module rejects. Returns true only if every module returns true — AND
    ///         logic. Called by Token._checkTransferAllowed() before state changes,
    ///         so this function must be a pure/view query with no side effects.
    ///         If no modules are registered, all transfers pass through.
    /// @param  from   The sending address.
    /// @param  to     The receiving address.
    /// @param  amount The token amount being transferred, in wei.
    /// @return True if all modules approve, false if any module rejects.
    function canTransfer(address from, address to, uint256 amount) external view override returns (bool) {
        for (uint256 i = 0; i < _modules.length; i++) {
            if (!IComplianceModule(_modules[i]).canTransfer(from, to, amount)) {
                return false;
            }
        }
        return true;
    }

    /// @notice Notifies all modules that a transfer has completed.
    /// @dev    Called by Token.transfer() and Token.transferFrom() after the ERC-20
    ///         state change succeeds. Allows stateful modules (e.g. MaxWalletBalance)
    ///         to update their internal accounting to reflect the new balances.
    ///         Also called by Token.forcedTransfer() so module accounting stays
    ///         consistent even for agent-bypassed transfers.
    /// @param  from   The address that sent tokens.
    /// @param  to     The address that received tokens.
    /// @param  amount The token amount transferred, in wei.
    function transferred(address from, address to, uint256 amount) external override {
        for (uint256 i = 0; i < _modules.length; i++) {
            IComplianceModule(_modules[i]).transferred(from, to, amount);
        }
    }

    /// @notice Notifies all modules that new tokens have been minted.
    /// @dev    Called by Token.mint() and Token.batchMint() after _mint.
    ///         Allows stateful modules like MaxWalletBalance to add the newly
    ///         minted amount to the recipient's tracked balance, ensuring future
    ///         canTransfer() checks reflect the correct post-mint balance.
    /// @param  to     The address that received the newly minted tokens.
    /// @param  amount The number of tokens minted, in wei.
    function created(address to, uint256 amount) external override {
        for (uint256 i = 0; i < _modules.length; i++) {
            IComplianceModule(_modules[i]).created(to, amount);
        }
    }

    /// @notice Notifies all modules that tokens have been burned.
    /// @dev    Called by Token.burn() and GoldToken.fulfillRedemption() after _burn.
    ///         Allows stateful modules to subtract the burned amount from the wallet's
    ///         tracked balance, freeing up capacity for future mints or transfers.
    /// @param  from   The address whose tokens were burned.
    /// @param  amount The number of tokens burned, in wei.
    function destroyed(address from, uint256 amount) external override {
        for (uint256 i = 0; i < _modules.length; i++) {
            IComplianceModule(_modules[i]).destroyed(from, amount);
        }
    }
}
