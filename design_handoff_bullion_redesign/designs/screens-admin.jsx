/* eslint-disable */
// Issuer Admin: Overview, Redemption queue (kanban), Mint console, KYC queue, Price oracle, Token registry

const { useState: useStateAdm } = React;

const AdmOverview = () => (
  <div className="main-pad">
    <Eyebrow>Issuer · Treasury Ops</Eyebrow>
    <h1 className="page-title">Operations today.</h1>
    <p className="page-sub">7 redemptions queued · 3 KYC requests · reserve healthy.</p>

    <div className="grid-4 mt-6">
      <KPI label="Pending redemptions" num="7" sub={<><b>2,150 g</b><span className="text-ink-3">to burn</span></>} />
      <KPI label="Mint headroom"       num="250.4" unit="kg" sub={<span className="text-emerald">25% of vault</span>} />
      <KPI label="KYC queue"           num="3" sub={<><b>oldest 8 h</b><span className="text-ink-3">SLA 24 h</span></>} />
      <KPI label="Mint volume · 24h"   num="1,287" unit="g" sub={<span className="text-emerald">+12.4%</span>} sparkData={[2,3,2,4,5,4,6,5,7,8,7,9,10,9,11,12]} />
    </div>

    <div className="grid-2 mt-6" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
      <Card>
        <CardHd title="Reserve coverage · 30‑day" action={<Badge tone="ok" dot>Above 100% floor</Badge>} />
        <div className="card-bd" style={{ position: 'relative' }}>
          <Sparkline data={[100.01,100.02,100.04,100.03,100.05,100.08,100.06,100.10,100.12,100.15,100.13,100.18,100.20,100.17,100.15,100.20,100.18,100.22,100.25,100.21,100.18,100.15,100.10,100.08,100.05,100.07,100.04,100.02,100.03,100.01]} w={600} h={120} />
          <div className="row mt-3" style={{ gap: 24, fontSize: 12 }}>
            <div><span className="text-ink-3">Min</span> <b className="mono">100.01%</b></div>
            <div><span className="text-ink-3">Max</span> <b className="mono">100.25%</b></div>
            <div><span className="text-ink-3">Avg</span> <b className="mono">100.11%</b></div>
            <div style={{ marginLeft: 'auto' }}><span className="text-ink-3">Last attest</span> <b>6 h ago</b></div>
          </div>
        </div>
      </Card>
      <Card>
        <CardHd title="Action queue" />
        {[
          { t: 'Approve', n: 'Redeem · 100 g', who: '0x3C44…93BC', urg: 'high' },
          { t: 'Approve', n: 'KYC · onboard', who: '0xab12…f0c4', urg: 'med' },
          { t: 'Mint',    n: '500 g · subscription', who: 'Wire #SUB‑0028', urg: 'med' },
          { t: 'Review',  n: 'Bar deactivation', who: 'GB‑2025‑0099', urg: 'low' },
          { t: 'Approve', n: 'Redeem · 1,000 g', who: '0x90F7…b906', urg: 'high' },
        ].map((a, i) => (
          <div key={i} className="row" style={{ padding: '12px 20px', borderBottom: '1px solid var(--rule)', gap: 10 }}>
            <span style={{ width: 4, height: 32, borderRadius: 2, background: a.urg === 'high' ? 'var(--ruby)' : a.urg === 'med' ? 'var(--bullion-2)' : 'var(--rule-strong)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.n}</div>
              <div className="addr" style={{ fontSize: 11 }}>{a.who}</div>
            </div>
            <button className="btn ghost sm">{a.t}</button>
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const REDEMPTIONS = [
  { ref: 'REDEEM‑20251030‑M9C2', addr: '0x3C44…93BC', g: 100,  fee: 46.28, age: '14 m', delivery: 'Brinks SG · pickup', status: 'PENDING' },
  { ref: 'REDEEM‑20251030‑K7F1', addr: '0x90F7…b906', g: 1000, fee: 462.80, age: '38 m', delivery: 'Loomis courier · LON', status: 'PENDING' },
  { ref: 'REDEEM‑20251029‑P2D8', addr: '0xab12…f0c4', g: 250,  fee: 115.70, age: '3 h',  delivery: 'Vault hold · CH-Z',  status: 'PENDING' },
  { ref: 'REDEEM‑20251029‑V8N3', addr: '0x70cd…11a1', g: 50,   fee: 23.14,  age: '5 h',  delivery: 'Brinks SG · pickup', status: 'APPROVED' },
  { ref: 'REDEEM‑20251029‑Q9R6', addr: '0xff19…e202', g: 500,  fee: 231.40, age: '6 h',  delivery: 'Loomis courier · NYC', status: 'APPROVED' },
  { ref: 'REDEEM‑20251028‑T4L2', addr: '0x3C44…93BC', g: 200,  fee: 92.56,  age: '1 d',  delivery: 'Vault hold · SG-A',  status: 'FULFILLED' },
];

const AdmRedemptions = () => {
  const cols = [
    { id: 'PENDING',   label: 'Pending review',   tone: 'azure', action: 'Approve' },
    { id: 'APPROVED',  label: 'Awaiting custodian', tone: 'bullion', action: 'Custodian' },
    { id: 'FULFILLED', label: 'Settled',          tone: 'ok', action: 'View' },
    { id: 'REJECTED',  label: 'Rejected',         tone: 'danger', action: '—' },
  ];
  return (
    <div className="main-pad">
      <Eyebrow>Redemption queue</Eyebrow>
      <h1 className="page-title">Approve, fulfill, settle.</h1>
      <p className="page-sub">Drag a card to advance state, or click an action. The on‑chain burn happens when the custodian fulfils.</p>

      <div className="row mt-6 gap-2" style={{ flexWrap: 'wrap' }}>
        <Badge tone="ink">All tokens</Badge>
        <Badge>SGT999</Badge>
        <span style={{ flex: 1 }} />
        <button className="btn ghost sm"><I.search size={12} />Search by ref or wallet</button>
        <button className="btn ghost sm"><I.upload size={12} />Export CSV</button>
      </div>

      <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cols.map(c => {
          const items = REDEMPTIONS.filter(r => r.status === c.id);
          return (
            <div key={c.id} style={{ background: 'var(--paper-2)', borderRadius: 'var(--radius)', border: '1px solid var(--rule)', overflow: 'hidden' }}>
              <div className="row" style={{ padding: '10px 14px', borderBottom: '1px solid var(--rule)', justifyContent: 'space-between' }}>
                <div>
                  <div className="eyebrow">{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{items.reduce((a,r)=>a+r.g,0).toLocaleString()} g · {items.length} req</div>
                </div>
                <Badge tone={c.tone}>{items.length}</Badge>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 320 }}>
                {items.length === 0 && <div style={{ fontSize: 11, color: 'var(--ink-3)', padding: 16, textAlign: 'center' }}>—</div>}
                {items.map(r => (
                  <div key={r.ref} className="card" style={{ padding: 12, cursor: 'grab' }}>
                    <div className="between">
                      <span className="serif tnum" style={{ fontSize: 20 }}>{r.g.toLocaleString()}<small style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4, fontFamily: 'var(--font-sans)' }}>g</small></span>
                      <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{r.age}</span>
                    </div>
                    <div className="addr mt-2">{r.addr}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{r.delivery}</div>
                    <hr className="hairline" style={{ margin: '10px 0 8px' }} />
                    <div className="between">
                      <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }} className="mono">{r.ref}</span>
                      {c.id === 'PENDING' && <div className="row gap-2"><button className="btn sm">Approve</button><button className="btn ghost sm"><I.x size={11} /></button></div>}
                      {c.id === 'APPROVED' && <Badge tone="bullion" dot>With custodian</Badge>}
                      {c.id === 'FULFILLED' && <span className="addr" style={{ fontSize: 10.5 }}>0x44de…</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdmMint = () => {
  const [g, setG] = useStateAdm('500');
  const [to, setTo] = useStateAdm('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  const headroom = 250_400;
  const ok = Number(g) <= headroom;
  return (
    <div className="main-pad">
      <Eyebrow>Mint console</Eyebrow>
      <h1 className="page-title">Issue new tokens.</h1>
      <p className="page-sub">Mints are guarded on‑chain. The contract reverts any issuance that would exceed registered vault weight.</p>

      <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <Card pad>
          <h2 className="section-title">New mint order</h2>
          <div className="grid-2 mt-4" style={{ gap: 16 }}>
            <div className="field">
              <label>Recipient (KYC verified)</label>
              <input className="input mono" value={to} onChange={e=>setTo(e.target.value)} />
              <div className="row gap-2 mt-2" style={{ fontSize: 11.5 }}>
                <Badge tone="ok" dot>Verified</Badge>
                <span className="text-ink-3">Singapore · cap 8,500/10,000 g remaining</span>
              </div>
            </div>
            <div className="field">
              <label>Amount</label>
              <div style={{ position: 'relative' }}>
                <input className="input serif tnum" style={{ fontSize: 24, padding: '12px 60px 12px 14px' }} value={g} onChange={e=>setG(e.target.value)} />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink-3)' }}>GRAMS</span>
              </div>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Reason / wire ref</label>
              <input className="input" defaultValue="SUB‑0028 · USD wire $46,280 settled 2025‑10‑30" />
            </div>
          </div>

          <hr className="hairline" style={{ margin: '20px 0' }} />

          <h2 className="section-title">Pre‑flight</h2>
          <div className="mt-3" style={{ fontSize: 12.5 }}>
            {[
              ['Identity registry · recipient verified', true],
              ['Country whitelist · passthrough', true],
              [`Wallet cap · would be 1,500/10,000 g`, true],
              ['Min transfer · 1 g', true],
              [`Reserve cap · ${Number(g).toLocaleString()} g vs ${headroom.toLocaleString()} g headroom`, ok],
            ].map(([t, pass]) => (
              <div key={t} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)', gap: 10 }}>
                <span style={{ color: pass ? 'var(--emerald)' : 'var(--ruby)' }}>{pass ? <I.check size={14} /> : <I.x size={14} />}</span>
                <span style={{ flex: 1 }}>{t}</span>
                <Badge tone={pass ? 'ok' : 'danger'}>{pass ? 'OK' : 'BLOCK'}</Badge>
              </div>
            ))}
          </div>

          <button className="btn bullion lg w-full mt-4" style={{ justifyContent: 'center' }} disabled={!ok}>
            <I.hammer size={14} /> Mint {Number(g).toLocaleString()} SGT999 → recipient
          </button>
          <div className="hint mt-2" style={{ textAlign: 'center' }}>Requires SUPPLY_MODIFIER role · transaction signed locally</div>
        </Card>

        <div className="col">
          <Card pad>
            <Eyebrow>Vault headroom</Eyebrow>
            <div className="row mt-2" style={{ gap: 14, alignItems: 'center' }}>
              <Donut pct={Math.round((headroom/1_000_122)*100)} size={90} label="free" />
              <div>
                <div className="serif tnum" style={{ fontSize: 24 }}>250.4<small style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4, fontFamily: 'var(--font-sans)' }}>kg</small></div>
                <div className="hint">of 1,000.12 kg total</div>
              </div>
            </div>
            <hr className="hairline" style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12 }}>
              <div className="between" style={{ padding: '3px 0' }}><span className="text-ink-3">Vault weight</span><span className="mono">1,000,122 g</span></div>
              <div className="between" style={{ padding: '3px 0' }}><span className="text-ink-3">Circulating</span><span className="mono">749,722 g</span></div>
              <div className="between" style={{ padding: '3px 0' }}><span className="text-ink-3">After mint</span><span className="mono">{(749_722 + Number(g)).toLocaleString()} g</span></div>
            </div>
          </Card>
          <Card pad>
            <Eyebrow>Recent mints</Eyebrow>
            <div className="mt-2 col" style={{ gap: 1 }}>
              {[['1,037.5 g','0x90F7…','2 h'],['25 g','0x3C44…','5 h'],['200 g','0xff19…','1 d']].map((r,i) => (
                <div key={i} className="between" style={{ padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--rule)' : 0, fontSize: 12 }}>
                  <span className="serif tnum" style={{ fontSize: 14 }}>{r[0]}</span>
                  <span className="addr">{r[1]}</span>
                  <span className="text-ink-3">{r[2]}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AdmKyc = () => (
  <div className="main-pad">
    <Eyebrow>KYC queue</Eyebrow>
    <h1 className="page-title">Onboard new wallets.</h1>
    <p className="page-sub">Verify, register on‑chain in IdentityRegistry, and the wallet can hold and transfer immediately.</p>

    <Card className="mt-6">
      <table className="ledger">
        <thead><tr>
          <th>Submitted</th><th>Wallet</th><th>Country</th><th>Tier</th><th>Verifier</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {[
            ['8 h ago', '0xab12cd34ef0156789012abcd34ef56789012abcd', 'SG', 'Retail · 10kg', 'Tokeny', 'PENDING'],
            ['12 h ago','0x70cd11a18820bb22cc33dd44ee55ff66aa770088','GB', 'Retail · 10kg', 'Onfido', 'PENDING'],
            ['1 d ago', '0xff19e2020c44b3d8a1f2c3d4e5f60718293a4b5c', 'US', 'Accredited · 100kg', 'Synaps', 'PENDING'],
            ['2 d ago', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'SG', 'Retail · 10kg', 'Tokeny', 'APPROVED'],
            ['3 d ago', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'SG', 'Issuer · ∞', 'Internal', 'APPROVED'],
          ].map((r, i) => (
            <tr key={i}>
              <td className="muted">{r[0]}</td>
              <td><Addr value={r[1]} length={8} /></td>
              <td><Badge>{r[2]}</Badge></td>
              <td>{r[3]}</td>
              <td className="muted">{r[4]}</td>
              <td><StatusBadge status={r[5] === 'APPROVED' ? 'FULFILLED' : 'PENDING'} /></td>
              <td className="text-right">
                {r[5] === 'PENDING' ? (
                  <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn ghost sm">Review</button>
                    <button className="btn sm">Approve</button>
                  </div>
                ) : <button className="btn ghost sm">Open</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const AdmPrice = () => (
  <div className="main-pad">
    <Eyebrow>Price oracle</Eyebrow>
    <h1 className="page-title">Set the gold reference price.</h1>
    <p className="page-sub">Used for USD value display only — has no effect on on‑chain balances or compliance. Production: replace with Chainlink XAU/USD.</p>

    <div className="grid-3 mt-6" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
      <Card pad>
        <h2 className="section-title">Current feed</h2>
        <div className="row mt-4" style={{ gap: 16, alignItems: 'baseline' }}>
          <div className="serif tnum" style={{ fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.025em' }}>$92.56</div>
          <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>per gram</span>
          <Badge tone="ok" dot>+0.42% 24h</Badge>
        </div>
        <Sparkline data={[88,89,87,90,91,90,92,93,92,94,95,93,96,94,95,96]} w={500} h={48} />
        <hr className="hairline" style={{ margin: '20px 0' }} />
        <h2 className="section-title">Update</h2>
        <div className="grid-2 mt-3" style={{ gap: 16 }}>
          <div className="field">
            <label>New price (USD/g)</label>
            <input className="input serif tnum" style={{ fontSize: 22 }} defaultValue="92.84" />
          </div>
          <div className="field">
            <label>Source</label>
            <select className="select" defaultValue="LBMA">
              <option>LBMA AM Fix</option><option>COMEX spot</option><option>Manual</option>
            </select>
          </div>
        </div>
        <div className="row mt-4 gap-3">
          <button className="btn">Publish update</button>
          <button className="btn ghost">Cancel</button>
          <span className="hint" style={{ marginLeft: 'auto' }}>Tx hash recorded · audit log</span>
        </div>
      </Card>
      <Card>
        <CardHd title="Update history" />
        <div className="card-bd" style={{ padding: 0 }}>
          {[
            ['Today, 09:30','$92.56','+0.42%','LBMA AM'],
            ['Yesterday, 09:30','$92.18','−0.11%','LBMA AM'],
            ['Oct 28, 09:30','$92.28','+0.88%','LBMA AM'],
            ['Oct 27, 09:30','$91.47','−0.30%','LBMA AM'],
            ['Oct 26, 09:30','$91.74','+1.12%','LBMA AM'],
          ].map((r, i, a) => (
            <div key={i} className="row" style={{ padding: '12px 20px', borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0, fontSize: 12.5, gap: 12 }}>
              <span className="text-ink-3" style={{ width: 130 }}>{r[0]}</span>
              <span className="serif tnum" style={{ fontSize: 16, flex: 1 }}>{r[1]}</span>
              <span className={r[2].startsWith('−') ? 'text-ruby mono' : 'text-emerald mono'}>{r[2]}</span>
              <span className="text-ink-3">{r[3]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

const AdmTokens = () => (
  <div className="main-pad">
    <Eyebrow>Token registry</Eyebrow>
    <h1 className="page-title">Deployed tokens.</h1>
    <p className="page-sub">Each token is an ERC‑3643 UUPS proxy with its own compliance stack and gold reserve.</p>

    <div className="grid-2 mt-6">
      {[
        { sym: 'SGT999', name: 'Singapore Fine Gold', purity: '999.9', supply: '999,872 g', vault: '1,000,122 g', addr: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb9226', dep: 'Sep 12, 2025' },
        { sym: 'CHF916', name: 'Zürich Bullion 22K', purity: '916.0', supply: '142,300 g', vault: '142,310 g', addr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', dep: 'Oct 02, 2025' },
      ].map(t => (
        <Card key={t.sym} pad>
          <div className="between">
            <div>
              <Badge tone="bullion">{t.sym}</Badge>
              <div className="serif" style={{ fontSize: 22, marginTop: 6 }}>{t.name}</div>
              <div className="hint">Purity {t.purity} · ERC‑3643 · UUPS</div>
            </div>
            <button className="btn ghost sm"><I.pencil size={11} />Edit</button>
          </div>
          <hr className="hairline" style={{ margin: '14px 0' }} />
          <div className="grid-2" style={{ gap: 16, fontSize: 12 }}>
            <div><span className="text-ink-3">Circulating</span><div className="serif tnum" style={{ fontSize: 18 }}>{t.supply}</div></div>
            <div><span className="text-ink-3">Vault</span><div className="serif tnum" style={{ fontSize: 18 }}>{t.vault}</div></div>
          </div>
          <hr className="hairline" style={{ margin: '14px 0' }} />
          <div style={{ fontSize: 11.5 }}>
            <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Proxy</span><Addr value={t.addr} length={10} /></div>
            <div className="between" style={{ padding: '4px 0' }}><span className="text-ink-3">Deployed</span><span>{t.dep}</span></div>
          </div>
        </Card>
      ))}
      <Card pad style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 200, color: 'var(--ink-3)' }}>
        <I.plus size={24} />
        <div className="serif" style={{ fontSize: 18, color: 'var(--ink)' }}>Register a new token</div>
        <button className="btn ghost sm">Begin deployment</button>
      </Card>
    </div>
  </div>
);

Object.assign(window, { AdmOverview, AdmRedemptions, AdmMint, AdmKyc, AdmPrice, AdmTokens });
