interface Props {
  data: number[];
  w?: number;
  h?: number;
  area?: boolean;
}

export function Sparkline({ data, w = 240, h = 36, area = true }: Props) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
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
}
