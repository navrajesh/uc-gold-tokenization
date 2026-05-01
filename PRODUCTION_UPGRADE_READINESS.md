# Production Readiness Checklist

This document lists what needs to change before this POC can be deployed to mainnet and used with real assets. Items are grouped by layer and roughly ordered by priority within each section.

---

## 1. Smart Contracts

### Critical (blockers)

- **Replace KYC bool mapping with ONCHAINID (ERC-734/735)**
  `IdentityRegistry` is a single-owner `address → bool` map. Production requires signed claims issued by accredited verifiers (Tokeny, Synaps, Onfido on-chain layer). The T-REX standard specifies ERC-734/735 identity contracts.

- **Fix CountryRestrictions — add per-address country lookup**
  Currently `canTransfer` returns `!whitelistEnabled` — when enabled it blocks ALL transfers regardless of country. Needs `identityRegistry.getCountry(address)` and a lookup against the allowed-country mapping.

- **Lock tokens at redemption request time**
  `requestRedemption` only emits an event — tokens are not held. An investor could transfer or spend their balance between request and fulfillment. Production needs tokens escrowed or frozen at request time and released on reject.

- **Multi-sig for all admin roles**
  `DEFAULT_ADMIN_ROLE`, `SUPPLY_MODIFIER`, `CUSTODIAN_ROLE` are held by single EOAs. Replace with a Gnosis Safe (3-of-5 or similar) for every privileged role. This is standard for any RWA platform.

- **Timelock on upgrades and critical parameter changes**
  UUPS `_authorizeUpgrade` and admin operations (setGoldReserve, setMaxBalance) should go through a TimelockController so the community has time to respond before a change takes effect.

- **Independent security audit**
  Engage at least one reputable auditor (OpenZeppelin, Trail of Bits, Sherlock, Code4rena) before any mainnet deployment with real assets.

### Important

- **Chainlink XAU/USD price oracle**
  Replace the manual `POST /api/price` feed with on-chain Chainlink aggregator. Add the price contract to the token or a companion oracle contract so mint valuations are trustless.

- **On-chain custodian attestation**
  Bar registration is custodian-signed on-chain, but there is no signed attestation document linking the on-chain record to a physical assay certificate. Add a Merkle root or IPFS hash of the attestation document to each bar registration event.

- **Redemption ref committed on-chain at request time**
  Currently the ref is backend-generated and passed in by the custodian at fulfillment. It should be derived from `keccak256(investor, amount, timestamp)` and emitted at request time so the off-chain record can be matched trustlessly.

- **Emergency pause**
  Add `Pausable` (OpenZeppelin) to `GoldToken` so the admin can halt all transfers in an incident. Pause should require multi-sig.

- **Gas optimisation**
  `getTotalActiveWeightGrams()` iterates all bars — O(n). Replace with a running-total state variable updated on register/deactivate. Critical once bar count grows.

- **MaxWalletBalance bootstrap**
  The module tracks balances from the point it is added. Wallets holding tokens before the module was deployed have `_tracked = 0`. Seed existing holders before enabling enforcement in production.

- **Formal verification of invariants**
  Core invariants (`totalSupply ≤ vaultGrams`, no transfer without KYC, no mint without reserve headroom) should be formally verified with Certora Prover or Halmos.

---

## 2. Backend

### Critical

- **Replace SQLite with PostgreSQL**
  SQLite has no concurrent write support and no native replication. Use PostgreSQL with connection pooling (PgBouncer) and a managed service (RDS, Supabase, Neon).

- **Replace plain private keys with HSM / KMS**
  `blockchain.ts` loads private keys from `.env`. Production needs keys stored in AWS KMS, Azure Key Vault, or an HSM. Signing happens inside the KMS — the key never leaves.

- **Authentication on all API routes**
  Currently there is no auth. Every route that triggers an on-chain write needs authentication (JWT + role check) so only authorised admins and custodians can call them.

- **Secrets management**
  All secrets (DB password, RPC URL, private key references) must come from a secrets manager (AWS Secrets Manager, HashiCorp Vault), not `.env` files.

### Important

- **Input validation on all routes**
  Add `zod` schemas to every request body. Reject malformed addresses, out-of-range amounts, and unexpected fields at the boundary before they reach the DB or chain.

- **Transaction retry and nonce management**
  `blockchain.ts` sends transactions without retry logic. Production needs nonce tracking, gas price estimation (EIP-1559), and retry/resubmit on dropped transactions.

- **On-chain event indexer**
  Replace polling with a proper event listener (using `ethers.provider.on` with reconnect logic, or The Graph / Ponder for historical queries). The activity streams and redemption status should be driven by chain events, not DB state alone.

- **Structured logging and error handling**
  Add `pino` or `winston` with log levels, correlation IDs per request, and sanitised error responses (no stack traces to clients). Ship logs to a central store (Datadog, CloudWatch).

