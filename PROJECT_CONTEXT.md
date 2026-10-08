# Gold Tokenization Project Context

This document is the durable handoff for future development sessions. It records
the project intent, current architecture, operational assumptions, recent fixes,
verification history, and known gaps. Update it whenever those facts change.

Last reviewed: **2026-10-07**

## Repository snapshot

- Repository: `https://github.com/navrajesh/uc-gold-tokenization.git`
- Primary branch: `main`
- Project stage: proof of concept (POC), not production-ready
- Latest pushed commits at the time of this note:
  - `a173932` (`Link demo records to Amoy explorer`)
  - `d9e0f89` (`Update hosted demo project context`)
  - `606fc13` (`Record Polygon Amoy deployment`)
  - `2bbdffd` (`Fix Vercel backend packaging`)
  - `09d4f0d` (`Add Amoy and Turso hosted demo support`)
  - `2754972` (`Rename and reorder info navigation`)
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
- `amoy`, chain ID `80002`, using `AMOY_RPC_URL` and two testnet-only signer
  keys from the root `.env`.

### Backend

Location: `backend/`

- Express 4 + TypeScript.
- ethers v6 for chain reads/writes.
- Drizzle ORM + libSQL client.
- Entrypoint: `backend/src/server.ts`.
- Default port: `3001`.
- Local database path: `backend/data/gold.db` after TypeScript path resolution.
- When `TURSO_DATABASE_URL` is set, the same client and schema use remote Turso
  storage authenticated by `TURSO_AUTH_TOKEN`.
- Database tables are bootstrapped in code by `backend/src/db/index.ts`.
- An initial manual price of USD 85/gram is inserted when no price exists.
- Chain write operations are signed by private keys held by the backend.

API route groups:

- `GET /health`
- `/api/tokens`: register tokens, fetch metadata and server-side live balances,
  mint, and run compliance checks.
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
  - `Dashboard.tsx`: token/reserve overview plus public PolygonScan Amoy links
    for the deployed token stack.
  - `AboutDemo.tsx`: visual explanation of the demo lifecycle and participants.
  - `AdminPanel.tsx`: token, bar, KYC, redemption, mint, and price actions.
  - `InvestorPortal.tsx`: wallet balance lookup and redemption submission.
- `ExplorerLink.tsx` consistently links public wallet, contract, and transaction
  records to PolygonScan Amoy. Zero/placeholder transaction hashes are rendered
  as unavailable rather than as dead links.
- Theme preference is stored in browser `localStorage` under `gold-theme`.

### Deployment scripts

- `scripts/deploy/01-deploy-gold-token.ts`: deploys and seeds `SGT999`.
- `scripts/deploy/02-deploy-sgt916.ts`: deploys and seeds `SGT916`.
- Deployment addresses are written to `deployments/<network>.json`; only the
  local file is ignored by Git.
- Deployment scripts register contracts and demo data with `DEMO_API_URL`
  (falling back to `http://localhost:3001`). Already-mined reserve transactions
  use the protected `/api/reserves/import` bookkeeping route rather than
  submitting the same bar on-chain twice.
- Amoy seeding distributes tokens to two configurable public investor wallets
  so the hosted Investor Portal starts with visible holdings.
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
| `TURSO_DATABASE_URL` | Optional Turso/libSQL URL; local SQLite if empty |
| `TURSO_AUTH_TOKEN` | Authenticates the remote Turso connection |
| `DEMO_SEED_TOKEN` | Protects deployment-only database import operations |

Root deployment variables are documented in `.env.example`: `AMOY_RPC_URL`,
both testnet signer keys, two public demo investor addresses, `DEMO_API_URL`,
and `DEMO_SEED_TOKEN`.

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

Commit `c742e5d` was pushed to `origin/main`. A later production deployment was
independently checked from this workspace; its current verified status is
recorded below.

### Hosted runtime status

The selected hosted stack is deployed and verified:

- Polygon Amoy is configured in Hardhat.
- Alchemy-backed live balance reads go through the backend rather than exposing
  the RPC URL in the frontend bundle.
- Turso provides persistent libSQL storage when its two variables are set.
- Amoy deployment scripts seed contract state, demo investor balances, and the
  hosted database.
- Production alias: `https://uc-gold-tokenization-ten.vercel.app`.
- Vercel project: `uc-gold-tokenization`, personal scope `navrajesh`.
- The production `/health` and application API routes return HTTP 200.
- Turso contains one registered token, one reserve bar, and three identities.
- The live reserve summary reports 1,000 active grams from the chain.
- The two demo investor balances are 100 and 75 `SGT999` respectively.
- The deployed contract map is committed in `deployments/amoy.json`; contract
  and account addresses there are public testnet data, not credentials.
- `SGT999` proxy: `0x3d5da18354C3c7856B20090790a94aD6E112e960`.
- The original proxy-deployment and bar-registration transaction hashes were
  recovered from PolygonScan and added to the deployment map. The protected,
  idempotent `register:amoy` recovery path can update those hashes in Turso
  without making another blockchain transaction.

