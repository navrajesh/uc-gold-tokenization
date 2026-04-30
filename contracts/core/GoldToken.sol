// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Token.sol";
import "../interfaces/IGoldToken.sol";
import "../interfaces/IGoldReserve.sol";

/// @title GoldToken - ERC-3643 token where 1 token = 1 gram of physical gold
/// @notice Extends the base Token with:
///         - A CUSTODIAN_ROLE for vault operators
///         - A reserve cap: total supply can never exceed registered gold weight
///         - On-chain redemption lifecycle hooks (request + fulfill/burn)
contract GoldToken is Token {
    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");

    // ─── State ────────────────────────────────────────────────────────────────
    string     public purityStandard;   // e.g. "999.9" or "916.0"
    IGoldReserve public goldReserveContract;

    // ─── Events ───────────────────────────────────────────────────────────────
    event RedemptionRequested(
        address indexed investor,
        uint256 grams,
        string  deliveryAddress,
        uint256 timestamp
    );
    event RedemptionFulfilled(
        address indexed investor,
        uint256 amountWei,
        string  redemptionRef
    );
    event GoldReserveUpdated(address indexed reserve);

    // ─── Initializer ─────────────────────────────────────────────────────────

    /// @notice One-time initializer for the UUPS proxy. Must be called immediately
    ///         after deployment; cannot be called again (Initializable guard).
    /// @dev    Delegates base ERC-20 and AccessControl setup to __Token_init, then
    ///         sets gold-specific state. Passing address(0) for goldReserve_ disables
    ///         reserve cap enforcement (useful for testing); passing address(0) for
    ///         custodian_ skips granting CUSTODIAN_ROLE at deploy time.
    /// @param  identityRegistry_ KYC registry contract address.
    /// @param  compliance_       Modular compliance orchestrator address.
    /// @param  name_             ERC-20 token name (e.g. "UC Gold Token").
    /// @param  symbol_           ERC-20 ticker symbol (e.g. "UCGLD").
    /// @param  decimals_         Token decimal precision (typically 18).
    /// @param  onchainID_        Token issuer's on-chain identity address (informational).
    /// @param  admin_            Address granted all admin roles.
    /// @param  purityStandard_   Human-readable gold purity string (e.g. "999.9", "916.0").
    /// @param  goldReserve_      Address of the GoldReserve contract. Pass address(0) to
    ///                           skip reserve cap enforcement.
    /// @param  custodian_        Address granted CUSTODIAN_ROLE for fulfillRedemption.
    ///                           Pass address(0) to skip at deploy time (grant later).
    function initialize(
        address identityRegistry_,
        address compliance_,
        string  memory name_,
        string  memory symbol_,
        uint8   decimals_,
        address onchainID_,
        address admin_,
        string  memory purityStandard_,
        address goldReserve_,
        address custodian_
    ) external initializer {
        __Token_init(
            identityRegistry_,
            compliance_,
            name_,
            symbol_,
            decimals_,
            onchainID_,
            admin_
        );
        purityStandard = purityStandard_;

        if (goldReserve_ != address(0)) {
            goldReserveContract = IGoldReserve(goldReserve_);
        }
        if (custodian_ != address(0)) {
            _grantRole(CUSTODIAN_ROLE, custodian_);
        }
    }

    // ─── Gold-specific admin ─────────────────────────────────────────────────

    /// @notice Updates the GoldReserve contract used for the mint reserve cap.
    /// @dev    Used if the reserve contract is redeployed or upgraded. Zero address
    ///         is explicitly rejected to prevent accidentally disabling the reserve
    ///         cap by passing address(0). To intentionally disable cap enforcement,
    ///         deploy a stub contract that returns a very large value from
    ///         getTotalActiveWeightGrams().
    /// @param  reserve Address of the new GoldReserve contract.
    function setGoldReserve(address reserve) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(reserve != address(0), "GoldToken: zero address");
        goldReserveContract = IGoldReserve(reserve);
        emit GoldReserveUpdated(reserve);
    }

    /// @notice Returns the current GoldReserve contract address.
    /// @dev    Exposes the internal IGoldReserve reference as a plain address for
    ///         off-chain tooling and front-end display without needing to decode
    ///         the storage slot directly.
    /// @return Address of the active GoldReserve contract, or address(0) if unset.
    function goldReserveAddress() external view returns (address) {
        return address(goldReserveContract);
    }

    // ─── Override mint — enforce reserve cap ─────────────────────────────────

    /// @notice Mints gold tokens, enforcing that total supply never exceeds vault reserves.
    /// @dev    Overrides Token.mint() to add the reserve cap check before _mint.
    ///         Queries goldReserveContract.getTotalActiveWeightGrams() and converts
    ///         grams to wei using the token's decimal precision:
    ///             reserveCap = reserveGrams * 10^decimals()
    ///         The cap is only enforced when goldReserveContract != address(0).
    ///         If no reserve contract is configured, behaves identically to Token.mint().
    ///         Notifies _compliance.created() after minting for module accounting.
    /// @param  to     KYC-verified recipient address.
    /// @param  amount Number of tokens to mint in wei. Must not push totalSupply
    ///                past reserveGrams * 10^decimals().
    function mint(address to, uint256 amount) external override onlyRole(SUPPLY_MODIFIER) {
        if (address(goldReserveContract) != address(0)) {
            uint256 reserveGrams = goldReserveContract.getTotalActiveWeightGrams();
            // 1 token = 1 gram, expressed in wei with token's decimal precision
            uint256 reserveCap = reserveGrams * (10 ** decimals());
            require(
                totalSupply() + amount <= reserveCap,
                "GoldToken: mint would exceed vault reserve"
            );
        }
        _mint(to, amount);
        _compliance.created(to, amount);
    }

    // ─── Override batchMint — enforce reserve cap on total ───────────────────

    /// @notice Batch-mints gold tokens, checking the reserve cap against the combined total.
    /// @dev    Overrides Token.batchMint() to perform a single up-front reserve cap check
    ///         on the sum of all amounts before any _mint calls, preventing a batch from
    ///         being partially applied when the aggregate would exceed the vault reserve.
    /// @param  toList  Array of recipient addresses.
    /// @param  amounts Array of token amounts (in wei) corresponding to each address.
    function batchMint(
        address[] calldata toList,
        uint256[] calldata amounts
    ) external override onlyRole(SUPPLY_MODIFIER) {
        require(toList.length == amounts.length, "Token: length mismatch");
        if (address(goldReserveContract) != address(0)) {
            uint256 batchTotal = 0;
            for (uint256 i = 0; i < amounts.length; i++) {
                batchTotal += amounts[i];
            }
            uint256 reserveGrams = goldReserveContract.getTotalActiveWeightGrams();
            uint256 reserveCap   = reserveGrams * (10 ** decimals());
            require(
                totalSupply() + batchTotal <= reserveCap,
                "GoldToken: mint would exceed vault reserve"
            );
        }
        for (uint256 i = 0; i < toList.length; i++) {
            _mint(toList[i], amounts[i]);
            _compliance.created(toList[i], amounts[i]);
        }
    }

    // ─── Redemption ──────────────────────────────────────────────────────────

    /// @notice Investor signals intent to redeem their tokens for physical gold.
    /// @dev    This function only emits an event — no tokens are moved or locked.
    ///         The backend listens for RedemptionRequested events and creates a
    ///         corresponding off-chain redemption record (status: PENDING).
    ///         The two-step design (request here, burn in fulfillRedemption) allows
    ///         admin review and physical delivery coordination before tokens are
    ///         permanently destroyed.
    ///         Reverts if the investor's balance is less than the requested grams.
    /// @param  grams           Number of whole grams the investor wants to redeem.
    ///                         Must be > 0 and ≤ floor(balanceOf(msg.sender) / 10^decimals).
    /// @param  deliveryAddress Physical delivery address for the gold shipment.
    ///                         Stored off-chain in the redemption record; not
    ///                         persisted on-chain beyond the event log.
    function requestRedemption(
        uint256 grams,
        string calldata deliveryAddress
    ) external {
        require(grams > 0, "GoldToken: zero grams");
        require(
            balanceOf(msg.sender) >= grams * (10 ** decimals()),
            "GoldToken: insufficient balance"
        );
        emit RedemptionRequested(msg.sender, grams, deliveryAddress, block.timestamp);
    }

    /// @notice Burns the investor's tokens after physical gold delivery is confirmed.
    /// @dev    Called by the custodian once the off-chain redemption status is APPROVED
    ///         and physical delivery has been completed. Permanently removes amountWei
    ///         tokens from circulation, reducing totalSupply and expanding the available
    ///         mint headroom in the reserve cap.
    ///         Notifies _compliance.destroyed() so modules like MaxWalletBalance
    ///         update their internal accounting for the investor's reduced balance.
    ///         redemptionRef should match the off-chain reference ID so the backend
    ///         can correlate the on-chain burn event with the database record and
    ///         store the resulting transaction hash as burnTxHash.
    /// @param  investor      Wallet address whose tokens will be burned.
    /// @param  amountWei     Token amount to burn in wei (e.g. 50 grams = 50 * 10^18).
    /// @param  redemptionRef Off-chain reference ID (e.g. "REDEEM-20240101-abc") used
    ///                       to correlate the burn with the database redemption record.
    function fulfillRedemption(
        address investor,
        uint256 amountWei,
        string calldata redemptionRef
    ) external onlyRole(CUSTODIAN_ROLE) {
        require(amountWei > 0, "GoldToken: zero amount");
        require(balanceOf(investor) >= amountWei, "GoldToken: investor balance too low");
        _burn(investor, amountWei);
        _compliance.destroyed(investor, amountWei);
        emit RedemptionFulfilled(investor, amountWei, redemptionRef);
    }
}
