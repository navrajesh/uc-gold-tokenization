/* eslint-disable */
// Shared app shell with role switcher + sidebar nav + topbar.

const { useState } = React;

const ROLES = [
  { id: 'investor',  tag: 'Investor',         name: 'Maya Chen',         addr: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
  { id: 'admin',     tag: 'Issuer · Admin',   name: 'Treasury Ops',      addr: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
  { id: 'custodian', tag: 'Custodian',        name: 'Brinks SG · Vault', addr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
  { id: 'auditor',   tag: 'Auditor · Read',   name: 'Marcum LLP',        addr: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
  { id: 'public',    tag: 'Public · No wallet', name: 'Proof of Reserve', addr: '— anyone can view —' },
];

const NAV_BY_ROLE = {
  investor: [
    { id: 'home',       label: 'Holdings',     icon: 'home' },
    { id: 'mint',       label: 'Mint',         icon: 'plus' },
    { id: 'redeem',     label: 'Redeem',       icon: 'arrowDown' },
    { id: 'activity',   label: 'Activity',     icon: 'history' },
    { id: 'kyc',        label: 'Identity',     icon: 'shield', badge: 'verified' },
  ],
  admin: [
    { id: 'overview',   label: 'Overview',     icon: 'pulse' },
    { id: 'redemptions',label: 'Redemptions',  icon: 'arrowSwap', badge: '7' },
    { id: 'mint',       label: 'Mint Console', icon: 'hammer' },
    { id: 'kyc',        label: 'KYC Queue',    icon: 'users',   badge: '3' },
    { id: 'price',      label: 'Price Oracle', icon: 'trend' },
    { id: 'tokens',     label: 'Token Registry', icon: 'coins' },
  ],
  custodian: [
    { id: 'vault',      label: 'Vault',        icon: 'vault' },
    { id: 'intake',     label: 'Bar Intake',   icon: 'package' },
    { id: 'fulfill',    label: 'Fulfillment',  icon: 'flame', badge: '2' },
    { id: 'attest',     label: 'Attestations', icon: 'doc' },
  ],
  auditor: [
    { id: 'reserve',    label: 'Reserve',      icon: 'scale' },
    { id: 'events',     label: 'Events',       icon: 'pulse' },
    { id: 'compliance', label: 'Compliance',   icon: 'shield' },
    { id: 'reports',    label: 'Reports',      icon: 'doc' },
  ],
  public: [
    { id: 'por',        label: 'Proof of Reserve', icon: 'globe' },
  ],
};

const Sidebar = ({ role, setRole, view, setView }) => {
  const r = ROLES.find(x => x.id === role);
  const nav = NAV_BY_ROLE[role] || [];
  const [open, setOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark" />
        <div>
          <div className="name">Bullion</div>
          <div className="ticker">SGT999 · ERC‑3643</div>
        </div>
      </div>

      {/* Role switcher */}
      <div>
        <div className="nav-section">Acting as</div>
        <button className="role-card" onClick={() => setOpen(!open)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px' }}>
          <div className="role-tag">{r.tag}</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="role-name">{r.name}</div>
            <I.chevD size={12} />
          </div>
          <div className="role-addr">{r.addr.length > 20 ? `${r.addr.slice(0, 8)}…${r.addr.slice(-6)}` : r.addr}</div>
        </button>
        {open && (
          <div className="card" style={{ marginTop: 6, padding: 4 }}>
            {ROLES.map(opt => (
              <button key={opt.id} className="nav-item" onClick={() => { setRole(opt.id); setView(NAV_BY_ROLE[opt.id][0].id); setOpen(false); }} style={{ borderRadius: 6 }}>
                <span className="dot">{opt.id === role ? '●' : '○'}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{opt.tag}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{opt.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <div>
        <div className="nav-section">{role === 'public' ? 'Public' : 'Workspace'}</div>
        <div className="nav-list">
          {nav.map((item, i) => {
            const Ic = I[item.icon];
            return (
              <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
                <span className="dot">{String(i + 1).padStart(2, '0')}</span>
                <Ic size={14} />
                <span>{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div className="card" style={{ padding: 12, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}><span className="dot" />Network</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Ethereum · Mainnet</span>
            <span className="text-emerald">●</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <span>Block</span>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>21,308,442</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <span>Gas</span>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>14 gwei</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ role, view, theme, setTheme }) => {
  const r = ROLES.find(x => x.id === role);
  const v = (NAV_BY_ROLE[role] || []).find(n => n.id === view);
  return (
    <div className="topbar">
      <div className="crumbs">
        <span>Bullion</span>
        <span className="sep">/</span>
        <span>{r.tag}</span>
        <span className="sep">/</span>
        <strong>{v ? v.label : ''}</strong>
      </div>
      <div className="ticker-strip">
        <span>XAU/USD <b>$2,418.74</b> <span className="up">+0.42%</span></span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>SGT999/g <b>$92.56</b></span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>Reserve <b className="text-emerald">100.00%</b></span>
        <button className="btn ghost sm" onClick={() => setTheme(theme === 'paper' ? 'ink' : 'paper')} style={{ padding: '4px 8px' }}>
          {theme === 'paper' ? <I.moon size={13} /> : <I.sun size={13} />}
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { ROLES, NAV_BY_ROLE, Sidebar, Topbar });
