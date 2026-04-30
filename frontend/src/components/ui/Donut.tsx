interface Props {
  pct?: number;
  color?: string;
  size?: number;
  label?: string;
}

export function Donut({ pct = 100, color = 'var(--bullion-2)', size = 120, label }: Props) {
  return (
    <div
      className="donut"
      style={{ '--p': pct, '--c': color, width: size, height: size } as React.CSSProperties}
    >
      <div style={{ textAlign: 'center' }}>
        <div className="serif tnum" style={{ fontSize: size * 0.22, lineHeight: 1 }}>
          {pct}
          <small style={{ fontFamily: 'var(--font-sans)', fontSize: size * 0.10, color: 'var(--ink-3)' }}>%</small>
        </div>
        {label && (
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
