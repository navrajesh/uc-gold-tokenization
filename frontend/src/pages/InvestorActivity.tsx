import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft } from 'lucide-react';
import { useInvestorWallet } from '../hooks/useInvestorWallet';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { formatGrams, formatUsd } from '../lib/utils';

export default function InvestorActivity() {
  const nav = useNavigate();
  const { wallet, redemptions, price, loading } = useInvestorWallet();
  const priceNum = price ? parseFloat(price.pricePerGramUsd) : 0;

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

  return (
    <div className="main-pad">
      <Eyebrow>Activity</Eyebrow>
      <h1 className="page-title">Every move, on the ledger.</h1>
      <p className="page-sub">Redemption requests submitted from your wallet. Nothing is cached.</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge tone="ink">All</Badge>
        <Badge>Redeem</Badge>
        <span style={{ flex: 1 }} />
        <button className="btn ghost sm"><Upload size={12} /> Export</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            <div className="loading-ring" style={{ margin: '0 auto 8px' }} />
            Loading…
          </div>
        ) : redemptions.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            No redemption history for this wallet.
          </div>
        ) : (
          <div className="scroll-x">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th className="num">Amount</th>
                  <th className="num">USD value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map(r => (
                  <tr key={r.id}>
                    <td className="muted">
                      {new Date(r.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })},&nbsp;
                      {new Date(r.requestedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td><Badge tone="danger">Redeem</Badge></td>
                    <td className="addr">{r.redemptionRef}</td>
                    <td className="num">
                      <span className="serif" style={{ fontSize: 15, color: 'var(--ruby)' }}>
                        −{formatGrams(r.requestedGrams)}
                      </span>
                    </td>
                    <td className="num" style={{ color: 'var(--ink-3)' }}>
                      {priceNum > 0 ? `−${formatUsd(r.requestedGrams * priceNum)}` : '—'}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
