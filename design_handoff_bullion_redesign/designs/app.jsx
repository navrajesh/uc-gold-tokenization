/* eslint-disable */
// App — wires the role-aware shell into a frame that goes inside DCArtboards.

const { useState: useStateApp, useEffect: useEffectApp } = React;

const ROUTERS = {
  investor:  { home: InvHoldings, mint: InvMint, redeem: InvRedeem, activity: InvActivity, kyc: InvKyc },
  admin:     { overview: AdmOverview, redemptions: AdmRedemptions, mint: AdmMint, kyc: AdmKyc, price: AdmPrice, tokens: AdmTokens },
  custodian: { vault: CusVault, intake: CusIntake, fulfill: CusFulfill, attest: CusAttest },
  auditor:   { reserve: AudReserve, events: AudReserve, compliance: AudReserve, reports: AudReserve },
  public:    { por: PublicPoR },
};

const Workspace = ({ initialRole = 'investor', initialView, theme = 'paper', density = 'comfy' }) => {
  const [role, setRole] = useStateApp(initialRole);
  const [view, setView] = useStateApp(initialView || NAV_BY_ROLE[initialRole][0].id);
  const [t, setT] = useStateApp(theme);

  useEffectApp(() => { setT(theme); }, [theme]);

  const Page = (ROUTERS[role] && ROUTERS[role][view]) || (() => <div style={{ padding: 40 }}>Coming soon</div>);

  return (
    <div data-theme={t === 'ink' ? 'ink' : ''} style={{ height: '100%' }}>
      <div className={`shell ${density === 'compact' ? 'compact' : ''}`}>
        <Sidebar role={role} setRole={setRole} view={view} setView={setView} />
        <div className="main">
          <Topbar role={role} view={view} theme={t} setTheme={setT} />
          <Page />
        </div>
      </div>
    </div>
  );
};

// Headerless "public" frame (no sidebar — simulating the marketing/proof page)
const PublicShell = ({ theme = 'paper' }) => (
  <div data-theme={theme === 'ink' ? 'ink' : ''} style={{ height: '100%', background: 'var(--paper)' }}>
    {/* Marketing topbar */}
    <div style={{ borderBottom: '1px solid var(--rule)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--paper)', zIndex: 10 }}>
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, oklch(0.95 0.06 85), var(--bullion) 60%, var(--bullion-2))' }} />
        <span className="serif" style={{ fontSize: 17 }}>Bullion</span>
      </div>
      <div className="row" style={{ gap: 24, fontSize: 12.5, color: 'var(--ink-2)' }}>
        <span>Proof of Reserve</span><span>Token</span><span>Vaults</span><span>Audit</span><span>Docs</span>
      </div>
      <div className="row gap-2">
        <button className="btn ghost sm">Sign in</button>
        <button className="btn sm">Open account</button>
      </div>
    </div>
    <div style={{ overflow: 'auto', height: 'calc(100% - 57px)' }}>
      <PublicPoR />
    </div>
  </div>
);

Object.assign(window, { Workspace, PublicShell });

// Mount canvas
const Canvas = window.DesignCanvas;
const Section = window.DCSection;
const Artboard = window.DCArtboard;

