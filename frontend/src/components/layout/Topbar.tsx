import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, LayoutGrid } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../lib/api';
import type { GoldPrice } from '../../lib/types';

type RoleId = 'investor' | 'admin' | 'custodian' | 'auditor' | 'public';

const ROLE_LABELS: Record<RoleId, string> = {
  investor:  'Investor',
  admin:     'Issuer · Admin',
  custodian: 'Custodian',
  auditor:   'Auditor',
  public:    'Public',
};

const VIEW_LABELS: Record<string, string> = {
  '/':                      'Proof of Reserve',
  '/investor':              'Holdings',
  '/investor/mint':         'Mint',
  '/investor/redeem':       'Redeem',
  '/investor/activity':     'Activity',
  '/investor/identity':     'Identity',
  '/admin':                 'Overview',
  '/admin/redemptions':     'Redemptions',
  '/admin/mint':            'Mint Console',
  '/admin/kyc':             'KYC Queue',
  '/admin/price':           'Price Oracle',
  '/admin/registry':        'Token Registry',
  '/custodian/vault':       'Vault',
  '/custodian/intake':      'Bar Intake',
  '/custodian/fulfillment': 'Fulfillment',
  '/custodian/attestation': 'Attestations',
  '/auditor':               'Reserve',
  '/auditor/compliance':    'Compliance',
  '/auditor/reports':       'Reports',
};

function deriveRole(pathname: string): RoleId {
  if (pathname.startsWith('/investor'))  return 'investor';
  if (pathname.startsWith('/admin'))     return 'admin';
  if (pathname.startsWith('/custodian')) return 'custodian';
  if (pathname.startsWith('/auditor'))   return 'auditor';
  return 'public';
}

export default function Topbar() {
  const { pathname } = useLocation();
  const { dark, toggle, compact, toggleCompact } = useTheme();
  const [price, setPrice] = useState<GoldPrice | null>(null);

  const role = deriveRole(pathname);
  const viewLabel = VIEW_LABELS[pathname] ?? '';

  useEffect(() => {
    api.getPrice().then(setPrice).catch(() => {});
  }, []);

  const pricePerGram = price ? parseFloat(price.pricePerGramUsd) : null;
  const xauUsd = pricePerGram ? (pricePerGram * 31.1035).toFixed(2) : null;

  return (
    <div className="topbar">
      <div className="crumbs">
        <span>Bullion</span>
        <span className="sep">/</span>
        <span>{ROLE_LABELS[role]}</span>
        {viewLabel && (
          <>
            <span className="sep">/</span>
            <strong>{viewLabel}</strong>
          </>
        )}
      </div>

      <div className="ticker-strip">
        {xauUsd ? (
          <>
            <span>XAU/USD <b>${xauUsd}</b></span>
            <span className="sep">·</span>
            <span>SGT999/g <b>${pricePerGram?.toFixed(2)}</b></span>
            <span className="sep">·</span>
            <span>Reserve <b style={{ color: 'var(--emerald)' }}>100.00%</b></span>
          </>
        ) : (
          <span style={{ opacity: 0.4, fontSize: 11 }}>backend offline</span>
        )}
      </div>

      <div className="topbar-actions">
        <button
          className="icon-btn"
          onClick={toggleCompact}
          title={compact ? 'Comfortable density' : 'Compact density'}
        >
          <LayoutGrid size={13} />
        </button>
        <button
          className="icon-btn"
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </div>
  );
}
