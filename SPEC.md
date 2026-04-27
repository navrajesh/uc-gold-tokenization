# Gold Tokenization — Simple Spec Summary

---

## The Players

| Role | Who they are | What they do |
|---|---|---|
| **Issuer / Admin** | The gold tokenization company | Deploys the system, sets rules, manages KYC approvals |
| **Custodian** | Physical gold vault operator (e.g. Brink's) | Holds the real gold, registers bars, fulfills redemptions |
| **Investor** | KYC-verified buyer | Buys, holds, transfers, and redeems gold tokens |
| **Compliance** | Embedded in smart contract | Automatically enforces rules on every transfer — no human needed |

---

## The Core Idea

> 1 token = 1 gram of physical gold sitting in a vault.
> Every token in circulation is backed by a real, registered gold bar.
> The token is proof of ownership. Redeeming it gives you the physical gold.

---

## Flow 1 — Platform Setup (Admin, one-time)

```
Admin deploys the smart contract
  → Sets token name (e.g. "Singapore Gold Token"), symbol "SGT"
  → Sets purity standard (e.g. 999.9 fine gold)
  → Configures compliance rules:
       - Which countries are allowed to invest
       - Max tokens any single wallet can hold
       - Minimum transfer amount (e.g. 1 gram)
  → Assigns the Custodian wallet address
```

---

## Flow 2 — Gold Goes Into the Vault (Custodian)

```
Custodian physically receives a gold bar
  → Logs it on the platform:
       Bar ID: GB-2024-001
       Weight: 1,000 grams
       Purity: 999.9
       Vault: Singapore Vault A
       Assay certificate: ASSAY-SG-001
  → This gets recorded on-chain as proof of physical backing
  → Admin reviews and approves the bar registration
```

---

## Flow 3 — Tokens Are Minted (Admin + Custodian)

```
Gold bar is now registered (1,000 grams)
  → Admin mints 1,000 tokens to the Issuer wallet
  → These tokens represent the 1,000 grams of real gold
  → No more tokens can be minted than the total gold in the vault
     (contract enforces: tokens issued ≤ total registered gold weight)
```

---

## Flow 4 — Investor Onboarding / KYC (Admin + Investor)

```
Investor wants to buy gold tokens
  → Submits KYC details: name, country, wallet address
  → Admin verifies and approves in the system
  → Investor wallet is now whitelisted on-chain
  → Without this step, the investor CANNOT receive tokens
     (the smart contract blocks transfers to unverified wallets)
```

---

## Flow 5 — Investor Buys Tokens — Primary Market (Admin → Investor)

```
Off-chain: Investor pays the Issuer (bank transfer, fiat)
  → Current gold price: $85.00/gram
  → Investor pays $8,500 → should receive 100 tokens (100g)

On-chain: Admin transfers 100 tokens to Investor wallet
  → Smart contract checks automatically:
       ✓ Is the investor's wallet KYC verified?
       ✓ Is the investor's country allowed?
       ✓ Would this put them over the max wallet limit?
       ✓ Is the amount above the minimum transfer?
  → All checks pass → transfer goes through
  → Investor now holds 100 SGT = 100g of gold
```

> **Note:** In this POC the fiat payment is off-chain. The on-chain action is the token transfer.

---

## Flow 6 — Investor Sells Tokens — Secondary Market (Investor → Investor)

```
Investor A wants to sell 50g to Investor B
  → Both must be KYC verified
  → Investor A initiates transfer in the app
  → App does a compliance pre-check:
       ✓ Investor A has enough balance
       ✓ Investor B is KYC verified
       ✓ Investor B won't exceed max wallet limit after receiving
       ✓ Both countries are on the allowed list
       ✓ 50g is above the minimum transfer amount
  → Pre-check passes → Investor A signs with their wallet (MetaMask)
  → Transfer is executed on-chain
  → If any check fails, the transaction is blocked with a clear reason
```

> **Note:** Fiat settlement between investors happens off-chain (e.g. bank transfer, agreed price).

---

## Flow 7 — Investor Redeems Tokens for Physical Gold (Investor → Custodian)

```
Investor wants to convert tokens back to real gold

Step 1 — Investor submits redemption request:
  → "I want to redeem 100 tokens (100g)"
  → Provides delivery address / collection instructions
  → Status: PENDING

Step 2 — Admin reviews and approves:
  → Checks investor's KYC is still valid
  → Confirms delivery logistics with custodian
  → Status: APPROVED

Step 3 — Custodian fulfills the physical delivery:
  → Ships or prepares gold for collection
  → Marks fulfillment on the platform
  → 100 tokens are BURNED on-chain (permanently destroyed)
  → Status: FULFILLED

Result:
  → Investor has real gold, tokens are gone
  → Total token supply decreases by 100
  → Reserve ratio stays 1:1 (less gold in vault = fewer tokens)
```

---

## The Reserve Dashboard (Public / Transparent)

At any time, anyone can see:

```
Total gold in vault:    2,450 grams  (across 3 registered bars)
Total tokens in supply: 2,450 SGT
Reserve ratio:          100%  ← must always be ≥ 100%

Bar Registry:
  GB-2024-001  |  1,000g  |  999.9  |  Vault SG-A  |  ASSAY-001  |  Active
  GB-2024-002  |  1,000g  |  999.9  |  Vault SG-A  |  ASSAY-002  |  Active
  GB-2024-003  |    450g  |  916.0  |  Vault SG-B  |  ASSAY-003  |  Active
```

This is the proof-of-reserve — the core trust mechanism of the whole system.

---

## What Happens If Rules Are Broken

| Scenario | Who it stops | How |
|---|---|---|
| Unverified investor tries to receive tokens | Investor | Smart contract reverts the transaction |
| Investor in a blocked country tries to transfer | Investor | Compliance module rejects on-chain |
| Transfer would put receiver over the wallet cap | Investor | Compliance module rejects on-chain |
| Custodian tries to mint more tokens than gold in vault | Custodian | Contract checks total supply vs registered weight |
| Admin tries to burn tokens not in their possession | Admin | ERC-20 standard prevents it |

---

## Two-Token Demo

| Token | Symbol | Purity | Use case |
|---|---|---|---|
| Singapore Fine Gold | SGT999 | 999.9 | Investment grade, strict KYC |
| Singapore Gold | SGT916 | 916.0 | Broader market, lower price point |

Both run on the same platform with separate compliance configurations.

---

## Design Decisions Summary

| # | Decision | Choice |
|---|---|---|
| Token unit | What 1 token represents | 1 gram of gold |
| Bar model | How physical gold maps to tokens | Pooled fungible (all bars → one token supply) |
| Redemption | How much of the lifecycle is in scope | Full: request → approve → burn → deliver |
| Compliance | Which rules are enforced on-chain | Country restrictions + max wallet cap + min transfer amount |
| Custodian | How the custodian role is modelled | Separate role in backend with own UI section |
| Price feed | How gold price is maintained | Manual admin update; interface ready for Chainlink swap |
| Multi-token | Single or multiple token deployments | Dynamic — demo with 2 tokens (999.9 + 916) |
| KYC data | What investor identity data is stored | Wallet address + country code + verified status |
| Codebase | Where the project lives | Fresh repo: `uc-gold-tokenization` |
