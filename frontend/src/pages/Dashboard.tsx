import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { formatGrams, formatUsd, formatWeiToGrams, formatPurityBps, formatRelativeTime, shortAddress } from '../lib/utils';
import type { Token, GoldBar, GoldPrice, Redemption } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { KPI } from '../components/ui/KPI';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Donut } from '../components/ui/Donut';
import { Ingot } from '../components/ui/Ingot';

const SUPPLY_SPARK = [10, 12, 11, 15, 14, 16, 18, 17, 19, 22, 21, 24, 23, 26, 28, 27];

interface VaultGroup { id: string; grams: number; bars: number; }

export default function Dashboard() {
  const [token,      setToken]      = useState<Token | null>(null);
  const [bars,       setBars]       = useState<GoldBar[]>([]);
  const [price,      setPrice]      = useState<GoldPrice | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [tkns, pr] = await Promise.all([api.getTokens(), api.getPrice()]);
      setPrice(pr);
      const base = tkns[0] ?? null;
      if (base) {
        const [enriched, res, rdms] = await Promise.all([
          api.getToken(base.address),
          api.getReserves(base.address),
          api.getRedemptions(base.address),
        ]);
        setToken(enriched);
        setBars(res.bars);
        setRedemptions(rdms);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeBars       = bars.filter(b => b.active);
  const reserveGrams     = activeBars.reduce((s, b) => s + b.weightGrams, 0);
  const totalSupplyGrams = token?.totalSupply ? formatWeiToGrams(token.totalSupply, token.decimals ?? 18) : 0;
  const ratio            = totalSupplyGrams > 0 ? (reserveGrams / totalSupplyGrams) * 100 : 100;
  const headroom         = reserveGrams - totalSupplyGrams;
  const priceNum         = price ? parseFloat(price.pricePerGramUsd) : 0;

  // Group active bars by vault
  const vaultGroups: VaultGroup[] = [];
  activeBars.forEach(bar => {
    const existing = vaultGroups.find(v => v.id === bar.vaultId);
    if (existing) { existing.grams += bar.weightGrams; existing.bars += 1; }
    else vaultGroups.push({ id: bar.vaultId, grams: bar.weightGrams, bars: 1 });
  });

  const lastBar = [...activeBars].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())[0];
  const lastAttestHours = lastBar ? Math.round((Date.now() - new Date(lastBar.registeredAt).getTime()) / 3_600_000) : null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13, gap: 10 }}>
        <div className="loading-ring" /> Loading reserve data…
      </div>
    );
  }

  return (
    <div className="main-pad">
      {/* Hero */}
      <div>
        <Eyebrow>Live · refreshed on demand</Eyebrow>
        <h1 className="page-title">Every gram, fully accounted.</h1>
        <p className="page-sub">
          Bullion publishes its reserve ratio in real time, on‑chain. Token supply can never exceed registered vault weight — the smart contract reverts the mint. This page is open: no wallet, no login, just the ledger.
        </p>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: '10px 16px', background: 'var(--ruby-soft)', border: '1px solid color-mix(in oklch, var(--ruby) 40%, transparent)', borderRadius: 'var(--radius)', color: 'var(--ruby)', fontSize: 12 }}>
          {error} — backend may be offline
        </div>
      )}

      {/* KPI grid */}
      <div className="grid-4" style={{ marginTop: 24 }}>
        <KPI
          label="Reserve Ratio"
          num={ratio.toFixed(2)}
          unit="%"
          sub={<span style={{ color: 'var(--emerald)' }}>● Fully backed · {Math.round(Math.max(0, headroom)).toLocaleString()} g headroom</span>}
        />
        <KPI
          label="Vault Weight"
          num={reserveGrams.toLocaleString()}
          unit="g"
          sub={<><b>{activeBars.length} bar{activeBars.length !== 1 ? 's' : ''}</b><span style={{ color: 'var(--ink-3)' }}>across {vaultGroups.length} vault{vaultGroups.length !== 1 ? 's' : ''}</span></>}
        />
        <KPI
          label="Circulating"
          num={totalSupplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          unit="SGT999"
          sub={<><b>{priceNum > 0 ? formatUsd(totalSupplyGrams * priceNum) : '—'}</b><span style={{ color: 'var(--ink-3)' }}>@ {priceNum > 0 ? formatUsd(priceNum) : '—'}/g</span></>}
          sparkData={SUPPLY_SPARK}
        />
        <KPI
          label="Last attestation"
          num={lastAttestHours != null ? String(lastAttestHours) : '—'}
          unit={lastAttestHours != null ? 'h ago' : ''}
          sub={<><b>Bar registry</b><span style={{ color: 'var(--ink-3)' }}>— on-chain</span></>}
        />
      </div>

      {/* Coverage scale */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="coverage" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
          <div>
            <div className="eyebrow">Coverage</div>
            <div className="ratio tnum">{ratio.toFixed(4)}<small>%</small></div>
          </div>
          <div style={{ paddingTop: 8 }}>
            <div className="scale">
              <div className="fill" style={{ width: '100%' }} />
              {totalSupplyGrams > 0 && reserveGrams > 0 && (
                <div className="target" style={{ left: `${Math.min(98, (totalSupplyGrams / reserveGrams) * 100)}%` }} />
              )}
            </div>
            <div className="legend">
              <span><b>{reserveGrams.toLocaleString()} g</b> in vault</span>
              <span><b>{totalSupplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })} g</b> tokens issued</span>
              <span>Mint guard <b>active</b> · floor 100.00%</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge tone="ok" dot>On-chain enforced</Badge>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.4 }}>
              GoldToken.mint() reverts<br />if supply &gt; vault weight
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn ghost sm" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw size={12} style={refreshing ? { animation: 'spin 0.7s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Vault distribution */}
      {vaultGroups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title">Vault distribution</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge>Geographic</Badge>
              <Badge>Active bars</Badge>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, vaultGroups.length)}, 1fr)`, gap: 16 }}>
            {vaultGroups.map(v => (
              <div key={v.id} className="card card-pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="eyebrow"><span className="dot" />Vault {v.id}</div>
                    <div className="serif" style={{ fontSize: 22, marginTop: 4 }}>{v.id}</div>
                  </div>
                  <Donut pct={reserveGrams > 0 ? Math.round((v.grams / reserveGrams) * 100) : 0} size={84} label="share" />
                </div>
                <hr className="hairline" style={{ margin: '14px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 12 }}>
                  <div>
                    <div style={{ color: 'var(--ink-3)' }}>Weight</div>
                    <div className="serif tnum" style={{ fontSize: 18 }}>
                      {v.grams.toLocaleString()}<small style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4 }}>g</small>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-3)' }}>Bars</div>
                    <div className="serif tnum" style={{ fontSize: 18 }}>{v.bars}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar registry */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 className="section-title">
            Bar registry · {activeBars.length} active bar{activeBars.length !== 1 ? 's' : ''}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost sm">Export CSV</button>
          </div>
        </div>
        <div className="card">
          {bars.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No gold bars registered yet.
            </div>
          ) : (
            <div className="scroll-x">
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Bar ID</th>
                    <th>Vault</th>
                    <th className="num">Weight</th>
                    <th>Purity</th>
                    <th>Assay ref</th>
                    <th>Registered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bars.map(b => (
                    <tr key={b.barId}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Ingot size="sm" />
                          <span className="mono" style={{ fontWeight: 600 }}>{b.barId}</span>
                        </div>
                      </td>
                      <td><Badge>{b.vaultId}</Badge></td>
                      <td className="num">
                        <span className="serif" style={{ fontSize: 15 }}>{b.weightGrams.toLocaleString()}</span> g
                      </td>
                      <td>
                        <Badge tone="bullion">
                          {formatPurityBps(b.purityBps)}% · {b.purityBps === 9999 ? '4N' : b.purityBps === 9160 ? '916' : '—'}
                        </Badge>
                      </td>
                      <td className="addr">{b.assayRef ?? '—'}</td>
                      <td className="muted">
                        {new Date(b.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td><StatusBadge status={b.active ? 'Active' : 'Inactive'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* On-chain activity stream */}
      {redemptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title">On-chain activity</h2>
            <Badge tone="ok" dot>Live</Badge>
          </div>
          <div className="card">
            {redemptions.slice(0, 6).map((r, i, a) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 20px',
                borderBottom: i < Math.min(a.length, 6) - 1 ? '1px solid var(--rule)' : 'none',
              }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', width: 56, flexShrink: 0 }}>
                  {formatRelativeTime(r.requestedAt)}
                </span>
                <Badge tone={r.status === 'FULFILLED' ? 'danger' : r.status === 'PENDING' ? 'azure' : 'ghost'}>
                  {r.status === 'FULFILLED' ? 'Redeem · Burn' : 'Redemption'}
                </Badge>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>
                  {shortAddress(r.investorAddress)}
                </span>
                <span className="serif tnum" style={{ fontSize: 16, color: 'var(--ruby)' }}>
                  −{formatGrams(r.requestedGrams)}
                </span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 32 }}>
        {[
          {
            title: 'Reserve cap on-chain',
            body: 'GoldToken.mint() reverts if total supply would exceed registered vault weight. The contract — not us — enforces the 1:1 backing.',
          },
          {
            title: 'KYC at the protocol',
            body: 'IdentityRegistry gates every transfer. Non-verified addresses cannot send or receive. Compliance modules AND-gate every move.',
          },
          {
            title: 'Independent attestation',
            body: 'Physical bars are registered on-chain via the GoldReserve contract. Each bar has an assay reference and custodian record.',
          },
        ].map(c => (
          <div key={c.title} className="card card-pad">
            <div className="serif" style={{ fontSize: 20, lineHeight: 1.2 }}>{c.title}</div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.55, margin: '8px 0 0' }}>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
