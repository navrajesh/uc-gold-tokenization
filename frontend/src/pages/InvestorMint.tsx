import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useInvestorWallet } from '../hooks/useInvestorWallet';
import { Eyebrow } from '../components/ui/Eyebrow';
import { formatUsd, formatWeiToGrams } from '../lib/utils';

const SETTLE_OPTIONS = ['USD wire', 'USDC', 'SGD wire'];

export default function InvestorMint() {
  const nav = useNavigate();
  const { wallet, token, price, reserveGrams, identity, balance } = useInvestorWallet();
  const priceNum = price ? parseFloat(price.pricePerGramUsd) : 0;
  const totalSupplyGrams = token?.totalSupply ? formatWeiToGrams(token.totalSupply, token.decimals ?? 18) : 0;
  const headroomGrams = Math.max(0, reserveGrams - totalSupplyGrams);

  const [grams, setGrams] = useState('100');
  const [settle, setSettle] = useState('USD wire');
  const [submitted, setSubmitted] = useState(false);

  const gramsNum = parseFloat(grams) || 0;
  const usd = gramsNum * priceNum;
  const fee = usd * 0.0025;

  if (!wallet) {
    return (
      <div className="main-pad" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div className="serif" style={{ fontSize: 24 }}>No wallet selected</div>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 8 }}>Set your wallet on the Holdings page first.</p>
        <button className="btn bullion" style={{ marginTop: 16 }} onClick={() => nav('/investor')}>
          <ArrowLeft size={13} /> Go to Holdings
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="main-pad" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)', display: 'inline-grid', placeItems: 'center' }}>
          <Check size={28} />
        </div>
        <h2 className="serif" style={{ fontSize: 28, margin: '16px 0 6px', letterSpacing: '-0.02em' }}>Order received.</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 400, margin: '0 auto' }}>
          POC demo — in production, wire instructions for {formatUsd(usd + fee)} would be sent to your registered email. Tokens mint to your wallet on T+1 settlement.
        </p>
        <button className="btn ghost" style={{ marginTop: 24 }} onClick={() => nav('/investor')}>
          <ArrowLeft size={13} /> Back to Holdings
        </button>
      </div>
    );
  }

  return (
    <div className="main-pad">
      <Eyebrow>Mint · subscribe to gold</Eyebrow>
      <h1 className="page-title">Buy tokenised gold.</h1>
      <p className="page-sub">Each token equals one gram of LBMA‑grade gold held in a custodian vault. Subscriptions clear on T+1 by wire transfer.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 24 }}>
        <div className="card card-pad">
          <h2 className="section-title">Order</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
            <div className="field">
              <label>Quantity</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input serif tnum"
                  style={{ fontSize: 28, padding: '12px 64px 12px 14px', height: 56 }}
                  value={grams}
                  onChange={e => setGrams(e.target.value)}
                  type="number" min="1"
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>GRAMS</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {['10', '100', '500', '1000'].map(q => (
                  <button key={q} className="btn ghost sm" onClick={() => setGrams(q)}>{q}g</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Settlement</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SETTLE_OPTIONS.map(s => (
                  <button
                    key={s}
                    className="btn ghost sm"
                    style={s === settle ? { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' } : {}}
                    onClick={() => setSettle(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="hint" style={{ marginTop: 8 }}>Funds clear by 09:00 SGT next business day. Tokens mint to your wallet on settlement.</div>
            </div>
          </div>

          <hr className="hairline" style={{ margin: '20px 0' }} />

          <h2 className="section-title">Pricing</h2>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            {[
              ['XAU/USD spot',          priceNum > 0 ? `${formatUsd(priceNum * 31.1035)} / oz` : '—'],
              ['Per‑gram',              priceNum > 0 ? `${formatUsd(priceNum)} / g` : '—'],
              ['Quantity',              `${gramsNum} g`],
              ['Subtotal',              priceNum > 0 ? formatUsd(usd) : '—'],
              ['Custody fee · 0.40% p.a.', '$0.00'],
              ['Issuance fee · 0.25%',  priceNum > 0 ? formatUsd(fee) : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                <span style={{ color: 'var(--ink-3)' }}>{k}</span>
                <span className="mono">{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Total due</span>
              <span className="serif tnum" style={{ fontSize: 26, color: 'var(--ink)' }}>
                {priceNum > 0 ? formatUsd(usd + fee) : '—'}
              </span>
            </div>
          </div>

          <button
            className="btn bullion lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
            onClick={() => setSubmitted(true)}
            disabled={!priceNum || gramsNum < 1}
          >
            Reserve {gramsNum} g · Confirm wire instructions <ArrowRight size={14} />
          </button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8 }}>
            POC demo · no actual payment is initiated
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-pad">
            <Eyebrow>Reserve check</Eyebrow>
            <div className="serif tnum" style={{ fontSize: 26, marginTop: 8 }}>
              {headroomGrams > 0 ? (headroomGrams / 1000).toFixed(1) : '—'} kg
              <small style={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--ink-3)', marginLeft: 4 }}>headroom</small>
            </div>
            <div className="hint" style={{ marginTop: 8 }}>
              {reserveGrams > 0
                ? `Mint guard live — vault: ${reserveGrams.toLocaleString()} g · supply: ${totalSupplyGrams.toLocaleString('en-US', { maximumFractionDigits: 0 })} g.`
                : 'Connect backend to see reserve.'}
            </div>
            <hr className="hairline" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: identity?.isVerified ? 'var(--emerald)' : 'var(--ruby)', flexShrink: 0 }} />
              <span style={{ fontSize: 12 }}>
                {identity?.isVerified ? 'Compliance pre-check passed' : 'KYC verification required'}
              </span>
            </div>
            <ul style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '8px 0 0 0', paddingLeft: 16, lineHeight: 1.7 }}>
              <li>KYC: {identity?.isVerified ? `verified (${identity.countryCode ?? '—'})` : 'not verified'}</li>
              <li>Balance: {balance ? formatUsd(balance.grams * priceNum) : '—'}</li>
              <li>Min size: 1 g · {gramsNum >= 1 ? 'OK' : 'too small'}</li>
            </ul>
          </div>

          <div className="card card-pad">
            <Eyebrow>What happens next</Eyebrow>
            <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '12px 0 0 0' }}>
              {[
                'Confirm order · receive wire instructions',
                'Send funds (USD/USDC) before T+1 09:00 SGT',
                'Tokens minted on‑chain to your wallet',
                'Vault attestation updated within 24h',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--rule)', gap: 10, alignItems: 'flex-start' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', width: 18, marginTop: 2, flexShrink: 0 }}>0{i + 1}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
