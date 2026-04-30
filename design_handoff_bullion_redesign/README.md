# Handoff: Bullion — Gold Tokenizer Frontend Redesign

## Overview

This package contains a **role-aware redesign of the gold tokenizer dApp** (the existing repo's frontend currently has three generic tabs — Reserve / Admin / Investor). The redesign reorganizes the product around five first-class roles:

1. **Investor** — retail / institutional holders
2. **Issuer Admin** — operators of the tokenization platform
3. **Custodian** — vault operator (bar inventory + fulfillment)
4. **Auditor** — read-only compliance / reserves verification
5. **Public** — un-authenticated proof-of-reserve marketing surface

It introduces a hi-fi visual system ("editorial-luxury fintech") with an Instrument Serif + Inter + JetBrains Mono pairing, paper/ink theming, and ledger-grade tabular layouts. Every screen is interactive and fully laid out.

---

## About the Design Files

> **The HTML and JSX files in `designs/` are design references — prototypes showing intended look, layout, and behavior. They are NOT production code to copy directly.**

The designs were authored as inline-Babel React (single-page prototype with global components) so they could be presented in a design canvas. Your job is to **recreate these designs in the existing `frontend/` codebase** — adopting its framework (likely React/Vite based on the repo), its existing routing, its wallet/web3 plumbing, its API/contract clients, and any component primitives already in use.

If a pattern in this design conflicts with conventions already in the codebase, **prefer the codebase's convention** for plumbing (state, data fetching, routing) and adopt the design for visual + interaction layer.

## Fidelity

**High-fidelity.** All screens have:
- Final color tokens (oklch values — see Design Tokens)
- Final type ramp and font pairings
- Final spacing, radii, borders, shadows
- Realistic mocked content
- Working interactions (tabs, mode toggles, modal/wizard flows, theme toggle, density toggle)

Recreate visuals pixel-faithfully. Data sources, contract calls, and routing should follow the existing repo's patterns.

---

## How to View the Designs

Open `designs/Bullion Gold Tokenizer.html` directly in a browser. It uses CDN React + Babel and loads the JSX files at runtime — no build step. Pan/zoom around the canvas; click an artboard label to focus it fullscreen. Use the topbar to toggle theme (paper/ink) and density (comfortable/compact).

For a quick **flip-through with no setup**, open `screenshots/contact-sheet.html` — every screen rendered as a static image with role grouping. Good for sharing in Slack/email or presenting in a meeting where you don't want to live-demo. Static index also at `screenshots/INDEX.md`.

---

## Information Architecture

```
Public (no wallet required)
└── /                          Proof of Reserve marketing page

Investor (after wallet connect + KYC)
├── /investor                  Holdings dashboard
├── /investor/mint             Mint flow (USDC → GBAR)
├── /investor/redeem           Redeem wizard (4-step, GBAR → physical bar)
├── /investor/activity         Transaction history (tx ledger)
└── /investor/identity         ONCHAINID claims & KYC status

Issuer Admin
├── /admin                     Operations overview (KPIs, alerts)
├── /admin/redemptions         Redemption kanban (Pending / Approved / Fulfilled)
├── /admin/mint                Mint console (compliance pre-flight gate)
├── /admin/kyc                 KYC approval queue
├── /admin/price               Price oracle controls
└── /admin/registry            Token registry & supply controls

Custodian
├── /custodian/vault           Bar inventory (96 visual bar tiles)
├── /custodian/intake          New bar intake form
├── /custodian/fulfillment     FIFO fulfillment queue
└── /custodian/attestation     Quarterly Merkle-rooted attestations

Auditor
└── /auditor                   Read-only invariants (reconstructed from chain)

Mobile
└── Investor holdings + tab bar (other mobile screens TBD)
```

---

## Design Tokens

### Color (oklch)

```css
/* Paper (light) theme */
--paper:        oklch(0.985 0.003 80);   /* page bg */
--paper-2:      oklch(0.965 0.005 80);   /* card alt bg, sidebar bg */
--paper-3:      oklch(0.94  0.006 80);   /* hover, scale track */
--rule:         oklch(0.88  0.005 80);   /* default border */
--rule-strong:  oklch(0.78  0.005 80);   /* input border */
--ink:          oklch(0.20  0.012 60);   /* primary text */
--ink-2:        oklch(0.38  0.012 60);   /* secondary text */
--ink-3:        oklch(0.56  0.010 60);   /* tertiary, captions */
--ink-4:        oklch(0.72  0.008 60);   /* quaternary */

/* Bullion accent (champagne — NOT orange-amber) */
--bullion:      oklch(0.74  0.115 78);
--bullion-2:    oklch(0.66  0.130 70);   /* primary action fill */
--bullion-soft: oklch(0.94  0.040 85);   /* badge bg */
--bullion-line: oklch(0.84  0.080 80);   /* badge border */

/* Status */
--emerald:      oklch(0.62  0.130 155);
--emerald-soft: oklch(0.94  0.040 155);
--ruby:         oklch(0.58  0.180 25);
--ruby-soft:    oklch(0.94  0.045 25);
--azure:        oklch(0.55  0.140 240);
--azure-soft:   oklch(0.94  0.035 240);
```

The `[data-theme="ink"]` (dark) overrides are in `designs/design.css`. **Do not approximate with hex** — modern browsers handle `oklch()` natively and the perceptual uniformity matters for the bullion ramp.

### Typography

| Role | Family | Source | Use |
|---|---|---|---|
| Display | **Instrument Serif** (regular) | Google Fonts | Page titles, KPI numbers, marketing hero |
| UI | **Inter** (400/500/600/700) | Google Fonts | All body, buttons, labels |
| Mono | **JetBrains Mono** (400/500/600) | Google Fonts | Addresses, hashes, table numerics, tickers |

Type ramp:
- Page title: 38px Instrument Serif, weight 400, tracking -0.02em, line 1.05
- KPI number: 38px Instrument Serif (30px in compact density)
- Section title: 12px Inter 600, uppercase, 0.10em tracking
- Body: 13.5px Inter 400, line 1.5
- Eyebrow: 10px Inter 600, uppercase, 0.14em tracking
- Mono row: 12.5px JetBrains Mono with `'zero', 'ss01'` features
- Tabular numerals: `font-variant-numeric: tabular-nums` everywhere money/quantities appear

### Spacing & geometry

- Radii: `--radius-sm: 6px`, `--radius: 10px`, `--radius-lg: 14px`
- Gap scale: 8 / 12 / 16 / 24 (`.gap-2 .gap-3 .gap-4 .gap-6`)
- Page padding: 28px 32px 40px (compact: 22px 24px 30px)
- Card padding: 18px 20px (compact: 14px 16px)
- Sidebar: 248px (compact: 220px)
- Mobile frame: 390 × 844 (iPhone-class)

### Shadow

```css
--shadow-1: 0 1px 0 0 oklch(0 0 0 / 0.04), 0 1px 3px oklch(0 0 0 / 0.06);
--shadow-2: 0 1px 0 0 oklch(0 0 0 / 0.05), 0 8px 24px -8px oklch(0 0 0 / 0.10);
```

Use sparingly — most surfaces sit on hairline rules, not shadows.

### Iconography

A minimal handcrafted icon set lives in `designs/atoms.jsx` (`I.vault`, `I.coins`, `I.shield`, etc.). They're 24×24 stroke icons with `strokeWidth=1.6`. **You may swap these for an established library** (lucide-react / phosphor / heroicons) — match by semantic name and keep the stroke weight consistent.

---

## Reusable Components

These appear across the design — implement them once in your component library:

| Component | Key API | Where defined |
|---|---|---|
| `KPI` | `label, num, unit, sub, deltaPct, sparkData` | `atoms.jsx` |
| `Badge` | `tone: ok\|danger\|azure\|bullion\|ink\|ghost`, `dot` | `atoms.jsx` |
| `StatusBadge` | normalizes redemption/KYC/order statuses | `atoms.jsx` |
| `Sparkline` | inline SVG, no library | `atoms.jsx` |
| `Addr` | truncated mono address pill | `atoms.jsx` |
| `Eyebrow` | uppercase label with bullion dot | `atoms.jsx` |
| Coverage Bar | reserve ratio with target marker | `design.css` `.coverage` |
| Bar Row | gold-bar glyph + serial + meta | `design.css` `.bar-row` + `.bar-glyph` |
| Donut | `--p` (percent) + `--c` (color) custom-prop chart | `design.css` `.donut` |
| Steps | wizard progress with done/active states | `design.css` `.steps`/`.step` |
| Ledger table | uppercase 10px header, mono numerics | `design.css` `.ledger` |
| Sidebar nav | role card + section + nav-item w/ keyboard letter dot | `shell.jsx` |
| Topbar | breadcrumbs + ticker strip + theme/density toggles | `shell.jsx` |

The bar glyph (`.bar-glyph`) is a CSS-only repeating-gradient that reads as a stylized gold bar. **Do not replace with an emoji or stock image.**

---

## Screens — Detailed Specs

> Each section describes layout in flex/grid terms, exact components, and behavior. See the matching `designs/screens-*.jsx` file for the source of truth.

### Public — Proof of Reserve (`screens-public.jsx`)

**Purpose:** Trust surface. Anyone can verify gold backing without a wallet.

**Layout (top to bottom):**
1. **Hero band** (full bleed) — eyebrow "Live attestation · Updated 4 min ago", display headline (Instrument Serif, 64px, max-width 14ch): "Every token, fully backed. Verifiable on-chain." Right column: oversized coverage bar showing 100.00% backing with a vertical target line at 100%, plus 4 inline stats (Tokens, Reserves, Bars, Vaults).
2. **Vault distribution** — 3-column grid of donuts (Brinks Zürich / Loomis NYC / Malca-Amit Singapore), each with location, weight (kg), and bar count.
3. **Bar registry** (sample) — 4 `.bar-row` items showing serial / refiner / weight / purity / vault / on-chain hash. CTA: "View all 96 bars →"
4. **On-chain event stream** — last 10 mint/redeem events as `.ledger` table; tx hash links out to block explorer.
5. **Quarterly attestations** — list of 4 PDF links with auditor (Bureau Veritas), date, Merkle root.
6. **Footer** — minimal: contract addresses, links, copyright.

**Interactions:** Donut hover shows allocation. Bar row click opens detail drawer. Event row click opens explorer in new tab.

**Critical:** This page exists nowhere in the current repo — it's the highest-impact addition. Lead with it.

---

### Investor — Holdings (`screens-investor.jsx` → `InvestorHoldings`)

**Purpose:** Show current GBAR balance, equivalent gold weight, USD value, and primary actions.

**Layout:**
- Page header: serif h1 "Holdings" + page-sub
- KPI grid (4 cols on desktop): Total GBAR / Gold weight (oz/g) / USD value / 24h delta with sparkline
- Two-column row: Live spot price card (XAU/USD with sparkline), Action card (Mint / Redeem / Send buttons, bullion fill on Mint)
- Allocation card: donut showing vault distribution of *user's* allocated bars
- "Your bars" — `.bar-row` list of bars allocated to this wallet
- Recent activity — last 5 rows of `.ledger`

**Interactions:** Mint button → /investor/mint; Redeem → wizard.

---

### Investor — Mint flow (`screens-investor.jsx` → `InvestorMint`)

**Purpose:** Convert USDC (or fiat ramp) to GBAR.

**Layout:**
- 4-step indicator: Amount → Compliance check → Confirm → Receipt
- Left column: input card with USDC amount, conversion preview (USDC → oz → GBAR), gas estimate, slippage
- Right column: Compliance summary (KYC ✓, jurisdiction ✓, wallet cap available, daily mint cap)
- Bottom: full-width review row with bullion `Mint X GBAR` button

**State:** local form state. On submit show signing modal then receipt with tx hash + add-to-wallet button.

---

### Investor — Redeem wizard (`screens-investor.jsx` → `InvestorRedeem`)

**Purpose:** Burn GBAR, receive physical gold (delivery or vault pickup).

**Steps (4):**
1. **Amount** — slider + input (with min-bar threshold warning). Shows "this will allocate ~2 bars (1 × 1kg + 1 × 100g)".
2. **Bar allocation preview** — `.bar-row` list of FIFO-selected bars with serials/refiners.
3. **Delivery** — radio: Vault transfer (free) / Insured shipping (form: address, ID upload).
4. **Review & sign** — irreversibility warning (ruby badge), `Burn X GBAR` danger-toned button.

**Interactions:** Step changes via Next/Back; back is allowed except after burn. Show signing state on step 4 submit.

---

### Investor — Activity (`screens-investor.jsx` → `InvestorActivity`)

**Purpose:** Full transaction ledger.

**Layout:** Filter row (type, date range, status) → `.ledger` table (Date / Type / Amount / Counterparty / Status / Tx hash). Pagination at bottom.

---

### Investor — Identity (`screens-investor.jsx` → `InvestorIdentity`)

**Purpose:** Show ONCHAINID claims (KYC, AML, accredited investor, jurisdiction).

**Layout:**
- ONCHAINID address card (mono address + copy)
- Claim cards (4): each shows claim type, issuer, issued date, expiry, status badge
- Pending invitations / required attestations section

---

### Issuer Admin — Operations (`screens-admin.jsx` → `AdminOps`)

**Purpose:** At-a-glance operating metrics + alerts.

**Layout:**
- KPI grid (4): 24h Mint volume / 24h Redeem volume / Reserve ratio / Pending redemptions
- Two-column: Reserve coverage bar (large) | Alerts list (oracle drift, KYC backlog, custodian heartbeat)
- Activity feed (recent 10 admin-relevant events)

---

### Issuer Admin — Redemption kanban (`screens-admin.jsx` → `AdminRedemptions`)

**Purpose:** Replace the redemption table with a workflow.

**Layout:** 3-column kanban (Pending review / Approved / Fulfilled). Each card shows requester, amount, allocated bars, age, action button. Drag/move is visual-only in the prototype — wire it to actual state transitions in your app.

**Critical:** Approval action triggers backend signing and notifies custodian; fulfillment marks burn complete.

---

### Issuer Admin — Mint console (`screens-admin.jsx` → `AdminMint`)

**Purpose:** Programmatic mint with **pre-flight compliance gate**.

**Layout:**
- Form: recipient address, amount
- Pre-flight checklist (5 gates, each turns green/red live as you type):
  - KYC verified
  - Country eligible
  - Wallet cap available
  - Above minimum mint
  - Reserve cap not exceeded
- `Sign & mint` button is **disabled** until all 5 are green

This is the most important admin UX win — currently the repo just exposes the raw mint call.

---

### Issuer Admin — KYC queue (`screens-admin.jsx` → `AdminKYC`)

**Purpose:** Approve/reject identity claims.

**Layout:** Filterable list of pending applicants (name, country, doc type, submitted at). Click row → drawer with documents and approve/reject actions. Decision writes ONCHAINID claim.

---

### Issuer Admin — Price oracle (`screens-admin.jsx` → `AdminPrice`)

**Purpose:** Configure and monitor the gold price feed.

**Layout:** Current price card with sparkline / Source list (Chainlink XAU/USD, manual override) / Update history ledger.

---

### Issuer Admin — Token registry (`screens-admin.jsx` → `AdminRegistry`)

**Purpose:** Manage token contract parameters.

**Layout:** Contract metadata card (address, decimals, total supply, paused state) → Cap table → Pause/unpause action (bullion-tone confirmation modal).

---

### Custodian — Vault inventory (`screens-custodian.jsx` → `CustodianVault`)

**Purpose:** Visual map of every bar.

**Layout:**
- Filters (vault, refiner, status: free/allocated/in-transit, weight class)
- Grid of 96 `.bar-glyph` tiles (~120px wide). Allocated bars dimmed; in-transit get azure border. Click a tile → detail drawer (serial, refiner, weight, purity, allocation history).
- Footer summary: total weight kg, count, avg purity.

---

### Custodian — Intake (`screens-custodian.jsx` → `CustodianIntake`)

**Purpose:** Register a new bar.

**Layout:** Form (serial, refiner, weight, purity, vault, photo upload, assay cert upload) → preview card → Submit. Submission writes the bar on-chain and updates the proof-of-reserve Merkle root.

---

### Custodian — Fulfillment queue (`screens-custodian.jsx` → `CustodianFulfillment`)

**Purpose:** Work queue for approved redemptions (FIFO bar allocation).

**Layout:** Table of approved redemptions with proposed bar allocation; custodian confirms allocation and triggers shipment / vault transfer.

---

### Custodian — Attestation (`screens-custodian.jsx` → `CustodianAttestation`)

**Purpose:** Generate quarterly attestation.

**Layout:** Period selector → bar list (snapshot) → Merkle root preview (mono) → Auditor selector → Export PDF button + Publish on-chain button.

---

### Auditor (`screens-admin.jsx` → reused panel)

**Purpose:** Read-only verification.

**Layout:** Big invariant cards: "Σ(token supply) ≤ Σ(bar weight × purity)" / "all bars referenced by Merkle root match on-chain registry" / "no bar allocated to >1 redemption" — each green/red with last-checked timestamp.

---

### Mobile (`screens-mobile.jsx`)

iPhone 390×844 frame showing:
- Status bar (mock)
- Holdings card with KPI hero
- Bar allocation preview
- 4-tab bottom bar: Holdings / Mint / Activity / Identity

Mint and redeem mobile screens are TBD — design pattern: full-screen wizard, one step per screen, sticky bottom action.

---

## Interactions & Behavior

| Behavior | Where | Notes |
|---|---|---|
| Theme toggle | Topbar sun/moon | Sets `data-theme="ink"` on `.shell`. Persist in localStorage. |
| Density toggle | Topbar | Toggles `.compact` class on `.shell`. |
| Role switch | Sidebar role card | Resets nav state. |
| Tab/section nav | Sidebar `.nav-item` | Use real router; active state is `.active` class. |
| Mint/Redeem flows | Multi-step | Maintain step state; allow Back except after on-chain commit. |
| Wallet connect | Topbar (replace mock) | Hook into existing wagmi/viem/web3 setup in repo. |
| Kanban drag | Admin redemptions | Visual only in prototype — implement with dnd-kit or similar; status transitions go through your existing approval API. |
| Form validation | Mint, Intake, Redeem | Inline below field, `--ruby` border on invalid; submit disabled. |
| Address copy | `Addr` component | Click copies; show 1.5s "Copied" badge. |

---

## State Management

Match the repo's existing pattern. Likely needs:

- **Wallet/auth state** — connected address, role, KYC status, ONCHAINID — global.
- **Token state** — balance, total supply, reserve ratio — server cache (react-query or similar) with on-chain event invalidation.
- **Form state** — local component state per wizard.
- **Theme + density** — localStorage-persisted UI state.
- **Pending tx queue** — toasts at top-right; wire to existing tx infrastructure.

---

## Assets

No external image assets are required. All visuals are CSS-only (bar glyphs, donuts, sparklines). Fonts come from Google Fonts via `@import` in `designs/design.css` — copy that import into your global stylesheet, or add equivalent `<link>` tags / font self-hosting per your repo's convention.

If you want a brand mark, the sidebar logo is a 30px CSS radial-gradient circle (`.sidebar-brand .mark`). Consider commissioning a real mark before launch.

---

## Files in This Bundle

```
design_handoff_bullion_redesign/
├── README.md                           ← this file
├── CLAUDE_CODE_PROMPT.md               ← paste-ready kickoff prompt for Claude Code
├── screenshots/
│   ├── contact-sheet.html              ← static visual index (open in browser)
│   ├── INDEX.md                        ← markdown index of every screen
│   └── *.png                           ← 22 per-screen images (00–19)
└── designs/
    ├── Bullion Gold Tokenizer.html     ← entry point (open in browser)
    ├── design.css                       ← all design tokens + component CSS
    ├── design-canvas.jsx                ← canvas frame, ignore for production
    ├── app.jsx                          ← top-level mount + canvas wiring
    ├── shell.jsx                        ← sidebar + topbar + role switch
    ├── atoms.jsx                        ← icons, KPI, Badge, Sparkline, Addr, Eyebrow
    ├── screens-public.jsx               ← Proof of Reserve marketing page
    ├── screens-investor.jsx             ← Holdings, Mint, Redeem, Activity, Identity
    ├── screens-admin.jsx                ← Ops, Redemptions, Mint console, KYC, Price, Registry, Auditor
    ├── screens-custodian.jsx            ← Vault, Intake, Fulfillment, Attestation
    └── screens-mobile.jsx               ← iOS-frame holdings view
```

---

## Recommended Implementation Order

If you implement incrementally, this order maximizes user-facing value early:

1. **Design tokens + base styles** (port `design.css` into your CSS pipeline / Tailwind config / styled-components theme).
2. **Shared atoms** (`KPI`, `Badge`, `Addr`, `Sparkline`, `Eyebrow`, ledger table styles, bar glyph) — every screen uses these.
3. **Shell** (sidebar + topbar + theme toggle + role-aware navigation, replacing the current 3-tab layout).
4. **Investor Holdings** — primary user lands here.
5. **Public Proof of Reserve page** — biggest trust win, shippable independently.
6. **Investor Mint + Redeem** — the core value flows.
7. **Issuer Admin: Redemption kanban + Mint console** — the operational uplift.
8. **Custodian + Auditor** — completes the role surface.
9. **Mobile** — once desktop is solid.

Each chunk can be a separate PR. Don't try to ship the whole thing at once.

---

## Open Questions for the Implementer

These were not specified in the source repo and need product decisions:

- Auth model: separate role accounts, or a single wallet that's granted multiple roles via on-chain attestation?
- Custodian vs Issuer separation: are these the same entity in your initial deployment? If so, you can collapse to one admin role for v1.
- Auditor identity: ONCHAINID claim issuer, or a separate `Ownable` role on the contract?
- Mobile parity: launch desktop-only, or treat mobile as v1?
- Real iconography: keep the inline `I.*` set, or adopt a library? Decide before scaling component count.

---

*Generated as a design handoff package. Open `designs/Bullion Gold Tokenizer.html` for the live prototype.*
