export const AMOY_EXPLORER_URL = 'https://amoy.polygonscan.com';

export function isTransactionHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value) && !/^0x0{64}$/.test(value);
}
