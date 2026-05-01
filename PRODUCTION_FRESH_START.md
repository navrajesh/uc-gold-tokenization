# Fresh Start — Production Build Guide

Instructions for building the production version of this platform with Claude Code.
Each phase is a self-contained Claude Code session with a clear scope and success criteria.

---

## Stack Decisions (pre-decided — do not debate with Claude)

| Layer | Choice | Reason |
|---|---|---|
| Contracts | Solidity 0.8.24 + Hardhat + OpenZeppelin Upgradeable 5.x | Same as POC; well-tested toolchain |
| Identity / KYC | ONCHAINID (ERC-734/735) via `@onchain-id/solidity` | T-REX standard; signed claims from verifiers |
| Price oracle | Chainlink AggregatorV3Interface (XAU/USD) | Trustless, decentralised |
| Admin control | Gnosis Safe (multi-sig) + OpenZeppelin TimelockController | Standard for RWA platforms |
| Backend | Node.js + Hono + Drizzle ORM + PostgreSQL | Hono is faster and type-safer than Express |
| Auth | JWT (access + refresh tokens) with role claims | Simple, stateless, auditable |
| Signing | AWS KMS (or local KMS mock for dev) | Keys never leave KMS |
| Event indexing | Ponder (open-source, type-safe Graph alternative) | Simpler than The Graph for self-hosted |
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 | Same as POC |
| Wallet | wagmi v2 + viem + WalletConnect v2 | Industry standard DApp stack |
| Data fetching | TanStack Query v5 | Caching, background refetch, optimistic updates |
| Testing (contracts) | Hardhat + ethers v6 + Chai | Same as POC — port tests directly |
| Testing (backend) | Vitest + supertest | Lightweight, same syntax as Jest |
| Testing (E2E) | Playwright | Best-in-class for web3 DApps |
| CI/CD | GitHub Actions | Free for public repos; widely supported |
| Local dev | Docker Compose | One command spins up Hardhat node + PostgreSQL + all services |
| Chain (prod) | Polygon (PoS) or Ethereum mainnet | Polygon for lower gas; Ethereum for institutional trust |

---

## Repo Structure

```
gold-tokenization-prod/
├── contracts/          Solidity + Hardhat
├── backend/            Hono API
├── frontend/           React + wagmi
├── indexer/            Ponder event indexer
├── infra/              Docker Compose + CI config
├── docs/               Architecture diagrams, API spec
├── CLAUDE.md           Claude Code context file (critical — write this first)
└── package.json        Root workspace (npm workspaces)
```

---

## What to Copy from the POC Repo

Before starting any phase, copy these into the new repo:

| Source (POC) | Destination (prod) | Notes |
|---|---|---|
| `contracts/core/GoldToken.sol` | `contracts/src/core/` | Keep reserve cap logic; replace `IdentityRegistry` calls with ONCHAINID |
| `contracts/core/GoldReserve.sol` | `contracts/src/core/` | Copy as-is; production-ready |
| `contracts/core/Token.sol` | `contracts/src/core/` | Keep base logic; update KYC checks for ONCHAINID |
| `contracts/core/ModularCompliance.sol` | `contracts/src/core/` | Copy as-is |
| `contracts/compliance/modules/MaxWalletBalance.sol` | `contracts/src/compliance/modules/` | Copy as-is |
| `contracts/compliance/modules/MinTransferAmount.sol` | `contracts/src/compliance/modules/` | Copy as-is |
| `contracts/compliance/modules/CountryRestrictions.sol` | `contracts/src/compliance/modules/` | Rewrite `canTransfer` to call ONCHAINID |
| `test/fixtures.ts` | `contracts/test/` | Adapt to new contract structure |
| `test/GoldToken.*.test.ts` | `contracts/test/` | Port all 35 tests; adapt for ONCHAINID |
| `frontend/src/index.css` | `frontend/src/` | Copy entire design system |
| `frontend/src/components/ui/` | `frontend/src/components/ui/` | Copy all UI components wholesale |
| `backend/src/db/schema.ts` | `backend/src/db/` | Adapt for PostgreSQL (minor syntax differences) |
| `backend/src/routes/` | `backend/src/routes/` | Port all routes; swap signing layer |

---

## Phase 0 — CLAUDE.md and Repo Scaffold

**Session goal:** Create the monorepo skeleton and write `CLAUDE.md` so every future Claude Code session has full context without re-explaining the project.

### Instructions for Claude Code

```
Create a new monorepo for a production gold-backed security token platform.

Repo name: gold-tokenization-prod
Structure: npm workspaces with packages at contracts/, backend/, frontend/, indexer/

Tasks:
1. Create root package.json with workspaces and scripts:
   - "test": runs all workspace tests
   - "build": builds all workspaces
   - "dev": starts Docker Compose

2. Create CLAUDE.md at repo root. It must include:
   - What the project is (ERC-3643 gold-backed security token, 1 token = 1 gram)
   - Full stack table (copy from FRESH_START.md stack decisions)
   - Contract architecture: same 5 core contracts as POC + ONCHAINID identity layer
   - Key POC learnings to carry forward:
     * loadFixture pattern for tests (see POC test/fixtures.ts)
     * hardhat.config.ts needs mocha.spec: "test/**/*.test.ts" to exclude fixtures.ts
     * batchMint must override mint's reserve cap check (Token.batchMint must be virtual)
     * CountryRestrictions currently blocks ALL when enabled — fix is getCountry(address) lookup
     * forcedTransfer bypasses compliance.canTransfer but still calls compliance.transferred
   - On-chain vs off-chain split (same as POC)
   - Role model: DEFAULT_ADMIN_ROLE (Gnosis Safe), SUPPLY_MODIFIER, CUSTODIAN_ROLE, AGENT_ROLE, FREEZER
   - Dev setup instructions

3. Create infra/docker-compose.yml with:
   - hardhat-node service (image: node:20, runs npx hardhat node)
   - postgres service (image: postgres:16, port 5432)
   - backend service (depends on postgres + hardhat-node)
   - frontend service (depends on backend)

4. Create .github/workflows/ci.yml:
   - Trigger on push and PR to main
   - Jobs: lint, contract-tests, backend-tests, frontend-typecheck
   - Each job: checkout, node 20, npm ci, run tests

5. Create root .gitignore covering node_modules, artifacts, cache,
   typechain-types, .env files, deployments/
```

**Success criteria:** `npm install` works from root; `docker compose up` starts postgres and hardhat node; CI workflow file exists.

### Claude Code Prompt

