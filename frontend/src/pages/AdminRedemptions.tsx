import { useState, useEffect, useCallback, FormEvent } from 'react';
import { XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { formatGrams, formatDate, shortAddress } from '../lib/utils';
import type { Token, Redemption } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';

const COLS = [
  { id: 'PENDING',   label: 'Pending review',     tone: 'azure',   action: 'approve' },
  { id: 'APPROVED',  label: 'Awaiting custodian',  tone: 'bullion', action: 'fulfill' },
  { id: 'FULFILLED', label: 'Settled',             tone: 'ok',      action: null },
  { id: 'REJECTED',  label: 'Rejected',            tone: 'danger',  action: null },
] as const;

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 12,
      background: ok ? 'var(--emerald-soft, color-mix(in oklch, var(--emerald) 12%, transparent))' : 'var(--ruby-soft)',
      border: `1px solid color-mix(in oklch, ${ok ? 'var(--emerald)' : 'var(--ruby)'} 30%, transparent)`,
      color: ok ? 'var(--emerald)' : 'var(--ruby)',
    }}>
      {msg}
    </div>
  );
}

export default function AdminRedemptions() {
  const [tokens, setTokens]         = useState<Token[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [tokenAddr, setTokenAddr]   = useState('');
  const [acting, setActing]         = useState<string | null>(null);
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null);
  const [rejectRef, setRejectRef]   = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const [tkns, rdms] = await Promise.all([api.getTokens(), api.getRedemptions(tokenAddr || undefined)]);
      setTokens(tkns);
      setRedemptions(rdms);
      if (!tokenAddr && tkns[0]) setTokenAddr(tkns[0].address);
    } catch (_) {}
  }, [tokenAddr]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>, label: string, key: string) => {
    setActing(key); setMsg(null);
    try {
      await fn();
      setMsg({ text: `${label} successful.`, ok: true });
      load();
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setActing(null); }
  };

  const submitReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectRef) return;
    await act(() => api.rejectRedemption(rejectRef, rejectReason || 'Rejected by admin'), 'Rejection', rejectRef + 'r');
    setRejectRef(null); setRejectReason('');
  };

  return (
    <div className="main-pad">
      <Eyebrow>Redemption queue</Eyebrow>
      <h1 className="page-title">Approve, fulfill, settle.</h1>
      <p className="page-sub">On-chain burn happens when the custodian fulfills. PENDING → APPROVED → FULFILLED or REJECTED.</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        {tokens.length > 0 && (
          <select className="select" style={{ width: 'auto' }} value={tokenAddr} onChange={e => setTokenAddr(e.target.value)}>
            <option value="">All tokens</option>
            {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
          </select>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn ghost sm" onClick={load}>Refresh</button>
        <button className="btn ghost sm">Export CSV</button>
      </div>

      {msg && <div style={{ marginTop: 12 }}><Toast msg={msg.text} ok={msg.ok} /></div>}

      {/* Reject modal */}
      {rejectRef && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card card-pad" style={{ width: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="section-title">Reject redemption</span>
              <button className="btn ghost sm" onClick={() => setRejectRef(null)}><XCircle size={14} /></button>
            </div>
            <form onSubmit={submitReject}>
              <div className="field">
                <label>Reason</label>
                <input className="input" placeholder="e.g. KYC expired, insufficient docs…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" className="btn" disabled={!!acting}>
                  {acting ? 'Rejecting…' : 'Confirm reject'}
                </button>
                <button type="button" className="btn ghost" onClick={() => setRejectRef(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
        {COLS.map(col => {
          const items = redemptions.filter(r => r.status === col.id);
          const totalG = items.reduce((s, r) => s + r.requestedGrams, 0);
          return (
            <div key={col.id} style={{ background: 'var(--paper-2)', borderRadius: 'var(--radius)', border: '1px solid var(--rule)', overflow: 'hidden' }}>
              {/* Column header */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="eyebrow">{col.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                    {totalG.toLocaleString()} g · {items.length} req
                  </div>
                </div>
                <Badge tone={col.tone as 'azure' | 'bullion' | 'ok' | 'danger'}>{items.length}</Badge>
              </div>

              {/* Cards */}
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 320 }}>
                {items.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', padding: 16, textAlign: 'center' }}>—</div>
                )}
                {items.map(r => (
                  <div key={r.redemptionRef} className="card" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="serif tnum" style={{ fontSize: 20 }}>
                        {r.requestedGrams.toLocaleString()}
                        <small style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4, fontFamily: 'var(--font-sans)' }}>g</small>
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{formatDate(r.requestedAt)}</span>
                    </div>
                    <div className="addr" style={{ marginTop: 6 }}>{r.investorAddress}</div>
                    {r.deliveryAddress && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{r.deliveryAddress}</div>
                    )}
                    <hr className="hairline" style={{ margin: '10px 0 8px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{shortAddress(r.redemptionRef, 10)}</span>
                      {col.id === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn sm"
                            disabled={acting === r.redemptionRef + 'a'}
                            onClick={() => act(() => api.approveRedemption(r.redemptionRef), 'Approval', r.redemptionRef + 'a')}
                          >
                            {acting === r.redemptionRef + 'a' ? '…' : 'Approve'}
                          </button>
                          <button className="btn ghost sm" onClick={() => setRejectRef(r.redemptionRef)}>
                            <XCircle size={11} />
                          </button>
                        </div>
                      )}
                      {col.id === 'APPROVED' && (
                        <button
                          className="btn sm"
                          disabled={acting === r.redemptionRef + 'f'}
                          onClick={() => act(() => api.fulfillRedemption(r.redemptionRef), 'Fulfillment (burn)', r.redemptionRef + 'f')}
                        >
                          {acting === r.redemptionRef + 'f' ? '…' : 'Fulfill & Burn'}
                        </button>
                      )}
                      {col.id === 'FULFILLED' && r.burnTxHash && (
                        <span className="addr" style={{ fontSize: 10.5 }}>{shortAddress(r.burnTxHash)}</span>
                      )}
                      {col.id === 'REJECTED' && r.rejectReason && (
                        <span style={{ fontSize: 10.5, color: 'var(--ruby)' }}>{r.rejectReason}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
