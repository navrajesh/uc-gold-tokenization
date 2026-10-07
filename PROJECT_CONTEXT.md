# Gold Tokenization Project Context

This document is the durable handoff for future development sessions. It records
the project intent, current architecture, operational assumptions, recent fixes,
verification history, and known gaps. Update it whenever those facts change.

Last reviewed: **2026-10-07**

## Repository snapshot

- Repository: `https://github.com/navrajesh/uc-gold-tokenization.git`
- Primary branch: `main`
- Project stage: proof of concept (POC), not production-ready
- Latest verified functional commit at the time of this note: `c742e5d`
  (`Fix frontend type-only imports`)
- Intended local commit identity for this clone:
  `Rajesh Nkrishnan <navrajesh@gmail.com>`
- The email override is stored in `.git/config`; it is local machine state and
  does not travel with a clone.

Do not put access tokens, wallet keys, production credentials, or other secrets
in this file. Git/GitHub authentication is machine-local state.

## Product intent

The application demonstrates physical-gold tokenization using an ERC-3643 /
T-REX-inspired security-token model:

- One token represents one gram of physical gold.
- Registered gold bars establish the reserve ceiling.
- The token contract prevents minting beyond active reserve weight.
- Wallets must pass identity/KYC checks before transfers.
- Pluggable compliance modules enforce country, wallet-balance, and minimum
  transfer rules.
- Redemptions move through `PENDING`, `APPROVED`, `FULFILLED`, or `REJECTED`.
- Fulfillment burns tokens on-chain and records the burn transaction in the
  backend.
- The demo supports multiple token deployments, notably `SGT999` and `SGT916`.

`SPEC.md` contains the non-technical product flows and design decisions.
`README.md` contains the primary setup and architecture guide.

## System architecture

### Smart contracts

Location: `contracts/`

- Solidity `0.8.24`, Hardhat, ethers v6, and TypeChain.
- `Token.sol`: base ERC-3643-style token behavior.
- `GoldToken.sol`: gold-specific token, reserve-backed mint cap, redemption.
- `GoldReserve.sol`: physical bar registry and active reserve total.
- `IdentityRegistry.sol`: wallet verification/KYC state.
- `ModularCompliance.sol`: combines compliance modules.
- Modules:
  - `CountryRestrictions.sol`
  - `MaxWalletBalance.sol`
  - `MinTransferAmount.sol`
- `ProxyHelper.sol` ensures the ERC-1967 proxy is included in TypeChain output.
- `GoldToken` is deployed behind a UUPS-compatible ERC-1967 proxy.

Hardhat networks currently configured:

- In-process `hardhat`, chain ID `31337`.
- `localhost`, `http://127.0.0.1:8545`, chain ID `31337`.
- No public testnet or mainnet network is configured in `hardhat.config.ts`.

### Backend

Location: `backend/`

- Express 4 + TypeScript.
- ethers v6 for chain reads/writes.
- Drizzle ORM + libSQL client.
- Entrypoint: `backend/src/server.ts`.
- Default port: `3001`.
- Local database path: `backend/data/gold.db` after TypeScript path resolution.
- Database tables are bootstrapped in code by `backend/src/db/index.ts`.
- An initial manual price of USD 85/gram is inserted when no price exists.
- Chain write operations are signed by private keys held by the backend.

API route groups:

- `GET /health`
- `/api/tokens`: register tokens, fetch token metadata, mint, compliance check.
- `/api/reserves`: list/register/deactivate physical gold bars.
- `/api/identities`: list/register/update KYC identities.
- `/api/redemptions`: create, approve, fulfill, and reject redemptions.
- `/api/price`: read or manually update the gold price.

The database is the off-chain record of tokens, identities, bars, redemptions,
and price history. Some reads fall back to database data if the chain is
unavailable. For operations that touch both systems, chain writes generally
happen before database writes.

### Frontend

Location: `frontend/`

- React 19 + TypeScript + Vite + Tailwind CSS v4.
- Default development port: `3000`.
- Vite proxies `/api` to `http://localhost:3001` during local development.
- Production API requests use same-origin relative `/api/...` paths.
- Main pages:
  - `Dashboard.tsx`: token/reserve overview.
  - `AdminPanel.tsx`: token, bar, KYC, redemption, mint, and price actions.
  - `InvestorPortal.tsx`: wallet balance lookup and redemption submission.