```
You are helping build a production gold-backed security token platform from scratch.

Project: ERC-3643 style security token where 1 token = 1 gram of LBMA gold.
Roles: admin (Gnosis Safe), custodian (vault operator), investor, auditor.

Stack (do not change these decisions):
- Monorepo: npm workspaces, packages at contracts/, backend/, frontend/, indexer/
- Contracts: Solidity 0.8.24 + Hardhat + OpenZeppelin Upgradeable 5.x
- Backend: Node.js + Hono + Drizzle ORM + PostgreSQL
- Frontend: React 19 + Vite + TypeScript + Tailwind v4 + wagmi v2
- CI/CD: GitHub Actions
- Local dev: Docker Compose

Task — scaffold the monorepo:

1. Create root package.json with npm workspaces pointing to contracts/, backend/,
   frontend/, indexer/. Scripts: "test" (all workspace tests), "build" (all), "dev" (docker compose up).

2. Create CLAUDE.md at repo root with:
   - Project description: ERC-3643 gold token, 1 token = 1 gram, production build
   - Full stack table (use the decisions listed above)
   - Contract architecture: GoldToken (UUPS proxy), GoldReserve, Token (base),
     ModularCompliance, IdentityRegistry (ONCHAINID-backed), 3 compliance modules
   - Key technical notes:
     * hardhat.config.ts must have mocha: { spec: "test/**/*.test.ts" } — prevents
       fixtures.ts being treated as a test file which breaks Chai matchers
     * Token.batchMint must be marked virtual so GoldToken can override it to enforce reserve cap
     * CountryRestrictions.canTransfer must call identityRegistry.getCountry(to) for
       per-address lookup — do not return !whitelistEnabled (blocks everyone when enabled)
     * forcedTransfer skips compliance.canTransfer but must still call compliance.transferred
     * Use loadFixture (not beforeEach) for contract test setup — 4x faster
   - On-chain: balances, KYC, compliance rules, reserve cap, bar registry, mint/burn
   - Off-chain (PostgreSQL): redemption lifecycle, price feed, delivery addresses, audit log
   - Role model: DEFAULT_ADMIN_ROLE → Gnosis Safe via TimelockController (48h),
     SUPPLY_MODIFIER, CUSTODIAN_ROLE, AGENT_ROLE, FREEZER

3. Create infra/docker-compose.yml with four services:
   - hardhat-node: node:20, runs npx hardhat node, port 8545
   - postgres: postgres:16, port 5432, env POSTGRES_DB/USER/PASSWORD
   - backend: depends_on hardhat-node + postgres, port 3001
   - frontend: depends_on backend, port 3000

4. Create .github/workflows/ci.yml:
   - Triggers: push and pull_request to main
   - Jobs: contract-tests (npx hardhat test in contracts/),
     backend-tests (npm test in backend/),
     frontend-typecheck (tsc --noEmit in frontend/)
   - Each job: actions/checkout@v4, actions/setup-node@v4 node 20, npm ci, run command

5. Create root .gitignore: node_modules, dist, artifacts, cache, typechain-types,
   .env, .env.local, deployments/*.json (keep deployments/example.json)

Do not install any dependencies yet — only create config and scaffold files.
```

---

## Phase 1 — Smart Contracts: Core

**Session goal:** Deploy the full contract stack locally with ONCHAINID identity, TimelockController, and Pausable.

### Instructions for Claude Code

```
Set up the smart contracts workspace for production.

Working directory: contracts/

Tasks:

1. Install dependencies:
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npm install @openzeppelin/contracts-upgradeable @openzeppelin/contracts
   npm install @onchain-id/solidity

2. Configure hardhat.config.ts:
   - solidity 0.8.24 with optimizer (200 runs)
   - networks: hardhat (chainId 31337), localhost, sepolia (from env), mainnet (from env)
   - typechain: ethers-v6
   - mocha: { spec: "test/**/*.test.ts" }   ← critical: prevents fixtures.ts being treated as a test

3. Copy these files from the POC repo (paths given):
   - contracts/core/Token.sol → src/core/Token.sol
   - contracts/core/GoldToken.sol → src/core/GoldToken.sol
   - contracts/core/GoldReserve.sol → src/core/GoldReserve.sol
   - contracts/core/ModularCompliance.sol → src/core/ModularCompliance.sol
   - contracts/compliance/modules/MaxWalletBalance.sol → src/compliance/modules/
   - contracts/compliance/modules/MinTransferAmount.sol → src/compliance/modules/

4. Replace IdentityRegistry.sol with ONCHAINID integration:
   - Create src/core/IdentityRegistry.sol that wraps @onchain-id/solidity
   - isVerified(address user) should check if the user's identity contract
     has a valid claim with topic CLAIM_TOPIC_KYC (defined as a constant)
   - Keep the same IIdentityRegistry interface so Token.sol doesn't change

5. Create src/core/CountryRestrictions.sol (replaces the POC version):
   - canTransfer should call identityRegistry.getCountry(to) and check
     allowedCountries[countryCode] when whitelistEnabled is true
   - Keep the same IComplianceModule interface

6. Add to GoldToken.sol:
   - Inherit PausableUpgradeable from OpenZeppelin
   - Add whenNotPaused modifier to transfer, transferFrom, mint, batchMint
   - Add pause() / unpause() functions gated to DEFAULT_ADMIN_ROLE
   - Deploy a TimelockController (48h delay) and transfer DEFAULT_ADMIN_ROLE to it

7. Compile and confirm zero errors: npx hardhat compile
```

**Success criteria:** `npx hardhat compile` succeeds with zero errors; typechain-types generated for all contracts.

### Claude Code Prompt

```
You are setting up smart contracts for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: contracts/.
Phase 0 (repo scaffold and CLAUDE.md) is already complete.

Contract architecture:
- Token.sol — ERC-3643 base: KYC-gated transfers, role-based supply, UUPS upgradeable.
  batchMint must be marked virtual so GoldToken can override it.
- GoldToken.sol — extends Token: reserve cap on mint AND batchMint, requestRedemption,
  fulfillRedemption, Pausable (whenNotPaused on all transfers and mints)
- GoldReserve.sol — gold bar registry: registerBar, deactivateBar, getTotalActiveWeightGrams
- ModularCompliance.sol — AND-gates compliance modules on every transfer
- IdentityRegistry.sol — wraps @onchain-id/solidity; isVerified checks for KYC claim
- CountryRestrictions.sol — canTransfer calls identityRegistry.getCountry(to) when whitelistEnabled
- MaxWalletBalance.sol — caps per-wallet balance via internal tracked mapping
- MinTransferAmount.sol — blocks transfers below threshold

Source files to copy from the POC repo at ../uc-gold-tokenization/contracts/:
  core/Token.sol, core/GoldToken.sol, core/GoldReserve.sol, core/ModularCompliance.sol,
  compliance/modules/MaxWalletBalance.sol, compliance/modules/MinTransferAmount.sol

Tasks:

1. npm init -y, then install:
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox typescript ts-node @types/node
   npm install @openzeppelin/contracts-upgradeable @openzeppelin/contracts @onchain-id/solidity

2. Create hardhat.config.ts:
   - solidity 0.8.24, optimizer enabled 200 runs
   - networks: hardhat (chainId 31337), localhost (http://127.0.0.1:8545),
     sepolia and mainnet from env vars
   - typechain: ethers-v6, outDir typechain-types
   - mocha: { spec: "test/**/*.test.ts" }

3. Copy the listed POC source files into src/core/ and src/compliance/modules/

4. In the copied Token.sol: add the virtual keyword to batchMint

5. In the copied GoldToken.sol: add batchMint override that sums all amounts,
   checks reserve cap on the total, then mints to each recipient (same pattern as mint override)

6. Create src/core/IdentityRegistry.sol:
   - Wraps @onchain-id/solidity IIdentityRegistry
   - isVerified(address user): returns true if the user's identity has a valid KYC claim
   - Keep the same interface: function isVerified(address) external view returns (bool)

7. Create src/compliance/modules/CountryRestrictions.sol:
   - When whitelistEnabled is false: return true (passthrough, same as POC)
   - When whitelistEnabled is true: call identityRegistry.getCountry(to),
     return allowedCountries[countryCode]
   - Keep the same IComplianceModule interface

8. Update GoldToken.sol:
   - Inherit PausableUpgradeable
   - Add whenNotPaused to transfer, transferFrom, mint, batchMint
   - Add pause() / unpause() gated to DEFAULT_ADMIN_ROLE

9. Run: npx hardhat compile
   Fix all errors until compile succeeds with zero warnings.
```

