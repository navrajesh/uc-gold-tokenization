// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IGoldReserve.sol";

/// @title GoldReserve - On-chain registry of physical gold bars backing the token supply
/// @notice The custodian registers and manages gold bars here.
///         GoldToken reads getTotalActiveWeightGrams() to enforce the 1:1 reserve cap.
contract GoldReserve is AccessControl, IGoldReserve {
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");

    mapping(string => IGoldReserve.GoldBar) private _bars;
    string[] private _barIds;

    /// @notice Deploys the GoldReserve contract and sets initial role holders.
    /// @dev    Uses OpenZeppelin AccessControl directly (not upgradeable) because
    ///         the reserve registry is intentionally not upgradeable — bar records
    ///         should be immutable once registered to preserve audit integrity.
    ///         Passing address(0) for custodian_ skips the custodian grant; the
    ///         admin can grant it later via grantRole().
    /// @param  admin_     Address granted DEFAULT_ADMIN_ROLE (can add/remove roles).
    /// @param  custodian_ Address granted CUSTODIAN_ROLE (can register/deactivate bars).
    ///                    Pass address(0) to skip at deploy time.
    constructor(address admin_, address custodian_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        if (custodian_ != address(0)) {
            _grantRole(CUSTODIAN_ROLE, custodian_);
        }
    }

    // ─── Custodian functions ──────────────────────────────────────────────────

    /// @notice Registers a new physical gold bar on-chain and marks it active.
    /// @dev    The new bar immediately contributes its weightGrams to the reserve
    ///         total returned by getTotalActiveWeightGrams(), expanding the available
    ///         mint headroom in GoldToken. Bar IDs are immutable once set — there is
    ///         no update function by design, to preserve audit integrity.
    ///         Reverts if barId already exists (idempotency protection) or weight is 0.
    /// @param  barId       Unique identifier for the physical bar (e.g. "GB-2024-001").
    ///                     Set by the custodian at registration; immutable thereafter.
    /// @param  weightGrams Physical weight of the bar in grams. Added to the active
    ///                     reserve total used by the GoldToken mint cap.
    /// @param  purityBps   Gold purity in basis points.
    ///                     9999 = 99.99% fine gold (LBMA 999.9 standard).
    ///                     9160 = 91.6% (916 standard / 22-karat).
    /// @param  vaultId     Identifier of the secure vault facility holding the bar
    ///                     (e.g. "Vault-SG-A"). Informational; not validated on-chain.
    /// @param  assayRef    Reference number of the independent assay certificate that
    ///                     verifies this bar's weight and purity. Informational.
    function registerBar(
        string calldata barId,
        uint256 weightGrams,
        uint16  purityBps,
        string  calldata vaultId,
        string  calldata assayRef
    ) external override onlyRole(CUSTODIAN_ROLE) {
        require(weightGrams > 0,                             "GoldReserve: zero weight");
        require(bytes(_bars[barId].barId).length == 0,       "GoldReserve: bar already exists");

        _bars[barId] = IGoldReserve.GoldBar({
            barId:        barId,
            weightGrams:  weightGrams,
            purityBps:    purityBps,
            vaultId:      vaultId,
            custodian:    msg.sender,
            assayRef:     assayRef,
            active:       true,
            registeredAt: block.timestamp
        });
        _barIds.push(barId);

        emit BarRegistered(barId, weightGrams, purityBps, vaultId);
    }

    /// @notice Marks a bar as inactive, removing it from the reserve total.
    /// @dev    Immediately reduces the value returned by getTotalActiveWeightGrams(),
    ///         tightening the GoldToken mint cap. If totalSupply already equals the
    ///         remaining active reserve, no further minting is possible until a new
    ///         bar is registered.
    ///         Deactivation is irreversible — there is no reactivate function. To
    ///         replace a deactivated bar, register a new one with a different barId.
    ///         Reverts if the bar is already inactive.
    /// @param  barId The unique identifier of the bar to deactivate.
    function deactivateBar(string calldata barId) external override onlyRole(CUSTODIAN_ROLE) {
        require(_bars[barId].active, "GoldReserve: bar not active");
        _bars[barId].active = false;
        emit BarDeactivated(barId);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    /// @notice Returns the full GoldBar struct for a given bar ID.
    /// @dev    Returns a zero-value struct (with an empty barId string) if the barId
    ///         does not exist. Callers should check bar.barId != "" to detect missing bars.
    /// @param  barId The unique identifier of the bar to retrieve.
    /// @return The GoldBar struct containing weight, purity, vault, status, and timestamps.
    function getBar(string calldata barId)
        external view override
        returns (IGoldReserve.GoldBar memory)
    {
        return _bars[barId];
    }

    /// @notice Returns the sum of weightGrams across all currently active bars.
    /// @dev    Called by GoldToken.mint() on every mint to enforce the reserve cap.
    ///         Iterates over the full _barIds array including inactive bars (skipped
    ///         by the active check). O(n) complexity — acceptable at the scale of
    ///         this POC (tens to low hundreds of bars). For very large bar counts,
    ///         maintain a running total state variable instead.
    /// @return Total active gold weight in grams.
    function getTotalActiveWeightGrams() external view override returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < _barIds.length; i++) {
            if (_bars[_barIds[i]].active) {
                total += _bars[_barIds[i]].weightGrams;
            }
        }
        return total;
    }

    /// @notice Returns the total number of bars ever registered (including inactive).
    /// @dev    Used by off-chain tooling to know the upper bound for getBarIdAt()
    ///         pagination. Does not subtract deactivated bars.
    /// @return Count of all registered bars.
    function getBarCount() external view override returns (uint256) {
        return _barIds.length;
    }

    /// @notice Returns the bar ID at a specific index in registration order.
    /// @dev    Used by off-chain tooling to paginate through all bars without
    ///         exposing the private _barIds array directly. Combine with getBar()
    ///         to enumerate full bar details:
    ///             for i in range(getBarCount()): getBar(getBarIdAt(i))
    ///         Reverts if index is out of bounds.
    /// @param  index Zero-based index into the bar registration list.
    /// @return The barId string at that index.
    function getBarIdAt(uint256 index) external view override returns (string memory) {
        require(index < _barIds.length, "GoldReserve: index out of bounds");
        return _barIds[index];
    }
}
