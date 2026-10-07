# Gold Tokenization Platform

A proof-of-concept for physical gold tokenization built on the **ERC-3643 / T-REX** security token standard. Each token represents one gram of LBMA-grade gold held in a custodian vault, with on-chain reserve enforcement, KYC/compliance gating, and a full redemption lifecycle.

For architecture, deployment history, verified fixes, known limitations, and
future-session handoff notes, see [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md).

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Frontend  (React 19 + Vite + Tailwind v4)   localhost:3000    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Dashboard   │  │  Admin Panel │  │   Investor Portal    │  │
│  │ (reserves)   │  │  (6 tabs)    │  │  (balance + redeem)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────┬─────────────────────────────────────┘
                           │ /api  (Vite proxy)
┌──────────────────────────▼─────────────────────────────────────┐
│  Backend  (Express + TypeScript + drizzle-orm)  localhost:3001  │
│  Routes: /tokens  /reserves  /redemptions  /identities  /price  │
│  Services: blockchain.ts (ethers v6)  ·  storage.ts (SQLite)    │
└──────────────────────────┬─────────────────────────────────────┘
                           │ JSON-RPC
┌──────────────────────────▼─────────────────────────────────────┐
│  Smart Contracts  (Solidity 0.8.24 · Hardhat · ERC-3643)        │
│  GoldToken (UUPS proxy)  ·  GoldReserve  ·  ModularCompliance   │
│  IdentityRegistry  ·  3 Compliance Modules                      │
└────────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### Core contracts

| Contract | Description |
|---|---|
| `GoldToken` | ERC-3643 security token — 1 token = 1 gram of gold. UUPS upgradeable proxy. Enforces `totalSupply ≤ vaultGrams` at mint time. |
| `GoldReserve` | Immutable registry of physical gold bars. Tracks bar ID, weight, purity (bps), vault, and assay reference. |
| `Token` | Base ERC-3643 implementation — KYC-gated transfers, role-based supply control, UUPS upgrade authority. |
| `IdentityRegistry` | On-chain KYC whitelist. Transfers revert if either party is not registered. |
| `ModularCompliance` | AND-gates a set of pluggable compliance modules on every transfer. |

### Compliance modules

| Module | Default | Behaviour |
|---|---|---|
| `CountryRestrictions` | Passthrough (whitelist disabled) | Country-level transfer whitelist |
| `MaxWalletBalance` | 10 000 g | Caps per-wallet holdings |
| `MinTransferAmount` | 1 g | Rejects dust transfers |

### Roles

