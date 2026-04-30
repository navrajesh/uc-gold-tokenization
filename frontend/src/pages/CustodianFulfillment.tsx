import { useState, useEffect, useCallback } from 'react';
import { Flame } from 'lucide-react';
import { api } from '../lib/api';
import { shortAddress, formatDate } from '../lib/utils';
import type { Token, Redemption } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';
import { Ingot } from '../components/ui/Ingot';

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 16,
      background: ok ? 'color-mix(in oklch, var(--emerald) 12%, transparent)' : 'var(--ruby-soft)',
      border: `1px solid color-mix(in oklch, ${ok ? 'var(--emerald)' : 'var(--ruby)'} 30%, transparent)`,
      color: ok ? 'var(--emerald)' : 'var(--ruby)',
    }}>
      {msg}
    </div>
  );
}

export default function CustodianFulfillment() {
  const [tokens, setTokens]         = useState<Token[]>([]);
  const [approved, setApproved]     = useState<Redemption[]>([]);
  const [acting, setActing]         = useState<string | null>(null);
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tkns = await api.getTokens();
      setTokens(tkns);
      const rdms = await api.getRedemptions(tkns[0]?.address);
      setApproved(rdms.filter(r => r.status === 'APPROVED'));
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fulfill = async (ref: string) => {
    setActing(ref); setMsg(null);
    try {
      await api.fulfillRedemption(ref);
      setMsg({ text: `Fulfillment complete · tokens burned on-chain.`, ok: true });
      setApproved(a => a.filter(r => r.redemptionRef !== ref));
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setActing(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13, gap: 10 }}>
      <div className="loading-ring" /> Loading fulfillment queue…
    </div>
  );

  return (
    <div className="main-pad">
      <Eyebrow>Fulfillment queue</Eyebrow>
      <h1 className="page-title">Release gold, burn tokens.</h1>
      <p className="page-sub">
        {approved.length} redemption{approved.length !== 1 ? 's' : ''} approved by issuer · awaiting custodian signature to settle.
      </p>

      {msg && <Toast msg={msg.text} ok={msg.ok} />}

      {approved.length === 0 ? (
        <div className="card" style={{ marginTop: 24, padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          No approved redemptions awaiting fulfillment. Check back after the issuer approves requests.
        </div>
      ) : (
        <div className="card" style={{ marginTop: 24 }}>
          {approved.map((r, i) => (
            <div key={r.redemptionRef} style={{ padding: 20, borderBottom: i < approved.length - 1 ? '1px solid var(--rule)' : 'none' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="serif tnum" style={{ fontSize: 28 }}>
                    {r.requestedGrams.toLocaleString()}
                    <small style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 4, fontFamily: 'var(--font-sans)' }}>g</small>
                  </span>
                  <Badge tone="bullion" dot>Approved · awaiting fulfillment</Badge>
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.redemptionRef}</span>
              </div>

              {/* Details grid */}
              <div className="grid-3" style={{ gap: 16, fontSize: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>Investor</div>
                  <div className="addr">{r.investorAddress}</div>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 10, marginBottom: 4 }}>Delivery</div>
                  <div style={{ fontSize: 13 }}>{r.deliveryAddress ?? '— not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>Bar allocation (FIFO)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <Ingot size="sm" />
                    <div>
                      <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{tokens[0]?.symbol ?? 'SGT999'} reserve</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Burn {r.requestedGrams} g of token supply</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>On-chain action</div>
                  <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.6 }}>
                    <code className="mono" style={{ background: 'var(--paper-3)', padding: '2px 5px', borderRadius: 4, fontSize: 10.5 }}>
                      fulfillRedemption("{shortAddress(r.redemptionRef, 8)}")
                    </code>
                    <br />
                    <span style={{ color: 'var(--ink-3)' }}>→ burn {r.requestedGrams} {tokens[0]?.symbol ?? 'SGT999'} · emit RedemptionFulfilled</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Requested {formatDate(r.requestedAt)}</div>
                </div>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  className="btn bullion"
                  disabled={acting === r.redemptionRef}
                  onClick={() => fulfill(r.redemptionRef)}
                >
                  {acting === r.redemptionRef
                    ? <><div className="loading-ring" style={{ width: 14, height: 14 }} /> Confirming…</>
                    : <><Flame size={13} /> Confirm release &amp; burn</>}
                </button>
                <button className="btn ghost">Print release form</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
