// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../interfaces/IComplianceModule.sol";

/// @title CountryRestrictions
/// @notice Whitelist of allowed ISO 3166-1 numeric country codes.
///         When whitelistEnabled=false (default), all transfers pass through.
///         Enable in production and add allowed country codes to enforce restrictions.
contract CountryRestrictions is IComplianceModule {
    address public owner;
    mapping(uint16 => bool) public allowedCountries;
    bool public whitelistEnabled;

    event CountryAdded(uint16 countryCode);
    event CountryRemoved(uint16 countryCode);

    modifier onlyOwner() {
        require(msg.sender == owner, "CountryRestrictions: not owner");
        _;
    }

    /// @notice Deploys the module with country restrictions disabled by default.
    /// @dev    whitelistEnabled starts as false so the module is a transparent
    ///         pass-through until explicitly activated. This prevents the module
    ///         from blocking all transfers at deployment before countries are
    ///         configured. Call setWhitelistEnabled(true) + addCountry() to activate.
    /// @param  _owner Address that can manage the country list and toggle enforcement.
    constructor(address _owner) {
        owner = _owner;
        whitelistEnabled = false;
    }

    /// @notice Adds an ISO 3166-1 numeric country code to the allowed list.
    /// @dev    Has no effect until setWhitelistEnabled(true) is called.
    ///         ISO 3166-1 numeric examples: 702 = Singapore, 840 = USA, 826 = UK.
    ///         Adding a country that is already allowed is a no-op (bool mapping
    ///         just gets set to true again); no duplicate check needed.
    /// @param  countryCode ISO 3166-1 numeric country code to allow.
    function addCountry(uint16 countryCode) external onlyOwner {
        allowedCountries[countryCode] = true;
        emit CountryAdded(countryCode);
    }

    /// @notice Removes an ISO 3166-1 numeric country code from the allowed list.
    /// @dev    Immediately blocks transfers to/from wallets registered in that
    ///         country once whitelistEnabled is true. Existing holders in that
    ///         country are not affected retroactively — only new transfers are
    ///         blocked. Does not check whether the country was previously added.
    /// @param  countryCode ISO 3166-1 numeric country code to disallow.
    function removeCountry(uint16 countryCode) external onlyOwner {
        allowedCountries[countryCode] = false;
        emit CountryRemoved(countryCode);
    }

    /// @notice Toggles enforcement of the country whitelist.
    /// @dev    When false (default), canTransfer() always returns true regardless
    ///         of the allowedCountries mapping. Set to true to start enforcing
    ///         country restrictions. Can be toggled on/off at any time.
    /// @param  enabled True to enforce country restrictions, false to disable.
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
    }

    // ─── IComplianceModule ────────────────────────────────────────────────────

    /// @notice Returns true if the transfer is permitted under country restrictions.
    /// @dev    When whitelistEnabled=false, always returns true (pass-through).
    ///         When whitelistEnabled=true, this POC implementation returns false for
    ///         ALL transfers because it does not have per-address country lookup —
    ///         there is no on-chain mapping from wallet → country code in this POC.
    ///         In production, this would call identityRegistry.getCountry(to) and
    ///         check allowedCountries[countryCode]. The from, to, and amount
    ///         parameters are unused in this simplified implementation.
    /// @return True if restrictions are disabled; false if enabled (POC limitation).
    function canTransfer(address, address, uint256) external view override returns (bool) {
        return !whitelistEnabled;
    }

    /// @notice No-op: CountryRestrictions has no internal balance state to update.
    function transferred(address, address, uint256) external override {}

    /// @notice No-op: CountryRestrictions has no internal balance state to update.
    function created(address, uint256) external override {}

    /// @notice No-op: CountryRestrictions has no internal balance state to update.
    function destroyed(address, uint256) external override {}
}
