import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Plus, Download, Clock, ShieldCheck,
  Activity, Hammer, Users, TrendingUp, Coins,
  Vault, Package, Flame, FileText, Scale,
  Globe, ChevronDown, type LucideIcon,
} from 'lucide-react';

type RoleId = 'investor' | 'admin' | 'custodian' | 'auditor' | 'public';

interface NavItem { id: string; label: string; icon: LucideIcon; badge?: string; path: string; }
interface Role    { id: RoleId; tag: string; name: string; addr: string; }

const ROLES: Role[] = [
  { id: 'investor',  tag: 'Investor',           name: 'Maya Chen',         addr: '0x3C44…4293BC' },
  { id: 'admin',     tag: 'Issuer · Admin',      name: 'Treasury Ops',      addr: '0xf39F…92266'  },
  { id: 'custodian', tag: 'Custodian',           name: 'Brinks SG · Vault', addr: '0x7099…79C8'   },
  { id: 'auditor',   tag: 'Auditor · Read',      name: 'Marcum LLP',        addr: '0x90F7…3906'   },
  { id: 'public',    tag: 'Public · No wallet',  name: 'Proof of Reserve',  addr: '— anyone can view —' },
];

const NAV: Record<RoleId, NavItem[]> = {
  investor: [
    { id: 'home',     label: 'Holdings',       icon: Home,        path: '/investor' },
    { id: 'mint',     label: 'Mint',           icon: Plus,        path: '/investor/mint' },
    { id: 'redeem',   label: 'Redeem',         icon: Download,    path: '/investor/redeem' },
    { id: 'activity', label: 'Activity',       icon: Clock,       path: '/investor/activity' },
    { id: 'identity', label: 'Identity',       icon: ShieldCheck, path: '/investor/identity', badge: 'KYC' },
  ],
  admin: [
    { id: 'overview',    label: 'Overview',       icon: Activity,   path: '/admin' },
    { id: 'redemptions', label: 'Redemptions',    icon: Download,   path: '/admin/redemptions', badge: '7' },
    { id: 'mint',        label: 'Mint Console',   icon: Hammer,     path: '/admin/mint' },
    { id: 'kyc',         label: 'KYC Queue',      icon: Users,      path: '/admin/kyc',  badge: '3' },
    { id: 'price',       label: 'Price Oracle',   icon: TrendingUp, path: '/admin/price' },
    { id: 'registry',    label: 'Token Registry', icon: Coins,      path: '/admin/registry' },
  ],
  custodian: [
    { id: 'vault',       label: 'Vault',          icon: Vault,    path: '/custodian/vault' },
    { id: 'intake',      label: 'Bar Intake',     icon: Package,  path: '/custodian/intake' },
    { id: 'fulfillment', label: 'Fulfillment',    icon: Flame,    path: '/custodian/fulfillment', badge: '2' },
    { id: 'attestation', label: 'Attestations',   icon: FileText, path: '/custodian/attestation' },
  ],
  auditor: [
    { id: 'reserve',    label: 'Reserve',     icon: Scale,       path: '/auditor' },
    { id: 'compliance', label: 'Compliance',  icon: ShieldCheck, path: '/auditor/compliance' },
    { id: 'reports',    label: 'Reports',     icon: FileText,    path: '/auditor/reports' },
  ],
  public: [
    { id: 'por', label: 'Proof of Reserve', icon: Globe, path: '/' },
  ],
};

function deriveRole(pathname: string): RoleId {
  if (pathname.startsWith('/investor'))  return 'investor';
  if (pathname.startsWith('/admin'))     return 'admin';
  if (pathname.startsWith('/custodian')) return 'custodian';
  if (pathname.startsWith('/auditor'))   return 'auditor';
  return 'public';
}

function isNavActive(itemPath: string, pathname: string): boolean {
  const exactOnly = ['/', '/investor', '/admin', '/auditor'];
  if (exactOnly.includes(itemPath)) return pathname === itemPath;
  return pathname.startsWith(itemPath);
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = deriveRole(pathname);
  const r = ROLES.find(x => x.id === role)!;
  const nav = NAV[role];
  const [open, setOpen] = useState(false);

  function switchRole(newRole: RoleId) {
    navigate(NAV[newRole][0].path);
    setOpen(false);
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
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
        <button className="role-card" onClick={() => setOpen(o => !o)}>
          <div className="role-tag">{r.tag}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="role-name">{r.name}</div>
            <ChevronDown
              size={12}
              style={{
                color: 'var(--ink-3)',
                transform: open ? 'rotate(180deg)' : undefined,
                transition: 'transform .15s',
                flexShrink: 0,
              }}
            />
          </div>
          <div className="role-addr">{r.addr}</div>
        </button>

        {open && (
          <div className="card" style={{ marginTop: 6, padding: 4 }}>
            {ROLES.map(opt => (
              <button
                key={opt.id}
                className={`nav-item${opt.id === role ? ' active' : ''}`}
                onClick={() => switchRole(opt.id)}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{opt.tag}</span>
                  <span style={{ fontSize: 10.5, color: opt.id === role ? 'inherit' : 'var(--ink-3)' }}>
                    {opt.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <div>
        <div className="nav-section">{role === 'public' ? 'Public' : 'Workspace'}</div>
        <nav className="nav-list">
          {nav.map((item, i) => {
            const active = isNavActive(item.path, pathname);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="dot">{String(i + 1).padStart(2, '0')}</span>
                <Icon size={14} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Network status footer */}
      <div style={{ marginTop: 'auto' }}>
        <div className="card" style={{ padding: 12, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            <span className="dot" />
            Network
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Localhost · Hardhat</span>
            <span style={{ color: 'var(--emerald)' }}>●</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span>Chain ID</span>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>31337</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span>RPC</span>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>:8545</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
