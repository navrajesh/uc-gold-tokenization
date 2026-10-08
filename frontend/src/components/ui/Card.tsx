import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`premium-card rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 sm:px-6 py-4 border-b border-stone-100/80 dark:border-white/[0.06] flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">{children}</h3>;
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 sm:px-6 py-5 ${className}`}>{children}</div>;
}