---

## Phase 2 — Smart Contracts: Tests

**Session goal:** Port and adapt all 35 POC tests to the new contract structure.

### Instructions for Claude Code

```
Port the test suite from the POC repo to the new contract structure.

Working directory: contracts/

Context:
- POC had 35 tests split across 4 files + fixtures.ts
- The fixture used loadFixture from @nomicfoundation/hardhat-network-helpers
- hardhat.config.ts mocha.spec must be "test/**/*.test.ts" — already set in Phase 1
- Key POC learning: fixtures.ts being auto-discovered broke Chai matchers when
  running all files together — mocha.spec setting fixes this

Tasks:

1. Create test/fixtures.ts — shared deploy fixture:
   - Deploy all contracts (ONCHAINID-aware IdentityRegistry, ModularCompliance,
     CountryRestrictions, MaxWalletBalance, MinTransferAmount, GoldReserve, GoldToken proxy)
   - KYC-register deployer, investor1, investor2 using the new ONCHAINID flow
   - Export ONE_GRAM, MAX_WALLET constants
   - Export deployGoldSystem() async function

2. Port these test files, adapting KYC calls for ONCHAINID:
   - test/GoldToken.reserve.test.ts   (9 tests)
   - test/GoldToken.transfer.test.ts  (12 tests)
   - test/GoldToken.compliance.test.ts (6 tests)
   - test/GoldToken.redemption.test.ts (8 tests)

3. Add new tests for production-only features:
   - Pause: transfer blocked when paused, resumes after unpause
   - Pause: only DEFAULT_ADMIN_ROLE can pause
   - CountryRestrictions: blocks transfer to wallet in disallowed country
   - CountryRestrictions: allows transfer to wallet in allowed country
   - TimelockController: admin action without timelock delay reverts

4. Run full suite: npx hardhat test
   Expected: all tests passing
```

**Success criteria:** `npx hardhat test` shows all tests green; no tests skipped.

### Claude Code Prompt

```
You are writing smart contract tests for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: contracts/.
Phase 1 is complete — all contracts compile with npx hardhat compile.
hardhat.config.ts already has mocha: { spec: "test/**/*.test.ts" }.

Critical testing rules (learned from the POC):
- Use loadFixture from @nomicfoundation/hardhat-network-helpers — NOT beforeEach for deploy.
  loadFixture snapshots chain state and restores it per test — 4x faster than redeploying.
- fixtures.ts must NOT have describe/it blocks — it is a helper only.
- Each test calls loadFixture(deployGoldSystem) inline and destructures only what it needs.
- Do not put mocha.spec in hardhat.config.ts — it is already set. Do not change it.

POC test structure to port (35 tests across 4 files):
  test/GoldToken.reserve.test.ts — 9 tests: reserve cap, bar deactivation, batchMint
  test/GoldToken.transfer.test.ts — 12 tests: KYC, freeze, transferFrom, forcedTransfer
  test/GoldToken.compliance.test.ts — 6 tests: min/max limits, country whitelist, module removal
  test/GoldToken.redemption.test.ts — 8 tests: redemption lifecycle, proof of reserve, access control

Tasks:

1. Create test/fixtures.ts:
   - Deploy: IdentityRegistry, ModularCompliance, CountryRestrictions,
     MaxWalletBalance (10000g cap), MinTransferAmount (1g min), GoldReserve, GoldToken UUPS proxy
   - Add all 3 compliance modules to ModularCompliance
   - KYC-register deployer, investor1, investor2 using the ONCHAINID flow
   - Export: ONE_GRAM = ethers.parseUnits("1", 18), MAX_WALLET = ethers.parseUnits("10000", 18)
   - Export: async function deployGoldSystem() returning all contracts and signers

2. Port all 4 test files from the POC, adapting any KYC registration calls for ONCHAINID.
   Keep the exact same revert message strings — tests depend on exact matches.
   Key revert messages from the contracts:
     "GoldToken: mint would exceed vault reserve"
     "Token: sender frozen" / "Token: recipient frozen"
     "Token: recipient not verified"
     "Token: compliance rejected"
     "GoldReserve: bar not active"
     "Token: length mismatch"
     "IdentityRegistry: not owner"

3. Add 5 new tests for production-only features (add to redemption test file):
   - transfer blocked when contract is paused
   - transfer resumes after unpause
   - non-DEFAULT_ADMIN_ROLE cannot call pause
   - CountryRestrictions: blocks transfer to wallet with disallowed country code
   - CountryRestrictions: allows transfer to wallet with allowed country code

4. Run: npx hardhat test
   All tests must pass before finishing. Fix any failures.
```

---

## Phase 3 — Backend: Foundation

**Session goal:** Set up the Hono API with PostgreSQL, JWT auth, and KMS-backed signing.

### Instructions for Claude Code

```
Set up the production backend API.

Working directory: backend/

Stack: Hono + Drizzle ORM + PostgreSQL + JWT auth + AWS KMS (local mock for dev)

Tasks:

1. Install dependencies:
   npm install hono @hono/node-server drizzle-orm pg
   npm install @aws-sdk/client-kms  (for KMS signing)
   npm install jose  (for JWT)
   npm install zod   (for input validation)
   npm install pino pino-pretty  (for logging)
   npm install --save-dev vitest supertest drizzle-kit @types/pg

2. Create src/db/schema.ts — PostgreSQL schema using Drizzle:
   Port tables from POC (tokens, gold_bars, redemptions, identities, gold_price)
   Add: users table (id, address, role, created_at)
   Add: audit_log table (id, user_id, action, resource, tx_hash, created_at)
   Use pgTable (not sqliteTable), serial primary keys, timestamp with timezone

3. Create src/lib/kms.ts — signing abstraction:
   - In production: uses AWS KMS GetPublicKey + Sign APIs
   - In development (NODE_ENV=development): falls back to ethers Wallet from env
   - Export: signTransaction(tx), getAddress() → address
   - This abstraction means routes never touch a private key directly

4. Create src/middleware/auth.ts — JWT middleware for Hono:
   - Verify Bearer token on every request
   - Attach { address, role } to context
   - Roles: admin, custodian, auditor, public
   - Public routes (GET /api/price, GET /api/reserves) skip auth

5. Create src/middleware/validate.ts — Zod request validation:
   - Generic middleware factory: validate(schema) returns Hono middleware
   - On failure: 400 with { error, issues } response

6. Create src/middleware/rateLimit.ts:
   - In-memory rate limiter (use a Map with sliding window)
   - Stricter on write routes: 10 req/min
   - Looser on read routes: 100 req/min

7. Create src/lib/logger.ts — pino instance with request context

8. Create src/index.ts — Hono app entry point:
   - Mount all middleware
   - Mount all route groups (stub routes are fine for now)
   - GET /health → { status: ok, db: ok/error, chain: ok/error, block: N }

9. Create src/db/migrate.ts — migration runner using drizzle-kit

10. Write backend/.env.example with all required variables:
    DATABASE_URL, JWT_SECRET, KMS_KEY_ID (or PRIVATE_KEY for dev),
    RPC_URL, CONTRACT_ADDRESS_*, PORT
```

