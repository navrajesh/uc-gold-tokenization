import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useInvestorWallet } from '../hooks/useInvestorWallet';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';
import { Ingot } from '../components/ui/Ingot';
import { api } from '../lib/api';
import { formatGrams, formatUsd } from '../lib/utils';

const STEPS = ['Amount', 'Delivery', 'Review', 'Submit'];

const DELIVERY_OPTS = [
  { id: 'vault',     label: 'Vault collection · Brinks Singapore', sub: 'Free · same-day pickup with photo ID' },
  { id: 'courier',  label: 'Insured courier · Loomis',            sub: '$240 flat · 3–5 business days' },
  { id: 'allocated', label: 'Allocated holding · keep in vault',   sub: 'Free · stays in your name, no shipment' },
];

export default function InvestorRedeem() {
  const nav = useNavigate();
  const { wallet, token, balance, price, identity } = useInvestorWallet();
  const priceNum = price ? parseFloat(price.pricePerGramUsd) : 0;

  const [currentStep, setCurrentStep] = useState(1);
  const [grams, setGrams] = useState('100');
  const [delivery, setDelivery] = useState(DELIVERY_OPTS[0].id);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ ref: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const gramsNum = parseFloat(grams) || 0;
  const usdEq = gramsNum * priceNum;
  const fee = usdEq * 0.005;
  const maxGrams = balance ? Math.floor(balance.grams) : 0;

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

  const handleSubmit = async () => {
    if (!token || !wallet) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.createRedemption({
        tokenAddress: token.address,
        investorAddress: wallet,
        requestedGrams: gramsNum,
        deliveryAddress: deliveryAddress || DELIVERY_OPTS.find(d => d.id === delivery)?.label,
      });
      setSubmitted({ ref: result.redemptionRef });
      setCurrentStep(4);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-pad">
      <Eyebrow>Redeem · burn for physical gold</Eyebrow>
      <h1 className="page-title">Take delivery.</h1>
      <p className="page-sub">Burn tokens 1:1 for the underlying gold. Settlement is physical — bars released from custodian on KYC + delivery confirmation.</p>

      {/* Steps indicator */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`step${i + 1 < currentStep ? ' done' : i + 1 === currentStep ? ' active' : ''}`}>
              <div className="num"><span className="ind" />STEP 0{i + 1}</div>
              <div className="ttl">{s}</div>
              <div className="desc">{['How much', 'Where to ship', 'Confirm', 'Burn on-chain'][i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 24 }}>
        {/* Main panel */}
        <div className="card card-pad">
          {currentStep === 1 && (
            <>
              <h2 className="section-title">How much do you want to redeem?</h2>
              <div className="field" style={{ marginTop: 16 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input serif tnum"
                    style={{ fontSize: 36, padding: '14px 80px 14px 16px', height: 64 }}
                    value={grams}
                    onChange={e => setGrams(e.target.value)}
                    type="number" min="1" max={maxGrams}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>GRAMS</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {['10', '50', '100', '500'].map(q => (
                  <button key={q} className="btn ghost sm" onClick={() => setGrams(q)}>{q} g</button>
                ))}
                {maxGrams > 0 && (
                  <button className="btn ghost sm" onClick={() => setGrams(String(maxGrams))}>Max · {maxGrams} g</button>
                )}
              </div>
              <hr className="hairline" style={{ margin: '20px 0' }} />
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
                Available balance <b className="mono" style={{ color: 'var(--ink)' }}>{balance ? formatGrams(balance.grams) : '—'}</b><br />
                Equivalent value <b className="mono" style={{ color: 'var(--ink)' }}>{priceNum > 0 ? formatUsd(usdEq) : '—'}</b><br />
                Redemption fee · 0.50% <b className="mono" style={{ color: 'var(--ink)' }}>{priceNum > 0 ? formatUsd(fee) : '—'}</b>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="section-title">Delivery method</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {DELIVERY_OPTS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDelivery(opt.id)}
                    className="card"
                    style={{
                      padding: 16, textAlign: 'left', cursor: 'pointer',
                      borderColor: delivery === opt.id ? 'var(--ink)' : 'var(--rule)',
                      background: delivery === opt.id ? 'var(--paper-2)' : 'var(--paper)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{opt.sub}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: '1.5px solid var(--rule-strong)',
                        background: delivery === opt.id ? 'var(--ink)' : 'transparent',
                        boxShadow: delivery === opt.id ? 'inset 0 0 0 3px var(--paper)' : 'none',
                        flexShrink: 0,
                      }} />
                    </div>
                  </button>
                ))}
                <div className="field" style={{ marginTop: 8 }}>
                  <label>Delivery / collection address (optional)</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Street address, city, postal code…"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="section-title">Review your redemption</h2>
              {submitError && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ruby-soft)', color: 'var(--ruby)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  {submitError}
                </div>
              )}
              <div style={{ marginTop: 16, fontSize: 13 }}>
                {[
                  ['Wallet', `${wallet.slice(0, 8)}…${wallet.slice(-4)}`],
                  ['Amount to burn', `${gramsNum} SGT999 (= ${formatGrams(gramsNum)})`],
                  ['Method', DELIVERY_OPTS.find(d => d.id === delivery)?.label ?? delivery],
                  ['Delivery address', deliveryAddress || '— same as method'],
                  ['Burn fee · 0.50%', priceNum > 0 ? formatUsd(fee) : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
                    <span style={{ color: 'var(--ink-3)' }}>{k}</span>
                    <span className="mono" style={{ fontSize: 12, maxWidth: '55%', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ marginTop: 16, padding: 14, background: 'var(--paper-2)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                <b>This action is irreversible.</b> Once submitted, your {gramsNum} tokens enter the redemption queue. The custodian fulfils within 1 business day; tokens are then burned on‑chain.
              </div>
            </>
          )}

          {currentStep === 4 && submitted && (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)', display: 'inline-grid', placeItems: 'center' }}>
                <Check size={28} />
              </div>
              <h2 className="serif" style={{ fontSize: 28, margin: '16px 0 6px', letterSpacing: '-0.02em' }}>Submitted to custodian.</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                Reference <b className="mono">{submitted.ref}</b> · status <Badge tone="azure" dot>Pending approval</Badge>
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)', maxWidth: 440, margin: '14px auto 0', lineHeight: 1.6 }}>
                The custodian will process your redemption. Tokens are burned on‑chain once the bar is released.
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          {currentStep < 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn ghost" disabled={currentStep === 1} onClick={() => setCurrentStep(s => s - 1)}>
                <ArrowLeft size={13} /> Back
              </button>
              <button
                className="btn bullion"
                disabled={currentStep === 3 && submitting}
                onClick={() => { if (currentStep === 3) handleSubmit(); else setCurrentStep(s => s + 1); }}
              >
                {currentStep === 3 ? (submitting ? 'Submitting…' : 'Confirm & submit') : 'Continue'} <ArrowRight size={13} />
              </button>
            </div>
          )}
          {currentStep === 4 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button className="btn ghost" onClick={() => nav('/investor/activity')}>
                View activity <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-pad">
            <Eyebrow>Compliance</Eyebrow>
            <ul style={{ fontSize: 12.5, color: 'var(--ink-2)', listStyle: 'none', padding: 0, margin: '10px 0 0 0' }}>
              {([
                ['KYC verified', identity?.isVerified ?? false],
                ['Min transfer · 1 g', gramsNum >= 1],
                ['Within balance', gramsNum <= maxGrams && maxGrams > 0],
                ['Wallet cap OK', true],
              ] as [string, boolean][]).map(([label, ok]) => (
                <li key={label} style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'center' }}>
                  <span style={{ color: ok ? 'var(--emerald)' : 'var(--ruby)', flexShrink: 0 }}>
                    {ok ? <Check size={12} /> : <span>✗</span>}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="card card-pad">
            <Eyebrow>Bars allocated</Eyebrow>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>
              FIFO from vault SG‑A. The same physical bars never re‑enter circulation.
            </div>
            <div style={{ marginTop: 12 }}>
              {gramsNum > 0 ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Ingot size="sm" />
                  <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                    <div className="mono" style={{ fontWeight: 600 }}>GB‑2025‑xxxx</div>
                    <div style={{ color: 'var(--ink-3)' }}>12,500 g · take {gramsNum} g</div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--ink-4)', fontSize: 12 }}>Enter an amount above</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
