import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import InvestorPortal from './pages/InvestorPortal';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
          <Header />
          <main>
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/admin"    element={<AdminPanel />} />
              <Route path="/investor" element={<InvestorPortal />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
