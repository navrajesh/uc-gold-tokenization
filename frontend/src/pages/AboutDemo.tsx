import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Coins,
  ExternalLink,
  Landmark,
  PackageCheck,
  Repeat2,
  ShieldCheck,
  UserRound,
  Vault,
} from 'lucide-react';
import flowIllustration from '../assets/gold-tokenization-flow.webp';

const STEPS = [
  {
    number: '01',
    title: 'Gold enters the vault',
    body: 'A custodian receives and verifies a physical gold bar.',
    Icon: Vault,
  },
  {
    number: '02',
    title: 'The reserve is registered',
    body: 'Weight, purity, vault, and assay details are recorded on-chain.',
    Icon: PackageCheck,
  },
  {
    number: '03',
    title: 'Tokens are minted',
    body: 'The contract allows issuance only up to the active reserve weight.',
    Icon: Coins,
  },
  {
    number: '04',
    title: 'Compliance travels with value',
    body: 'KYC and transfer rules are checked whenever tokens move.',
    Icon: ShieldCheck,
  },
  {
    number: '05',
    title: 'Tokens return to gold',
    body: 'Approved redemptions burn tokens as physical gold is released.',
    Icon: Repeat2,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <section className="overflow-hidden rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-6 sm:p-9 lg:p-10 flex flex-col justify-center">
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 pulse-gold" />
              Interactive proof of concept
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Physical gold, made verifiable and programmable
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-7 text-zinc-600 dark:text-zinc-300">
              This demo shows how vaulted gold can become a compliant digital token without losing the link to the underlying asset. One token represents one gram of registered gold.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-700 hover:bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                View proof of reserve <ArrowRight size={15} />
              </Link>
              <Link
                to="/investor"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
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
          <h2 className="mt-2 text-2xl font-bold text-zinc-950 dark:text-white">How the demo works</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            The physical asset and the digital supply stay connected from vault intake through investor redemption.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {STEPS.map(({ number, title, body, Icon }, index) => (
            <div key={number} className="relative">
              <article className="h-full rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
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

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-zinc-950 text-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">What it proves</p>
          <h2 className="mt-2 text-2xl font-bold">Trust comes from linked controls</h2>
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

        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Three participants</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-950 dark:text-white">Who does what?</h2>
          <div className="mt-5 space-y-4">
            {ACTORS.map(({ title, body, Icon }) => (
              <div key={title} className="flex gap-4 rounded-xl bg-stone-50 dark:bg-zinc-800/60 p-4">
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

      <section className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">This is a demonstration environment</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              It illustrates the operating model and contract controls. It is not a live investment product, custody service, price oracle, or substitute for legal, regulatory, and smart-contract review.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex flex-none items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Open admin controls <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
