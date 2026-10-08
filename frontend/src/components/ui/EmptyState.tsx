import type { ReactNode } from 'react';

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl border border-amber-200/50 dark:border-amber-400/10 bg-amber-50/70 dark:bg-amber-400/[0.06] flex items-center justify-center text-amber-700/70 dark:text-amber-300/60 mb-4 shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">{title}</p>
      {body && <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">{body}</p>}
    </div>
  );
}
