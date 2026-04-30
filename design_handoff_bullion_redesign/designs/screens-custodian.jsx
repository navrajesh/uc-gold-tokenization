/* eslint-disable */
// Custodian + Auditor screens

const { useState: useStateCus } = React;

const CusVault = () => (
  <div className="main-pad">
    <Eyebrow>Brinks Singapore · Vault SG-A</Eyebrow>
    <h1 className="page-title">Vault inventory.</h1>
    <p className="page-sub">412,350 g across 28 bars · last reconciled 6 hours ago.</p>

    <div className="grid-4 mt-6">
      <KPI label="Total weight" num="412,350" unit="g" sub={<><b>28 bars</b><span className="text-ink-3">all 999.9</span></>} />
      <KPI label="Allocated" num="411,850" unit="g" sub={<>backing SGT999</>} />
      <KPI label="Free / unbacked" num="500" unit="g" sub={<span className="text-emerald">buffer · 0.12%</span>} />
      <KPI label="Pending fulfillments" num="2" sub={<><b>1,100 g</b><span className="text-ink-3">to release</span></>} />
    </div>

    <div className="section mt-8">
      <div className="section-hd">
        <h2 className="section-title">Bar inventory</h2>
        <div className="row gap-2">
          <button className="btn ghost sm"><I.filter size={12} />Filter</button>
          <button className="btn"><I.plus size={12} />Intake new bar</button>
        </div>
      </div>
      <Card>
        {[
          { id: 'GB‑2025‑0142', g: 12_500, allocated: 12_500, ar: 'LBMA‑SG‑0142', d: '2025‑09‑12', s: 'Active' },
          { id: 'GB‑2025‑0141', g: 12_500, allocated: 12_500, ar: 'LBMA‑SG‑0141', d: '2025‑09‑12', s: 'Active' },
          { id: 'GB‑2025‑0137', g: 12_500, allocated: 12_400, ar: 'LBMA‑SG‑0140', d: '2025‑08‑22', s: 'Active' },
          { id: 'GB‑2025‑0099', g: 12_445, allocated: 0,      ar: 'LBMA‑SG‑0089', d: '2025‑06‑14', s: 'Inactive' },
        ].map((b, i, a) => (
          <div key={b.id} className="bar-row" style={{ borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0 }}>
            <Ingot />
            <div className="bar-meta">
              <div className="id">{b.id}</div>
              <div className="det">
                <span><b>{b.g.toLocaleString()} g</b></span>
                <span className="text-ink-3">·</span>
                <span>Allocated <b>{b.allocated.toLocaleString()} g</b></span>
                <span className="text-ink-3">·</span>
                <span>Assay <b>{b.ar}</b></span>
                <span className="text-ink-3">·</span>
                <span>Registered {b.d}</span>
              </div>
            </div>
            <div className="row gap-2">
              <StatusBadge status={b.s} />
              <button className="btn ghost sm">Open</button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const CusIntake = () => (
  <div className="main-pad">
    <Eyebrow>Bar intake</Eyebrow>
    <h1 className="page-title">Register a new bar.</h1>
    <p className="page-sub">Assay → photograph → register on‑chain in GoldReserve. Vault headroom updates immediately.</p>

    <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
      <Card pad>
        <h2 className="section-title">Bar details</h2>
        <div className="grid-2 mt-4" style={{ gap: 16 }}>
          <div className="field"><label>Bar ID</label><input className="input mono" defaultValue="GB‑2025‑0143" /></div>
          <div className="field"><label>Vault</label><select className="select"><option>SG-A · Brinks Singapore</option><option>CH-Z · Loomis Zürich</option></select></div>
          <div className="field"><label>Weight (grams)</label><input className="input serif tnum" style={{ fontSize: 22 }} defaultValue="12500" /></div>
          <div className="field"><label>Purity (bps)</label><input className="input mono" defaultValue="9999" /></div>
          <div className="field"><label>Assay reference</label><input className="input mono" defaultValue="LBMA‑SG‑0143" /></div>
          <div className="field"><label>Refiner</label><select className="select"><option>PAMP Suisse</option><option>Metalor</option><option>Argor‑Heraeus</option></select></div>
        </div>

        <hr className="hairline" style={{ margin: '20px 0' }} />

        <h2 className="section-title">Documents</h2>
        <div className="grid-2 mt-3" style={{ gap: 12 }}>
          {['Assay certificate (PDF)', 'Bar photograph (front)', 'Bar photograph (serial)', 'Vault entry receipt'].map((t, i) => (
            <div key={t} className="card" style={{ padding: 14, borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer' }}>
              <I.upload size={18} />
              <div style={{ fontSize: 12, marginTop: 8 }}>{t}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{i < 2 ? 'Uploaded · 142 KB' : 'Drop or click to upload'}</div>
            </div>
          ))}
        </div>

        <button className="btn bullion lg w-full mt-4" style={{ justifyContent: 'center' }}>
          Register on‑chain · GoldReserve.registerBar() <I.arrowR size={14} />
        </button>
      </Card>

      <div className="col">
        <Card pad>
          <Eyebrow>Effect on reserve</Eyebrow>
          <div className="mt-3" style={{ fontSize: 12.5 }}>
            <div className="between" style={{ padding: '6px 0', borderBottom: '1px solid var(--rule)' }}><span className="text-ink-3">Before</span><span className="mono">1,000,122 g</span></div>
            <div className="between" style={{ padding: '6px 0', borderBottom: '1px solid var(--rule)' }}><span className="text-ink-3">+ This bar</span><span className="mono">+12,500 g</span></div>
            <div className="between" style={{ padding: '6px 0' }}><b>After</b><span className="serif tnum" style={{ fontSize: 18 }}>1,012,622 g</span></div>
          </div>
          <div className="hint mt-2">Headroom for new mints rises to 262.9 kg.</div>
        </Card>
        <Card pad>
          <Eyebrow>Custodian signature</Eyebrow>
          <div className="hint mt-2">This action is signed with your CUSTODIAN_ROLE key. The on‑chain event includes your vault ID, weight, and assay reference.</div>
          <div className="row mt-3" style={{ gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--paper-3)', display: 'grid', placeItems: 'center' }}><I.shield size={16} /></div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Brinks Singapore</div>
              <Addr value="0x70997970C51812dc3A010C7d01b50e0d17dc79C8" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

const CusFulfill = () => (
  <div className="main-pad">
    <Eyebrow>Fulfillment queue</Eyebrow>
    <h1 className="page-title">Release gold, burn tokens.</h1>
    <p className="page-sub">2 redemptions approved by issuer · awaiting your custodian signature to settle.</p>

    <Card className="mt-6">
      {[
        { ref: 'REDEEM‑20251029‑V8N3', g: 50,   addr: '0x70cd…11a1', mode: 'Brinks SG · pickup', bar: 'GB‑2025‑0142', age: '5 h' },
        { ref: 'REDEEM‑20251029‑Q9R6', g: 1000, addr: '0xff19…e202', mode: 'Loomis courier · NYC', bar: 'GB‑2025‑0140', age: '6 h' },
      ].map((r, i, a) => (
        <div key={r.ref} style={{ padding: 20, borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0 }}>
          <div className="between mb-3">
            <div className="row gap-3">
              <span className="serif tnum" style={{ fontSize: 28 }}>{r.g.toLocaleString()}<small style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 4, fontFamily: 'var(--font-sans)' }}>g</small></span>
              <Badge tone="bullion" dot>Approved · awaiting fulfillment</Badge>
              <span className="text-ink-3" style={{ fontSize: 12 }}>queued {r.age} ago</span>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.ref}</span>
          </div>

          <div className="grid-3" style={{ gap: 16, fontSize: 12 }}>
            <div>
              <div className="text-ink-3" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Investor</div>
              <Addr value={r.addr} length={8} />
              <div className="text-ink-3 mt-2" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Delivery</div>
              <div style={{ fontSize: 13 }}>{r.mode}</div>
            </div>
            <div>
              <div className="text-ink-3" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bar allocation (FIFO)</div>
              <div className="row mt-2 gap-3" style={{ alignItems: 'center' }}>
                <Ingot size="sm" />
                <div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{r.bar}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Take {r.g} g · remaining 12,{500 - r.g} g</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-ink-3" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>On‑chain action</div>
              <div style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.55 }}>
                <code className="mono" style={{ background: 'var(--paper-3)', padding: '2px 5px', borderRadius: 4 }}>fulfillRedemption(investor, {r.g}e18, "{r.ref}")</code><br/>
                <span className="text-ink-3">→ burn {r.g} SGT999 · emit RedemptionFulfilled</span>
              </div>
            </div>
          </div>

          <div className="row mt-4 gap-2">
            <button className="btn">Confirm release & burn <I.flame size={13} /></button>
            <button className="btn ghost">Print release form <I.print size={13} /></button>
            <span style={{ flex: 1 }} />
            <button className="btn ghost danger">Reject</button>
          </div>
        </div>
      ))}
    </Card>
  </div>
);

const CusAttest = () => (
  <div className="main-pad">
    <Eyebrow>Attestations</Eyebrow>
    <h1 className="page-title">Quarterly proof of holdings.</h1>
    <p className="page-sub">Independent auditor signs a Merkle root of bars + photo evidence. The root is published on‑chain.</p>

    <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
      <Card pad>
        <div className="row" style={{ alignItems: 'baseline', gap: 14 }}>
          <Eyebrow>Next attestation due</Eyebrow>
          <span className="hint">Dec 31, 2025</span>
        </div>
        <div className="serif tnum" style={{ fontSize: 56, lineHeight: 0.95, marginTop: 8 }}>61<small style={{ fontSize: 18, color: 'var(--ink-3)', marginLeft: 8, fontFamily: 'var(--font-sans)' }}>days</small></div>
        <hr className="hairline" style={{ margin: '20px 0' }} />
        <h2 className="section-title">Last attestation</h2>
        <div className="grid-2 mt-3" style={{ gap: 16, fontSize: 12.5 }}>
          <div><span className="text-ink-3">Auditor</span><div style={{ fontSize: 14, marginTop: 2 }}>Marcum LLP</div></div>
          <div><span className="text-ink-3">Date</span><div style={{ fontSize: 14, marginTop: 2 }}>Sep 30, 2025</div></div>
          <div><span className="text-ink-3">Bars verified</span><div className="serif tnum" style={{ fontSize: 18, marginTop: 2 }}>68</div></div>
          <div><span className="text-ink-3">Weight</span><div className="serif tnum" style={{ fontSize: 18, marginTop: 2 }}>987,622 g</div></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span className="text-ink-3">Merkle root</span>
            <div className="mono" style={{ fontSize: 11.5, marginTop: 4, padding: '6px 10px', background: 'var(--paper-2)', borderRadius: 6, wordBreak: 'break-all' }}>0x7f3a1b9c4d2e8f1a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHd title="Attestation history" />
        <div className="card-bd" style={{ padding: 0 }}>
          {[
            ['Sep 30, 2025','Marcum LLP','987,622 g','0x7f3a…4f3a'],
            ['Jun 30, 2025','Marcum LLP','812,300 g','0x4b1c…22ee'],
            ['Mar 31, 2025','BDO Singapore','504,180 g','0x9928…eea1'],
            ['Dec 31, 2024','BDO Singapore','312,700 g','0xfc02…1180'],
          ].map((r, i, a) => (
            <div key={i} className="row" style={{ padding: '12px 20px', borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0, gap: 10, fontSize: 12 }}>
              <span className="text-ink-3" style={{ width: 92 }}>{r[0]}</span>
              <span style={{ flex: 1 }}>{r[1]}</span>
              <span className="serif tnum" style={{ fontSize: 14 }}>{r[2]}</span>
              <span className="addr">{r[3]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

const AudReserve = () => (
  <div className="main-pad">
    <Eyebrow>Auditor · read‑only</Eyebrow>
    <h1 className="page-title">Reserve invariants.</h1>
    <p className="page-sub">Reconstructed from on‑chain state. No off‑chain inputs.</p>

    <div className="grid-4 mt-6">
      <KPI label="Vault weight (chain)" num="1,000,122" unit="g" sub={<>GoldReserve.getTotalActiveWeightGrams()</>} />
      <KPI label="Total supply (chain)" num="999,872" unit="SGT999" sub={<>GoldToken.totalSupply()</>} />
      <KPI label="Ratio" num="100.025" unit="%" sub={<span className="text-emerald">≥ 100% invariant holds</span>} />
      <KPI label="Discrepancies" num="0" sub={<>chain vs DB · last 30d</>} />
    </div>

    <div className="grid-2 mt-6">
      <Card>
        <CardHd title="Invariant checks · last 24h" action={<Badge tone="ok" dot>All passing</Badge>} />
        <div className="card-bd" style={{ padding: 0 }}>
          {[
            ['totalSupply ≤ Σ activeBarWeights', '4,182 / 4,182', 'PASS'],
            ['Sum(balanceOf) = totalSupply',     '128 / 128',     'PASS'],
            ['Σ Transfer(in) = Σ Transfer(out)', '942 / 942',     'PASS'],
            ['Burn events match Redemptions DB', '12 / 12',       'PASS'],
            ['Mint events authorised by SUPPLY_MODIFIER', '8 / 8','PASS'],
          ].map((r, i, a) => (
            <div key={i} className="row" style={{ padding: '12px 20px', borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0, gap: 12, fontSize: 12.5 }}>
              <span style={{ color: 'var(--emerald)' }}><I.check size={13} /></span>
              <span style={{ flex: 1 }} className="mono">{r[0]}</span>
              <span className="text-ink-3">{r[1]}</span>
              <Badge tone="ok">{r[2]}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHd title="On‑chain events · last 24h" />
        <div className="card-bd" style={{ padding: 0 }}>
          {[
            ['12s', 'Transfer', '+50 g',  '0xa1f4…'],
            ['4m',  'Transfer', '12.5 g', '0x88c2…'],
            ['38m', 'Burn',     '−100 g', '0x44de…'],
            ['2h',  'BarRegistered', '+12,500 g', '0xc101…'],
            ['5h',  'Transfer', '+200 g', '0xff19…'],
            ['8h',  'IdentityRegistered','—', '0xab12…'],
            ['12h', 'Transfer', '−25 g',  '0x9011…'],
          ].map((r, i, a) => (
            <div key={i} className="row" style={{ padding: '10px 20px', borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0, gap: 10, fontSize: 12 }}>
              <span className="mono text-ink-3" style={{ width: 32 }}>{r[0]}</span>
              <Badge tone={r[1] === 'Burn' ? 'danger' : r[1] === 'BarRegistered' ? 'azure' : 'ghost'}>{r[1]}</Badge>
              <span className="serif tnum" style={{ fontSize: 13, flex: 1 }}>{r[2]}</span>
              <span className="addr">{r[3]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

Object.assign(window, { CusVault, CusIntake, CusFulfill, CusAttest, AudReserve });
