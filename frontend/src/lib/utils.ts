export function shortAddress(address: string, chars = 6): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, chars)}…${address.slice(-4)}`;
}

export function formatGrams(grams: number): string {
  return grams.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' g';
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatWeiToGrams(wei: string, decimals = 18): number {
  if (!wei || wei === '0') return 0;
  return Number(BigInt(wei)) / 10 ** decimals;
}

export function gramsToWei(grams: number, decimals = 18): string {
  return (BigInt(Math.round(grams)) * 10n ** BigInt(decimals)).toString();
}

export function formatPurityBps(bps: number): string {
  // 9999 → "999.9"  |  9160 → "916.0"
  return (bps / 100).toFixed(1);
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs  = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function reserveRatio(supplyWei: string, reserveGrams: number, decimals = 18): number {
  if (!reserveGrams || !supplyWei || supplyWei === '0') return 100;
  const supply = Number(BigInt(supplyWei)) / 10 ** decimals;
  return (reserveGrams / supply) * 100;
}
