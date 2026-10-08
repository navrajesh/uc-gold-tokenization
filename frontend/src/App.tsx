import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import InvestorPortal from './pages/InvestorPortal';
import AboutDemo from './pages/AboutDemo';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell min-h-screen text-zinc-900 dark:text-zinc-100">
          <Header />
          <main className="relative z-10">
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/about"    element={<AboutDemo />} />
              <Route path="/admin"    element={<AdminPanel />} />
              <Route path="/investor" element={<InvestorPortal />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
