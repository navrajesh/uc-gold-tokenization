import { useState, useEffect, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate, shortAddress } from '../lib/utils';
import type { Token, Identity } from '../lib/types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge, StatusBadge } from '../components/ui/Badge';
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

export default function AdminKyc() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [tokens, setTokens]         = useState<Token[]>([]);
  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState({ address: '', countryCode: '', tokenAddress: '' });
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => Promise.all([api.getIdentities(), api.getTokens()]).then(([ids, tkns]) => {
    setIdentities(ids);
    setTokens(tkns);
    if (!form.tokenAddress && tkns[0]) setForm(f => ({ ...f, tokenAddress: tkns[0].address }));
  }).catch(() => {});

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.registerIdentity({ ...form, verified: true });
      setMsg({ text: `KYC registered on-chain for ${shortAddress(form.address)}.`, ok: true });
      setForm(f => ({ ...f, address: '', countryCode: '' }));
      setOpen(false);
      load();
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  return (
    <div className="main-pad">
      <Eyebrow>KYC queue</Eyebrow>
      <h1 className="page-title">Onboard new wallets.</h1>
      <p className="page-sub">Verify, register on-chain in IdentityRegistry, and the wallet can hold and transfer immediately.</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="ok">{identities.filter(i => i.isVerified).length} verified</Badge>
          <Badge>{identities.length} total</Badge>
        </div>
        <button className="btn" onClick={() => setOpen(!open)}>
          <Plus size={13} /> Register identity
        </button>
      </div>

      {msg && <div style={{ marginTop: 12 }}><Toast msg={msg.text} ok={msg.ok} /></div>}

      {/* Register form */}
      {open && (
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Register KYC identity</h2>
          <form onSubmit={submit}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Wallet address *</label>
                <input className="input mono" placeholder="0x…" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Country code (ISO 3166-1)</label>
                <input className="input" placeholder="SG" maxLength={2} value={form.countryCode} onChange={e => setForm(f => ({ ...f, countryCode: e.target.value.toUpperCase() }))} />
              </div>
              {tokens.length > 0 && (
                <div className="field">
                  <label>Token registry *</label>
                  <select className="select" value={form.tokenAddress} onChange={e => setForm(f => ({ ...f, tokenAddress: e.target.value }))}>
                    {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Registering…' : 'Register on-chain'}
              </button>
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* KYC registry table */}
      <div className="card" style={{ marginTop: 16 }}>
        {identities.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            No identities registered yet. KYC-verified wallets can receive and transfer tokens.
          </div>
        ) : (
          <div className="scroll-x">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {identities.map(id => (
                  <tr key={id.address}>
                    <td><Addr value={id.address} prefixLen={10} /></td>
                    <td>
                      {id.countryCode ? <Badge>{id.countryCode}</Badge> : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                    </td>
                    <td><StatusBadge status={id.isVerified ? 'Active' : 'Inactive'} /></td>
                    <td className="muted">{formatDate(id.registeredAt)}</td>
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
