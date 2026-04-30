/* eslint-disable */
// Public Proof of Reserve — viewable by anyone, no wallet needed.
// This is the "trust" surface: live ratio, vault map, bar registry, audit log.

const { useState: useStatePublic } = React;

const VAULT_DATA = [
  { id: 'SG-A', city: 'Singapore', operator: 'Brinks',          grams: 412_350, bars: 28, lat: 1.29, lng: 103.85 },
  { id: 'CH-Z', city: 'Zürich',    operator: 'Loomis',          grams: 358_200, bars: 24, lat: 47.37, lng: 8.55 },
  { id: 'UK-L', city: 'London',    operator: 'Malca‑Amit',      grams: 229_450, bars: 18, lat: 51.51, lng: -0.13 },
];

const BARS_PUBLIC = [
  { id: 'GB‑2025‑0142', vault: 'SG-A', weight: 12_500, purity: 9999, assay: 'LBMA‑SG‑0142', registered: '2025-09-12' },
  { id: 'GB‑2025‑0141', vault: 'SG-A', weight: 12_500, purity: 9999, assay: 'LBMA‑SG‑0141', registered: '2025-09-12' },
  { id: 'GB‑2025‑0140', vault: 'CH-Z', weight: 12_445, purity: 9999, assay: 'LBMA‑CH‑0218', registered: '2025-09-08' },
  { id: 'GB‑2025‑0139', vault: 'UK-L', weight: 12_500, purity: 9999, assay: 'LBMA‑UK‑1102', registered: '2025-09-04' },
  { id: 'GB‑2025‑0138', vault: 'CH-Z', weight: 11_980, purity: 9999, assay: 'LBMA‑CH‑0217', registered: '2025-08-29' },
  { id: 'GB‑2025‑0137', vault: 'SG-A', weight: 12_500, purity: 9999, assay: 'LBMA‑SG‑0140', registered: '2025-08-22' },
];

const EVENTS = [
  { ts: '12s ago', type: 'mint',     who: '0x3C44…93BC', amt: '+50.00 g',   tx: '0xa1f4…',  label: 'Mint' },
  { ts: '4 min',   type: 'transfer', who: '0x3C44 → 0x90F7', amt: '12.50 g', tx: '0x88c2…', label: 'Transfer' },
  { ts: '38 min',  type: 'burn',     who: '0xf39F…2266', amt: '−100.00 g',  tx: '0x44de…',  label: 'Redeem · Burn' },
  { ts: '2 hr',    type: 'attest',   who: 'Marcum LLP',  amt: '+12,500 g',  tx: '0xc101…',  label: 'Bar attestation' },
  { ts: '5 hr',    type: 'mint',     who: '0x90F7…b906', amt: '+200.00 g',  tx: '0xff19…',  label: 'Mint' },
];

