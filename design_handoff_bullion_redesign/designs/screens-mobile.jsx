/* eslint-disable */
// Mobile investor — iOS-style frame embedded in canvas

const MobileInvestor = () => (
  <div className="mobile" style={{ borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 60px -20px oklch(0 0 0 / 0.18), 0 0 0 10px oklch(0.18 0.01 60), 0 0 0 11px oklch(0.30 0.01 60)' }}>
    <div className="mobile-shell">
      <div className="mobile-statusbar">
        <span>9:41</span>
        <div className="mobile-bar-icons">
          <I.pulse size={13} /><I.globe size={13} />
          <span style={{ width: 22, height: 11, border: '1px solid var(--ink)', borderRadius: 2, position: 'relative' }}>
            <span style={{ position: 'absolute', inset: 1.5, background: 'var(--ink)', borderRadius: 1 }} />
          </span>
        </div>
      </div>
      <div className="mobile-pad">
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, oklch(0.95 0.06 85), var(--bullion) 60%, var(--bullion-2))' }} />
            <div>
              <div className="serif" style={{ fontSize: 17, lineHeight: 1 }}>Bullion</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>Maya · SG</div>
            </div>
          </div>
          <I.bell size={16} />
        </div>

        <div className="card" style={{ padding: 18, background: 'linear-gradient(180deg, var(--paper) 0%, var(--bullion-soft) 220%)' }}>
          <div className="eyebrow"><span className="dot" />Holdings</div>
          <div className="serif tnum" style={{ fontSize: 44, lineHeight: 1, marginTop: 6, letterSpacing: '-0.025em' }}>1,000.00<small style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 6, fontFamily: 'var(--font-sans)' }}>g</small></div>
          <div className="row mt-2" style={{ gap: 8, alignItems: 'baseline' }}>
            <span className="serif tnum" style={{ fontSize: 17, color: 'var(--bullion-2)' }}>$92,560.00</span>
            <span className="text-emerald" style={{ fontSize: 11 }}>+0.42%</span>
          </div>
          <Sparkline data={[88,89,87,90,91,90,92,93,92,94,95,93,96,94,95,96]} w={300} h={36} />
          <div className="row mt-3" style={{ gap: 6 }}>
            <button className="btn bullion sm" style={{ flex: 1, justifyContent: 'center' }}><I.plus size={11} />Mint</button>
            <button className="btn ghost sm" style={{ flex: 1, justifyContent: 'center' }}><I.arrowDown size={11} />Redeem</button>
            <button className="btn ghost sm" style={{ flex: 1, justifyContent: 'center' }}><I.arrowSwap size={11} />Send</button>
          </div>
        </div>

        <div className="card mt-3" style={{ padding: 14 }}>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald)', display: 'grid', placeItems: 'center' }}><I.shield size={14} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>KYC Verified</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>Singapore · Retail tier</div>
            </div>
            <I.chevR size={13} />
          </div>
        </div>

        <div className="eyebrow mt-3" style={{ marginBottom: 8 }}><span className="dot" />Recent</div>
        <div className="card">
          {[
            ['Mint','+50.00 g','Today'],
            ['Transfer','+12.50 g','Sep 28'],
            ['Redeem','−100.00 g','Sep 22'],
          ].map((r, i, a) => (
            <div key={i} className="row" style={{ padding: '10px 14px', borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0, gap: 10 }}>
              <Badge tone={r[0] === 'Redeem' ? 'danger' : r[0] === 'Mint' ? 'bullion' : 'ghost'}>{r[0]}</Badge>
              <span className="serif tnum" style={{ fontSize: 14, flex: 1, color: r[1].startsWith('−') ? 'var(--ruby)' : 'var(--ink)' }}>{r[1]}</span>
              <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{r[2]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mobile-tabbar">
        {[['home','Home',true],['plus','Mint',false],['history','Activity',false],['user','Identity',false]].map(([k,l,a]) => {
          const Ic = I[k];
          return (
            <div key={k} className={`mobile-tab ${a ? 'active' : ''}`}>
              <Ic size={18} />
              <span>{l}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

Object.assign(window, { MobileInvestor });
