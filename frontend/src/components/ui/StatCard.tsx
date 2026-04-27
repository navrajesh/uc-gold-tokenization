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
      relative overflow-hidden rounded-xl border p-5
      bg-white dark:bg-zinc-900
      border-stone-200 dark:border-zinc-800
      shadow-sm hover:shadow-md transition-shadow
      ${accent ? 'border-t-2 border-t-amber-500 dark:border-t-amber-400' : ''}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1 flex items-center">
            {label}
            {help && <HelpTooltip text={help} />}
          </p>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {value}
          </div>
          {sub && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{sub}</p>
          )}
        </div>
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
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