**Success criteria:** `npm run dev` starts the server; `GET /health` returns 200; `npm test` runs (even with 0 tests yet).

### Claude Code Prompt

```
You are setting up the backend API for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: backend/.
Smart contracts are complete (Phases 1 and 2 done).
This replaces the POC's Express + SQLite stack.

Stack (do not change):
- Framework: Hono + @hono/node-server
- ORM: Drizzle ORM with PostgreSQL (pg driver)
- Auth: JWT via jose
- Signing: AWS KMS in production, ethers Wallet fallback in development
- Validation: zod
- Logging: pino + pino-pretty
- Tests: vitest + supertest

Tasks:

1. npm init -y, then install:
   npm install hono @hono/node-server drizzle-orm pg jose zod pino pino-pretty
   npm install @aws-sdk/client-kms ethers
   npm install --save-dev vitest supertest drizzle-kit @types/pg typescript tsx

2. Create src/db/schema.ts — Drizzle PostgreSQL schema (use pgTable, serial pk, timestamptz):
   - tokens: id, address, name, symbol, decimals, reserve_address, deployed_at
   - gold_bars: id, bar_id, token_address, weight_grams, purity_bps, vault_id,
     assay_ref, custodian_address, active, registered_at, tx_hash
   - redemptions: id, ref, token_address, investor_address, requested_grams, amount_wei,
     delivery_address, status (PENDING/APPROVED/FULFILLED/REJECTED enum),
     reject_reason, burn_tx_hash, requested_at, approved_at, fulfilled_at
   - identities: id, address, country_code, verified, registered_at, tx_hash
   - gold_price: id, price_usd, source, updated_at
   - users: id, address, role (admin/custodian/auditor/investor enum), created_at
   - audit_log: id, user_address, action, resource_type, resource_id, tx_hash, created_at

3. Create src/lib/kms.ts:
   - Interface Signer: { signTransaction(tx): Promise<string>, getAddress(): Promise<string> }
   - KmsSigner: uses AWS KMS GetPublicKey + Sign (ethers-compatible signing)
   - DevSigner: uses ethers.Wallet from process.env.PRIVATE_KEY
   - Export createSigner(): returns KmsSigner if NODE_ENV=production, DevSigner otherwise

4. Create src/middleware/auth.ts:
   - Verify Authorization: Bearer <token> with jose
   - Decode { address, role }, attach to Hono context via c.set('user', ...)
   - Export requireRole(...roles): Hono middleware factory for route-level guards

5. Create src/middleware/validate.ts:
   - validate(schema: ZodSchema) → Hono MiddlewareHandler
   - On failure: return 400 { error: 'Validation failed', issues: [...] }

6. Create src/middleware/rateLimit.ts:
   - Sliding window using Map<string, number[]> keyed by IP
   - readLimit: 100 req/min, writeLimit: 10 req/min
   - On exceed: 429 { error: 'Rate limit exceeded' }

7. Create src/lib/logger.ts: pino instance, level from LOG_LEVEL env (default 'info')

8. Create src/index.ts:
   - Apply logger + rateLimit middleware globally
   - Mount stub routers at /api/tokens, /api/reserves, /api/redemptions,
     /api/identities, /api/price, /api/auth
   - GET /health: SELECT 1 to check DB, provider.getBlockNumber() to check chain,
     return { status, db, chain, block }

9. Create src/db/migrate.ts: drizzle-kit migration runner

10. Create .env.example:
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goldtoken
    JWT_SECRET=change-me-in-production
    KMS_KEY_ID=
    PRIVATE_KEY=
    RPC_URL=http://127.0.0.1:8545
    GOLD_TOKEN_ADDRESS=
    GOLD_RESERVE_ADDRESS=
    IDENTITY_REGISTRY_ADDRESS=
    PORT=3001
    NODE_ENV=development
    LOG_LEVEL=info

Start the server with npm run dev and confirm GET /health returns 200.
```

---

## Phase 4 — Backend: Routes and Business Logic

**Session goal:** Port all API routes from the POC with proper validation, auth, and KMS signing.

### Instructions for Claude Code

```
Port all API routes from the POC backend to the new Hono + PostgreSQL stack.

Working directory: backend/

Context from POC:
- Routes: /api/tokens, /api/reserves, /api/redemptions, /api/identities, /api/price
- blockchain.ts wrapped ethers contract calls — in prod these go through kms.ts
- storage.ts wrapped SQLite — in prod these use Drizzle + PostgreSQL
- The redemption lifecycle: PENDING → APPROVED → FULFILLED (or REJECTED)
- fulfillRedemption calls token.fulfillRedemption() on-chain (burn)

Tasks:

1. Create src/services/blockchain.ts:
   - Use ethers JsonRpcProvider (URL from env)
   - All write operations use kms.ts signer, never a raw private key
   - Wrap contract calls with retry logic: 3 attempts, exponential backoff
   - Track nonces manually to avoid race conditions on concurrent txs
   - Log every tx hash and wait for 1 confirmation before returning

2. Port routes (one file per group, same paths as POC):
   src/routes/tokens.ts      — GET /api/tokens, GET /api/tokens/:address,
                               POST /api/tokens (admin only), POST /api/tokens/:address/mint (admin only)
   src/routes/reserves.ts    — GET /api/reserves, POST /api/reserves (custodian only),
                               PATCH /api/reserves/:barId/deactivate (custodian only)
   src/routes/redemptions.ts — POST /api/redemptions (any auth'd user),
                               PATCH approve/fulfill/reject (admin or custodian)
   src/routes/identities.ts  — POST /api/identities (admin only),
                               GET /api/identities/:address (any auth'd)
   src/routes/price.ts       — GET /api/price (public), POST /api/price (admin only)
   src/routes/auth.ts        — POST /api/auth/login (wallet signature verify → JWT)

3. Add audit logging to every write route:
   Insert into audit_log: user address, action name, resource id, tx hash (if on-chain)

4. Write backend tests (src/__tests__/):
   Use vitest + supertest
   Create a test database (separate DATABASE_URL in test env)
   Test files:
   - redemptions.test.ts: full lifecycle (POST → approve → fulfill)
   - reserves.test.ts: register bar, deactivate bar
   - auth.test.ts: login with valid/invalid signature
   Target: ~20 tests covering happy paths and key error cases
```

**Success criteria:** All POC API routes respond correctly; `npm test` passes with ≥ 20 tests.

### Claude Code Prompt

