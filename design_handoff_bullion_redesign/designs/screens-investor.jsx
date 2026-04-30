/* eslint-disable */
// Investor screens: Holdings, Mint, Redeem (multi-step), Activity, KYC

const { useState: useStateInv } = React;

const InvHoldings = () => (
  <div className="main-pad">
    <Eyebrow>Welcome back, Maya</Eyebrow>
    <h1 className="page-title">Your gold, on‑chain.</h1>
    <p className="page-sub">Holdings read live from the blockchain at every refresh — no caching, no off‑chain ledger.</p>

    <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
      <Card pad style={{ background: 'linear-gradient(180deg, var(--paper) 0%, var(--bullion-soft) 200%)' }}>
        <Eyebrow>Holdings · SGT999</Eyebrow>
        <div className="row" style={{ alignItems: 'baseline', marginTop: 10, gap: 12 }}>
          <div className="serif tnum" style={{ fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.025em' }}>1,000.00</div>
          <Badge tone="bullion">grams</Badge>
        </div>
        <div className="row mt-3" style={{ gap: 18 }}>
          <span className="serif tnum" style={{ fontSize: 22, color: 'var(--bullion-2)' }}>$92,560.00</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>@ $92.56/g · <span className="text-emerald">+0.42%</span> 24h</span>
        </div>
        <Sparkline data={[88,89,87,90,91,90,92,93,92,94,95,93,96,94,95,96]} w={400} h={48} />
        <div className="row mt-3" style={{ gap: 8 }}>
          <button className="btn bullion"><I.plus size={13} />Mint more</button>
          <button className="btn ghost"><I.arrowDown size={13} />Redeem physical</button>
          <button className="btn ghost"><I.arrowSwap size={13} />Transfer</button>
        </div>
      </Card>

      <Card pad>
        <Eyebrow>Identity</Eyebrow>
        <div className="row mt-3" style={{ alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)', display: 'grid', placeItems: 'center' }}><I.check size={18} /></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>KYC Verified</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>ONCHAINID · Tokeny verifier</div>
          </div>
        </div>
        <hr className="hairline" style={{ margin: '14px 0' }} />
        <div style={{ fontSize: 12 }}>
          <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Country</span><span>Singapore</span></div>
          <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Wallet</span><Addr value="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" /></div>
          <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Tier</span><Badge tone="bullion">Retail · 10kg cap</Badge></div>
        </div>
      </Card>

      <Card pad>
        <Eyebrow>Reserve coverage</Eyebrow>
        <div className="row mt-3" style={{ gap: 14, alignItems: 'center' }}>
          <Donut pct={100} size={88} label="backed" />
          <div>
            <div className="serif tnum" style={{ fontSize: 22 }}>1.0001×</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>1,000,122 g vault<br/>999,872 g supply</div>
          </div>
        </div>
        <button className="btn ghost sm mt-3" style={{ width: '100%' }}>View Proof of Reserve <I.arrowR size={11} /></button>
      </Card>
    </div>

    {/* Recent activity */}
    <div className="section mt-8">
      <div className="section-hd">
        <h2 className="section-title">Recent activity</h2>
        <button className="btn ghost sm">All activity <I.arrowR size={11} /></button>
      </div>
      <Card>
        {[
          { d: 'Today, 14:22', t: 'Mint',     g: '+50.00 g',  s: 'Confirmed', tx: '0xa1f4…2c91' },
          { d: 'Sep 28',       t: 'Transfer in', g: '+12.50 g', s: 'Confirmed', tx: '0x88c2…9def' },
          { d: 'Sep 22',       t: 'Redeem',   g: '−100.00 g', s: 'Fulfilled', tx: '0x44de…0c14' },
          { d: 'Sep 14',       t: 'Mint',     g: '+1,037.50 g', s: 'Confirmed', tx: '0xff19…ab02' },
        ].map((r, i, a) => (
          <div key={i} className="row" style={{ padding: '14px 20px', borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0, gap: 16 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)', width: 110 }}>{r.d}</span>
            <Badge tone={r.t === 'Redeem' ? 'danger' : r.t === 'Mint' ? 'bullion' : 'ghost'}>{r.t}</Badge>
            <span className="serif tnum" style={{ fontSize: 16, flex: 1, color: r.g.startsWith('−') ? 'var(--ruby)' : 'var(--ink)' }}>{r.g}</span>
            <span className="addr">{r.tx}</span>
            <Badge tone="ok" dot>{r.s}</Badge>
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const InvMint = () => {
  const [grams, setG] = useStateInv('100');
  const usd = (Number(grams) || 0) * 92.56;
  return (
    <div className="main-pad">
      <Eyebrow>Mint · subscribe to gold</Eyebrow>
      <h1 className="page-title">Buy tokenised gold.</h1>
      <p className="page-sub">Each token equals one gram of LBMA‑grade gold held in a custodian vault. Subscriptions clear on T+1 by wire transfer.</p>

      <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <Card pad>
          <h2 className="section-title">Order</h2>
          <div className="grid-2 mt-4" style={{ gap: 20 }}>
            <div className="field">
              <label>Quantity</label>
              <div style={{ position: 'relative' }}>
                <input className="input serif tnum" style={{ fontSize: 28, padding: '12px 64px 12px 14px', height: 56 }} value={grams} onChange={e=>setG(e.target.value)} />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>GRAMS</span>
              </div>
              <div className="row gap-2 mt-2">
                {['10','100','500','1000'].map(q => <button key={q} className="btn ghost sm" onClick={()=>setG(q)}>{q}g</button>)}
              </div>
            </div>
            <div className="field">
              <label>Settlement</label>
              <div className="row gap-2">
                {['USD wire','USDC','SGD wire'].map((p,i) => (
                  <button key={p} className="btn ghost sm" style={i === 0 ? { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' } : {}}>{p}</button>
                ))}
              </div>
              <div className="hint mt-2">Funds clear by 09:00 SGT next business day. Tokens mint to your wallet on settlement.</div>
            </div>
          </div>

          <hr className="hairline" style={{ margin: '20px 0' }} />

          <h2 className="section-title">Pricing</h2>
          <div className="mt-3" style={{ fontSize: 13 }}>
            {[
              ['XAU/USD spot',     '$2,418.74 / oz'],
              ['Per‑gram',          '$92.56 / g'],
              ['Quantity',          `${grams} g`],
              ['Subtotal',          `$${usd.toLocaleString(undefined,{maximumFractionDigits:2})}`],
              ['Custody fee · 0.40% p.a. accrued', '$0.00'],
              ['Issuance fee · 0.25%', `$${(usd*0.0025).toFixed(2)}`],
            ].map(([k,v]) => (
              <div key={k} className="between" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                <span className="text-ink-3">{k}</span><span className="mono">{v}</span>
              </div>
            ))}
            <div className="between" style={{ padding: '12px 0' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Total due</span>
              <span className="serif tnum" style={{ fontSize: 26, color: 'var(--ink)' }}>${(usd*1.0025).toLocaleString(undefined,{maximumFractionDigits:2})}</span>
            </div>
          </div>

          <button className="btn bullion lg w-full mt-3" style={{ justifyContent: 'center' }}>
            Reserve {grams} g · Confirm wire instructions <I.arrowR size={14} />
          </button>
          <div className="hint mt-2" style={{ textAlign: 'center' }}>Quote held for 30 seconds · refreshes automatically</div>
        </Card>

        <div className="col">
          <Card pad>
            <Eyebrow>Reserve check</Eyebrow>
            <div className="serif tnum mt-2" style={{ fontSize: 26 }}>250.4 kg<small style={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--ink-3)', marginLeft: 4 }}>headroom</small></div>
            <div className="hint mt-2">Mint guard live — your order is well within available reserve. Vault: 1,000,122 g · supply: 999,872 g.</div>
            <hr className="hairline" style={{ margin: '14px 0' }} />
            <div className="row" style={{ alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)' }} />
              <span style={{ fontSize: 12 }}>Compliance pre‑check passed</span>
            </div>
            <ul style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '8px 0 0 0', paddingLeft: 16, lineHeight: 1.7 }}>
              <li>KYC: verified (Singapore)</li>
              <li>Wallet cap: 1,100/10,000 g</li>
              <li>Min size: 1 g · OK</li>
            </ul>
          </Card>

          <Card pad>
            <Eyebrow>What happens next</Eyebrow>
            <ol style={{ paddingLeft: 0, listStyle: 'none', margin: '12px 0 0 0' }}>
              {['Confirm order · receive wire instructions','Send funds (USD/USDC) before T+1 09:00 SGT','Tokens minted on‑chain to your wallet','Vault attestation updated within 24h'].map((t, i) => (
                <li key={i} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)', gap: 10, alignItems: 'flex-start' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', width: 18, marginTop: 2 }}>0{i+1}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{t}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
};

const REDEEM_STEPS = ['Amount','Delivery','Review','Submit'];

const InvRedeem = () => {
  const [step, setStep] = useStateInv(1);
  const [grams, setG] = useStateInv('100');
  const [delivery, setD] = useStateInv('Vault collection · Brinks Singapore');

  return (
    <div className="main-pad">
      <Eyebrow>Redeem · burn for physical gold</Eyebrow>
      <h1 className="page-title">Take delivery.</h1>
      <p className="page-sub">Burn tokens 1:1 for the underlying gold. Settlement is physical — bars released from custodian on KYC + delivery confirmation.</p>

      <Card className="mt-6">
        <div className="steps">
          {REDEEM_STEPS.map((s, i) => (
            <div key={s} className={`step ${i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}`}>
              <div className="num"><span className="ind" />STEP 0{i+1}</div>
              <div className="ttl">{s}</div>
              <div className="desc">{['How much','Where to ship','Confirm','Burn on‑chain'][i]}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <Card pad>
          {step === 1 && (
            <>
              <h2 className="section-title">How much do you want to redeem?</h2>
              <div className="field mt-4">
                <input className="input serif tnum" style={{ fontSize: 36, padding: '14px 80px 14px 16px', height: 64 }} value={grams} onChange={e=>setG(e.target.value)} />
              </div>
              <div className="row gap-2 mt-3">
                {['10','100','500','1000','MAX'].map(q => <button key={q} className="btn ghost sm" onClick={()=>setG(q === 'MAX' ? '1000' : q)}>{q === 'MAX' ? 'Max · 1,000 g' : `${q} g`}</button>)}
              </div>
              <hr className="hairline" style={{ margin: '20px 0' }} />
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
                Available balance <b className="mono" style={{ color: 'var(--ink)' }}>1,000.00 g</b><br/>
                Equivalent value <b className="mono" style={{ color: 'var(--ink)' }}>${((Number(grams)||0)*92.56).toLocaleString(undefined,{maximumFractionDigits:2})}</b><br/>
                Redemption fee · 0.50% <b className="mono" style={{ color: 'var(--ink)' }}>${((Number(grams)||0)*92.56*0.005).toFixed(2)}</b>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="section-title">Delivery method</h2>
              <div className="col mt-4 gap-3">
                {[
                  ['Vault collection · Brinks Singapore', 'Free · same‑day pickup with photo ID'],
                  ['Insured courier · Loomis', '$240 flat · 3–5 business days'],
                  ['Allocated holding · keep in vault', 'Free · stays in your name, no shipment'],
                ].map(([t, sub]) => (
                  <button key={t} onClick={()=>setD(t)} className="card" style={{ padding: 16, textAlign: 'left', cursor: 'pointer', borderColor: delivery === t ? 'var(--ink)' : 'var(--rule)', background: delivery === t ? 'var(--paper-2)' : 'var(--paper)' }}>
                    <div className="between">
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--rule-strong)', background: delivery === t ? 'var(--ink)' : 'transparent', boxShadow: delivery === t ? 'inset 0 0 0 3px var(--paper)' : 'none' }} />
                    </div>
                  </button>
                ))}
                <div className="field mt-2">
                  <label>Delivery / collection address</label>
                  <textarea className="textarea" rows={3} defaultValue="Brinks Vault SG-A · 38 Changi North Crescent · Singapore 499611" />
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="section-title">Review your redemption</h2>
              <div className="mt-4" style={{ fontSize: 13 }}>
                {[
                  ['Reference', 'REDEEM‑20251030‑M9C2'],
                  ['Wallet',    '0x3C44…93BC'],
                  ['Amount to burn', `${grams} SGT999 (= ${grams} g)`],
                  ['Method',    delivery],
                  ['Estimated arrival', 'Same day · vault pickup'],
                  ['Burn fee · 0.50%', `$${((Number(grams)||0)*92.56*0.005).toFixed(2)}`],
                ].map(([k,v]) => (
                  <div key={k} className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
                    <span className="text-ink-3">{k}</span><span className="mono">{v}</span>
                  </div>
                ))}
              </div>
              <div className="card mt-4" style={{ padding: 14, background: 'var(--paper-2)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                <b>Burn is irreversible.</b> Once submitted, your {grams} tokens are sent to the redemption queue. The custodian fulfils within 1 business day; your tokens are then burned on‑chain.
              </div>
            </>
          )}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)', display: 'inline-grid', placeItems: 'center' }}><I.check size={28} /></div>
              <h2 className="serif" style={{ fontSize: 28, margin: '16px 0 6px', letterSpacing: '-0.02em' }}>Submitted to custodian.</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Reference <b className="mono">REDEEM‑20251030‑M9C2</b> · status <Badge tone="azure" dot>Pending approval</Badge></p>
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)', maxWidth: 440, margin: '14px auto 0' }}>Brinks Singapore typically processes redemptions in under 4 hours. You'll receive a notification when bars are released and tokens are burned.</p>
            </div>
          )}

          <div className="row mt-6" style={{ justifyContent: 'space-between' }}>
            <button className="btn ghost" disabled={step === 1} onClick={()=>setStep(step-1)}>Back</button>
            <button className="btn bullion" onClick={()=>setStep(Math.min(4, step+1))}>
              {step === 3 ? 'Confirm & burn' : step === 4 ? 'Done' : 'Continue'} <I.arrowR size={13} />
            </button>
          </div>
        </Card>

        <div className="col">
          <Card pad>
            <Eyebrow>Compliance</Eyebrow>
            <ul style={{ fontSize: 12.5, color: 'var(--ink-2)', listStyle: 'none', padding: 0, margin: '10px 0 0 0' }}>
              {[['KYC verified', true], ['Min transfer · 1 g', true], ['Custodian assigned', true], ['Wallet cap OK', true]].map(([t, ok]) => (
                <li key={t} className="row" style={{ padding: '6px 0', gap: 8 }}>
                  <span style={{ color: 'var(--emerald)' }}><I.check size={12} /></span>{t}
                </li>
              ))}
            </ul>
          </Card>
          <Card pad>
            <Eyebrow>Bars allocated</Eyebrow>
            <div className="hint mt-2">FIFO from vault SG-A. The same physical bars never re‑enter circulation.</div>
            <div className="mt-3 col gap-2">
              {[
                { id: 'GB‑2025‑0142', g: 12_500, take: 100 },
              ].map(b => (
                <div key={b.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
                  <Ingot size="sm" />
                  <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                    <div className="mono" style={{ fontWeight: 600 }}>{b.id}</div>
                    <div className="text-ink-3">12,500 g · take {b.take} g</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const InvActivity = () => (
  <div className="main-pad">
    <Eyebrow>Activity</Eyebrow>
    <h1 className="page-title">Every move, on the ledger.</h1>
    <p className="page-sub">Direct chain reads · queryable by hash, type, or date. Nothing is cached.</p>

    <div className="row mt-6 gap-2" style={{ flexWrap: 'wrap' }}>
      <Badge tone="ink">All</Badge><Badge>Mint</Badge><Badge>Transfer</Badge><Badge>Redeem · Burn</Badge>
      <span style={{ flex: 1 }} />
      <button className="btn ghost sm"><I.calendar size={12} />Last 90 days</button>
      <button className="btn ghost sm"><I.upload size={12} />Export</button>
    </div>

    <Card className="mt-4">
      <table className="ledger">
        <thead><tr>
          <th>Date</th><th>Type</th><th>Counterparty</th><th className="num">Amount</th><th className="num">USD</th><th>Tx hash</th><th>Status</th>
        </tr></thead>
        <tbody>
          {[
            ['Oct 30, 14:22', 'Mint', '— issuer', '+50.00 g', '$4,628.00', '0xa1f4…2c91', 'FULFILLED'],
            ['Oct 22, 09:14', 'Transfer in', '0x90F7…b906', '+12.50 g', '$1,157.00', '0x88c2…9def', 'FULFILLED'],
            ['Oct 14, 18:00', 'Redeem · Burn', '— custodian', '−100.00 g', '−$9,256.00', '0x44de…0c14', 'FULFILLED'],
            ['Oct 02, 11:31', 'Mint', '— issuer', '+1,037.50 g', '$96,031.00', '0xff19…ab02', 'FULFILLED'],
            ['Sep 28, 16:44', 'Transfer out', '0xf39F…2266', '−25.00 g', '−$2,314.00', '0x9011…1ac3', 'FULFILLED'],
            ['Sep 12, 08:09', 'Mint', '— issuer', '+25.00 g', '$2,314.00', '0x12ab…7e64', 'FULFILLED'],
          ].map((r, i) => (
            <tr key={i}>
              <td className="muted">{r[0]}</td>
              <td><Badge tone={r[1].includes('Burn') ? 'danger' : r[1] === 'Mint' ? 'bullion' : 'ghost'}>{r[1]}</Badge></td>
              <td className="addr">{r[2]}</td>
              <td className="num"><span className="serif" style={{ fontSize: 15, color: r[3].startsWith('−') ? 'var(--ruby)' : 'var(--ink)' }}>{r[3]}</span></td>
              <td className="num">{r[4]}</td>
              <td className="addr">{r[5]}</td>
              <td><StatusBadge status={r[6]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const InvKyc = () => (
  <div className="main-pad">
    <Eyebrow>Identity · ONCHAINID</Eyebrow>
    <h1 className="page-title">Your verified identity.</h1>
    <p className="page-sub">KYC claims live in your on‑chain identity contract. They travel with your wallet — verify once, transact anywhere.</p>

    <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
      <Card pad>
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bullion-soft)', display: 'grid', placeItems: 'center' }}>
            <I.shield size={26} />
          </div>
          <div>
            <div className="serif" style={{ fontSize: 26, lineHeight: 1.1 }}>Maya Chen</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Verified Sep 12, 2025 · Tokeny</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><Badge tone="ok" dot>Verified</Badge></div>
        </div>

        <hr className="hairline" style={{ margin: '18px 0' }} />

        <h2 className="section-title">Claims</h2>
        <div className="mt-3 col" style={{ gap: 1 }}>
          {[
            ['Identity', 'Singapore NRIC · ✓ matched', 'Onfido · 09‑12'],
            ['Country of residence', 'Singapore (SG)', 'Self‑attested'],
            ['Accreditation', 'Retail · 10 kg cap', 'Tokeny tier'],
            ['Sanctions', 'Clear · OFAC, EU, UK', 'Refinitiv · daily'],
            ['Source of funds', 'Salary · employed', 'Document upload'],
          ].map(c => (
            <div key={c[0]} className="row" style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)', gap: 12 }}>
              <span style={{ color: 'var(--emerald)' }}><I.check size={14} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c[0]}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{c[1]}</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c[2]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="col">
        <Card pad>
          <Eyebrow>Wallet</Eyebrow>
          <div className="row mt-2" style={{ alignItems: 'center', gap: 8 }}>
            <Addr value="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" length={10} />
            <button className="btn ghost sm" style={{ padding: '4px 8px' }}><I.copy size={11} /></button>
          </div>
          <hr className="hairline" style={{ margin: '12px 0' }} />
          <div style={{ fontSize: 12 }}>
            <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Identity contract</span><Addr value="0x12ab78e64f01" /></div>
            <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Linked since</span><span>Sep 12, 2025</span></div>
            <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Linked tokens</span><span>SGT999</span></div>
          </div>
        </Card>
        <Card pad>
          <Eyebrow>Renewal</Eyebrow>
          <div className="serif tnum mt-2" style={{ fontSize: 24 }}>286 days</div>
          <div className="hint">Annual sanctions re‑screen on Sep 12, 2026.</div>
          <button className="btn ghost sm mt-3 w-full">Refresh KYC documents</button>
        </Card>
      </div>
    </div>
  </div>
);

Object.assign(window, { InvHoldings, InvMint, InvRedeem, InvActivity, InvKyc });
