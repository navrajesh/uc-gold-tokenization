import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { GoldBar } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';

const HISTORY = [
  { date: 'Sep 30, 2025', auditor: 'Marcum LLP',     weight: '987,622 g', root: '0x7f3a…4f3a' },
  { date: 'Jun 30, 2025', auditor: 'Marcum LLP',     weight: '812,300 g', root: '0x4b1c…22ee' },
  { date: 'Mar 31, 2025', auditor: 'BDO Singapore',  weight: '504,180 g', root: '0x9928…eea1' },
  { date: 'Dec 31, 2024', auditor: 'BDO Singapore',  weight: '312,700 g', root: '0xfc02…1180' },
];

export default function CustodianAttestation() {
  const [bars, setBars]   = useState<GoldBar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTokens().then(tkns => {
      if (tkns[0]) return api.getReserves(tkns[0].address);
      return Promise.reject();
    }).then(res => setBars(res.bars)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeBars = bars.filter(b => b.active);
  const lastBar = [...activeBars].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())[0];

  const nextDue = new Date('2025-12-31');
  const daysLeft = Math.max(0, Math.round((nextDue.getTime() - Date.now()) / 86_400_000));

  return (
    <div className="main-pad">
      <Eyebrow>Attestations</Eyebrow>
      <h1 className="page-title">Quarterly proof of holdings.</h1>
      <p className="page-sub">Independent auditor signs a Merkle root of bars and photo evidence. The root is published on-chain.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 24 }}>
        {/* Next attestation */}
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <Eyebrow>Next attestation due</Eyebrow>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Dec 31, 2025</span>
          </div>
          <div className="serif tnum" style={{ fontSize: 56, lineHeight: 0.95, marginTop: 12 }}>
            {loading ? '—' : daysLeft}
            <small style={{ fontSize: 18, color: 'var(--ink-3)', marginLeft: 8, fontFamily: 'var(--font-sans)' }}>days</small>
          </div>

          <hr className="hairline" style={{ margin: '20px 0' }} />

          <h2 className="section-title">Last attestation</h2>
          <div className="grid-2" style={{ gap: 16, marginTop: 12, fontSize: 12.5 }}>
            <div>
              <div style={{ color: 'var(--ink-3)' }}>Auditor</div>
              <div style={{ fontSize: 14, marginTop: 2 }}>Marcum LLP</div>
            </div>
            <div>
              <div style={{ color: 'var(--ink-3)' }}>Date</div>
              <div style={{ fontSize: 14, marginTop: 2 }}>Sep 30, 2025</div>
            </div>
            <div>
              <div style={{ color: 'var(--ink-3)' }}>Bars verified</div>
              <div className="serif tnum" style={{ fontSize: 18, marginTop: 2 }}>{activeBars.length || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ink-3)' }}>Weight</div>
              <div className="serif tnum" style={{ fontSize: 18, marginTop: 2 }}>
                {activeBars.reduce((s, b) => s + b.weightGrams, 0).toLocaleString() || '—'} g
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: 'var(--ink-3)' }}>Merkle root (mock)</div>
              <div className="mono" style={{ fontSize: 11.5, marginTop: 4, padding: '6px 10px', background: 'var(--paper-2)', borderRadius: 6, wordBreak: 'break-all' }}>
                0x7f3a1b9c4d2e8f1a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a
              </div>
            </div>
          </div>

          {lastBar && (
            <>
              <hr className="hairline" style={{ margin: '20px 0' }} />
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                Most recent bar registered: <b style={{ color: 'var(--ink)' }}>{lastBar.barId}</b> on {new Date(lastBar.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </>
          )}
        </div>

        {/* History */}
        <div className="card">
          <div className="card-hd">
            <span className="section-title">Attestation history</span>
            <Badge tone="ok" dot>On-chain</Badge>
          </div>
          <div>
            {HISTORY.map((h, i) => (
              <div key={h.date} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 20px',
                borderBottom: i < HISTORY.length - 1 ? '1px solid var(--rule)' : 'none',
                fontSize: 12,
              }}>
                <span style={{ color: 'var(--ink-3)', width: 100, flexShrink: 0 }}>{h.date}</span>
                <span style={{ flex: 1 }}>{h.auditor}</span>
                <span className="serif tnum" style={{ fontSize: 14 }}>{h.weight}</span>
                <span className="addr">{h.root}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--rule)', fontSize: 11, color: 'var(--ink-3)' }}>
            Quarterly cadence · Q1–Q4 · independent auditor
          </div>
        </div>
      </div>
    </div>
  );
}