The initial contract deployment completed on-chain, but its backend registration
requests failed while the Vercel function packaging issue below was present.
After deploying the packaging fix, `npm run register:amoy` successfully imported
the existing token, reserve bar, deployer identity, and two investor identities
without redeploying contracts or repeating chain writes. Do not rerun
`npm run deploy:amoy` for this stack. Use `register:amoy` only to recover the
off-chain records for the addresses already stored in `deployments/amoy.json`.

The Amoy/Turso/Vercel implementation was verified on 2026-10-07 with the live
health and API endpoints, live investor balances, a direct Turso connectivity
check, all 11 Hardhat tests, the backend TypeScript build, the frontend
TypeScript/Vite production build, deployment-script typechecking, and
`git diff --check`. One first test run encountered a one-second timestamp-boundary
flake in the redemption event assertion; the immediate full rerun passed all 11.

### 2026-10-07 Amoy explorer integration

Commit `a173932` added an **On-chain Verification** panel to the dashboard and
inline PolygonScan Amoy links throughout the Admin and Investor views. Visible
records include the token proxy, deployment transaction, reserve and compliance
contracts, identity registry, public role wallets, bar-registration transaction,
mint transaction, and redemption burn transaction when present.

The initial deployment file predated transaction-hash capture. The proxy
creation and `GB-2024-001` registration hashes were recovered from PolygonScan,
validated against the public contract activity (including the `registerBar`
method selector), and committed to `deployments/amoy.json`.

The protected recovery behavior is now idempotent:

- Reposting an existing token with a valid `DEMO_SEED_TOKEN` can replace its
  placeholder transaction hash.
- Re-importing an existing bar with a valid seed token can fill its missing
  registration hash.
- `npm run register:amoy` performed both Turso updates successfully and did not
  deploy contracts or send any blockchain transaction.

The personal Vercel production deployment for `a173932` reached `Ready`, and
the primary alias remained `https://uc-gold-tokenization-ten.vercel.app`.
Post-deployment verification confirmed:

- `/health`, `/api/tokens`, and `/api/reserves` returned HTTP 200.
- Both repaired transaction hashes were returned by the hosted API.
- Reserve summary source remained `chain`.
- A rendered-browser inspection found the On-chain Verification panel, all
  expected contract/wallet links, and the bar-registration transaction link.
- Backend production build passed.
- Frontend TypeScript/Vite production build passed; the existing non-blocking
  chunk-size warning remains.
- Focused linting of the new explorer component/helper passed.

Repository-wide frontend lint was already not clean: it reports existing issues
in `Tooltip.tsx`, `useTheme.tsx`, and effect patterns in `AdminPanel.tsx` and
`Dashboard.tsx`. A root `npx tsc --noEmit` also reports existing Hardhat test
contract-cast diagnostics. These did not affect either production build and
were not introduced or changed by the explorer feature.

### 2026-10-07 Vercel Services runtime packaging failure

Commit `09d4f0d` built successfully, but every backend invocation failed with
`Cannot find module 'express'` from `/var/task/server.js`. Vercel had run the
backend `tsc` build and flattened `backend/dist/server.js` into the function
root without placing the service dependencies beside it. This matches the open
Vercel Services nested-backend output-directory issue. `vercel.json` now sets
the backend `entrypoint` to `src/server.ts` and `outputDirectory` to `.`, forcing
Vercel to package the source entrypoint with its service dependencies. `/health`
is also routed to the backend for deployment verification.

Commit `2bbdffd` contains the packaging fix and the database-only registration
recovery flow. The resulting production function was built with its dependencies
and verified successfully.

### Vercel CLI account profiles

Two CLI profiles are intentionally kept separate so work and personal projects
can be switched without logging either account out:

- Default Vercel configuration: authenticated as `navrajesh-aura-admin`, with
  active team `team-aura-invites` (`Team AURA Invites`).
- Personal configuration at `/Users/rajesh/.vercel-personal`: authenticated as
  `navrajesh-7640`, with active team/scope `navrajesh`.

Useful identity checks:

```bash
# Default/team profile
npx vercel whoami
npx vercel teams ls

# Personal profile
npx vercel whoami --global-config /Users/rajesh/.vercel-personal
npx vercel teams ls --global-config /Users/rajesh/.vercel-personal
```

Use the personal `--global-config` option for commands targeting this project's
Vercel deployment. Login tokens and configuration contents remain machine-local
and must not be committed.

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
- A private-looking 64-character value and an Alchemy endpoint were displayed
  in earlier chat/IDE context. If they have not already been rotated, treat them
  as exposed and replace the affected seed token, testnet wallet, and/or Alchemy
  key in local and Vercel configuration. Never record the values here.
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
- `SGT999` seed data uses a 1,000 g demo reserve, mints 1,000 tokens, and sends
  100/75 tokens to the two configured investor addresses.
- `SGT916` seed data uses a 500 g demo reserve, mints 200 tokens, and sends
  25/20 tokens to the two configured investor addresses.

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