```
You are implementing all API routes for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: backend/.
Phase 3 is complete: Hono app running, PostgreSQL schema defined,
auth middleware ready (requireRole), KMS signing abstraction in src/lib/kms.ts.

Design rules for all routes:
- All on-chain writes use src/lib/kms.ts signer — never touch a raw private key in routes
- Wait for 1 block confirmation before returning a tx hash to the caller
- Use retry with exponential backoff (3 attempts) on all on-chain writes
- Every write route inserts into audit_log: user address, action, resource id, tx hash
- Every POST/PATCH body validated with zod before touching DB or chain
- Admin-only routes: use requireRole('admin'). Custodian-only: requireRole('custodian').

Redemption lifecycle: PENDING → APPROVED → FULFILLED (or REJECTED before FULFILLED)

Tasks:

1. Create src/services/blockchain.ts:
   - JsonRpcProvider from RPC_URL env
   - Load contract ABIs from ../../contracts/artifacts/ or typechain-types
   - Functions: getGoldToken(address), getGoldReserve(address), getIdentityRegistry(address)
     returning typed contract instances connected to the KMS signer
   - writeWithRetry(fn): wraps any on-chain write in 3-attempt exponential backoff
   - Nonce tracker: Map<address, number> to avoid race conditions on concurrent txs

2. Create src/routes/tokens.ts:
   GET /api/tokens → list from DB, enrich each with totalSupply from chain
   GET /api/tokens/:address → single token + on-chain data
   POST /api/tokens (admin) → validate body, insert to DB
   POST /api/tokens/:address/mint (admin) → validate, call token.mint(), audit log

3. Create src/routes/reserves.ts:
   GET /api/reserves?tokenAddress= → bars from DB + getTotalActiveWeightGrams from chain
   POST /api/reserves (custodian) → call goldReserve.registerBar(), insert to DB + audit log
   PATCH /api/reserves/:barId/deactivate (custodian) → call goldReserve.deactivateBar(),
     update DB + audit log

4. Create src/routes/redemptions.ts:
   POST /api/redemptions (any authed user) → insert PENDING record
   GET /api/redemptions?tokenAddress=&status= → list with filters
   PATCH /api/redemptions/:ref/approve (admin) → update PENDING → APPROVED + audit log
   PATCH /api/redemptions/:ref/fulfill (custodian) → call token.fulfillRedemption(),
     update APPROVED → FULFILLED, store burnTxHash + audit log
   PATCH /api/redemptions/:ref/reject (admin or custodian) → update → REJECTED + reason + audit log

5. Create src/routes/identities.ts:
   POST /api/identities (admin) → call identityRegistry.registerIdentity(), insert to DB + audit log
   GET /api/identities/:address → identity from DB + isVerified from chain

6. Create src/routes/price.ts:
   GET /api/price → latest record from DB (public, no auth required)
   POST /api/price (admin) → insert new price record + audit log

7. Create src/routes/auth.ts:
   POST /api/auth/login → body: { address, signature, message }
   Verify: ethers.verifyMessage(message, signature) === address
   Look up user in DB by address, return signed JWT { address, role }

8. Write src/__tests__/ with vitest + supertest:
   - redemptions.test.ts: POST create → GET list → PATCH approve → PATCH fulfill
   - reserves.test.ts: POST register → GET list → PATCH deactivate
   - auth.test.ts: valid signature returns JWT; invalid signature returns 401
   - health.test.ts: GET /health returns 200 with expected shape
   Target: 20+ tests. Run: npm test — all must pass.
```

---

## Phase 5 — Event Indexer

**Session goal:** Replace the polling pattern with a real-time on-chain event indexer using Ponder.

### Instructions for Claude Code

```
Set up a Ponder event indexer to replace the polling-based event listening in the backend.

Working directory: indexer/

What Ponder does: listens to on-chain events and writes structured data to a PostgreSQL
database. The backend then queries this DB instead of polling the chain directly.

Tasks:

1. Install Ponder: npm create ponder@latest

2. Configure ponder.config.ts:
   - Network: localhost (chainId 31337) for dev, mainnet/polygon for prod
   - Contracts: GoldToken, GoldReserve (with their ABIs from contracts/typechain-types)
   - Start block: from deployment block (read from deployments/localhost.json)

3. Create indexer handlers in src/:

   src/GoldToken.ts — handle GoldToken events:
   - Transfer(from, to, value) → upsert transfer record in DB
   - RedemptionRequested(investor, grams, deliveryAddress, timestamp)
     → update redemptions table status to PENDING
   - RedemptionFulfilled(investor, amountWei, redemptionRef)
     → update redemptions table status to FULFILLED, store burnTxHash
   - AddressFrozen(wallet, isFrozen) → update identities table frozen flag

   src/GoldReserve.ts — handle GoldReserve events:
   - BarRegistered(barId, weightGrams, purityBps, vaultId) → upsert gold_bars
   - BarDeactivated(barId) → update gold_bars active = false

4. The backend should query indexed data (fast DB reads) rather than calling
   the chain directly for historical queries. Chain calls are only needed for
   current state (balanceOf, totalSupply) and write operations.

5. Add indexer service to docker-compose.yml
```

**Success criteria:** Ponder starts and indexes events from a local Hardhat node; transfer events appear in the DB within 2 seconds of the tx being mined.

### Claude Code Prompt

```
You are setting up an on-chain event indexer for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: indexer/.
Backend (Phase 4) is complete and PostgreSQL is running with the full schema.
The backend currently polls the chain for events — this replaces that with real-time indexing.

Tool: Ponder (https://ponder.sh) — TypeScript-native on-chain event indexer.
It listens to contract events and writes to the shared PostgreSQL database.
The backend queries this indexed data for history; chain calls are only for current state and writes.

Tasks:

1. Initialise: npm create ponder@latest . (choose blank template)

2. Create ponder.config.ts:
   - Network: { name: 'localhost', chainId: 31337, transport: http(process.env.RPC_URL) }
   - Contracts:
     GoldToken: { abi: goldTokenAbi, address: process.env.GOLD_TOKEN_ADDRESS,
                  startBlock: read from ../deployments/localhost.json }
     GoldReserve: { abi: goldReserveAbi, address: process.env.GOLD_RESERVE_ADDRESS,
                    startBlock: read from ../deployments/localhost.json }
   - Import ABIs from ../contracts/artifacts/

3. Create src/GoldToken.ts event handlers:
   - on Transfer(from, to, value):
     Upsert transfers table: { tx_hash, from_address, to_address, value, block_number, timestamp }
   - on RedemptionRequested(investor, grams, deliveryAddress, timestamp):
     Find redemption in DB by investor + grams + status=PENDING, update if found;
     insert new PENDING record if not found
   - on RedemptionFulfilled(investor, amountWei, redemptionRef):
     Update redemptions set status=FULFILLED, burn_tx_hash=event.transaction.hash
     where ref=redemptionRef
   - on AddressFrozen(wallet, isFrozen):
     Update identities set frozen=isFrozen where address=wallet

4. Create src/GoldReserve.ts event handlers:
   - on BarRegistered(barId, weightGrams, purityBps, vaultId):
     Upsert gold_bars: { bar_id, weight_grams, purity_bps, vault_id, active: true,
                         tx_hash: event.transaction.hash }
   - on BarDeactivated(barId):
     Update gold_bars set active=false where bar_id=barId

5. Create .env.example:
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goldtoken
   RPC_URL=http://127.0.0.1:8545
   GOLD_TOKEN_ADDRESS=
   GOLD_RESERVE_ADDRESS=

6. Add indexer service to infra/docker-compose.yml:
   indexer:
     build: ../indexer
     depends_on: [postgres, hardhat-node]
     environment: DATABASE_URL, RPC_URL, contract addresses
     restart: unless-stopped

Start the indexer against the local Hardhat node. Call registerBar on-chain and confirm
the gold_bars row appears in the DB within 2 seconds.
```

---

## Phase 6 — Frontend: Foundation

**Session goal:** Set up the React app with wagmi, TanStack Query, and the ported design system.

### Instructions for Claude Code

