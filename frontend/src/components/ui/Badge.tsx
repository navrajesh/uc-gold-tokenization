import type { ReactNode } from 'react';

type Variant = 'gold' | 'green' | 'blue' | 'amber' | 'red' | 'gray';

const styles: Record<Variant, string> = {
  gold:  'border border-amber-300/50 bg-amber-100/80 text-amber-900 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-200',
  green: 'border border-emerald-300/40 bg-emerald-100/70 text-emerald-800 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-300',
  blue:  'border border-blue-300/40 bg-blue-100/70 text-blue-800 dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-blue-300',
  amber: 'border border-amber-300/40 bg-amber-100/70 text-amber-800 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-300',
  red:   'border border-red-300/40 bg-red-100/70 text-red-800 dark:border-red-400/15 dark:bg-red-400/10 dark:text-red-300',
  gray:  'border border-zinc-200/80 bg-zinc-100/70 text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.05] dark:text-zinc-400',
};

export function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    PENDING:   'amber',
    APPROVED:  'blue',
    FULFILLED: 'green',
    REJECTED:  'red',
    Active:    'green',
    Inactive:  'gray',
  };
  const dot: Record<string, string> = {
    PENDING:   'bg-amber-500',
    APPROVED:  'bg-blue-500',
    FULFILLED: 'bg-emerald-500',
    REJECTED:  'bg-red-500',
    Active:    'bg-emerald-500',
    Inactive:  'bg-zinc-400',
  };
  return (
    <Badge variant={map[status] ?? 'gray'}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? 'bg-zinc-400'}`} />
      {status}
    </Badge>
  );
}
