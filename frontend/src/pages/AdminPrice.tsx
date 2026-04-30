import { useState, useEffect, FormEvent } from 'react';
import { api } from '../lib/api';
import { formatUsd, formatDate } from '../lib/utils';
import type { GoldPrice } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';
import { Sparkline } from '../components/ui/Sparkline';

const PRICE_SPARK = [88, 89, 87, 90, 91, 90, 92, 93, 92, 94, 95, 93, 96, 94, 95, 96];

const SOURCES = ['LBMA AM Fix', 'COMEX Spot', 'Manual'];

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: 12, marginTop: 12,
      background: ok ? 'color-mix(in oklch, var(--emerald) 12%, transparent)' : 'var(--ruby-soft)',
      border: `1px solid color-mix(in oklch, ${ok ? 'var(--emerald)' : 'var(--ruby)'} 30%, transparent)`,
      color: ok ? 'var(--emerald)' : 'var(--ruby)',
    }}>
      {msg}
    </div>
  );
}

export default function AdminPrice() {
  const [price, setPrice]           = useState<GoldPrice | null>(null);
  const [history, setHistory]       = useState<GoldPrice[]>([]);
  const [newPrice, setNewPrice]     = useState('');
  const [source, setSource]         = useState(SOURCES[0]);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => api.getPrice().then(p => {
    setPrice(p);
    setHistory(h => {
      const next = [p, ...h.filter(x => x.updatedAt !== p.updatedAt)].slice(0, 10);
      return next;
    });
  }).catch(() => {});

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const p = await api.updatePrice(newPrice, source);
      setPrice(p);
      setHistory(h => [p, ...h].slice(0, 10));
      setMsg({ text: `Price updated to ${formatUsd(parseFloat(newPrice))}/gram.`, ok: true });
      setNewPrice('');
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  const priceNum = price ? parseFloat(price.pricePerGramUsd) : 0;

  return (
    <div className="main-pad">
      <Eyebrow>Price oracle</Eyebrow>
      <h1 className="page-title">Set the gold reference price.</h1>
      <p className="page-sub">Used for USD value display only — has no effect on on-chain balances or compliance. Production: replace with Chainlink XAU/USD.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 24 }}>
        {/* Left: current price + update form */}
        <div className="card card-pad">
          <h2 className="section-title">Current feed</h2>

          {price ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 16 }}>
              <div className="serif tnum" style={{ fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.025em' }}>
                {formatUsd(priceNum)}
              </div>
              <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>per gram</span>
              <Badge tone="ok" dot>Live</Badge>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, color: 'var(--ink-3)', fontSize: 13 }}>
              <div className="loading-ring" /> Loading price…
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Sparkline data={PRICE_SPARK} w={500} h={48} />
          </div>

          {price && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              Updated {formatDate(price.updatedAt)}{price.updatedBy ? ` by ${price.updatedBy}` : ''}
            </div>
          )}

          <hr className="hairline" style={{ margin: '20px 0' }} />

          <h2 className="section-title">Update</h2>
          <form onSubmit={submit}>
            <div className="grid-2" style={{ gap: 16, marginTop: 12 }}>
              <div className="field">
                <label>New price (USD/gram)</label>
                <input
                  className="input serif tnum"
                  style={{ fontSize: 22 }}
                  type="number" step="0.01" min="0.01"
                  placeholder={priceNum > 0 ? priceNum.toFixed(2) : '92.56'}
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Source</label>
                <select className="select" value={source} onChange={e => setSource(e.target.value)}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Publishing…' : 'Publish update'}
              </button>
              <button type="button" className="btn ghost" onClick={() => setNewPrice('')}>Cancel</button>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>Off-chain update · SQLite</span>
            </div>

            {msg && <Toast msg={msg.text} ok={msg.ok} />}
          </form>
        </div>

        {/* Right: update history */}
        <div className="card">
          <div className="card-hd"><span className="section-title">Update history</span></div>
          {history.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No updates yet.
            </div>
          ) : (
            <div>
              {history.map((p, i) => (
                <div key={p.updatedAt} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  borderBottom: i < history.length - 1 ? '1px solid var(--rule)' : 'none',
                  fontSize: 12.5,
                }}>
                  <span style={{ color: 'var(--ink-3)', width: 140, flexShrink: 0 }}>{formatDate(p.updatedAt)}</span>
                  <span className="serif tnum" style={{ fontSize: 16, flex: 1 }}>{formatUsd(parseFloat(p.pricePerGramUsd))}</span>
                  <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>{p.updatedBy ?? 'system'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--rule)', fontSize: 11, color: 'var(--ink-3)' }}>
            Production: replace this feed with Chainlink XAU/USD oracle
          </div>
        </div>
      </div>
    </div>
  );
}
