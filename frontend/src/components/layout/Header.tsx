import { NavLink } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, ShieldCheck, User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const NAV = [
  { to: '/',         label: 'Reserve',  Icon: LayoutDashboard },
  { to: '/admin',    label: 'Admin',    Icon: ShieldCheck },
  { to: '/investor', label: 'Investor', Icon: User },
];

export default function Header() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm select-none">G</span>
          </div>
          <span className="font-semibold text-sm hidden sm:block">
            <span className="gold-shimmer">Gold Token</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-normal"> Platform</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`
              }
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          {dark
            ? <Sun size={16} />
            : <Moon size={16} />
          }
        </button>
      </div>
    </header>
  );
}
