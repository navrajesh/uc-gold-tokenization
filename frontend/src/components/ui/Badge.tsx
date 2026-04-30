import type { ReactNode } from 'react';

type Tone = 'ok' | 'danger' | 'azure' | 'bullion' | 'ink' | 'ghost';
type LegacyVariant = 'gold' | 'green' | 'blue' | 'amber' | 'red' | 'gray';

const LEGACY_MAP: Record<LegacyVariant, Tone> = {
  gold: 'bullion', green: 'ok', blue: 'azure', amber: 'bullion', red: 'danger', gray: 'ghost',
};

interface Props {
  children: ReactNode;
  tone?: Tone;
  variant?: LegacyVariant;
  dot?: boolean;
}

export function Badge({ children, tone, variant, dot = false }: Props) {
  const resolved = tone ?? (variant ? LEGACY_MAP[variant] : 'ghost');
  return (
    <span className={`badge ${resolved}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    PENDING:   { tone: 'azure',   label: 'Pending'   },
    APPROVED:  { tone: 'bullion', label: 'Approved'  },
    FULFILLED: { tone: 'ok',      label: 'Fulfilled' },
    REJECTED:  { tone: 'danger',  label: 'Rejected'  },
    Active:    { tone: 'ok',      label: 'Active'    },
    Inactive:  { tone: 'ghost',   label: 'Inactive'  },
  };
  const cfg = map[status] ?? { tone: 'ghost' as Tone, label: status };
  return <Badge tone={cfg.tone} dot>{cfg.label}</Badge>;
}
