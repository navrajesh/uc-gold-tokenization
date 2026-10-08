import type { ReactNode } from 'react';
import { HelpTooltip } from './Tooltip';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  accent?: boolean;
  help?: string;
}

export function StatCard({ label, value, sub, icon, accent, help }: Props) {
  return (
    <div className={`
      premium-stat relative overflow-hidden rounded-2xl p-5 sm:p-6
      ${accent ? 'premium-stat-accent' : ''}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.14em] mb-2 flex items-center">
            {label}
            {help && <HelpTooltip text={help} />}
          </p>
          <div className="stat-value text-2xl font-semibold text-zinc-950 dark:text-zinc-50 truncate">
            {value}
          </div>
          {sub && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{sub}</p>
          )}
        </div>
        <div className={`
          stat-icon flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${accent
            ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
            : 'bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }
        `}>
          {icon}
        </div>
      </div>
    </div>
  );
}
