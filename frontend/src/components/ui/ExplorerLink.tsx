import { ExternalLink } from 'lucide-react';
import { shortAddress } from '../../lib/utils';
import { AMOY_EXPLORER_URL, isTransactionHash } from '../../lib/explorer';

type ExplorerLinkProps = {
  value: string;
  kind: 'address' | 'tx';
  label?: string;
  chars?: number;
  className?: string;
};

export function ExplorerLink({
  value,
  kind,
  label,
  chars = 6,
  className = '',
}: ExplorerLinkProps) {
  const noun = kind === 'address' ? 'address' : 'transaction';
  const href = `${AMOY_EXPLORER_URL}/${kind}/${encodeURIComponent(value)}`;

  if (kind === 'tx' && !isTransactionHash(value)) {
    return <span className={`text-zinc-400 dark:text-zinc-500 ${className}`}>Not recorded</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${noun} ${value} on PolygonScan Amoy`}
      aria-label={`View ${noun} ${value} on PolygonScan Amoy (opens in a new tab)`}
      className={`inline-flex items-center gap-1 font-mono text-amber-700 hover:text-amber-600 hover:underline dark:text-amber-400 dark:hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-sm ${className}`}
    >
      <span>{label ?? shortAddress(value, chars)}</span>
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}
