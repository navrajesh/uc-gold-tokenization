import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  Building2,
  CheckCircle2,
  Coins,
  Database,
  ExternalLink,
  Landmark,
  MonitorSmartphone,
  PackageCheck,
  Repeat2,
  ServerCog,
  ShieldCheck,
  UserRound,
  Vault,
} from 'lucide-react';
import flowIllustration from '../assets/gold-tokenization-flow.webp';

const STEPS = [
  {
    number: '01',
    title: 'Gold enters the vault',
    body: 'The custodian validates the bar, assay reference, weight, purity, and vault assignment before any chain write.',
    Icon: Vault,
  },
  {
    number: '02',
    title: 'The reserve is registered',
    body: 'GoldReserve.registerBar() stores immutable bar metadata and increments the active reserve weight on-chain.',
    Icon: PackageCheck,
  },
  {
    number: '03',
    title: 'Tokens are minted',
    body: 'GoldToken.mint() enforces totalSupply + amount ≤ activeReserve × 10¹⁸ before issuing ERC-20 units.',
    Icon: Coins,
  },
  {
    number: '04',
    title: 'Compliance travels with value',
    body: 'Every transfer checks IdentityRegistry, then AND-gates the country, wallet-cap, and minimum-transfer modules.',
    Icon: ShieldCheck,
  },
  {
    number: '05',
    title: 'Tokens return to gold',
    body: 'Workflow states live in Turso; fulfillment calls GoldToken.fulfillRedemption(), burns supply, and stores the receipt hash.',
    Icon: Repeat2,
  },
] as const;

const TECH_LAYERS = [
  {
    label: 'Client',
    title: 'React 19 + Vite',
    body: 'Typed API client, responsive operator views, and server-mediated balance reads. No RPC credential is shipped to the browser.',
    detail: 'Tailwind CSS v4 · same-origin /api',
    Icon: MonitorSmartphone,
  },
  {
    label: 'Application',
    title: 'Express + TypeScript',
    body: 'Coordinates validation, signer-backed writes, receipt handling, chain reads, and the off-chain workflow state machine.',
    detail: 'Express 4 · ethers v6 · Drizzle ORM',
    Icon: ServerCog,
  },
  {
    label: 'Settlement',
    title: 'Polygon Amoy',
    body: 'Solidity contracts enforce supply, identity, compliance, reserve, and burn invariants on a public EVM testnet.',
    detail: 'Chain 80002 · Solidity 0.8.24',
    Icon: Blocks,
  },
  {
    label: 'Persistence',
    title: 'Turso / libSQL',
    body: 'Stores token discovery metadata, country codes, bar references, prices, and redemption lifecycle records.',
    detail: 'Remote libSQL · SQLite locally',
    Icon: Database,
  },
] as const;

const CONTRACTS = [
  ['GoldToken', 'UUPS/ERC-1967 token proxy. Enforces the reserve ceiling at mint and burns units during fulfillment.'],
  ['GoldReserve', 'Registers physical bars and exposes the total weight of active reserves to GoldToken.'],
  ['IdentityRegistry', 'Maintains the on-chain wallet verification state checked before compliant transfers.'],
  ['ModularCompliance', 'Runs every bound module with AND semantics; one failed rule rejects the transfer.'],
  ['Compliance modules', 'CountryRestrictions, MaxWalletBalance, and MinTransferAmount remain independently configurable.'],
] as const;

const EXECUTION_PATHS = [
  {
    title: 'Write path',
    body: 'Reserve, identity, mint, and fulfillment operations are signed by role-specific backend wallets. The API waits for the transaction receipt before persisting its metadata.',
  },
  {
    title: 'Read path',
    body: 'Turso discovers token records; ethers enriches them with live supply, balance, and reserve values. Reserve reads can fall back to stored data if RPC access fails.',
  },
  {
    title: 'Redemption path',
    body: 'PENDING and APPROVED are application states. FULFILLED is anchored on-chain by the burn transaction and linked back to the database by its transaction hash.',
  },
] as const;

const ACTORS = [
  {
    title: 'Issuer / Admin',
    body: 'Deploys the token, manages KYC, mints within the reserve limit, and reviews redemptions.',
    Icon: Building2,
  },
  {
    title: 'Custodian',
    body: 'Holds the physical gold, registers bars, and fulfills approved redemptions.',
    Icon: Landmark,
  },
  {
    title: 'Investor',
    body: 'Holds compliant gold tokens, checks balances, and requests physical redemption.',
    Icon: UserRound,
  },
] as const;

const PROOFS = [
  {
    title: 'Provable backing',
    body: 'Every active bar contributes to the on-chain reserve. Minting beyond that reserve is rejected by the token contract.',
  },
  {
    title: 'Programmable compliance',
    body: 'Identity verification, country restrictions, wallet caps, and minimum transfer sizes are enforced in the transaction path.',
  },
  {
    title: 'Complete asset lifecycle',
    body: 'The demo connects custody, issuance, investor ownership, transfer controls, redemption, and token burning.',
  },
] as const;

