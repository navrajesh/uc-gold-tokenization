import { useState, useEffect, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate, formatWeiToGrams } from '../lib/utils';
import type { Token } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';
import { Addr } from '../components/ui/Addr';

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 12,
      background: ok ? 'color-mix(in oklch, var(--emerald) 12%, transparent)' : 'var(--ruby-soft)',
      border: `1px solid color-mix(in oklch, ${ok ? 'var(--emerald)' : 'var(--ruby)'} 30%, transparent)`,
      color: ok ? 'var(--emerald)' : 'var(--ruby)',
    }}>
      {msg}
    </div>
  );
}

interface EnrichedToken extends Token {
  supplyGrams?: number;
}

const EMPTY_FORM = {
  address: '', name: '', symbol: '', deployer: '', txHash: '',
  complianceAddress: '', identityRegistryAddress: '', goldReserveAddress: '',
  purityStandard: '', custodianAddress: '',
};

export default function AdminRegistry() {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  const load = async () => {
    try {
      const tkns = await api.getTokens();
      const enriched = await Promise.allSettled(tkns.map(t => api.getToken(t.address)));
      const result: EnrichedToken[] = tkns.map((t, i) => {
        const r = enriched[i];
        if (r.status === 'fulfilled' && r.value.totalSupply) {
          return { ...t, supplyGrams: formatWeiToGrams(r.value.totalSupply, r.value.decimals ?? 18) };
        }
        return t;
      });
      setTokens(result);
    } catch (_) {}
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const f = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.registerToken({ ...form, decimals: 18 });
      setMsg({ text: `Token ${form.symbol} registered.`, ok: true });
      setForm(EMPTY_FORM); setOpen(false);
      load();
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  return (
    <div className="main-pad">
      <Eyebrow>Token registry</Eyebrow>
      <h1 className="page-title">Deployed tokens.</h1>
      <p className="page-sub">Each token is an ERC-3643-style UUPS proxy with its own compliance stack and gold reserve contract.</p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn" onClick={() => setOpen(!open)}>
          <Plus size={13} /> Register token
        </button>
      </div>

      {msg && <div style={{ marginTop: 12 }}><Toast msg={msg.text} ok={msg.ok} /></div>}

      {/* Register form */}
      {open && (
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Register deployed token</h2>
          <form onSubmit={submit}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Token address *</label>
                <input className="input mono" placeholder="0x…" value={form.address} onChange={f('address')} required />
              </div>
              <div className="field">
                <label>Name *</label>
                <input className="input" placeholder="Singapore Fine Gold" value={form.name} onChange={f('name')} required />
              </div>
              <div className="field">
                <label>Symbol *</label>
                <input className="input" placeholder="SGT999" value={form.symbol} onChange={f('symbol')} required />
              </div>
              <div className="field">
                <label>Deployer address *</label>
                <input className="input mono" placeholder="0x…" value={form.deployer} onChange={f('deployer')} required />
              </div>
              <div className="field">
                <label>Deploy tx hash *</label>
                <input className="input mono" placeholder="0x…" value={form.txHash} onChange={f('txHash')} required />
              </div>
              <div className="field">
                <label>Compliance address *</label>
                <input className="input mono" placeholder="0x…" value={form.complianceAddress} onChange={f('complianceAddress')} required />
              </div>
              <div className="field">
                <label>Identity registry address *</label>
                <input className="input mono" placeholder="0x…" value={form.identityRegistryAddress} onChange={f('identityRegistryAddress')} required />
              </div>
              <div className="field">
                <label>Gold reserve address</label>
                <input className="input mono" placeholder="0x…" value={form.goldReserveAddress} onChange={f('goldReserveAddress')} />
              </div>
              <div className="field">
                <label>Purity standard</label>
                <input className="input" placeholder="999.9" value={form.purityStandard} onChange={f('purityStandard')} />
              </div>
              <div className="field">
                <label>Custodian address</label>
                <input className="input mono" placeholder="0x…" value={form.custodianAddress} onChange={f('custodianAddress')} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Registering…' : 'Register'}
              </button>
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Token cards */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        {tokens.map(t => (
          <div key={t.address} className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Badge tone="bullion">{t.symbol}</Badge>
                <div className="serif" style={{ fontSize: 22, marginTop: 6 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  Purity {t.purityStandard ?? '—'} · ERC-3643 · UUPS
                </div>
              </div>
            </div>

            <hr className="hairline" style={{ margin: '14px 0' }} />

            <div className="grid-2" style={{ gap: 16, fontSize: 12 }}>
              <div>
                <div style={{ color: 'var(--ink-3)' }}>Circulating</div>
                <div className="serif tnum" style={{ fontSize: 18 }}>
                  {t.supplyGrams != null
                    ? t.supplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : '—'} <small style={{ fontSize: 11, color: 'var(--ink-3)' }}>g</small>
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--ink-3)' }}>Deployed</div>
                <div style={{ fontSize: 13, marginTop: 2 }}>{formatDate(t.deployedAt)}</div>
              </div>
            </div>

            <hr className="hairline" style={{ margin: '14px 0' }} />

            <div style={{ fontSize: 11.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--ink-3)' }}>Proxy</span>
                <Addr value={t.address} prefixLen={10} />
              </div>
              {t.custodianAddress && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Custodian</span>
                  <Addr value={t.custodianAddress} prefixLen={8} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add-token card */}
        <div
          className="card card-pad"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 200, color: 'var(--ink-3)', border: '1px dashed var(--rule-strong)', cursor: 'pointer' }}
          onClick={() => setOpen(true)}
        >
          <Plus size={24} />
          <div className="serif" style={{ fontSize: 18, color: 'var(--ink)' }}>Register a new token</div>
          <button className="btn ghost sm" onClick={e => { e.stopPropagation(); setOpen(true); }}>Begin deployment</button>
        </div>
      </div>
    </div>
  );
}
