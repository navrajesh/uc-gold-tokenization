import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
  compact: boolean;
  toggleCompact: () => void;
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {}, compact: false, toggleCompact: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('gold-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [compact, setCompact] = useState<boolean>(() => {
    return localStorage.getItem('gold-compact') === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-theme', dark ? 'ink' : 'paper');
    localStorage.setItem('gold-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('gold-compact', String(compact));
  }, [compact]);

  return (
    <Ctx.Provider value={{ dark, toggle: () => setDark(d => !d), compact, toggleCompact: () => setCompact(c => !c) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
