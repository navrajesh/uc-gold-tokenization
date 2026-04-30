import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Shell({ children }: { children: ReactNode }) {
  const { compact } = useTheme();

  return (
    <div className={`shell${compact ? ' compact' : ''}`}>
      <Sidebar />
      <div className="main">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