| Role | Holder (deploy default) | Can |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Deployer (account #0) | Grant / revoke all roles |
| `SUPPLY_MODIFIER` | Deployer | Mint |
| `CUSTODIAN_ROLE` | Account #1 | Register bars, fulfill redemptions (burn) |

### Key flows

**Mint**
```
Admin calls mint(to, amount)
  → GoldToken checks totalSupply + amount ≤ vault grams × 10^decimals
  → _mint() + compliance.created()
```

**Transfer**
```
investor.transfer(to, amount)
  → IdentityRegistry: both parties KYC'd?
  → ModularCompliance: CountryRestrictions ∧ MaxWallet ∧ MinTransfer
  → ERC20._transfer()
```

**Redemption**
```
Investor submits form (frontend)
  → backend: DB insert (status=PENDING)
  → Admin approves (status=APPROVED)
  → Custodian fulfills: fulfillRedemption(investor, amountWei, ref)
      → _burn() + compliance.destroyed()
      → emit RedemptionFulfilled
  → backend: DB update (status=FULFILLED, burnTxHash=...)
```

---

## Project Structure

```
uc-gold-tokenization/
├── contracts/
│   ├── core/
│   │   ├── Token.sol               # ERC-3643 base (virtual mint/burn)
│   │   ├── GoldToken.sol           # Gold-specific overrides + reserve cap
│   │   ├── GoldReserve.sol         # Gold bar registry
│   │   ├── IdentityRegistry.sol    # KYC whitelist
│   │   └── ModularCompliance.sol   # Pluggable compliance engine
│   ├── compliance/modules/
│   │   ├── CountryRestrictions.sol
│   │   ├── MaxWalletBalance.sol
│   │   └── MinTransferAmount.sol
│   ├── interfaces/                 # IERC3643, IGoldToken, IGoldReserve, …
│   └── utils/ProxyHelper.sol       # Forces ERC1967Proxy into TypeChain output
│
├── scripts/
│   ├── bat/                        # Windows CMD scripts
│   │   ├── start-all.bat
│   │   ├── start-chain.bat
│   │   ├── start-backend.bat
│   │   ├── start-frontend.bat
│   │   └── deploy.bat
│   ├── sh/                         # Bash scripts (Git Bash / WSL / macOS)
│   │   ├── start-all.sh
│   │   ├── start-chain.sh
│   │   ├── start-backend.sh
│   │   ├── start-frontend.sh
│   │   └── deploy.sh
│   └── deploy/
│       └── 01-deploy-gold-token.ts # Full SGT999 stack + seed data
│
├── test/
│   └── GoldToken.test.ts           # 11 unit tests (Hardhat + ethers v6)
│
├── backend/
│   ├── src/
│   │   ├── config/index.ts         # Env config
│   │   ├── db/schema.ts            # drizzle-orm schema (SQLite)
│   │   ├── services/
│   │   │   ├── blockchain.ts       # ethers v6 contract interactions
│   │   │   └── storage.ts          # DB read/write helpers
│   │   ├── routes/
│   │   │   ├── tokens.ts           # /api/tokens
│   │   │   ├── reserves.ts         # /api/reserves
│   │   │   ├── redemptions.ts      # /api/redemptions
│   │   │   ├── identities.ts       # /api/identities
│   │   │   └── price.ts            # /api/price
│   │   └── server.ts               # Express entry point
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx       # Reserve overview + bar registry
│       │   ├── AdminPanel.tsx      # 6-tab admin interface
│       │   └── InvestorPortal.tsx  # Balance lookup + redemption form
│       ├── components/
│       │   ├── layout/Header.tsx   # Sticky nav + dark mode toggle
│       │   └── ui/                 # Button, Card, Badge, Input, StatCard, …
│       ├── hooks/useTheme.tsx      # Class-based dark mode (localStorage)
│       └── lib/
│           ├── api.ts              # Typed fetch wrappers (Vite proxy → :3001)
│           ├── types.ts            # Shared TypeScript types
│           └── utils.ts            # formatGrams, formatUsd, reserveRatio, …
│
├── hardhat.config.ts
├── tsconfig.json
└── SPEC.md
```

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

---

## Quick Start

### 1 — Install dependencies

```bash
# Root (contracts + Hardhat)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2 — Configure backend environment

```bash
cp backend/.env.example backend/.env
# The defaults match Hardhat's well-known test accounts — no changes needed for local dev.
```

### 3 — Compile contracts

```bash
npm run compile
```

### 4 — Run the test suite

```bash
npm test
# Expected: 11 passing
```

### 5 — Start the stack

#### Option A — one command

**Windows CMD / double-click:**
```bat
scripts\bat\start-all.bat
scripts\bat\start-all.bat --deploy
```

**Git Bash / WSL:**
```bash
./scripts/sh/start-all.sh
./scripts/sh/start-all.sh --deploy
```

Both open each layer in its own terminal window. Pass `--deploy` to also run the contract deploy script automatically after the chain starts.

#### Option B — individual scripts

**Windows CMD:**
```bat
scripts\bat\start-chain.bat        :: Terminal 1 — Hardhat node
scripts\bat\deploy.bat             :: Terminal 2 — deploy contracts (after chain is up)
scripts\bat\start-backend.bat      :: Terminal 3 — backend API
scripts\bat\start-frontend.bat     :: Terminal 4 — frontend dev server
```

**Git Bash / WSL:**
```bash
./scripts/sh/start-chain.sh
./scripts/sh/deploy.sh
./scripts/sh/start-backend.sh
./scripts/sh/start-frontend.sh
```

#### Option C — npm scripts directly

```bash
# Terminal 1
npm run node

# Terminal 2
npm run deploy:local

# Terminal 3
cd backend && npm run dev

# Terminal 4
cd frontend && npm run dev
```

Once running, open **http://localhost:3000**.

> **Note:** `start-backend.sh` and `start-frontend.sh` will auto-copy `.env.example` and run `npm install` if those steps haven't been done yet.

---

## Scripts Reference

All scripts live in [`scripts/`](scripts/) and are executable bash scripts.

Each script has a `.bat` (Windows CMD) and a `.sh` (Git Bash / WSL) variant.

| Script | Description |
|---|---|
| `start-all` | Opens the full stack in separate terminal windows. Pass `--deploy` to also run the deploy script after the chain starts. |
| `start-chain` | Starts the Hardhat node on `http://127.0.0.1:8545` (chainId 31337). |
| `deploy` | Deploys the SGT999 token stack to the running local chain and writes `deployments/localhost.json`. |
| `start-backend` | Starts the Express API on `http://localhost:3001`. Auto-copies `.env.example` if `.env` is missing. |
| `start-frontend` | Starts the Vite dev server on `http://localhost:3000`. Auto-runs `npm install` if `node_modules` is missing. |

---

## Backend API Reference

Base URL: `http://localhost:3001`

### Tokens

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tokens` | List all registered tokens |
| `GET` | `/api/tokens/:address` | Token detail (+ on-chain totalSupply) |
| `POST` | `/api/tokens` | Register a deployed token in the DB |
| `PATCH` | `/api/tokens/:address/reserve` | Link a GoldReserve contract address |
| `POST` | `/api/tokens/:address/mint` | On-chain mint (deployer key) |
| `GET` | `/api/tokens/:address/check-transfer` | Compliance pre-check (`?from=&to=&amount=`) |

### Reserves

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/reserves?tokenAddress=` | Bar list + summary for a token |
| `GET` | `/api/reserves/:barId` | Single bar detail |
| `POST` | `/api/reserves` | Register bar on-chain + DB |
| `PATCH` | `/api/reserves/:barId/deactivate` | Deactivate bar on-chain + DB |

### Redemptions

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/redemptions` | Create redemption request (PENDING) |
| `PATCH` | `/api/redemptions/:ref/approve` | PENDING → APPROVED |
| `PATCH` | `/api/redemptions/:ref/fulfill` | APPROVED → FULFILLED (burns on-chain) |
| `PATCH` | `/api/redemptions/:ref/reject` | PENDING/APPROVED → REJECTED |

### Identities

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/identities` | KYC-register address on-chain + DB |
| `GET` | `/api/identities/:address` | Identity detail + verified status |

### Price

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/price` | Current gold price (USD/gram) |
| `POST` | `/api/price` | Update price (manual oracle feed) |

---

## Frontend Pages

### Reserve Dashboard (`/`)
Real-time proof-of-reserve overview. Shows gold in vault, circulating supply, reserve ratio (must stay ≥ 100%), gold price, and the full gold bar registry table.

### Admin Panel (`/admin`)
Six-tab management interface:
- **Tokens** — register deployed token contracts
- **Gold Bars** — on-chain bar registration and deactivation
- **KYC** — on-chain identity registration
- **Redemptions** — approve, reject, or fulfill pending requests
- **Mint** — issue new tokens (blocked if vault headroom is insufficient)
- **Price** — update the manual gold price feed

### Investor Portal (`/investor`)
Enter any KYC-verified wallet address to view holdings (read directly from chain via ethers.js), USD value at current price, and full redemption history. Includes a redemption request form.

---

## End-to-End UI Walkthrough

A complete flow from setup to fulfilled redemption using the demo seed data.

### Demo addresses (from `deployments/localhost.json`)

| Role | Address |
|---|---|
| Deployer / token holder | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Investor 1 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| Investor 2 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |

---

### 1 — Set a gold price
**Admin → Price tab**

Enter a USD price per gram (e.g. `92.50`) and save. USD values across all pages depend on this.

---

### 2 — Verify KYC identities
**Admin → KYC tab**

Three addresses are pre-registered by the deploy script: deployer, investor1, and investor2. Only KYC'd addresses can hold or transfer tokens.

---

### 3 — View investor holdings
**Investor Portal (`/investor`)**

Paste the deployer address into the wallet lookup:
```
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```
The holdings card should show **1 000 SGT999** and the USD equivalent at the price set in step 1.

---

### 4 — Submit a redemption request
**Investor Portal** (with the deployer wallet loaded)

Fill in the redemption form:
- **Amount:** e.g. `100` grams
- **Delivery Address:** e.g. `123 Gold St, Singapore 049483`

Click **Submit Redemption Request**. The request appears in the redemption history table with status `PENDING`.

---

### 5 — Approve the redemption
**Admin → Redemptions tab**

Find the pending request and click **Approve**. Status changes to `APPROVED`.

---

### 6 — Fulfill the redemption
**Admin → Redemptions tab**

Click **Fulfill** on the approved request. This:
- Calls `fulfillRedemption` on-chain — burns 100 SGT999 from the investor's wallet
- Records the burn transaction hash in the DB
- Status changes to `FULFILLED`

---

### 7 — Verify the reserve dashboard
**Dashboard (`/`)**

- **Circulating Supply** drops from 1 000 to **900 SGT999**
- **Reserve Ratio** rises above 100% (1 000 g in vault, 900 g in circulation)
- The ratio bar turns green and shows `> 100%`

---

### Optional — Test the reserve cap
**Admin → Mint tab**

Try minting **more than 1 000 g** total (e.g. mint 200 SGT999 while supply is already 900). The transaction will revert with:
```
GoldToken: mint would exceed vault reserve
```
This confirms the on-chain reserve enforcement is working correctly.

---

## Technology Stack

| Layer | Tech |
|---|---|
| Smart contracts | Solidity 0.8.24, Hardhat 2.x, OpenZeppelin Upgradeable 5.x |
| Contract standard | ERC-3643 / T-REX (security token) |
| Proxy pattern | ERC-1967 UUPS |
| Backend | Node.js, Express 4, TypeScript 5 |
| Database | SQLite via `@libsql/client` + drizzle-orm |
| Blockchain client | ethers v6 |
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| UI components | Lucide React icons, custom component library |
| Dark mode | Class-based (`document.documentElement.classList`) + localStorage |
| Dev chain | Hardhat Network (chainId 31337) |

---

## Design Decisions

- **Reserve cap at mint time** — `GoldToken.mint` reverts if `totalSupply + amount > registeredGrams × 10^decimals`. The ratio can never exceed 1:1 by construction.
- **Redemptions are off-chain first** — investors submit via the backend API; the on-chain burn only happens when a custodian calls `fulfillRedemption`. This separates the request lifecycle (DB) from settlement (chain).
- **Direct chain reads in the frontend** — `InvestorPortal` reads `balanceOf` directly via `JsonRpcProvider` rather than through the backend, following the standard DApp pattern.
- **UUPS over Transparent proxy** — lower gas cost; upgrade authority is controlled by `DEFAULT_ADMIN_ROLE`.
- **AND-logic compliance** — a transfer is only allowed if every compliance module approves it. Adding a new rule never weakens existing constraints.

---

## On-Chain vs Off-Chain Data

### On-Chain (Smart Contracts — permanent, trustless)

| Data | Contract | Details |
|---|---|---|
| Token balances | `GoldToken` (ERC-20) | `balanceOf(address)` per wallet |
| Total supply | `GoldToken` | `totalSupply()` |
| Token metadata | `GoldToken` | Name, symbol, decimals, purity standard |
| Role assignments | `GoldToken` | `DEFAULT_ADMIN_ROLE`, `SUPPLY_MODIFIER`, `CUSTODIAN_ROLE` |
| KYC whitelist | `IdentityRegistry` | Address → verified (bool) |
| Gold bar registry | `GoldReserve` | Bar ID, weight (g), purity (bps), vault ID, assay ref, active flag |
| Total vault weight | `GoldReserve` | `getTotalActiveWeightGrams()` — sum of all active bars |
| Compliance rules | `ModularCompliance` | Which modules are wired; modules store their own parameters |
| Max wallet cap | `MaxWalletBalance` | 10,000 g limit |
| Min transfer floor | `MinTransferAmount` | 1 g minimum |
| Country whitelist | `CountryRestrictions` | Empty by default (passthrough) |
| Transfer history | ERC-20 `Transfer` events | Emitted on every transfer; queryable via logs |
| Burn events | `GoldToken` | `RedemptionFulfilled` event with burn tx hash |
| Proxy → impl mapping | ERC-1967 slot | Implementation contract address |

### Off-Chain (SQLite via Backend — convenience layer, not authoritative)

| Data | Table | Why off-chain |
|---|---|---|
| Token registry | `tokens` | Stores deploy tx hash, companion contract addresses, timestamp |
| Country code per identity | `identities` | ISO country code; on-chain only stores address → bool |
| Gold bar tx hash + custodian name | `gold_bars` | Mirrors on-chain bar data plus backend-only fields |
| Redemption lifecycle | `redemptions` | Full PENDING → APPROVED → FULFILLED workflow; chain only sees the final burn |
| Redemption delivery address | `redemptions` | Physical address for gold delivery — never touches the chain |
| Approve/reject timestamps | `redemptions` | Intermediate states not recorded on-chain |
| Reject reason | `redemptions` | Free-text field with no on-chain equivalent |
| Gold price (USD/gram) | `gold_price` | Manual oracle feed; chain has no price data |

The **only on-chain enforcement** is: KYC check on every transfer, compliance module rules on every transfer, reserve cap on every mint, and the final burn when a redemption is fulfilled. Everything else lives in SQLite and is enforced by the application layer only.

---

## Industry Comparison

### What matches industry practice

- **On-chain enforcement of core invariants** — balances, KYC gating, compliance rules, and reserve caps are on-chain in every serious RWA platform (Securitize, Ondo, Backed Finance).
- **Off-chain redemption workflow** — keeping PENDING/APPROVED states in a DB before the final on-chain burn is standard. The chain is too expensive and slow for multi-step approval workflows.
- **Off-chain price feed** — using an external price source is correct; production systems use Chainlink, Pyth, or an institutional data provider. The pattern (off-chain source → on-chain consumer) is identical.
- **Off-chain delivery address** — physical redemption details (vault instructions, shipping address) never go on-chain anywhere in the industry.

### Where this POC diverges from production

| Gap | This POC | Industry Standard |
|---|---|---|
| **Identity / KYC** | Simple address → bool mapping | ONCHAINID (ERC-734/735) — identity contracts hold signed claims from accredited verifiers (e.g. Tokeny, Synaps) |
| **Country code** | Stored only in SQLite | Stored as a claim inside the on-chain identity contract — enforced trustlessly |
| **Gold price** | Manual POST to SQLite | Chainlink `XAU/USD` feed or a time-locked admin oracle with on-chain storage |
| **Compliance audit trail** | No structured log | Production platforms emit structured events for every compliance decision; some write a compliance hash on-chain |
| **Redemption ref** | Backend-generated string | Typically a hash of `(investor, amount, timestamp)` committed on-chain at request time, then fulfilled against it |
| **Custodian attestation** | Custodian calls a single function | Production uses multi-sig (Gnosis Safe) or HSM-backed keys; some platforms require a second custodian co-signature |
| **Reserve proof** | On-chain weight counter | Production adds a Merkle proof or ZK proof linking the counter to a signed custodian attestation document |

### Bottom line

The **split itself** (trustless enforcement on-chain, workflow/metadata off-chain) is exactly right and mirrors how Tokeny T-REX, Securitize DS Protocol, and ADDX structure their systems. The gaps are in the **depth** of on-chain identity and the **strength** of custodian/oracle trust assumptions — acceptable trade-offs for a POC, but areas that would need hardening before a production deployment.
