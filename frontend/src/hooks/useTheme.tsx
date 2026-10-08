import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ThemeCtx { dark: boolean; toggle: () => void }
const Ctx = createContext<ThemeCtx>({ dark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('gold-theme');
    if (stored) return stored === 'dark';
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('gold-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <Ctx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