export default function AboutDemo() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      <section className="premium-card overflow-hidden rounded-3xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-6 sm:p-9 lg:p-10 flex flex-col justify-center">
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-amber-300/50 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] font-bold text-amber-800 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 pulse-gold" />
              Interactive proof of concept
            </div>
            <h1 className="display-title mt-5 text-4xl sm:text-5xl font-semibold leading-[1.05] text-zinc-950 dark:text-white">
              Physical gold, made verifiable and programmable
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-7 text-zinc-600 dark:text-zinc-300">
              This demo shows how vaulted gold can become a compliant digital token without losing the link to the underlying asset. One token represents one gram of registered gold.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/"
                className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-zinc-950 transition-all"
              >
                View proof of reserve <ArrowRight size={15} />
              </Link>
              <Link
                to="/investor"
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 transition-all"
              >
                Explore investor flow <ExternalLink size={14} />
              </Link>
            </div>
          </div>
          <div className="relative min-h-64 lg:min-h-[390px] bg-zinc-950 overflow-hidden">
            <img
              src={flowIllustration}
              alt="A gold bar in a secure vault connected through a compliance shield to a digital gold token, with arrows showing tokenization and redemption"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/25 via-transparent to-transparent lg:from-zinc-950/10" />
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">The lifecycle</p>
          <h2 className="display-title mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">How the demo works</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            The physical asset and the digital supply stay connected from vault intake through investor redemption.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {STEPS.map(({ number, title, body, Icon }, index) => (
            <div key={number} className="relative">
              <article className="premium-card h-full rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{number}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{body}</p>
              </article>
              {index < STEPS.length - 1 && (
                <ArrowRight
                  size={15}
                  className="hidden md:block absolute z-10 -right-2.5 top-1/2 -translate-y-1/2 text-amber-500"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="max-w-3xl">
          <p className="page-eyebrow">Engineering architecture</p>
          <h2 className="display-title mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Where each responsibility lives</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            The application separates user experience, workflow orchestration, immutable settlement, and queryable operational records. The chain owns financial invariants; the database owns workflow context.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TECH_LAYERS.map(({ label, title, body, detail, Icon }, index) => (
            <div key={title} className="relative">
              <article className="premium-card h-full rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl border border-amber-200/60 bg-amber-50/80 text-amber-700 flex items-center justify-center dark:border-amber-400/10 dark:bg-amber-400/[0.07] dark:text-amber-300">
                    <Icon size={18} />
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">0{index + 1}</span>
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">{label}</p>
                <h3 className="mt-1.5 text-base font-semibold text-zinc-950 dark:text-zinc-100">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{body}</p>
                <p className="mt-4 border-t border-stone-200/70 pt-3 font-mono text-[10px] leading-4 text-zinc-400 dark:border-white/[0.06] dark:text-zinc-500">{detail}</p>
              </article>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="premium-card rounded-3xl overflow-hidden">
            <div className="border-b border-stone-100/80 px-5 py-4 dark:border-white/[0.06]">
              <p className="page-eyebrow">Contract topology</p>
              <h3 className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-100">ERC-3643-inspired control plane</h3>
            </div>
            <div className="divide-y divide-stone-100/80 dark:divide-white/[0.06]">
              {CONTRACTS.map(([name, body]) => (
                <div key={name} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[145px_1fr] sm:gap-4">
                  <code className="text-xs font-semibold text-amber-800 dark:text-amber-300">{name}</code>
                  <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="luxury-panel rounded-3xl p-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">Runtime behavior</p>
            <h3 className="display-title mt-2 text-2xl font-semibold">Transaction boundaries</h3>
            <div className="mt-5 space-y-5">
              {EXECUTION_PATHS.map(({ title, body }, index) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 font-mono text-[10px] text-amber-300">{index + 1}</span>
                  <div>
                    <h4 className="text-sm font-semibold">{title}</h4>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-[11px] leading-5 text-amber-100/80">
              Engineering caveat: chain and database writes are not atomic. Production hardening requires idempotency, reconciliation jobs, durable queues, and managed key custody.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="luxury-panel rounded-3xl text-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">What it proves</p>
          <h2 className="display-title mt-2 text-3xl font-semibold">Trust comes from linked controls</h2>
          <div className="mt-6 space-y-5">
            {PROOFS.map(({ title, body }) => (
              <div key={title} className="flex gap-3">
                <CheckCircle2 size={19} className="mt-0.5 flex-none text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs sm:text-sm leading-6 text-zinc-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Three participants</p>
          <h2 className="display-title mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Who does what?</h2>
          <div className="mt-5 space-y-4">
            {ACTORS.map(({ title, body, Icon }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50/70 dark:bg-white/[0.025] p-4">
                <div className="h-9 w-9 flex-none rounded-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Icon size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-300/40 dark:border-amber-500/15 bg-gradient-to-br from-amber-50 to-white/70 dark:from-amber-500/[0.07] dark:to-white/[0.02] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">This is a demonstration environment</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              It illustrates the operating model and contract controls. It is not a live investment product, custody service, price oracle, or substitute for legal, regulatory, and smart-contract review.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex flex-none items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-amber-200 px-5 py-3 text-sm font-semibold text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
          >
            Open admin controls <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
