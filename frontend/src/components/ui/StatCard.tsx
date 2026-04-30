import type { ReactNode } from 'react';
import { HelpTooltip } from './Tooltip';
import { Sparkline } from './Sparkline';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
  help?: string;
  sparkData?: number[];
  deltaPct?: number;
}

export function StatCard({ label, value, sub, icon, accent, help, sparkData, deltaPct }: Props) {
  return (
    <div
      className="card kpi"
      style={accent ? { borderTop: '2px solid var(--bullion-2)' } : undefined}
    >
      <div className="label">
        {icon && (
          <span style={{ color: accent ? 'var(--bullion)' : 'var(--ink-4)', display: 'flex', flexShrink: 0 }}>
            {icon}
          </span>
        )}
        {label}
        {help && <HelpTooltip text={help} />}
      </div>
      <div className="num tnum">{value}</div>
      {sub && <div className="sub">{sub}</div>}
      {typeof deltaPct === 'number' && (
        <div className="sub">
          <span className={deltaPct >= 0 ? 'delta-up' : 'delta-dn'}>
            {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(2)}%
          </span>
          <span style={{ color: 'var(--ink-3)' }}>24h</span>
        </div>
      )}
      {sparkData && <Sparkline data={sparkData} />}
    </div>
  );
}
