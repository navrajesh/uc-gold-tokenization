export function Spinner({ size = 5 }: { size?: number }) {
  const dimension = `${size * 0.25}rem`;

  return (
    <svg
      className="animate-spin shrink-0 text-amber-500"
      style={{ width: dimension, height: dimension }}
      fill="none" viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={8} />
    </div>
  );
}
