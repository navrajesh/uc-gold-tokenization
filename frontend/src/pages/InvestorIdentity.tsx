import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Check } from 'lucide-react';
import { useInvestorWallet } from '../hooks/useInvestorWallet';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Badge } from '../components/ui/Badge';
import { Addr } from '../components/ui/Addr';
import { formatDate } from '../lib/utils';

export default function InvestorIdentity() {
  const nav = useNavigate();
  const { wallet, identity, loading } = useInvestorWallet();

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
      <Eyebrow>Identity · On-chain KYC</Eyebrow>
      <h1 className="page-title">Your verified identity.</h1>
      <p className="page-sub">KYC status stored in the IdentityRegistry contract. Verified wallets can send and receive SGT999 tokens.</p>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32, color: 'var(--ink-3)', fontSize: 13 }}>
          <div className="loading-ring" /> Loading…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 24 }}>
          {/* Main identity card */}
          <div className="card card-pad">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bullion-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Shield size={26} style={{ color: 'var(--bullion-2)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 22, lineHeight: 1.1 }}>{wallet.slice(0, 6)}…{wallet.slice(-4)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  {identity?.registeredAt ? `Registered ${formatDate(identity.registeredAt)}` : 'Not registered in identity registry'}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <Badge tone={identity?.isVerified ? 'ok' : 'danger'} dot>
                  {identity?.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>

            <hr className="hairline" style={{ margin: '18px 0' }} />

            <h2 className="section-title">Claims</h2>

            {identity ? (
              <div style={{ marginTop: 12 }}>
                {[
                  { label: 'KYC Status', value: identity.isVerified ? 'Verified' : 'Not verified', ok: identity.isVerified },
                  { label: 'Country of residence', value: identity.countryCode ?? '— not set', ok: !!identity.countryCode },
                  { label: 'On-chain verification', value: identity.onchainVerified ? 'Verified on-chain' : 'Off-chain record only', ok: identity.onchainVerified ?? false },
                  { label: 'Last updated', value: identity.updatedAt ? formatDate(identity.updatedAt) : 'Never updated', ok: true },
                ].map(c => (
                  <div key={c.label} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--rule)', alignItems: 'flex-start' }}>
                    <span style={{ color: c.ok ? 'var(--emerald)' : 'var(--ink-3)', marginTop: 2, flexShrink: 0 }}>
                      <Check size={14} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 12, padding: 20, background: 'var(--paper-2)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
                This wallet is not registered in the identity registry.<br />
                Contact admin to complete KYC registration before you can transact.
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card card-pad">
              <Eyebrow>Wallet</Eyebrow>
              <div style={{ marginTop: 8 }}>
                <Addr value={wallet} prefixLen={8} />
              </div>
              <hr className="hairline" style={{ margin: '12px 0' }} />
              <div style={{ fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Registry status</span>
                  <span>{identity ? 'Registered' : 'Not found'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Can transfer</span>
                  <span style={{ color: identity?.isVerified ? 'var(--emerald)' : 'var(--ruby)' }}>
                    {identity?.isVerified ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>Linked token</span>
                  <span>SGT999</span>
                </div>
              </div>
            </div>

            <div className="card card-pad">
              <Eyebrow>Next steps</Eyebrow>
              {identity?.isVerified ? (
                <>
                  <div className="serif tnum" style={{ fontSize: 24, marginTop: 8 }}>Active</div>
                  <div className="hint" style={{ marginTop: 4 }}>Your identity is verified and ready to transact.</div>
                  <button className="btn ghost sm" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => nav('/investor/mint')}>
                    Mint gold tokens
                  </button>
                </>
              ) : (
                <>
                  <div className="serif tnum" style={{ fontSize: 20, marginTop: 8, color: 'var(--ruby)' }}>Action required</div>
                  <div className="hint" style={{ marginTop: 4 }}>Contact your issuer or admin to complete KYC registration before you can transact.</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
