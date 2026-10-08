import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          premium-input w-full rounded-xl border px-3.5 py-2.5 text-sm
          text-zinc-900 dark:text-zinc-100
          placeholder:text-zinc-400 dark:placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
          transition-all
          ${error ? 'border-red-400 dark:border-red-500' : ''}
          ${className}
        `}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export function Select({ label, children, className = '', id, ...rest }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          premium-input w-full rounded-xl border px-3.5 py-2.5 text-sm
          text-zinc-900 dark:text-zinc-100
          focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
          transition-all ${className}
        `}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
