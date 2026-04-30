import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Check, X, Hammer } from 'lucide-react';
import { api } from '../lib/api';
import { formatWeiToGrams, shortAddress } from '../lib/utils';
import type { Token, Identity } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';
import { Donut } from '../components/ui/Donut';

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

export default function AdminMint() {
  const [tokens, setTokens]               = useState<Token[]>([]);
  const [reserveGrams, setReserveGrams]   = useState(0);
  const [totalSupplyGrams, setTotalSupplyGrams] = useState(0);
  const [to, setTo]                       = useState('');
  const [grams, setGrams]                 = useState('');
  const [tokenAddr, setTokenAddr]         = useState('');
  const [identity, setIdentity]           = useState<Identity | null | 'loading' | 'none'>('none');
  const [saving, setSaving]               = useState(false);
  const [msg, setMsg]                     = useState<{ text: string; ok: boolean } | null>(null);

  const loadToken = useCallback(async (addr: string) => {
    try {
      const [enriched, res] = await Promise.all([api.getToken(addr), api.getReserves(addr)]);
      setTotalSupplyGrams(enriched.totalSupply ? formatWeiToGrams(enriched.totalSupply, enriched.decimals ?? 18) : 0);
      setReserveGrams(res.bars.filter(b => b.active).reduce((s, b) => s + b.weightGrams, 0));
    } catch (_) {}
  }, []);

  useEffect(() => {
    api.getTokens().then(tkns => {
      setTokens(tkns);
      if (tkns[0]) { setTokenAddr(tkns[0].address); loadToken(tkns[0].address); }
    }).catch(() => {});
  }, [loadToken]);

  useEffect(() => { if (tokenAddr) loadToken(tokenAddr); }, [tokenAddr, loadToken]);

  const checkIdentity = async () => {
    const addr = to.trim();
    if (!addr || !addr.startsWith('0x') || addr.length < 10) return;
    setIdentity('loading');
    try {
      const id = await api.getIdentity(addr);
      setIdentity(id);
    } catch (_) { setIdentity(null); }
  };

  const gramsNum   = parseFloat(grams) || 0;
  const headroom   = Math.max(0, reserveGrams - totalSupplyGrams);
  const afterSupply = totalSupplyGrams + gramsNum;

  const checks = [
    {
      label: 'Identity registry · recipient verified',
      pass: identity !== 'none' && identity !== 'loading' && identity !== null && (identity as Identity).isVerified,
      pending: identity === 'loading',
      skip: identity === 'none',
    },
    {
      label: 'Min transfer · 1 g',
      pass: gramsNum >= 1,
      pending: false,
      skip: gramsNum === 0,
    },
    {
      label: `Reserve cap · ${gramsNum.toLocaleString()} g vs ${headroom.toLocaleString()} g headroom`,
      pass: gramsNum > 0 && gramsNum <= headroom,
      pending: false,
      skip: gramsNum === 0,
    },
  ];

  const allPass = checks.every(c => c.skip || c.pass);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allPass) return;
    const token = tokens.find(t => t.address === tokenAddr);
    if (!token) return;
    setSaving(true); setMsg(null);
    const amountWei = (BigInt(Math.round(gramsNum)) * (10n ** BigInt(token.decimals))).toString();
    try {
      const r = await api.mintTokens(token.address, to, amountWei);
      setMsg({ text: `Minted ${grams} g → ${shortAddress(to)}. Tx: ${shortAddress(r.txHash)}`, ok: true });
      setGrams(''); setTo(''); setIdentity('none');
      loadToken(token.address);
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  const donutPct = reserveGrams > 0 ? Math.round((headroom / reserveGrams) * 100) : 0;

  return (
    <div className="main-pad">
      <Eyebrow>Mint console</Eyebrow>
      <h1 className="page-title">Issue new tokens.</h1>
      <p className="page-sub">Mints are guarded on-chain. The contract reverts any issuance that would exceed registered vault weight.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 24 }}>
        {/* Mint form */}
        <div className="card card-pad">
          <h2 className="section-title">New mint order</h2>
          <form onSubmit={submit}>
            <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
              {tokens.length > 1 && (
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Token</label>
                  <select className="select" value={tokenAddr} onChange={e => setTokenAddr(e.target.value)}>
                    {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol} — {t.name}</option>)}
                  </select>
                </div>
              )}

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Recipient (KYC verified)</label>
                <input
                  className="input mono"
                  placeholder="0x…"
                  value={to}
                  onChange={e => { setTo(e.target.value); setIdentity('none'); }}
                  onBlur={checkIdentity}
                  required
                />
                {identity !== 'none' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, marginTop: 4 }}>
                    {identity === 'loading' && <><div className="loading-ring" style={{ width: 12, height: 12 }} /> Checking identity…</>}
                    {identity === null && <><span style={{ color: 'var(--ruby)' }}>✗</span> Not in identity registry</>}
                    {identity !== null && identity !== 'loading' && (
                      <>
                        <Badge tone={(identity as Identity).isVerified ? 'ok' : 'danger'} dot>
                          {(identity as Identity).isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                        {(identity as Identity).countryCode && (
                          <span style={{ color: 'var(--ink-3)' }}>{(identity as Identity).countryCode}</span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Amount (grams)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input serif tnum"
                    style={{ fontSize: 22, padding: '10px 60px 10px 14px' }}
                    type="number" min="1" step="1" placeholder="500"
                    value={grams}
                    onChange={e => setGrams(e.target.value)}
                    required
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Grams
                  </span>
                </div>
              </div>

              <div className="field">
                <label>Wire / subscription ref</label>
                <input className="input" placeholder="Wire #SUB-0028" />
              </div>
            </div>

            <hr className="hairline" style={{ margin: '20px 0' }} />

            <h2 className="section-title">Pre-flight</h2>
            <div style={{ marginTop: 12 }}>
              {checks.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule)', fontSize: 12.5 }}>
                  {c.pending ? (
                    <div className="loading-ring" style={{ width: 14, height: 14 }} />
                  ) : c.skip ? (
                    <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>○</span>
                  ) : c.pass ? (
                    <Check size={14} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                  ) : (
                    <X size={14} style={{ color: 'var(--ruby)', flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{c.label}</span>
                  {!c.skip && !c.pending && (
                    <Badge tone={c.pass ? 'ok' : 'danger'}>{c.pass ? 'OK' : 'BLOCK'}</Badge>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn bullion lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
              disabled={!allPass || saving}
            >
              {saving ? <><div className="loading-ring" style={{ width: 14, height: 14 }} /> Minting…</> : <><Hammer size={14} /> Mint {gramsNum > 0 ? `${gramsNum.toLocaleString()} g` : ''} → recipient</>}
            </button>
            {msg && <Toast msg={msg.text} ok={msg.ok} />}
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 8 }}>
              Requires SUPPLY_MODIFIER role · transaction signed by backend signer
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-pad">
            <Eyebrow>Vault headroom</Eyebrow>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10 }}>
              <Donut pct={donutPct} size={90} label="free" />
              <div>
                <div className="serif tnum" style={{ fontSize: 22 }}>
                  {(headroom / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}
                  <small style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4, fontFamily: 'var(--font-sans)' }}>kg</small>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>of {(reserveGrams / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} kg total</div>
              </div>
            </div>
            <hr className="hairline" style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ color: 'var(--ink-3)' }}>Vault weight</span>
                <span className="mono">{reserveGrams.toLocaleString()} g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ color: 'var(--ink-3)' }}>Circulating</span>
                <span className="mono">{totalSupplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })} g</span>
              </div>
              {gramsNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid var(--rule)', marginTop: 4, paddingTop: 6 }}>
                  <span style={{ color: 'var(--ink-3)' }}>After mint</span>
                  <span className={`mono ${afterSupply > reserveGrams ? 'text-ruby' : ''}`} style={{ color: afterSupply > reserveGrams ? 'var(--ruby)' : undefined }}>
                    {afterSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} g
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card card-pad">
            <Eyebrow>Guard rails</Eyebrow>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--ink-3)' }}>
              <div>● GoldToken.mint() reverts if supply exceeds vault weight</div>
              <div>● Recipient must be in IdentityRegistry</div>
              <div>● All compliance modules checked (min transfer, wallet cap, country)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
