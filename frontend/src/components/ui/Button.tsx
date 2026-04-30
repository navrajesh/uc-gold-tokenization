import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'bullion';
type Size    = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<Variant, string> = {
  primary:   'btn',
  secondary: 'btn ghost',
  ghost:     'btn ghost',
  danger:    'btn danger',
  bullion:   'btn bullion',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'sm',
  md: '',
  lg: 'lg',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, disabled, className = '', ...rest }: Props) {
  const sizeStr = SIZE_CLASS[size];
  const base = `${VARIANT_CLASS[variant]}${sizeStr ? ` ${sizeStr}` : ''}`;
  return (
    <button
      disabled={disabled || loading}
      className={`${base}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {loading && (
        <svg
          style={{ width: '1em', height: '1em', flexShrink: 0 }}
          className="animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