const App = () => (
  <Canvas
    title="Bullion · Gold Tokenizer redesign"
    subtitle="Role-aware UX upgrade for navrajesh/uc-gold-tokenization · 5 personas · 17 screens"
  >
    <Section id="public" title="00 · Public" subtitle="No wallet needed. The trust surface for every prospect, regulator, and journalist.">
      <Artboard id="por" label="Proof of Reserve · marketing site" width={1440} height={2400}>
        <PublicShell theme="paper" />
      </Artboard>
      <Artboard id="por-ink" label="Proof of Reserve · ink theme" width={1440} height={2400}>
        <PublicShell theme="ink" />
      </Artboard>
    </Section>

    <Section id="investor" title="01 · Investor" subtitle="Maya Chen, Singapore retail. Verify → Mint → Redeem → Track. Mobile-first attention to the wallet/holdings surface.">
      <Artboard id="inv-home" label="Holdings dashboard" width={1440} height={1000}>
        <Workspace initialRole="investor" initialView="home" />
      </Artboard>
      <Artboard id="inv-mint" label="Mint flow · subscribe" width={1440} height={1000}>
        <Workspace initialRole="investor" initialView="mint" />
      </Artboard>
      <Artboard id="inv-redeem" label="Redeem · multi‑step" width={1440} height={1100}>
        <Workspace initialRole="investor" initialView="redeem" />
      </Artboard>
      <Artboard id="inv-activity" label="Activity ledger" width={1440} height={900}>
        <Workspace initialRole="investor" initialView="activity" />
      </Artboard>
      <Artboard id="inv-kyc" label="Identity · ONCHAINID" width={1440} height={900}>
        <Workspace initialRole="investor" initialView="kyc" />
      </Artboard>
      <Artboard id="inv-mobile" label="Mobile holdings · iOS" width={420} height={870}>
        <div style={{ padding: 15, background: 'var(--paper-2)', height: '100%', display: 'grid', placeItems: 'center' }}>
          <MobileInvestor />
        </div>
      </Artboard>
    </Section>

    <Section id="admin" title="02 · Issuer Admin" subtitle="Treasury Ops at the issuing entity. Mint console with on-chain pre-flight, redemption kanban, KYC queue, oracle.">
      <Artboard id="adm-overview" label="Operations overview" width={1440} height={900}>
        <Workspace initialRole="admin" initialView="overview" />
      </Artboard>
      <Artboard id="adm-redemptions" label="Redemption queue · kanban" width={1440} height={900}>
        <Workspace initialRole="admin" initialView="redemptions" />
      </Artboard>
      <Artboard id="adm-mint" label="Mint console" width={1440} height={1000}>
        <Workspace initialRole="admin" initialView="mint" />
      </Artboard>
      <Artboard id="adm-kyc" label="KYC queue" width={1440} height={750}>
        <Workspace initialRole="admin" initialView="kyc" />
      </Artboard>
      <Artboard id="adm-price" label="Price oracle" width={1440} height={850}>
        <Workspace initialRole="admin" initialView="price" />
      </Artboard>
      <Artboard id="adm-tokens" label="Token registry" width={1440} height={750}>
        <Workspace initialRole="admin" initialView="tokens" />
      </Artboard>
    </Section>

    <Section id="custodian" title="03 · Custodian" subtitle="Brinks Singapore vault operator. Inventory, bar intake, redemption fulfillment, attestations.">
      <Artboard id="cus-vault" label="Vault inventory" width={1440} height={900}>
        <Workspace initialRole="custodian" initialView="vault" />
      </Artboard>
      <Artboard id="cus-intake" label="Bar intake · register on-chain" width={1440} height={1100}>
        <Workspace initialRole="custodian" initialView="intake" />
      </Artboard>
      <Artboard id="cus-fulfill" label="Fulfillment queue" width={1440} height={900}>
        <Workspace initialRole="custodian" initialView="fulfill" />
      </Artboard>
      <Artboard id="cus-attest" label="Attestations" width={1440} height={800}>
        <Workspace initialRole="custodian" initialView="attest" />
      </Artboard>
    </Section>

    <Section id="auditor" title="04 · Auditor (read-only)" subtitle="Independent attestor reconstructing reserve invariants from chain state.">
      <Artboard id="aud-reserve" label="Reserve invariants" width={1440} height={900}>
        <Workspace initialRole="auditor" initialView="reserve" />
      </Artboard>
      <Artboard id="aud-ink" label="Reserve · ink theme" width={1440} height={900}>
        <Workspace initialRole="auditor" initialView="reserve" theme="ink" />
      </Artboard>
    </Section>
  </Canvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
