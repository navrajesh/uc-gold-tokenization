type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { width: number; height: number }> = {
  sm: { width: 56, height: 36 },
  md: { width: 84, height: 56 },
  lg: { width: 120, height: 80 },
};

export function Ingot({ size = 'md' }: { size?: Size }) {
  const { width, height } = SIZES[size];
  return <div className="bar-glyph" style={{ width, height }} />;
}