- **Database migrations**
  Drizzle supports `drizzle-kit` migrations. Formalise the migration flow so schema changes are versioned and repeatable across environments.

- **Backend test suite**
  Add `vitest` + `supertest` covering the happy path for each route group. Focus on routes that trigger on-chain writes (`/mint`, `/redemptions/:ref/fulfill`). Aim for ~20 tests.

- **Rate limiting**
  Add `express-rate-limit` on all routes. Stricter limits on write routes.

- **Health check endpoint**
  `GET /health` returning chain connectivity status, DB status, and last processed block. Required by load balancers and monitoring.

---

## 3. Frontend

### Critical

- **Real wallet integration**
  Replace the `localStorage` address-entry pattern with a proper wallet provider. Use `wagmi` + `viem` with WalletConnect v2 and MetaMask. Users should sign transactions from their own wallet, not rely on backend-held keys.

- **Transaction UX**
  Every on-chain action needs pending/confirmed/failed states with the tx hash and a block explorer link. Users need to know when to wait.

- **HTTPS and security headers**
  Deploy behind HTTPS. Add CSP, HSTS, X-Frame-Options, and X-Content-Type-Options headers.

### Important

- **Real-time updates**
  Holdings, supply, and redemption status should update automatically when the chain state changes, not require a manual refresh. Use WebSocket subscriptions or polling with SWR/React Query.

- **Error boundaries and fallback UI**
  Unhandled promise rejections currently surface as blank states. Wrap all async data-fetching in error boundaries with user-facing messages.

- **End-to-end tests**
  Add Playwright tests covering the core investor flow (connect wallet → mint → redeem) and the admin approval flow. Run in CI against a local Hardhat node.

- **Accessibility**
  Audit against WCAG 2.1 AA. The current design is visually driven; keyboard navigation and screen reader support need verification.

---

## 4. Infrastructure & DevOps

- **CI/CD pipeline**
  GitHub Actions (or equivalent) running on every PR: compile contracts, run all tests, typecheck frontend and backend. Block merge on failure.

- **Environment separation**
  Three environments minimum: `local` (Hardhat), `staging` (testnet — Sepolia or Polygon Amoy), `production` (mainnet). Each with its own deployed contracts, DB, and config.

- **Contract deployment registry**
  Store deployed contract addresses in a versioned registry (the current `deployments/localhost.json` pattern is a good start). Include deployment block number for event indexing start points.

- **Monitoring and alerting**
  Monitor: chain RPC latency, transaction failure rate, reserve ratio dropping below 100%, pending redemptions older than X hours. Alert via PagerDuty or Opsgenie.

- **Database backups**
  Automated daily backups with point-in-time recovery. The DB is the source of truth for redemption lifecycle state — losing it means losing the ability to reconcile with the chain.

- **Frontend CDN**
  Serve the Vite build from a CDN (Vercel, Cloudflare Pages, AWS CloudFront). Do not serve a financial application from a single-origin Node server.

---

## 5. Compliance & Legal

- **Legal classification of SGT999**
  Engage securities lawyers in every jurisdiction where the token will be offered. In Singapore this falls under MAS's Capital Markets Services licensing framework.

- **KYC/AML provider integration**
  Replace the manual KYC registration with an accredited provider (Jumio, Onfido, Synaps, Fractal ID). The provider issues verified claims that feed into the on-chain IdentityRegistry.

- **Custodian legal agreements**
  The custodian role needs a formal legal agreement with the vault operator (Brinks, Loomis, etc.) covering insurance, audit rights, and bar registration procedures.

- **Proof of reserve audit cadence**
  Agree a regular third-party attestation schedule (monthly or quarterly) where an auditor physically inspects vault holdings and signs an attestation that is committed on-chain.

- **Privacy policy and terms**
  GDPR / PDPA-compliant privacy policy covering the off-chain data stored in SQLite (delivery addresses, identity data). Terms of service covering token purchase and redemption.

---

## 6. Summary Priority Order

| Priority | Item |
|---|---|
| P0 | Smart contract audit |
| P0 | Multi-sig for all admin roles |
| P0 | HSM / KMS for backend signing keys |
| P0 | ONCHAINID KYC (ERC-734/735) |
| P0 | Token locking at redemption request |
| P1 | Real wallet integration (wagmi) |
| P1 | PostgreSQL + proper migrations |
| P1 | Timelock on upgrades |
| P1 | Chainlink price oracle |
| P1 | CI/CD pipeline |
| P1 | Staging environment on testnet |
| P2 | CountryRestrictions per-address lookup |
| P2 | On-chain event indexer (The Graph) |
| P2 | Transaction retry / nonce management |
| P2 | Emergency pause |
| P2 | Legal classification and KYC/AML provider |
| P3 | Formal verification |
| P3 | E2E tests (Playwright) |
| P3 | Gas optimisation (reserve running total) |
| P3 | Proof of reserve attestation on-chain |