```
Set up the production frontend with wagmi wallet integration.

Working directory: frontend/

Tasks:

1. Scaffold with Vite:
   npm create vite@latest . -- --template react-ts
   npm install wagmi viem @tanstack/react-query
   npm install @rainbow-me/rainbowkit   (pre-built connect wallet UI)
   npm install react-router-dom lucide-react

2. Copy the entire design system from the POC:
   - frontend/src/index.css → copy wholesale (oklch tokens, component CSS, dark mode)
   - frontend/src/components/ui/ → copy all components:
     Sparkline.tsx, Addr.tsx, Eyebrow.tsx, Ingot.tsx, Donut.tsx,
     KPI.tsx, Badge.tsx, Button.tsx, Card.tsx, StatCard.tsx
   - frontend/src/hooks/useTheme.tsx → copy as-is

3. Set up wagmi in src/lib/wagmi.ts:
   - Configure chains: localhost (31337) for dev, polygon/mainnet for prod
   - Connectors: RainbowKit (includes MetaMask, WalletConnect, Coinbase)
   - Transport: http(RPC_URL)

4. Wrap app in src/main.tsx:
   WagmiProvider → QueryClientProvider → RainbowKitProvider → BrowserRouter → App

5. Create src/lib/contracts.ts:
   - Export typed contract instances using useReadContract / useWriteContract hooks
   - One hook per contract: useGoldToken(), useGoldReserve(), useIdentityRegistry()
   - These replace the direct ethers calls in the POC

6. Create src/lib/api.ts — typed fetch wrappers for backend routes (same as POC)

7. Set up routing in App.tsx:
   - Same routes as POC (/, /investor/*, /admin/*, /custodian/*, /auditor/*)
   - Add a ProtectedRoute component that checks wallet connection + role

8. Copy Sidebar.tsx and Shell.tsx from POC:
   - Replace the localStorage wallet pattern in Sidebar with useAccount() from wagmi
   - Role detection: derive from connected wallet address via backend GET /api/identities/:address
```

**Success criteria:** App loads; RainbowKit connect button appears; wallet connects; dark mode toggle works; all existing CSS classes render correctly.

### Claude Code Prompt

```
You are setting up the frontend foundation for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: frontend/.
Backend is running at localhost:3001. Contracts deployed to Hardhat localhost.
This replaces the POC's localStorage wallet pattern with wagmi.

POC design system to copy exactly (do not redesign anything):
- ../uc-gold-tokenization/frontend/src/index.css — full design system:
  oklch color tokens (--bullion, --emerald, --ruby, --azure, --ink, --paper),
  component CSS (.card, .btn, .nav-item, .kpi, .badge, .ledger, .eyebrow, .sidebar, .shell),
  dark mode via [data-theme="ink"]. Copy this file wholesale without modification.
- ../uc-gold-tokenization/frontend/src/components/ui/ — copy all components as-is:
  Sparkline.tsx, Addr.tsx, Eyebrow.tsx, Ingot.tsx, Donut.tsx, KPI.tsx, Badge.tsx,
  Button.tsx, Card.tsx, StatCard.tsx
- ../uc-gold-tokenization/frontend/src/hooks/useTheme.tsx — copy as-is
- ../uc-gold-tokenization/frontend/src/components/layout/Sidebar.tsx and Shell.tsx — copy,
  then update only the wallet parts (see task 4 below)

Stack: React 19 + Vite + TypeScript + Tailwind v4 + wagmi v2 + viem + RainbowKit + TanStack Query v5

Tasks:

1. Scaffold: npm create vite@latest . -- --template react-ts
   Install:
   npm install wagmi viem @tanstack/react-query @rainbow-me/rainbowkit react-router-dom lucide-react
   npm install --save-dev @types/node

2. Copy all design system files listed above. Do not modify them.

3. Create src/lib/wagmi.ts:
   - Chains: localhost (chainId 31337, rpcUrls: { default: { http: [VITE_RPC_URL] } }) for dev
   - Connectors: RainbowKit getDefaultConfig with WalletConnect projectId from env
   - Export wagmiConfig

4. Update the copied Sidebar.tsx — change only the wallet parts:
   - Replace localStorage.getItem('gold-wallet') with useAccount().address from wagmi
   - Replace the manual wallet input/connect button with RainbowKit ConnectButton
   - Keep all role switching, nav items, and CSS classes exactly as-is

5. Wrap app in src/main.tsx:
   WagmiProvider → QueryClientProvider → RainbowKitProvider → ThemeProvider → BrowserRouter → App

6. Create src/lib/contracts.ts:
   - Import ABIs from ../../contracts/artifacts/
   - Export contract addresses from env (VITE_GOLD_TOKEN_ADDRESS, etc.)
   - Export useGoldTokenRead(functionName, args), useGoldTokenWrite(functionName)
     wrapping wagmi's useReadContract / useWriteContract

7. Create src/lib/api.ts — typed fetch wrappers (same shape as POC):
   - Base URL: VITE_API_URL (defaults to /api via Vite proxy → localhost:3001)
   - Include Authorization: Bearer header with JWT from localStorage('jwt')

8. Create src/components/auth/ProtectedRoute.tsx:
   - Check useAccount().isConnected; if not: show ConnectButton centred on page
   - Fetch role from GET /api/identities/:address
   - If role doesn't match: redirect to /
   - While loading: show spinner

9. Set up App.tsx with same routes as POC:
   / → Dashboard (public), /investor/* (wallet required),
   /admin/* (admin role), /custodian/* (custodian role), /auditor/* (auditor role)

10. Add Vite proxy in vite.config.ts: /api → http://localhost:3001

Run npm run dev. Confirm: app loads, RainbowKit connect button visible,
dark mode works, all CSS classes render correctly.
```

---

## Phase 7 — Frontend: Pages

**Session goal:** Port all pages from the POC, replacing localStorage/manual-address patterns with wagmi hooks.

### Instructions for Claude Code

```
Port all frontend pages from the POC to use wagmi and TanStack Query.

Working directory: frontend/

Context from POC:
- POC used useInvestorWallet() hook with localStorage — replace with useAccount() from wagmi
- POC used direct ethers JsonRpcProvider calls — replace with useReadContract()
- POC write operations (mint, redeem, etc.) called the backend API — keep this pattern
  (backend holds the signing keys; users don't need to sign most transactions)
- Exception: requestRedemption() should be called directly from the user's wallet
  (investor signs this themselves — it's their intent to redeem)

Pages to port (from POC frontend/src/pages/):

1. Dashboard.tsx → Public proof of reserve
   - useReadContract for totalSupply, getTotalActiveWeightGrams
   - TanStack Query for GET /api/reserves, GET /api/price
   - No wallet required

2. InvestorPortal.tsx → Replace wallet input form with:
   - If not connected: show RainbowKit ConnectButton
   - If connected: show holdings (useReadContract balanceOf with useAccount().address)
   - requestRedemption: useWriteContract → calls token.requestRedemption() directly
     (investor signs from their own wallet)

3. InvestorMint.tsx, InvestorRedeem.tsx, InvestorActivity.tsx, InvestorIdentity.tsx
   → Port as-is; replace localStorage wallet refs with useAccount().address

4. AdminPanel.tsx and all admin sub-pages (AdminRedemptions, AdminMint, AdminKyc,
   AdminPrice, AdminRegistry):
   → Port as-is; replace direct ethers calls with backend API calls
   → Add ProtectedRoute wrapper requiring admin role

5. CustodianVault.tsx, CustodianIntake.tsx, CustodianFulfillment.tsx,
   CustodianAttestation.tsx:
   → Port as-is; add ProtectedRoute requiring custodian role

6. AuditorReserve.tsx:
   → Port as-is; replace static event stream with indexed data from Ponder DB

7. Add transaction feedback component:
   - When useWriteContract is pending: show spinner + "Waiting for signature"
   - When tx is in mempool: show "Transaction submitted" + block explorer link
   - When tx confirmed: show "Confirmed" + success state
   - On error: show human-readable error (parse revert reason from viem)
```

