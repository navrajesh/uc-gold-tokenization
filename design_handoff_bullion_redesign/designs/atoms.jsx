/* eslint-disable */
// Shared atoms used across all role screens.

const Icon = ({ d, size = 16, stroke = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

// minimal icon set — avoid external libs
const I = {
  vault:   (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M3 12h2M19 12h2"/></>} />,
  coins:   (p) => <Icon {...p} d={<><circle cx="9" cy="9" r="6"/><path d="M9 5v8M6 9h6"/><circle cx="15" cy="15" r="6" /></>} />,
  scale:   (p) => <Icon {...p} d={<><path d="M12 3v18M3 7h18M6 7l-3 7a3 3 0 006 0L6 7zM18 7l-3 7a3 3 0 006 0l-3-7z"/></>} />,
  shield:  (p) => <Icon {...p} d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" />,
  user:    (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>} />,
  users:   (p) => <Icon {...p} d={<><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="7" r="2.5"/><path d="M22 18c0-2.5-2-4.5-5-4.5"/></>} />,
  arrowR:  (p) => <Icon {...p} d="M5 12h14M13 5l7 7-7 7" />,
  arrowDown: (p) => <Icon {...p} d="M12 5v14M5 13l7 7 7-7" />,
  arrowUp: (p) => <Icon {...p} d="M12 19V5M5 11l7-7 7 7" />,
  arrowSwap: (p) => <Icon {...p} d="M7 7h12M7 7l3-3M7 7l3 3M17 17H5M17 17l-3-3M17 17l-3 3" />,
  plus:    (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  check:   (p) => <Icon {...p} d="M5 12l4 4 10-10" />,
  x:       (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  search:  (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></>} />,
  bell:    (p) => <Icon {...p} d="M6 8a6 6 0 0112 0v5l2 3H4l2-3V8zM10 19a2 2 0 004 0" />,
  history: (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 1015-7L3 5"/><path d="M3 5v5h5"/><path d="M12 7v5l3 2"/></>} />,
  doc:     (p) => <Icon {...p} d={<><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h6"/></>} />,
  package: (p) => <Icon {...p} d={<><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></>} />,
  hammer:  (p) => <Icon {...p} d="M14 6l4-4 4 4-4 4M14 6l-9 9-3 4 4-3 9-9M14 6l4 4" />,
  trend:   (p) => <Icon {...p} d="M3 17l6-6 4 4 8-8M21 7h-5M21 7v5" />,
  print:   (p) => <Icon {...p} d="M6 9V3h12v6M6 18H3v-9h18v9h-3M6 14h12v7H6z" />,
  globe:   (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></>} />,
  chevR:   (p) => <Icon {...p} d="M9 6l6 6-6 6" />,
  chevD:   (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  copy:    (p) => <Icon {...p} d={<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/></>} />,
  link:    (p) => <Icon {...p} d="M10 14a4 4 0 010-6l3-3a4 4 0 116 6l-2 2M14 10a4 4 0 010 6l-3 3a4 4 0 11-6-6l2-2" />,
  filter:  (p) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />,
  pencil:  (p) => <Icon {...p} d="M14 4l6 6L8 22H2v-6L14 4z" />,
  upload:  (p) => <Icon {...p} d="M12 16V4M5 11l7-7 7 7M4 19h16" />,
  sun:     (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>} />,
  moon:    (p) => <Icon {...p} d="M21 13a9 9 0 11-10-10 7 7 0 0010 10z" />,
  home:    (p) => <Icon {...p} d="M3 12l9-9 9 9M5 10v10h14V10" />,
  pulse:   (p) => <Icon {...p} d="M3 12h4l3-8 4 16 3-8h4" />,
  calendar:(p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>} />,
  flame:   (p) => <Icon {...p} d="M12 3c2 4 6 5 6 10a6 6 0 11-12 0c0-3 2-4 3-7 2 1 3 4 3 4 0-3 0-5 0-7z" />,
  spark:   (p) => <Icon {...p} d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4" />,
  qr:      (p) => <Icon {...p} d="M3 3h7v7H3V3zm0 11h7v7H3v-7zM14 3h7v7h-7V3zm0 11h2v2h-2v-2zm5 0h2v2h-2v-2zm-5 5h7v2h-7v-2z" />,
};

// Address pill — copyable
const Addr = ({ value, length = 6, mono = true }) => {
  const short = value && value.length > 12 ? `${value.slice(0, length)}…${value.slice(-4)}` : value;
  return <span className={mono ? 'mono' : ''} style={{ fontSize: 12, color: 'var(--ink-2)' }}>{short}</span>;
};

const Eyebrow = ({ children, accent = true }) => (
  <div className="eyebrow">{accent && <span className="dot" />}{children}</div>
);

const Sparkline = ({ data, w = 240, h = 36, area = true }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const stepX = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * stepX},${h - ((v - min) / span) * (h - 4) - 2}`);
  const path = `M${pts.join(' L')}`;
  const areaPath = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {area && <path className="area" d={areaPath} />}
      <path d={path} />
    </svg>
  );
};

const KPI = ({ label, num, unit, sub, deltaPct, sparkData, hint }) => (
  <div className="card kpi">
    <div className="label">{label}{hint && <span className="text-ink-3" title={hint}>?</span>}</div>
    <div className="num tnum">{num}{unit && <small>{unit}</small>}</div>
    {sub && <div className="sub">{sub}</div>}
    {typeof deltaPct === 'number' && (
      <div className="sub">
        <span className={deltaPct >= 0 ? 'delta-up' : 'delta-dn'}>
          {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(2)}%
        </span>
        <span className="text-ink-3">24h</span>
      </div>
    )}
    {sparkData && <Sparkline data={sparkData} />}
  </div>
);

const Badge = ({ tone = 'ghost', children, dot = false }) => (
  <span className={`badge ${tone}`}>
    {dot && <span className="dot" />}
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:   { tone: 'azure',   label: 'Pending',   dot: true },
    APPROVED:  { tone: 'bullion', label: 'Approved',  dot: true },
    FULFILLED: { tone: 'ok',      label: 'Fulfilled', dot: true },
    REJECTED:  { tone: 'danger',  label: 'Rejected',  dot: true },
    Active:    { tone: 'ok',      label: 'Active',    dot: true },
    Inactive:  { tone: 'ghost',   label: 'Inactive',  dot: false },
  };
  const cfg = map[status] || { tone: 'ghost', label: status };
  return <Badge tone={cfg.tone} dot={cfg.dot}>{cfg.label}</Badge>;
};

const Card = ({ children, className = '', pad = false, style }) => (
  <div className={`card ${className} ${pad ? 'card-pad' : ''}`} style={style}>{children}</div>
);
const CardHd = ({ title, action, sub }) => (
  <div className="card-hd">
    <div>
      <h2 className="section-title">{title}</h2>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

// Bar glyph "ingot"
const Ingot = ({ size = 'md' }) => (
  <div className={`bar-glyph`} style={{ width: size === 'sm' ? 56 : 84, height: size === 'sm' ? 36 : 56 }} />
);

// Donut chart for reserve allocation
const Donut = ({ pct = 92, color = 'var(--bullion-2)', size = 120, label, sub }) => (
  <div className="donut" style={{ '--p': pct, '--c': color, width: size, height: size }}>
    <div style={{ textAlign: 'center' }}>
      <div className="serif" style={{ fontSize: size * 0.22, lineHeight: 1 }}>{pct}<small style={{ fontSize: size * 0.10, fontFamily: 'var(--font-sans)', color: 'var(--ink-3)' }}>%</small></div>
      {label && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>}
    </div>
  </div>
);

Object.assign(window, { Icon, I, Addr, Eyebrow, Sparkline, KPI, Badge, StatusBadge, Card, CardHd, Ingot, Donut });
