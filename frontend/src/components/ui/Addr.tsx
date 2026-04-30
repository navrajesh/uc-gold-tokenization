import { useState } from 'react';

interface Props {
  value: string;
  prefixLen?: number;
}

export function Addr({ value, prefixLen = 6 }: Props) {
  const [copied, setCopied] = useState(false);
  const short = value.length > 12 ? `${value.slice(0, prefixLen)}…${value.slice(-4)}` : value;

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <span
      className="mono"
      onClick={copy}
      title={value}
      style={{ fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer', userSelect: 'none' }}
    >
      {copied ? 'Copied!' : short}
    </span>
  );
}