**Success criteria:** Full investor flow works end-to-end (connect wallet → view holdings → request redemption → see in activity). Admin can approve and fulfill redemptions.

### Claude Code Prompt

```
You are porting all frontend pages for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: frontend/.
Phase 6 is complete: wagmi configured, design system copied, routing set up, ProtectedRoute ready.

POC source pages are at: ../uc-gold-tokenization/frontend/src/pages/
Port each page with these substitutions:
- useInvestorWallet() / localStorage wallet → useAccount().address from wagmi
- Direct ethers JsonRpcProvider calls → useReadContract() from wagmi
- Frontend contract writes → POST/PATCH to backend API (backend holds signing keys)
- EXCEPTION: token.requestRedemption() must use useWriteContract — investor signs personally

After every useWriteContract call show transaction status using a TxStatus component:
  pending → "Waiting for signature..." (spinner)
  hash present, unconfirmed → "Transaction submitted" + block explorer link (spinner)
  confirmed → "Confirmed" (green check)
  error → parsed revert reason from viem decodeErrorResult

Tasks:

1. Create src/components/ui/TxStatus.tsx:
   Props: { hash?: string, isPending: boolean, isSuccess: boolean, error?: Error | null }
   Render the four states described above.

2. Port Dashboard.tsx (public, no wallet needed):
   - useReadContract for totalSupply, getTotalActiveWeightGrams
   - TanStack useQuery for GET /api/reserves and GET /api/price

3. Port InvestorPortal.tsx:
   - Not connected: show RainbowKit ConnectButton centred on page
   - Connected: useReadContract(balanceOf, [address]) for balance
   - useQuery for price, identity, redemptions from API
   - "Request redemption" button: form → useWriteContract token.requestRedemption(grams, address)
     with TxStatus feedback

4. Port InvestorMint.tsx, InvestorRedeem.tsx, InvestorActivity.tsx, InvestorIdentity.tsx:
   Replace all useInvestorWallet()/localStorage refs with useAccount().address. Otherwise port as-is.

5. Port AdminPanel.tsx and sub-pages (AdminRedemptions, AdminMint, AdminKyc, AdminPrice, AdminRegistry):
   All writes call backend API. Add ProtectedRoute requiring admin role. Port layout as-is.

6. Port CustodianVault.tsx, CustodianIntake.tsx, CustodianFulfillment.tsx, CustodianAttestation.tsx:
   Add ProtectedRoute requiring custodian role. Port layout as-is.
   CustodianFulfillment: "Fulfill" button calls PATCH /api/redemptions/:ref/fulfill.

7. Port AuditorReserve.tsx:
   Replace static event stream with useQuery for GET /api/activity (indexed data from Ponder DB).
   Add this route to the backend if it doesn't exist yet.

After each page run: npx tsc --noEmit and fix any TypeScript errors before moving to the next.
When all pages are done, manually test the full investor flow:
  connect wallet → view holdings → submit redemption → verify PENDING in activity.
```

---

## Phase 8 — E2E Tests

**Session goal:** Add Playwright tests for the core flows.

### Instructions for Claude Code

```
Add Playwright end-to-end tests for the core user flows.

Working directory: frontend/  (or a top-level e2e/ directory)

Setup:
- npm install --save-dev @playwright/test
- Configure playwright.config.ts: baseURL localhost:3000, use chromium
- Create a test wallet setup (Hardhat account #2 with known private key)
- Use Playwright's wallet mock (inject window.ethereum before tests)

Test files:

e2e/investor.spec.ts:
  - Connect wallet (mock MetaMask)
  - Holdings page shows correct balance after mint
  - Submit redemption request → appears in activity with PENDING status

e2e/admin.spec.ts:
  - Connect admin wallet
  - Approve a pending redemption → status changes to APPROVED
  - Fulfill an approved redemption → status changes to FULFILLED, balance decreases

e2e/public.spec.ts:
  - Proof of reserve page loads without wallet
  - Reserve ratio is displayed
  - Bar registry table shows at least one bar

e2e/por-invariant.spec.ts:
  - After fulfillment, totalSupply ≤ vaultGrams (read from chain directly via viem)

Target: ~15 tests. Run with: npx playwright test
Add to CI: run against docker-compose stack
```

**Success criteria:** `npx playwright test` passes all 15 tests against a running local stack.

### Claude Code Prompt

```
You are writing end-to-end tests for a production gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. Working directory: e2e/ (top-level).
Full stack is running: Hardhat node (8545), backend (3001), frontend (3000).

Test wallets (Hardhat default accounts — fixed private keys, safe to commit in tests):
- Admin / deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- Investor: 0x90F79bf6EB2c4f870365E785982E1f101E93b906

Tool: Playwright with chromium.
Wallet injection: use Playwright addInitScript to inject a window.ethereum mock that
auto-approves connection requests and signs transactions with the given private key.

Tasks:

1. Install: npm init -y && npm install --save-dev @playwright/test && npx playwright install chromium

2. Create playwright.config.ts:
   - baseURL: http://localhost:3000
   - use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } }
   - globalSetup: './global-setup.ts' (seeds test state: 1 bar, KYC'd investor, 100g minted)

3. Create global-setup.ts:
   - Connect to chain via viem, call registerBar (1 × 100g bar), KYC investor wallet,
     mint 100g to investor wallet
   - Connect to backend, set a gold price ($92.50/g)

4. Create helpers/wallet.ts:
   - injectMockWallet(page, address, privateKey):
     page.addInitScript that replaces window.ethereum with a mock provider
     that auto-approves eth_requestAccounts and signs with the given key

5. Create e2e/public.spec.ts (3 tests):
   - Page loads without wallet and shows reserve ratio
   - Reserve ratio is a number ≥ 1.0
   - Bar registry table has at least one row

6. Create e2e/investor.spec.ts (5 tests):
   - Inject investor wallet, navigate to /investor
   - Holdings page shows 100g balance
   - Holdings USD value is shown (non-zero)
   - Submit redemption request form → success toast appears
   - Redemption appears in activity table with status PENDING

7. Create e2e/admin.spec.ts (5 tests):
   - Inject admin wallet, navigate to /admin/redemptions
   - PENDING redemption card is visible in the kanban
   - Click Approve → card moves to APPROVED column
   - Click Fulfill → card moves to FULFILLED column
   - Navigate to /investor activity → status shows FULFILLED

8. Create e2e/invariant.spec.ts (2 tests):
   - After fulfillment: query chain via viem for totalSupply and getTotalActiveWeightGrams,
     assert totalSupply ≤ vaultGrams * 10^18
   - Dashboard reserve ratio is ≥ 1.0 after setup

9. Add to .github/workflows/ci.yml a new e2e job:
   - docker compose up -d, wait for health checks on all services
   - npx playwright test
   - Upload playwright-report/ as artifact on failure

Run: npx playwright test — all 15 tests must pass.
```