- Theme preference is stored in browser `localStorage` under `gold-theme`.

### Deployment scripts

- `scripts/deploy/01-deploy-gold-token.ts`: deploys and seeds `SGT999`.
- `scripts/deploy/02-deploy-sgt916.ts`: deploys and seeds `SGT916`.
- Local deployment addresses are written to `deployments/localhost.json`, which
  is intentionally ignored by Git.
- Deployment scripts attempt to register the resulting contracts and demo data
  with the backend at `http://localhost:3001`.
- Shell and Windows batch launchers live under `scripts/sh/` and `scripts/bat/`.

## Configuration

Backend environment variables are documented in `backend/.env.example`:

| Variable | Local default/role |
| --- | --- |
| `PORT` | Express port, normally `3001` |
| `NODE_ENV` | Runtime environment |
| `FRONTEND_URL` | Allowed CORS origin, locally `http://localhost:3000` |
| `RPC_URL` | JSON-RPC endpoint, locally `http://127.0.0.1:8545` |
| `CHAIN_ID` | Expected chain ID, locally `31337` |
| `DEPLOYER_PRIVATE_KEY` | Signs admin, KYC, and mint operations |
| `CUSTODIAN_PRIVATE_KEY` | Signs reserve and redemption operations |

The keys in `.env.example` are Hardhat's well-known test accounts. They are safe
only for isolated local development and must never control real assets or be
used on a public network. `backend/.env` is ignored by Git.

## Local development

Prerequisites recorded by the project: Node.js 18+ and npm 9+.

Install each independently locked workspace:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Prepare the backend environment:

```bash
cp backend/.env.example backend/.env
```

Typical four-process workflow:

```bash
# Terminal 1, repository root
npm run node

# Terminal 2, repository root
npm run deploy:local

# Terminal 3
cd backend && npm run dev

# Terminal 4
cd frontend && npm run dev
```

Convenience launchers are also described in `README.md`.

Useful verification commands:

```bash
# Contracts and generated types
npm run compile

# Contract tests
npm test

# Backend typecheck/build
cd backend && npm run build

# Frontend typecheck and production bundle
cd frontend && npm run build

# Frontend lint
cd frontend && npm run lint
```

If the local Hardhat node is restarted, its chain state is reset. Redeploy the
contracts and ensure database records/deployment addresses are not stale.

## Vercel deployment

`vercel.json` defines two services:

- `backend`: root `backend`, Express framework.
- `frontend`: root `frontend`, Vite framework.

Routing:

- `/api/(.*)` goes to the backend service.
- All other paths go to the frontend service.

### 2026-10-07 build failure and fix

The reported deployment attempt ran in Vercel region `iad1` on a 2-core, 8 GB
builder with Vercel CLI `62.1.0`. It cloned commit `a751627` without a previous
build cache. The backend build and typecheck passed, and Vercel selected
`backend/src/server.ts` as its root entrypoint. The subsequent frontend build
failed.

Vercel built the backend successfully, then the frontend failed with `TS1484`
because `frontend/tsconfig.app.json` enables `verbatimModuleSyntax`. With that
option, symbols used only as TypeScript types must use type-only imports.

Commit `c742e5d` fixed:

- `ReactNode` in `frontend/src/hooks/useTheme.tsx`.
- `FormEvent` in `frontend/src/pages/AdminPanel.tsx`.
- `FormEvent` in `frontend/src/pages/InvestorPortal.tsx`.

The fix was locally verified with:

- TypeScript project build/typecheck: passed.
- Vite production build: passed.
- Vite emitted a non-blocking warning that the main JavaScript chunk exceeds
  500 kB after minification.

The original failure was a TypeScript source issue, not a Vercel Hobby-plan
limit.

Commit `c742e5d` was pushed to `origin/main`. The post-push Vercel deployment
result was not independently checked from this workspace, so future sessions
should confirm the deployment state in Vercel rather than assuming runtime
success from the local build alone.

### Runtime items that still require deployment work

Passing the build does not make the current POC fully usable on a hosted URL.
These facts come directly from the current code and should be addressed before
claiming a working public deployment:

1. `InvestorPortal.tsx` directly uses `http://127.0.0.1:8545` for balance
   queries. In a hosted browser, that points at the visitor's own computer.
