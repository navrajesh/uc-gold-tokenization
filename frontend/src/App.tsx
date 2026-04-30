import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AdminRedemptions from './pages/AdminRedemptions';
import AdminMint from './pages/AdminMint';
import AdminKyc from './pages/AdminKyc';
import AdminPrice from './pages/AdminPrice';
import AdminRegistry from './pages/AdminRegistry';
import CustodianVault from './pages/CustodianVault';
import CustodianIntake from './pages/CustodianIntake';
import CustodianFulfillment from './pages/CustodianFulfillment';
import CustodianAttestation from './pages/CustodianAttestation';
import AuditorReserve from './pages/AuditorReserve';
import InvestorPortal from './pages/InvestorPortal';
import InvestorActivity from './pages/InvestorActivity';
import InvestorRedeem from './pages/InvestorRedeem';
import InvestorMint from './pages/InvestorMint';
import InvestorIdentity from './pages/InvestorIdentity';

function ComingSoon({ page }: { page: string }) {
  return (
    <div className="main-pad">
      <h1 className="page-title">{page}</h1>
      <p className="page-sub" style={{ marginTop: 8 }}>This page is coming in a future phase.</p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            {/* Public */}
            <Route path="/"                       element={<Dashboard />} />

            {/* Investor */}
            <Route path="/investor"               element={<InvestorPortal />} />
            <Route path="/investor/mint"          element={<InvestorMint />} />
            <Route path="/investor/redeem"        element={<InvestorRedeem />} />
            <Route path="/investor/activity"      element={<InvestorActivity />} />
            <Route path="/investor/identity"      element={<InvestorIdentity />} />

            {/* Issuer Admin */}
            <Route path="/admin"                  element={<AdminPanel />} />
            <Route path="/admin/redemptions"      element={<AdminRedemptions />} />
            <Route path="/admin/mint"             element={<AdminMint />} />
            <Route path="/admin/kyc"              element={<AdminKyc />} />
            <Route path="/admin/price"            element={<AdminPrice />} />
            <Route path="/admin/registry"         element={<AdminRegistry />} />

            {/* Custodian */}
            <Route path="/custodian/vault"        element={<CustodianVault />} />
            <Route path="/custodian/intake"       element={<CustodianIntake />} />
            <Route path="/custodian/fulfillment"  element={<CustodianFulfillment />} />
            <Route path="/custodian/attestation"  element={<CustodianAttestation />} />

            {/* Auditor */}
            <Route path="/auditor"                element={<AuditorReserve />} />
            <Route path="/auditor/compliance"     element={<ComingSoon page="Compliance Reports" />} />
            <Route path="/auditor/reports"        element={<ComingSoon page="Reports" />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