---

## Phase 9 — Deployment Config

**Session goal:** Production deployment configuration for Sepolia testnet (staging) and mainnet.

### Instructions for Claude Code

```
Set up deployment configuration for staging (Sepolia) and production.

Tasks:

1. Create scripts/deploy/01-deploy-prod.ts:
   - Deploy contracts to the configured network
   - TimelockController with 48h delay
   - Transfer DEFAULT_ADMIN_ROLE to TimelockController
   - Transfer TimelockController admin to Gnosis Safe address (from env)
   - Write deployed addresses to deployments/{network}.json
   - Verify contracts on Etherscan: npx hardhat verify

2. Create scripts/deploy/02-configure.ts:
   - Register compliance modules
   - Set Chainlink oracle address
   - Set initial MaxWalletBalance and MinTransferAmount

3. Update docker-compose.yml for staging:
   - Add environment-specific overrides
   - postgres with volume mount for persistence
   - healthchecks on all services

4. Update .github/workflows/ci.yml:
   - Add deploy-staging job: triggers on push to main
   - deploy-staging: runs hardhat deploy to Sepolia, runs smoke tests
   - Secrets: SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY (staging key only), ETHERSCAN_API_KEY

5. Create a deployment runbook in docs/DEPLOY.md:
   - Pre-deployment checklist (audit complete, multi-sig set up, Chainlink address confirmed)
   - Step-by-step deploy commands
   - Post-deployment verification steps (check reserve ratio, test a small mint)
   - Rollback procedure
```

**Success criteria:** Contracts deploy to Sepolia and are verified on Etherscan; CI deploys automatically on push to main.

### Claude Code Prompt

```
You are setting up production deployment for a gold-backed security token platform.

Project: ERC-3643 style token where 1 token = 1 gram of LBMA gold.
Monorepo root: gold-tokenization-prod/. All code complete and tested locally (Phases 0–8 done).
Deploying to Sepolia testnet as staging; Ethereum mainnet or Polygon as production.

Tasks:

1. Create contracts/scripts/deploy/01-deploy-prod.ts:
   Deploy in this exact order, waiting for each tx to confirm:
   a. IdentityRegistry
   b. ModularCompliance
   c. CountryRestrictions, MaxWalletBalance (10000g cap), MinTransferAmount (1g min)
   d. compliance.addModule() for each of the three modules
   e. GoldReserve (admin=deployer, custodian=env.CUSTODIAN_ADDRESS)
   f. GoldToken implementation contract + ERC1967Proxy (initialize with all addresses)
   g. TimelockController (minDelay=172800 [48h], proposers=[env.GNOSIS_SAFE_ADDRESS],
      executors=[env.GNOSIS_SAFE_ADDRESS])
   h. token.grantRole(DEFAULT_ADMIN_ROLE, timelockController.address)
   i. token.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address)
   Write all addresses + deploy block numbers to deployments/{networkName}.json

2. Create contracts/scripts/deploy/02-configure.ts:
   - Set Chainlink XAU/USD oracle address (env.CHAINLINK_XAUUSD_ADDRESS) on the token
   - Set MaxWalletBalance and MinTransferAmount to their initial values
   - Log confirmation of each step

3. Create contracts/scripts/deploy/03-verify.ts:
   - npx hardhat verify for each deployed contract with its constructor args
   - Print Etherscan URL for each verified contract

4. Add infra/docker-compose.prod.yml (overrides for production):
   - postgres: add named volume for data persistence, resource limits (mem: 1g)
   - backend: NODE_ENV=production, no PRIVATE_KEY env (uses KMS_KEY_ID instead)
   - All services: healthcheck with interval: 30s, timeout: 10s, retries: 3
   - All services: restart: unless-stopped

5. Update .github/workflows/ci.yml — add deploy-staging job:
   - Runs after contract-tests and backend-tests jobs pass
   - Trigger: push to main branch only
   - Steps:
     checkout, node 20, npm ci in contracts/,
     npx hardhat run scripts/deploy/01-deploy-prod.ts --network sepolia,
     npx hardhat run scripts/deploy/02-configure.ts --network sepolia,
     npx hardhat run scripts/deploy/03-verify.ts --network sepolia
   - GitHub secrets required: SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY,
     ETHERSCAN_API_KEY, GNOSIS_SAFE_ADDRESS, CUSTODIAN_ADDRESS, CHAINLINK_XAUUSD_ADDRESS

6. Create docs/DEPLOY.md — deployment runbook with these sections:

   Pre-deployment checklist:
   - [ ] Smart contract audit complete and all findings resolved
   - [ ] Gnosis Safe set up with minimum 3 signers confirmed
   - [ ] Chainlink XAU/USD oracle address confirmed for target network
   - [ ] AWS KMS key created, ARN added to backend production env
   - [ ] CUSTODIAN_ADDRESS confirmed with vault operator

   Staging deploy (Sepolia):
     npx hardhat run scripts/deploy/01-deploy-prod.ts --network sepolia
     npx hardhat run scripts/deploy/02-configure.ts --network sepolia
     npx hardhat run scripts/deploy/03-verify.ts --network sepolia

   Post-deploy verification:
   - deployments/sepolia.json exists with all addresses and block numbers
   - All contracts verified on Etherscan
   - getTotalActiveWeightGrams() returns 0 (no bars yet — expected)
   - Mint attempt reverts with "GoldToken: mint would exceed vault reserve" — confirms reserve cap
   - Register one test bar, confirm getTotalActiveWeightGrams() updates
   - Mint 1g to a test address, confirm balance with balanceOf()

   Rollback:
   UUPS proxy — deploy new implementation, submit upgradeTo() call via
   TimelockController proposal through the Gnosis Safe UI. Wait 48h for timelock.
```

---

## Claude Code Session Tips

These apply to every phase above:

**Starting a session:**
> "Read CLAUDE.md first. We are on Phase N. [paste the Claude Code Prompt block above]."

**If Claude drifts or over-engineers:**
> "We are building a POC-to-production upgrade. Don't add features beyond what's listed. Keep the scope to this phase only."

**For contract work:**
> "The existing POC contracts are in [path]. Use the exact revert message strings from the source — don't paraphrase them, tests rely on exact matches."

**For the test suite:**
> "Use the loadFixture pattern from contracts/test/fixtures.ts. Do not use beforeEach for deployment — it's 4x slower. Each test should destructure only the contracts it needs."

**For the frontend:**
> "Port the component logic from the POC. Do not redesign anything — the CSS design system is already production-quality and must be preserved exactly."

**After each phase:**
> "Run the full test suite and fix any failures before we move to the next phase."

---

## Effort Estimate

| Phase | Complexity | Claude sessions |
|---|---|---|
| 0 — Scaffold + CLAUDE.md | Low | 1 |
| 1 — Contracts core | Medium | 2 |
| 2 — Contract tests | Low | 1 |
| 3 — Backend foundation | Medium | 2 |
| 4 — Backend routes | Medium | 2 |
| 5 — Event indexer | Medium | 2 |
| 6 — Frontend foundation | Medium | 2 |
| 7 — Frontend pages | High | 3–4 |
| 8 — E2E tests | Medium | 2 |
| 9 — Deployment config | Medium | 2 |
| **Total** | | **~19–20 sessions** |

Each session assumes a focused 1–2 hour working block with Claude Code.
