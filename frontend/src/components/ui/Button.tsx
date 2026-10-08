import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2';

const variants: Record<Variant, string> = {
  primary:   'btn-gold text-zinc-950',
  secondary: 'btn-secondary text-zinc-800 dark:text-zinc-100',
  ghost:     'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-400',
  danger:    'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-900/10',
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3.5 py-2',
  md: 'text-sm px-4.5 py-2.5',
  lg: 'text-sm px-6 py-3',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, disabled, className = '', ...rest }: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
