import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm
          bg-white dark:bg-zinc-800
          border-stone-300 dark:border-zinc-700
          text-zinc-900 dark:text-zinc-100
          placeholder:text-zinc-400 dark:placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
          transition-colors
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
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm
          bg-white dark:bg-zinc-800
          border-stone-300 dark:border-zinc-700
          text-zinc-900 dark:text-zinc-100
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
          transition-colors ${className}
        `}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
