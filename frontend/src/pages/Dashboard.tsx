import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Vault, Coins, Scale, DollarSign, Package } from 'lucide-react';
import { api } from '../lib/api';
import { formatGrams, formatUsd, formatWeiToGrams, formatPurityBps, formatDate, reserveRatio } from '../lib/utils';
import type { Token, GoldBar, GoldPrice } from '../lib/types';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { HelpTooltip } from '../components/ui/Tooltip';

export default function Dashboard() {
  const [tokens,      setTokens]      = useState<Token[]>([]);
  const [selected,    setSelected]    = useState<Token | null>(null);
  const [bars,        setBars]        = useState<GoldBar[]>([]);
  const [reserveGrams, setReserveGrams] = useState<number>(0);
  const [price,       setPrice]       = useState<GoldPrice | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [tkns, pr] = await Promise.all([api.getTokens(), api.getPrice()]);
      setTokens(tkns);
      setPrice(pr);
      const first = tkns[0] ?? null;
      setSelected(s => s ?? first);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) return;
    api.getReserves(selected.address).then(r => {
      setBars(r.bars);
      setReserveGrams(r.summary?.totalActiveGrams ?? 0);
    }).catch(() => {});
    // Refresh token chain data (totalSupply)
    api.getToken(selected.address).then(t => {
      setSelected(t);
    }).catch(() => {});
  }, [selected?.address]);

  const totalSupplyGrams = selected?.totalSupply
    ? formatWeiToGrams(selected.totalSupply, selected.decimals)
    : 0;

  const ratio = selected?.totalSupply
    ? reserveRatio(selected.totalSupply, reserveGrams, selected.decimals)
    : 100;

  const priceNum = price ? parseFloat(price.pricePerGramUsd) : 0;

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Reserve Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time proof-of-reserve · every token is backed by physical gold
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tokens.length > 1 && (
            <select
              value={selected?.address ?? ''}
              onChange={e => setSelected(tokens.find(t => t.address === e.target.value) ?? null)}
              className="text-sm rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {tokens.map(t => (
                <option key={t.address} value={t.address}>{t.symbol} — {t.name}</option>
              ))}
            </select>
          )}
          <Button variant="secondary" size="sm" loading={refreshing} onClick={() => load(true)}>
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error} — backend may be offline
        </div>
      )}

      {tokens.length === 0 && !error ? (
        <EmptyState
          icon={<Vault size={24} />}
          title="No tokens deployed yet"
          body="Run the Hardhat deploy script and register the token via the Admin panel."
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              accent
              label="Gold in Vault"
              help="Total physical gold weight registered on-chain (active bars only). The smart contract blocks any mint that would exceed this amount — the reserve ratio can never drop below 100%."
              icon={<Vault size={18} />}
              value={formatGrams(reserveGrams)}
              sub={`${bars.filter(b => b.active).length} active bar${bars.filter(b => b.active).length !== 1 ? 's' : ''}`}
            />
            <StatCard
              accent
              label="Circulating Supply"
              help="Total tokens currently minted and held by investors, read live from the blockchain. Each token equals exactly 1 gram of gold at the specified purity standard."
              icon={<Coins size={18} />}
              value={`${totalSupplyGrams.toLocaleString()} ${selected?.symbol ?? ''}`}
              sub={`${selected?.purityStandard ?? '—'} purity`}
            />
            <StatCard
              label="Reserve Ratio"
              help="Vault weight ÷ circulating supply × 100. The smart contract enforces this can never drop below 100% at mint time. A ratio above 100% means the vault holds more gold than tokens issued."
              icon={<Scale size={18} />}
              value={
                <span className={ratio >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                  {ratio.toFixed(2)}%
                </span>
              }
              sub={ratio >= 100 ? '✓ Fully backed' : '⚠ Under-collateralised'}
            />
            <StatCard
              label="Gold Price"
              help="Manual USD/gram price set in Admin → Price tab. Used only for USD value display — has no effect on on-chain balances or compliance rules."
              icon={<DollarSign size={18} />}
              value={formatUsd(priceNum)}
              sub={`per gram · ${totalSupplyGrams > 0 ? formatUsd(totalSupplyGrams * priceNum) + ' total' : 'manual feed'}`}
            />
          </div>

          {/* Reserve ratio bar */}
          <Card>
            <CardBody className="py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 inline-flex items-center">
                  Reserve coverage
                  <HelpTooltip text="Visual ratio of vault gold to circulating token supply. Green = fully backed (≥ 100%). Red = undercollateralised — investigate immediately. The on-chain mint guard prevents this from happening during normal operations." />
                </span>
                <span className={`text-xs font-bold ${ratio >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {ratio.toFixed(4)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${ratio >= 100 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                {reserveGrams}g in vault · {totalSupplyGrams}g tokens in circulation · ratio must always be ≥ 100%
              </p>
            </CardBody>
          </Card>

          {/* Gold Bar Registry */}
          <Card>
            <CardHeader>
              <CardTitle>Gold Bar Registry <HelpTooltip text="All physical gold bars registered on-chain in the GoldReserve contract. Only active bars count toward the vault total used in the reserve ratio." /></CardTitle>
              <Badge variant="gray">{bars.length} bar{bars.length !== 1 ? 's' : ''}</Badge>
            </CardHeader>
            {bars.length === 0 ? (
              <EmptyState
                icon={<Package size={20} />}
                title="No bars registered"
                body="Register gold bars via the Admin panel to back your token supply."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-zinc-800">
                      {[
                        { label: 'Bar ID',     help: 'Unique identifier for the physical gold bar (e.g. GB-2024-001). Set by the custodian at registration and immutable.' },
                        { label: 'Weight',     help: 'Physical weight of the bar in grams. This amount is added to the vault total while the bar is active.' },
                        { label: 'Purity',     help: 'Gold purity in basis points. 9999 = 99.99% fine gold (999.9 standard). 9160 = 91.6% (916 standard / 22-karat).' },
                        { label: 'Vault',      help: 'ID of the secure vault facility where this bar is physically stored (e.g. Vault-SG-A).' },
                        { label: 'Assay Ref',  help: 'Reference number of the independent assay certificate that verifies this bar\'s weight and purity.' },
                        { label: 'Registered', help: 'Date and time the bar was registered on-chain via the GoldReserve smart contract.' },
                        { label: 'Status',     help: 'Active bars count in the vault total. Deactivating a bar reduces reserve headroom, limiting how many tokens can be minted.' },
                      ].map(({ label, help }) => (
                        <th key={label} className="text-left px-5 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                          <span className="inline-flex items-center gap-0.5">{label}<HelpTooltip text={help} /></span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bars.map((bar, i) => (
                      <tr
                        key={bar.barId}
                        className={`border-b last:border-0 border-stone-50 dark:border-zinc-800/50 hover:bg-stone-50 dark:hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-stone-50/40 dark:bg-zinc-800/20'}`}
                      >
                        <td className="px-5 py-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 font-medium">{bar.barId}</td>
                        <td className="px-5 py-3 text-zinc-900 dark:text-zinc-100">{bar.weightGrams.toLocaleString()}g</td>
                        <td className="px-5 py-3">
                          <Badge variant="gold">{formatPurityBps(bar.purityBps)}</Badge>
                        </td>
                        <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{bar.vaultId}</td>
                        <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{bar.assayRef ?? '—'}</td>
                        <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-xs whitespace-nowrap">{formatDate(bar.registeredAt)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={bar.active ? 'Active' : 'Inactive'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
