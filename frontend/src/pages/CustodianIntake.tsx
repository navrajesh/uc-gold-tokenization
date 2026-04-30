import { useState, useEffect, FormEvent } from 'react';
import { api } from '../lib/api';
import type { Token } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Addr } from '../components/ui/Addr';

const VAULTS = [
  { id: 'SG-A', custodian: 'Brinks Singapore' },
  { id: 'CH-Z', custodian: 'Loomis Zürich' },
  { id: 'HK-1', custodian: 'Brinks Hong Kong' },
];
const REFINERS = ['PAMP Suisse', 'Metalor', 'Argor-Heraeus', 'Perth Mint', 'Royal Canadian Mint'];

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

export default function CustodianIntake() {
  const [tokens, setTokens]         = useState<Token[]>([]);
  const [reserveGrams, setReserveGrams] = useState(0);
  const [form, setForm]             = useState({
    barId: '', vaultId: 'SG-A', custodian: 'Brinks Singapore',
    weightGrams: '', purityBps: '9999', assayRef: '', tokenAddress: '',
  });
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.getTokens().then(tkns => {
      setTokens(tkns);
      if (tkns[0]) {
        setForm(f => ({ ...f, tokenAddress: tkns[0].address }));
        api.getReserves(tkns[0].address).then(res => {
          setReserveGrams(res.bars.filter(b => b.active).reduce((s, b) => s + b.weightGrams, 0));
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const gramsNum    = parseFloat(form.weightGrams) || 0;
  const afterReserve = reserveGrams + gramsNum;

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.registerBar({
        tokenAddress: form.tokenAddress,
        barId: form.barId,
        weightGrams: Number(form.weightGrams),
        purityBps: Number(form.purityBps),
        vaultId: form.vaultId,
        custodian: form.custodian,
        assayRef: form.assayRef,
      });
      setMsg({ text: `Bar ${form.barId} registered on-chain. Reserve +${gramsNum.toLocaleString()} g.`, ok: true });
      setReserveGrams(r => r + gramsNum);
      setForm(f => ({ ...f, barId: '', weightGrams: '', assayRef: '' }));
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  const custodianWallet = tokens[0]?.custodianAddress ?? '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  return (
    <div className="main-pad">
      <Eyebrow>Bar intake</Eyebrow>
      <h1 className="page-title">Register a new bar.</h1>
      <p className="page-sub">Assay → photograph → register on-chain in GoldReserve. Vault headroom updates immediately.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 24 }}>
        {/* Bar form */}
        <div className="card card-pad">
          <h2 className="section-title">Bar details</h2>
          <form onSubmit={submit}>
            <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
              <div className="field">
                <label>Bar ID *</label>
                <input className="input mono" placeholder="GB-2025-0143" value={form.barId} onChange={f('barId')} required />
              </div>
              <div className="field">
                <label>Vault</label>
                <select className="select" onChange={e => {
                  const v = VAULTS.find(v => v.id === e.target.value);
                  if (v) setForm(p => ({ ...p, vaultId: v.id, custodian: v.custodian }));
                }}>
                  {VAULTS.map(v => <option key={v.id} value={v.id}>{v.id} · {v.custodian}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Weight (grams) *</label>
                <input className="input serif tnum" style={{ fontSize: 22, padding: '10px 14px' }}
                  type="number" min="1" placeholder="12500"
                  value={form.weightGrams} onChange={f('weightGrams')} required />
              </div>
              <div className="field">
                <label>Purity (bps)</label>
                <input className="input mono" placeholder="9999" value={form.purityBps} onChange={f('purityBps')} required />
                <span className="hint">9999 = 999.9‰ · 9160 = 916.0‰</span>
              </div>
              <div className="field">
                <label>Assay reference</label>
                <input className="input mono" placeholder="LBMA-SG-0143" value={form.assayRef} onChange={f('assayRef')} />
              </div>
              <div className="field">
                <label>Refiner</label>
                <select className="select">
                  {REFINERS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              {tokens.length > 1 && (
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Token *</label>
                  <select className="select" value={form.tokenAddress} onChange={e => setForm(p => ({ ...p, tokenAddress: e.target.value }))}>
                    {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
                  </select>
                </div>
              )}
            </div>

            <button type="submit" className="btn bullion lg" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} disabled={saving}>
              {saving ? 'Registering on-chain…' : 'Register on-chain · GoldReserve.registerBar()'}
            </button>
            {msg && <Toast msg={msg.text} ok={msg.ok} />}
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-pad">
            <Eyebrow>Effect on reserve</Eyebrow>
            <div style={{ marginTop: 12, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--rule)' }}>
                <span style={{ color: 'var(--ink-3)' }}>Before</span>
                <span className="mono">{reserveGrams.toLocaleString()} g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--rule)' }}>
                <span style={{ color: 'var(--ink-3)' }}>+ This bar</span>
                <span className="mono" style={{ color: gramsNum > 0 ? 'var(--emerald)' : undefined }}>
                  {gramsNum > 0 ? `+${gramsNum.toLocaleString()}` : '—'} g
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <b>After</b>
                <span className="serif tnum" style={{ fontSize: 18 }}>
                  {gramsNum > 0 ? afterReserve.toLocaleString() : '—'} g
                </span>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <Eyebrow>Custodian signature</Eyebrow>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6 }}>
              This action is signed with your CUSTODIAN_ROLE key. The on-chain event includes your vault ID, weight, and assay reference.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--paper-3)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 16 }}>
                ◆
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{form.custodian}</div>
                <Addr value={custodianWallet} prefixLen={8} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
