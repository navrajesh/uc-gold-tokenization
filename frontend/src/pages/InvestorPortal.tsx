import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Download, ArrowLeftRight, ArrowRight, LogOut, Check, X } from 'lucide-react';
import { useInvestorWallet } from '../hooks/useInvestorWallet';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Sparkline } from '../components/ui/Sparkline';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Donut } from '../components/ui/Donut';
import { Addr } from '../components/ui/Addr';
import { formatGrams, formatUsd, formatWeiToGrams, shortAddress } from '../lib/utils';

const SPARK = [88, 89, 87, 90, 91, 90, 92, 93, 92, 94, 95, 93, 96, 94, 95, 96];

const DEMO_WALLETS = [
  { label: 'Maya Chen', addr: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
  { label: 'Treasury Ops', addr: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
];

export default function InvestorPortal() {
  const nav = useNavigate();
  const { wallet, token, balance, price, identity, redemptions, reserveGrams, loading, error, setWallet, clearWallet } = useInvestorWallet();
  const [input, setInput] = useState('');

  const priceNum = price ? parseFloat(price.pricePerGramUsd) : 0;
  const usdValue = balance ? balance.grams * priceNum : 0;
  const totalSupplyGrams = token?.totalSupply ? formatWeiToGrams(token.totalSupply, token.decimals ?? 18) : 0;
  const multiplier = reserveGrams > 0 && totalSupplyGrams > 0 ? reserveGrams / totalSupplyGrams : 1;
  const donutPct = Math.min(100, Math.round(multiplier * 100));
  const sparkData = SPARK.map(v => v * (priceNum > 0 ? priceNum / 92.56 : 1));

  if (!wallet) {
    return (
      <div className="main-pad">
        <Eyebrow>Investor · SGT999</Eyebrow>
        <h1 className="page-title">Your gold, on‑chain.</h1>
        <p className="page-sub">Holdings read live from the blockchain at every refresh — no caching, no off‑chain ledger.</p>
        <div className="card" style={{ marginTop: 32, padding: 24, maxWidth: 480 }}>
          <h2 className="section-title" style={{ marginBottom: 14 }}>Connect wallet</h2>
          <div className="field">
            <label>Wallet address</label>
            <input
              className="input mono"
              placeholder="0x…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input.trim() && setWallet(input)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Demo:</span>
            {DEMO_WALLETS.map(w => (
              <button key={w.addr} className="btn ghost sm" onClick={() => { setInput(w.addr); setWallet(w.addr); }}>
                {w.label}
              </button>
            ))}
          </div>
          <button
            className="btn bullion"
            style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
            disabled={!input.trim()}
            onClick={() => setWallet(input)}
          >
            <Search size={13} /> Load holdings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Eyebrow>Welcome back</Eyebrow>
          <h1 className="page-title">Your gold, on‑chain.</h1>
          <p className="page-sub">Holdings read live from the blockchain at every refresh — no caching, no off‑chain ledger.</p>
        </div>
        <button className="btn ghost sm" style={{ marginTop: 8, flexShrink: 0 }} onClick={clearWallet}>
          <LogOut size={12} /> {shortAddress(wallet)}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: '10px 16px', background: 'var(--ruby-soft)', border: '1px solid color-mix(in oklch, var(--ruby) 40%, transparent)', borderRadius: 'var(--radius)', color: 'var(--ruby)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32, color: 'var(--ink-3)', fontSize: 13 }}>
          <div className="loading-ring" />
          Loading from chain…
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, marginTop: 24 }}>
            {/* Hero balance card */}
            <div className="card card-pad" style={{ background: 'linear-gradient(180deg, var(--paper) 0%, var(--bullion-soft) 200%)' }}>
              <Eyebrow>Holdings · {token?.symbol ?? 'SGT999'}</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 10, gap: 12 }}>
                <div className="serif tnum" style={{ fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.025em' }}>
                  {balance ? balance.grams.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
                <Badge tone="bullion">grams</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 12 }}>
                <span className="serif tnum" style={{ fontSize: 22, color: 'var(--bullion-2)' }}>
                  {balance ? formatUsd(usdValue) : '$0.00'}
                </span>
                {priceNum > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>@ {formatUsd(priceNum)}/g</span>
                )}
              </div>
              {sparkData.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Sparkline data={sparkData} w={400} h={48} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn bullion" onClick={() => nav('/investor/mint')}>
                  <Plus size={13} /> Mint more
                </button>
                <button className="btn ghost" onClick={() => nav('/investor/redeem')}>
                  <Download size={13} /> Redeem
                </button>
                <button className="btn ghost" onClick={() => nav('/investor/activity')}>
                  <ArrowLeftRight size={13} /> Activity
                </button>
              </div>
            </div>

            {/* Identity card */}
            <div className="card card-pad">
              <Eyebrow>Identity</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: identity?.isVerified ? 'var(--emerald-soft)' : 'var(--ruby-soft)',
                  color: identity?.isVerified ? 'var(--emerald)' : 'var(--ruby)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  {identity?.isVerified ? <Check size={18} /> : <X size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {identity?.isVerified ? 'KYC Verified' : identity === null ? 'Not registered' : 'Not verified'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {identity?.isVerified ? 'Identity registry · on-chain' : 'Contact admin to register'}
                  </div>
                </div>
              </div>
              <hr className="hairline" style={{ margin: '14px 0' }} />
              <div style={{ fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Country</span>
                  <span>{identity?.countryCode ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Wallet</span>
                  <Addr value={wallet} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Status</span>
                  <Badge tone={identity?.isVerified ? 'ok' : 'danger'}>
                    {identity?.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
              <button className="btn ghost sm" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => nav('/investor/identity')}>
                View Identity <ArrowRight size={11} />
              </button>
            </div>

            {/* Reserve coverage card */}
            <div className="card card-pad">
              <Eyebrow>Reserve coverage</Eyebrow>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12 }}>
                <Donut pct={donutPct} size={88} label="backed" />
                <div>
                  <div className="serif tnum" style={{ fontSize: 22 }}>{multiplier.toFixed(4)}×</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                    {reserveGrams.toLocaleString()} g vault<br />
                    {totalSupplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })} g supply
                  </div>
                </div>
              </div>
              <button className="btn ghost sm" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => nav('/')}>
                View Proof of Reserve <ArrowRight size={11} />
              </button>
            </div>
          </div>

          {/* Recent activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="section-title">Recent activity</h2>
              <button className="btn ghost sm" onClick={() => nav('/investor/activity')}>
                All activity <ArrowRight size={11} />
              </button>
            </div>
            <div className="card">
              {redemptions.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                  No redemption history yet
                </div>
              ) : (
                redemptions.slice(0, 5).map((r, i, a) => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 20px',
                    borderBottom: i < Math.min(a.length, 5) - 1 ? '1px solid var(--rule)' : 0,
                  }}>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)', width: 100, flexShrink: 0 }}>
                      {new Date(r.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <Badge tone="danger">Redeem</Badge>
                    <span className="serif tnum" style={{ fontSize: 16, flex: 1, color: 'var(--ruby)' }}>
                      −{formatGrams(r.requestedGrams)}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {r.redemptionRef}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
