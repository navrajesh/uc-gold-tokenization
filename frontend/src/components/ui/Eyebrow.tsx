import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  accent?: boolean;
}

export function Eyebrow({ children, accent = true }: Props) {
  return (
    <div className="eyebrow">
      {accent && <span className="dot" />}
      {children}
    </div>
  );
}
