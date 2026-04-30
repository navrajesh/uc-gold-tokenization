import type { ReactNode } from 'react';
import { Sparkline } from './Sparkline';

interface Props {
  label: ReactNode;
  num: ReactNode;
  unit?: string;
  sub?: ReactNode;
  deltaPct?: number;
  sparkData?: number[];
}

export function KPI({ label, num, unit, sub, deltaPct, sparkData }: Props) {
  return (
    <div className="card kpi">
      <div className="label">{label}</div>
      <div className="num tnum">
        {num}
        {unit && <small>{unit}</small>}
      </div>
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
