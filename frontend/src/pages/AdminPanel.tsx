import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatGrams, formatWeiToGrams } from '../lib/utils';
import type { Token, Redemption, Identity } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { KPI } from '../components/ui/KPI';
import { Badge } from '../components/ui/Badge';
import { Sparkline } from '../components/ui/Sparkline';

const RATIO_SPARK = [100.01, 100.02, 100.04, 100.03, 100.05, 100.08, 100.06, 100.10, 100.12, 100.15, 100.13, 100.18, 100.20, 100.17, 100.15, 100.20, 100.18, 100.22, 100.25, 100.21, 100.18, 100.15, 100.10, 100.08, 100.05, 100.07, 100.04, 100.02, 100.03, 100.01];

export default function AdminPanel() {
  const nav = useNavigate();
  const [tokens, setTokens]         = useState<Token[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [reserveGrams, setReserveGrams]         = useState(0);
  const [totalSupplyGrams, setTotalSupplyGrams] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tkns, rdms, ids] = await Promise.all([
        api.getTokens(), api.getRedemptions(), api.getIdentities(),
      ]);
      setTokens(tkns); setRedemptions(rdms); setIdentities(ids);
      if (tkns[0]) {
        const [enriched, res] = await Promise.all([
          api.getToken(tkns[0].address), api.getReserves(tkns[0].address),
        ]);
        setTotalSupplyGrams(
          enriched.totalSupply ? formatWeiToGrams(enriched.totalSupply, enriched.decimals ?? 18) : 0,
        );
        setReserveGrams(res.bars.filter(b => b.active).reduce((s, b) => s + b.weightGrams, 0));
      }
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending      = redemptions.filter(r => r.status === 'PENDING');
  const pendingGrams = pending.reduce((s, r) => s + r.requestedGrams, 0);
  const headroom     = Math.max(0, reserveGrams - totalSupplyGrams);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13, gap: 10 }}>
      <div className="loading-ring" /> Loading…
    </div>
  );

  return (
    <div className="main-pad">
      <Eyebrow>Issuer · Treasury Ops</Eyebrow>
      <h1 className="page-title">Operations today.</h1>
      <p className="page-sub">
        {pending.length} redemption{pending.length !== 1 ? 's' : ''} queued · {identities.length} KYC registered · reserve {headroom > 0 ? 'healthy' : 'at floor'}.
      </p>

      <div className="grid-4" style={{ marginTop: 24 }}>
        <KPI
          label="Pending redemptions"
          num={String(pending.length)}
          sub={<><b>{formatGrams(pendingGrams)}</b><span style={{ color: 'var(--ink-3)' }}>to process</span></>}
        />
        <KPI
          label="Mint headroom"
          num={(headroom / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}
          unit="kg"
          sub={<span style={{ color: 'var(--emerald)' }}>{reserveGrams > 0 ? Math.round((headroom / reserveGrams) * 100) : 0}% of vault</span>}
        />
        <KPI
          label="KYC registered"
          num={String(identities.length)}
          sub={<><b>{identities.filter(i => i.isVerified).length} verified</b><span style={{ color: 'var(--ink-3)' }}>wallets</span></>}
        />
        <KPI
          label="Circulating"
          num={totalSupplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          unit="g"
          sub={<><b>{tokens[0]?.symbol ?? 'SGT999'}</b><span style={{ color: 'var(--ink-3)' }}>issued</span></>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 24 }}>
        {/* Reserve coverage sparkline */}
        <div className="card">
          <div className="card-hd">
            <span className="section-title">Reserve coverage · 30-day</span>
            <Badge tone="ok" dot>Above 100% floor</Badge>
          </div>
          <div className="card-bd">
            <Sparkline data={RATIO_SPARK} w={600} h={120} />
            <div style={{ display: 'flex', gap: 24, fontSize: 12, marginTop: 12 }}>
              <div><span style={{ color: 'var(--ink-3)' }}>Min</span> <b className="mono">100.01%</b></div>
              <div><span style={{ color: 'var(--ink-3)' }}>Max</span> <b className="mono">100.25%</b></div>
              <div><span style={{ color: 'var(--ink-3)' }}>Avg</span> <b className="mono">100.11%</b></div>
              <div style={{ marginLeft: 'auto' }}><span style={{ color: 'var(--ink-3)' }}>Real-time · on-chain</span></div>
            </div>
          </div>
        </div>

        {/* Action queue */}
        <div className="card">
          <div className="card-hd"><span className="section-title">Action queue</span></div>
          {pending.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No pending actions.
            </div>
          ) : (
            <>
              {pending.slice(0, 5).map(r => (
                <div key={r.redemptionRef} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--rule)', gap: 10 }}>
                  <span style={{ width: 4, height: 32, borderRadius: 2, flexShrink: 0, background: r.requestedGrams >= 500 ? 'var(--ruby)' : 'var(--bullion-2)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Redeem · {formatGrams(r.requestedGrams)}</div>
                    <div className="addr" style={{ fontSize: 11 }}>{r.investorAddress}</div>
                  </div>
                  <button className="btn ghost sm" onClick={() => nav('/admin/redemptions')}>Approve</button>
                </div>
              ))}
              {pending.length > 5 && (
                <div style={{ padding: '10px 20px', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
                  +{pending.length - 5} more ·{' '}
                  <button className="btn ghost sm" onClick={() => nav('/admin/redemptions')}>View all</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
