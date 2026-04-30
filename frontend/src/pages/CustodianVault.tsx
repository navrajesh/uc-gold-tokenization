import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { formatWeiToGrams, formatPurityBps, formatDate } from '../lib/utils';
import type { Token, GoldBar, Redemption } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { KPI } from '../components/ui/KPI';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Ingot } from '../components/ui/Ingot';

export default function CustodianVault() {
  const [tokens, setTokens]               = useState<Token[]>([]);
  const [bars, setBars]                   = useState<GoldBar[]>([]);
  const [totalSupplyGrams, setTotalSupplyGrams] = useState(0);
  const [approved, setApproved]           = useState<Redemption[]>([]);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tkns = await api.getTokens();
      setTokens(tkns);
      if (tkns[0]) {
        const [enriched, res, rdms] = await Promise.all([
          api.getToken(tkns[0].address),
          api.getReserves(tkns[0].address),
          api.getRedemptions(tkns[0].address),
        ]);
        setTotalSupplyGrams(enriched.totalSupply ? formatWeiToGrams(enriched.totalSupply, enriched.decimals ?? 18) : 0);
        setBars(res.bars);
        setApproved(rdms.filter(r => r.status === 'APPROVED'));
      }
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeBars   = bars.filter(b => b.active);
  const reserveGrams = activeBars.reduce((s, b) => s + b.weightGrams, 0);
  const freeGrams    = Math.max(0, reserveGrams - totalSupplyGrams);
  const approvedGrams = approved.reduce((s, r) => s + r.requestedGrams, 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13, gap: 10 }}>
      <div className="loading-ring" /> Loading vault…
    </div>
  );

  return (
    <div className="main-pad">
      <Eyebrow>Custodian · Vault inventory</Eyebrow>
      <h1 className="page-title">Vault inventory.</h1>
      <p className="page-sub">
        {reserveGrams.toLocaleString()} g across {activeBars.length} active bar{activeBars.length !== 1 ? 's' : ''} · last reconciled on demand.
      </p>

      <div className="grid-4" style={{ marginTop: 24 }}>
        <KPI label="Total weight" num={reserveGrams.toLocaleString()} unit="g"
          sub={<><b>{activeBars.length} bars</b><span style={{ color: 'var(--ink-3)' }}>active</span></>}
        />
        <KPI label="Allocated" num={totalSupplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })} unit="g"
          sub={<>backing {tokens[0]?.symbol ?? 'SGT999'}</>}
        />
        <KPI label="Free / unbacked" num={freeGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })} unit="g"
          sub={<span style={{ color: 'var(--emerald)' }}>{reserveGrams > 0 ? ((freeGrams / reserveGrams) * 100).toFixed(2) : '0.00'}% buffer</span>}
        />
        <KPI label="Pending fulfillments" num={String(approved.length)}
          sub={<><b>{approvedGrams.toLocaleString()} g</b><span style={{ color: 'var(--ink-3)' }}>to release</span></>}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 32 }}>
        <h2 className="section-title">
          Bar inventory · {activeBars.length} active{bars.length > activeBars.length ? `, ${bars.length - activeBars.length} inactive` : ''}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost sm">Export CSV</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        {bars.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            No bars registered. Use Bar Intake to add the first bar.
          </div>
        ) : (
          <div className="scroll-x">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Bar ID</th>
                  <th className="num">Weight</th>
                  <th>Purity</th>
                  <th>Vault</th>
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
                    <td className="num">
                      <span className="serif" style={{ fontSize: 15 }}>{b.weightGrams.toLocaleString()}</span> g
                    </td>
                    <td><Badge tone="bullion">{formatPurityBps(b.purityBps)}%</Badge></td>
                    <td><Badge>{b.vaultId}</Badge></td>
                    <td className="addr">{b.assayRef ?? '—'}</td>
                    <td className="muted">{formatDate(b.registeredAt)}</td>
                    <td><StatusBadge status={b.active ? 'Active' : 'Inactive'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