const PublicPoR = () => {
  const totalGrams = VAULT_DATA.reduce((a, v) => a + v.grams, 0);
  const supplyGrams = 999_872; // < total ⇒ 100% backed with headroom
  const ratio = (totalGrams / supplyGrams) * 100;
  const headroom = totalGrams - supplyGrams;

  return (
    <div className="main-pad">
      {/* Hero */}
      <div className="section">
        <Eyebrow>Live · refreshed every block</Eyebrow>
        <h1 className="page-title">Every gram, fully accounted.</h1>
        <p className="page-sub">
          Bullion publishes its reserve ratio in real time, on‑chain. Token supply can never exceed registered vault weight — the smart contract reverts the mint. This page is open: no wallet, no login, just the ledger.
        </p>
      </div>

      {/* Hero KPIs */}
      <div className="grid-4 mt-6">
        <KPI label="Reserve Ratio" num={ratio.toFixed(2)} unit="%" sub={<span className="text-emerald">● Fully backed · headroom {Math.round(headroom).toLocaleString()} g</span>} />
        <KPI label="Vault Weight" num={totalGrams.toLocaleString()} unit="g" sub={<><b>{VAULT_DATA.reduce((a,v)=>a+v.bars,0)} bars</b><span className="text-ink-3">across 3 vaults</span></>} />
        <KPI label="Circulating" num={supplyGrams.toLocaleString()} unit="SGT999" sub={<><b>$92.5M</b><span className="text-ink-3">@ $92.56/g</span></>} sparkData={[10,12,11,15,14,16,18,17,19,22,21,24,23,26,28,27]} />
        <KPI label="Last attestation" num="6" unit="h ago" sub={<><b>Marcum LLP</b><span className="text-ink-3">— independent</span></>} />
      </div>

      {/* Coverage scale + invariant */}
      <Card className="mt-4">
        <div className="coverage" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
          <div>
            <div className="eyebrow">Coverage</div>
            <div className="ratio tnum">{ratio.toFixed(4)}<small>%</small></div>
          </div>
          <div style={{ paddingTop: 8 }}>
            <div className="scale">
              <div className="fill" style={{ width: '100%' }} />
              <div className="target" style={{ left: `${(supplyGrams / totalGrams) * 100}%` }} />
            </div>
            <div className="legend">
              <span><b>{totalGrams.toLocaleString()} g</b> in vault</span>
              <span><b>{supplyGrams.toLocaleString()} g</b> tokens issued</span>
              <span>Mint guard <b>active</b> · floor 100.00%</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge tone="ok" dot>On‑chain enforced</Badge>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>GoldToken.mint() reverts<br/>if supply &gt; vault weight</div>
          </div>
        </div>
      </Card>

      {/* Vaults */}
      <div className="section mt-8">
        <div className="section-hd">
          <h2 className="section-title">Vault distribution</h2>
          <div className="row gap-2"><Badge>Geographic</Badge><Badge>Insured · Lloyd's</Badge></div>
        </div>
        <div className="grid-3">
          {VAULT_DATA.map(v => (
            <Card key={v.id} pad>
              <div className="between">
                <div>
                  <div className="eyebrow"><span className="dot" />Vault {v.id}</div>
                  <div className="serif" style={{ fontSize: 22, marginTop: 4 }}>{v.city}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{v.operator}</div>
                </div>
                <Donut pct={Math.round((v.grams / totalGrams) * 100)} size={84} label="share" />
              </div>
              <hr className="hairline" style={{ margin: '14px 0' }} />
              <div className="grid-2" style={{ fontSize: 12 }}>
                <div><span className="text-ink-3">Weight</span><div className="serif tnum" style={{ fontSize: 18 }}>{v.grams.toLocaleString()}<small style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4 }}>g</small></div></div>
                <div><span className="text-ink-3">Bars</span><div className="serif tnum" style={{ fontSize: 18 }}>{v.bars}</div></div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bar registry */}
      <div className="section mt-8">
        <div className="section-hd">
          <h2 className="section-title">Bar registry · {BARS_PUBLIC.length} of 70 shown</h2>
          <div className="row gap-2">
            <button className="btn ghost sm"><I.filter size={12} /> Filter</button>
            <button className="btn ghost sm"><I.upload size={12} /> Export CSV</button>
          </div>
        </div>
        <Card>
          <table className="ledger">
            <thead><tr>
              <th>Bar ID</th><th>Vault</th><th className="num">Weight</th><th>Purity</th><th>Assay ref</th><th>Registered</th><th></th>
            </tr></thead>
            <tbody>
              {BARS_PUBLIC.map(b => (
                <tr key={b.id}>
                  <td className="row gap-3"><Ingot size="sm" /><span className="mono" style={{ fontWeight: 600 }}>{b.id}</span></td>
                  <td><Badge>{b.vault}</Badge></td>
                  <td className="num"><span className="serif" style={{ fontSize: 15 }}>{b.weight.toLocaleString()}</span> g</td>
                  <td><Badge tone="bullion">99.99% · 4N</Badge></td>
                  <td className="addr">{b.assay}</td>
                  <td className="muted">{b.registered}</td>
                  <td className="text-right"><button className="btn ghost sm"><I.link size={11} />Etherscan</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Live event stream */}
      <div className="section mt-8">
        <div className="section-hd">
          <h2 className="section-title">On‑chain activity · live</h2>
          <Badge tone="ok" dot>Streaming</Badge>
        </div>
        <Card>
          {EVENTS.map((e, i) => (
            <div key={i} className="row" style={{ padding: '12px 20px', borderBottom: i < EVENTS.length - 1 ? '1px solid var(--rule)' : 'none', gap: 16 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', width: 56 }}>{e.ts}</span>
              <Badge tone={e.type === 'burn' ? 'danger' : e.type === 'mint' ? 'bullion' : e.type === 'attest' ? 'azure' : 'ghost'}>{e.label}</Badge>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>{e.who}</span>
              <span className="serif tnum" style={{ fontSize: 16, color: e.amt.startsWith('−') ? 'var(--ruby)' : 'var(--ink)' }}>{e.amt}</span>
              <span className="addr">{e.tx}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Trust footer */}
      <div className="grid-3 mt-8">
        {[
          { ttl: 'Reserve cap on‑chain', body: 'GoldToken.mint() reverts if total supply would exceed registered vault weight. The contract — not us — enforces the 1:1 backing.' },
          { ttl: 'KYC at the protocol', body: 'IdentityRegistry gates every transfer. Non‑verified addresses cannot send or receive. Compliance modules AND‑gate every move.' },
          { ttl: 'Independent attestation', body: 'Marcum LLP physically verifies vault contents quarterly. Reports are linked on‑chain via attestation hash. Next: Dec 31, 2025.' },
        ].map(c => (
          <Card key={c.ttl} pad>
            <div className="serif" style={{ fontSize: 20, lineHeight: 1.2 }}>{c.ttl}</div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.55 }}>{c.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { PublicPoR });
