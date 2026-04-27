import type { ReactNode } from 'react';

type Variant = 'gold' | 'green' | 'blue' | 'amber' | 'red' | 'gray';

const styles: Record<Variant, string> = {
  gold:  'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  blue:  'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red:   'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  gray:  'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
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
