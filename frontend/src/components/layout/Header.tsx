import { NavLink } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, ShieldCheck, User, CircleHelp, Gem } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const NAV = [
  { to: '/',         label: 'Reserve',      Icon: LayoutDashboard },
  { to: '/admin',    label: 'Admin',        Icon: ShieldCheck },
  { to: '/investor', label: 'Investor',     Icon: User },
  { to: '/about',    label: 'How It Works', Icon: CircleHelp },
];

export default function Header() {
  const { dark, toggle } = useTheme();

  return (
    <header className="premium-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="brand-mark" aria-hidden="true">
            <Gem size={17} strokeWidth={1.6} />
          </div>
          <div className="hidden sm:block leading-none">
            <span className="brand-wordmark block">Gold Tokenizer</span>
            <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">Institutional Tokenization Platform</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav-capsule flex items-center gap-1 p-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-full text-[13px] font-medium transition-all duration-200
                ${isActive
                  ? 'nav-active text-zinc-950 dark:text-amber-200'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`
              }
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            <span className="live-dot" /> Amoy live
          </div>
          <button
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="theme-toggle w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 transition-all"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