2. The backend defaults to the same local RPC URL. A hosted environment needs a
   reachable RPC provider and matching deployed contracts.
3. The backend stores SQLite data at a local application path. Persistence and
   write access in the selected hosted runtime have not been validated. A
   durable external libSQL/Turso-style database or another hosted database is
   likely required for reliable deployments.
4. The backend bootstraps the database and calls `app.listen(...)` from its
   module. Confirm this lifecycle against the actual deployment runtime.
5. `FRONTEND_URL` must match the deployed frontend origin for CORS.
6. Contract addresses created on a local Hardhat chain are not usable from a
   hosted deployment. Deploy to a reachable network and register those
   addresses in the hosted database.
7. Production secrets must be stored in deployment environment variables, not
   committed files.

## Security and production-readiness gaps

This is intentionally a POC. Important gaps visible in the current code:

- No API authentication or authorization protects admin/custodian endpoints.
- The backend holds privileged deployer and custodian private keys.
- There is no end-user wallet connection/signing flow such as MetaMask.
- KYC data is minimal and does not represent a complete identity-verification
  process.
- CORS is configured, but CORS is not access control.
- Chain/database dual writes are not transactional; a successful chain write
  followed by a failed database write can leave inconsistent state.
- The redemption fulfillment conversion rounds requested grams before turning
  them into token units, so fractional-gram behavior needs explicit review.
- Manual gold-price updates are unauthenticated and are not connected to a live
  oracle.
- Input validation is basic and should be strengthened for addresses, amounts,
  purity, state transitions, and duplicate/concurrent requests.
- Country codes are stored off-chain, while the current backend identity ABI
  only submits wallet plus verified status on-chain; verify how country rules
  are meant to receive identity-country data.
- Logging, rate limiting, audit trails, monitoring, secret rotation, backups,
  and incident controls are not implemented.
- The local dependency install reported npm audit findings on 2026-10-07. They
  were not investigated as part of the compiler fix and should be reviewed
  before any production release.

Never deploy this POC with real funds or real customer data until the threat
model, contract audit, API controls, key management, data persistence, and
regulatory requirements have been addressed.

## Behavioral details and caveats

- A token must first be deployed on-chain and then registered in the backend.
- Minting uses the deployer signer; reserve changes and fulfillment use the
  custodian signer.
- KYC registration writes on-chain first, then stores the database record.
- Reserve registration writes on-chain first, then stores the database record.
- Reserve reads prefer the chain and fall back to the database when chain
  access fails.
- Token detail reads enrich database records with live supply/decimal data when
  the chain is reachable.
- Redemption submission is database-only; fulfillment performs the on-chain
  burn.
- The API generates redemption references from token symbol, time, and a short
  random suffix.
- Gold price is an off-chain display value and does not affect contract logic.
- Country restrictions default to passthrough until configured.
- The demo max-wallet rule is 10,000 grams and the minimum transfer is 1 gram.
- `SGT999` seed data uses a 1,000 g demo reserve and mints 1,000 tokens.
- `SGT916` seed data uses a 500 g demo reserve and mints 200 tokens.

## Recent Git/authentication history

- The Vercel fix was committed with the correct repository-local email and
  pushed from `main` to `origin/main`.
- An initial push was rejected because macOS Keychain supplied credentials for
  a different GitHub account. After the user authenticated the correct account,
  `git push origin main` succeeded.
- Do not record account tokens or credential contents. If this recurs, verify
  `git remote -v`, `git config user.email`, `gh auth status`, and the credential
  helper before changing repository history.

## Handoff checklist for future sessions

Before making changes:

1. Read `PROJECT_CONTEXT.md`, `README.md`, and `SPEC.md`.
2. Run `git status --short --branch`; preserve unrelated user changes.
3. Confirm the target environment: local Hardhat, public testnet, or hosted UI.
4. Check effective Git identity before committing.
5. Never copy `.env.example` test keys into a public-network deployment.

Before handing off a change:

1. Run the relevant contract, backend, and/or frontend checks.
2. Record any check that could not run and why.
3. Update this file when architecture, configuration, deployment status, or
   important limitations change.
4. Confirm the working tree contains only intended changes.
5. Commit and push only when explicitly requested or already authorized by the
   active task.
