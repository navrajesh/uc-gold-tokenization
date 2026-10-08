# Hosted Interview Demo: Vercel + Polygon Amoy + Turso

This runbook deploys the proof of concept with free-tier services. It uses:

- Vercel for the React frontend and Express API.
- Polygon Amoy (chain ID `80002`) for testnet contracts.
- Alchemy for the server-side Amoy JSON-RPC connection.
- Turso/libSQL for persistent application data.

Use testnet-only wallets and test POL. Never use a wallet that controls real
assets, and never commit `.env` files or paste credentials into issues or chat.

## 1. Prepare two testnet wallets

Create separate deployer and custodian accounts. Fund both with Amoy test POL;
both accounts submit transactions during deployment. Optionally create two more
wallets for the demo investors. Their public addresses are safe to configure,
but their private keys are not needed.

## 2. Configure the local deployment script

Copy the root template and fill the local `.env`:

```bash
cp .env.example .env
```

Required values:

| Variable | Purpose |
| --- | --- |
| `AMOY_RPC_URL` | Full Alchemy Polygon Amoy HTTPS URL |
| `DEPLOYER_PRIVATE_KEY` | Testnet-only issuer/admin key |
| `CUSTODIAN_PRIVATE_KEY` | Testnet-only reserve/custodian key |
| `DEMO_INVESTOR_1_ADDRESS` | First public demo wallet address |
| `DEMO_INVESTOR_2_ADDRESS` | Second public demo wallet address |
| `DEMO_API_URL` | Deployed Vercel origin, without a trailing slash |
| `DEMO_SEED_TOKEN` | Random secret shared with the deployed API |

The root template also contains the Vercel runtime variables so it is the
complete configuration reference. When copying values into Vercel, use only
the variables listed in step 3; `AMOY_RPC_URL`, both investor addresses, and
`DEMO_API_URL` are local deployment inputs.

Generate the seed token locally with `openssl rand -hex 32`. Store the same
value in the local `.env` and Vercel; do not expose it to the frontend.

## 3. Configure Vercel environment variables

Add these variables to the Vercel project for Production (and Preview only if
preview deployments should use the same demo infrastructure):

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | The public Vercel origin |
| `RPC_URL` | Full Alchemy Polygon Amoy HTTPS URL |
| `CHAIN_ID` | `80002` |
| `DEPLOYER_PRIVATE_KEY` | Same testnet-only deployer key |
| `CUSTODIAN_PRIVATE_KEY` | Same testnet-only custodian key |
| `TURSO_DATABASE_URL` | Turso database URL, usually beginning `libsql://` |
| `TURSO_AUTH_TOKEN` | Turso database auth token |
| `DEMO_SEED_TOKEN` | The random value generated in step 2 |

Redeploy Vercel after changing environment variables. The backend creates its
tables automatically on the first successful request.

## 4. Deploy and seed Amoy

Deploy the main `SGT999` stack first:

```bash
npm run deploy:amoy
```

The script deploys the contracts, registers a 1,000 gram reserve, mints 1,000
tokens, sends 100 and 75 tokens to the two demo investors, writes
`deployments/amoy.json`, and registers the records in Turso through the hosted
API.

Optionally deploy the second-purity product:

```bash
npm run deploy:amoy:sgt916
```

That adds `SGT916`, a 500 gram reserve, 200 minted tokens, and demo investor
holdings of 25 and 20 tokens.

The scripts are intentionally not idempotent on-chain. If a run fails after
deploying contracts, inspect the transaction history and output before running
it again; a retry creates a new contract stack.

If contract deployment succeeds but hosted API registration fails, preserve
`deployments/amoy.json`, fix the backend, and run this instead of redeploying:

```bash
npm run register:amoy
```

This command performs only the Turso/backend bookkeeping for the existing
contracts; it does not deploy, mint, transfer, or register identities on-chain.

## 5. Verify the hosted story

1. Open `/api/tokens` and confirm `SGT999` is returned.
2. Open the Reserve page and confirm the reserve and minted supply are visible.
3. Open Investor, select `SGT999`, and look up either configured investor
   address; it should show 100 g or 75 g.
4. Submit a small redemption request and confirm it appears as `PENDING`.
5. Show the How It Works page to explain the custody, tokenization, compliance,
   and redemption lifecycle.

## Demo boundary

This remains an interview POC, not a production RWA platform. Admin mutations
are not authenticated, privileged private keys are held by the backend, KYC is
a boolean demo registry, and the contracts are unaudited. Keep it on Amoy with
synthetic identities and no real customer or delivery data. Add authentication
or make the Admin page read-only before sharing the URL broadly.
