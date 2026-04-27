import type { ReactNode } from 'react';

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
        {icon}
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">{title}</p>
      {body && <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">{body}</p>}
    </div>
  );
}
