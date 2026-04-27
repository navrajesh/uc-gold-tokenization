// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IERC3643.sol";
import "../interfaces/IModularCompliance.sol";
import "../interfaces/IIdentityRegistry.sol";

/// @title Token - ERC-3643 compliant security token (UUPS upgradeable)
/// @notice All transfers are gated by identity verification and compliance modules.
///         Implements the T-REX (Token for Regulated EXchanges) standard.
contract Token is
    Initializable,
    ERC20Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IERC3643
{
    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant AGENT_ROLE     = keccak256("AGENT_ROLE");
    bytes32 public constant SUPPLY_MODIFIER = keccak256("SUPPLY_MODIFIER");
    bytes32 public constant FREEZER        = keccak256("FREEZER");

    // ─── State ────────────────────────────────────────────────────────────────
    IIdentityRegistry private   _identityRegistry;
    IModularCompliance internal  _compliance;   // internal so GoldToken can call .created/.destroyed
    address private              _onchainID;
    uint8 private                _tokenDecimals;
    mapping(address => bool) private _frozen;

    // ─── Events ───────────────────────────────────────────────────────────────
    event AddressFrozen(address indexed wallet, bool isFrozen);

    /// @notice Disables the initializer on the implementation contract.
    /// @dev    UUPS safety requirement: prevents the implementation contract itself
    ///         from being initialized directly, which would allow an attacker to
    ///         call initialize() on the bare logic contract and take ownership.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ─── Internal initializer (for inheritance by GoldToken) ─────────────────

    /// @notice Internal one-time setup called by GoldToken.initialize().
    /// @dev    Uses OpenZeppelin's onlyInitializing guard so it can only be called
    ///         from within an initializer chain (not directly). Wires identity
    ///         registry and compliance, then grants all admin roles to admin_.
    /// @param identityRegistry_ KYC registry contract; isVerified() is called on
    ///                          the recipient before every transfer.
    /// @param compliance_       Modular compliance orchestrator; canTransfer() is
    ///                          called before transfers, transferred/created/destroyed
    ///                          called after state changes for module accounting.
    /// @param name_             ERC-20 token name (e.g. "UC Gold Token").
    /// @param symbol_           ERC-20 ticker symbol (e.g. "UCGLD").
    /// @param decimals_         Token decimal precision. 18 means 1 token = 1e18 wei.
    /// @param onchainID_        Optional on-chain identity contract address. Informational
    ///                          in this POC; in production this points to the token's
    ///                          ONCHAINID (ERC-734/735) contract.
    /// @param admin_            Address granted DEFAULT_ADMIN_ROLE, AGENT_ROLE,
    ///                          SUPPLY_MODIFIER, and FREEZER at deployment.
    function __Token_init(
        address identityRegistry_,
        address compliance_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address onchainID_,
        address admin_
    ) internal onlyInitializing {
        __ERC20_init(name_, symbol_);
        __AccessControl_init();

        _identityRegistry = IIdentityRegistry(identityRegistry_);
        _compliance       = IModularCompliance(compliance_);
        _onchainID        = onchainID_;
        _tokenDecimals    = decimals_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(AGENT_ROLE,         admin_);
        _grantRole(SUPPLY_MODIFIER,    admin_);
        _grantRole(FREEZER,            admin_);
    }

    // ─── ERC-3643 view functions ──────────────────────────────────────────────

    /// @notice Returns the address of the IIdentityRegistry contract.
    /// @dev    Used by off-chain tooling to locate the KYC whitelist contract
    ///         without reading storage slots directly.
    /// @return Address of the deployed IdentityRegistry.
    function identityRegistry() external view override returns (address) {
        return address(_identityRegistry);
    }

    /// @notice Returns the address of the IModularCompliance contract.
    /// @dev    Used by off-chain tooling to enumerate active compliance modules
    ///         via ModularCompliance.getModules().
    /// @return Address of the deployed ModularCompliance.
    function compliance() external view override returns (address) {
        return address(_compliance);
    }

    /// @notice Returns the token's associated on-chain identity address.
    /// @dev    Informational in this POC. In a full T-REX deployment this would
    ///         point to an ONCHAINID (ERC-734/735) contract that carries the
    ///         issuer's verified claims.
    /// @return The onchainID address set at initialization.
    function onchainID() external view override returns (address) {
        return _onchainID;
    }

    /// @notice Returns whether a wallet is currently frozen.
    /// @dev    Frozen wallets are blocked from both sending and receiving tokens
    ///         in _checkTransferAllowed(). Freeze state is set by FREEZER role.
    /// @param  wallet The address to query.
    /// @return True if the wallet is frozen, false otherwise.
    function isFrozen(address wallet) external view override returns (bool) {
        return _frozen[wallet];
    }

    /// @notice Returns the number of decimal places used by the token.
    /// @dev    Overrides ERC20Upgradeable which hardcodes 18. The value is stored
    ///         separately so GoldToken can configure different decimal precisions
    ///         at deploy time without re-implementing OpenZeppelin internals.
    /// @return The decimal precision set at initialization.
    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }

    // ─── Compliant transfer ───────────────────────────────────────────────────

    /// @notice Transfers tokens from msg.sender to `to`, enforcing KYC and compliance.
    /// @dev    Calls _checkTransferAllowed() before the ERC-20 state change, then
    ///         notifies _compliance.transferred() after success so modules like
    ///         MaxWalletBalance can update their internal accounting.
    ///         Compliance is notified AFTER the transfer to ensure the accounting
    ///         update reflects the new on-chain state.
    /// @param  to     Recipient address. Must be KYC-verified and not frozen.
    /// @param  amount Amount of tokens to transfer, in wei.
    /// @return True on success (reverts on failure).
    function transfer(address to, uint256 amount) public override returns (bool) {
        _checkTransferAllowed(msg.sender, to, amount);
        bool result = super.transfer(to, amount);
        if (result) _compliance.transferred(msg.sender, to, amount);
        return result;
    }

    /// @notice Transfers tokens on behalf of `from` using the caller's allowance.
    /// @dev    Same compliance checks as transfer(). The allowance deduction is
    ///         handled by super.transferFrom() (OpenZeppelin ERC-20 logic).
    ///         Compliance notification happens after the successful state change.
    /// @param  from   Address whose tokens will be transferred. Must not be frozen.
    /// @param  to     Recipient address. Must be KYC-verified and not frozen.
    /// @param  amount Amount of tokens to transfer, in wei.
    /// @return True on success (reverts on failure).
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _checkTransferAllowed(from, to, amount);
        bool result = super.transferFrom(from, to, amount);
        if (result) _compliance.transferred(from, to, amount);
        return result;
    }

    /// @notice Internal pre-transfer validation. Reverts if any check fails.
    /// @dev    Called by both transfer() and transferFrom() before any state changes.
    ///         Order of checks: frozen sender → frozen recipient → KYC → compliance.
    ///         Failing fast on freeze avoids a compliance module call for trivially
    ///         blocked addresses.
    /// @param  from   The sending address.
    /// @param  to     The receiving address.
    /// @param  amount The token amount being transferred, in wei.
    function _checkTransferAllowed(address from, address to, uint256 amount) internal view {
        require(!_frozen[from],                           "Token: sender frozen");
        require(!_frozen[to],                             "Token: recipient frozen");
        require(_identityRegistry.isVerified(to),         "Token: recipient not verified");
        require(_compliance.canTransfer(from, to, amount), "Token: compliance rejected");
    }

    // ─── Supply management ────────────────────────────────────────────────────

    /// @notice Creates new tokens and assigns them to `to`.
    /// @dev    Marked virtual so GoldToken can override it to add a reserve cap check.
    ///         Notifies _compliance.created() after minting so modules like
    ///         MaxWalletBalance can track the recipient's new balance.
    ///         Does NOT check KYC on the recipient — minting is a privileged admin
    ///         action assumed to target pre-verified wallets.
    /// @param  to     Address to receive the newly minted tokens.
    /// @param  amount Number of tokens to mint, in wei.
    function mint(address to, uint256 amount) external virtual override onlyRole(SUPPLY_MODIFIER) {
        _mint(to, amount);
        _compliance.created(to, amount);
    }

    /// @notice Mints tokens to multiple addresses in a single transaction.
    /// @dev    More gas-efficient than calling mint() repeatedly for initial
    ///         distributions or airdrops. Arrays must be the same length.
    ///         Each recipient gets an individual _compliance.created() notification
    ///         so module accounting remains correct per-wallet.
    /// @param  toList  Array of recipient addresses.
    /// @param  amounts Array of token amounts (in wei) corresponding to each address.
    function batchMint(
        address[] calldata toList,
        uint256[] calldata amounts
    ) external onlyRole(SUPPLY_MODIFIER) {
        require(toList.length == amounts.length, "Token: length mismatch");
        for (uint256 i = 0; i < toList.length; i++) {
            _mint(toList[i], amounts[i]);
            _compliance.created(toList[i], amounts[i]);
        }
    }

    /// @notice Destroys tokens from `from`, permanently reducing total supply.
    /// @dev    Marked virtual so subclasses can override (GoldToken uses _burn
    ///         directly in fulfillRedemption rather than this role-gated entry point).
    ///         Notifies _compliance.destroyed() so modules update internal accounting.
    /// @param  from   Address whose tokens will be burned.
    /// @param  amount Number of tokens to burn, in wei.
    function burn(address from, uint256 amount) external virtual override onlyRole(SUPPLY_MODIFIER) {
        _burn(from, amount);
        _compliance.destroyed(from, amount);
    }

    // ─── Agent functions ──────────────────────────────────────────────────────

    /// @notice Bypasses compliance checks to forcibly move tokens between addresses.
    /// @dev    Intended for regulatory seizure, court-ordered recovery, or error
    ///         correction by a designated agent. Does NOT call _checkTransferAllowed,
    ///         so KYC, freeze state, and compliance modules are all skipped.
    ///         _compliance.transferred() is still called so module accounting
    ///         (e.g. MaxWalletBalance internal balances) stays consistent.
    /// @param  from   Source address; tokens are taken regardless of freeze state.
    /// @param  to     Destination address; KYC check is bypassed.
    /// @param  amount Amount to transfer, in wei.
    /// @return True on success (reverts on failure).
    function forcedTransfer(
        address from,
        address to,
        uint256 amount
    ) external override onlyRole(AGENT_ROLE) returns (bool) {
        _transfer(from, to, amount);
        _compliance.transferred(from, to, amount);
        return true;
    }

    /// @notice Sets or clears the frozen flag for a wallet.
    /// @dev    Frozen wallets are rejected at the start of _checkTransferAllowed,
    ///         blocking both inbound and outbound transfers. Freeze does not affect
    ///         forcedTransfer() — agents can still move tokens out of a frozen wallet.
    /// @param  wallet The address to freeze or unfreeze.
    /// @param  freeze True to freeze, false to unfreeze.
    function setAddressFrozen(address wallet, bool freeze) external override onlyRole(FREEZER) {
        _frozen[wallet] = freeze;
        emit AddressFrozen(wallet, freeze);
    }

    // ─── UUPS upgrade authorization ───────────────────────────────────────────

    /// @notice UUPS hook that authorizes a contract upgrade.
    /// @dev    Empty body — the onlyRole(DEFAULT_ADMIN_ROLE) modifier is the entire
    ///         implementation. Only the deployer admin can authorize pointing the
    ///         proxy to a new logic contract. Reverts for all other callers.
    /// @param  newImplementation Address of the new implementation (unused; checked
    ///                           by OpenZeppelin's upgrade machinery).
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
