import type {
  Token, GoldBar, ReservesResponse, Redemption, Identity, GoldPrice,
  RegisterTokenPayload, RegisterBarPayload, RegisterIdentityPayload, CreateRedemptionPayload,
} from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── Tokens ──────────────────────────────────────────────────────────────────
  getTokens: () =>
    request<Token[]>('/api/tokens'),

  getToken: (address: string) =>
    request<Token>(`/api/tokens/${encodeURIComponent(address)}`),

  getTokenBalance: (address: string, wallet: string) =>
    request<{ tokenAddress: string; walletAddress: string; balanceWei: string; decimals: number }>(
      `/api/tokens/${encodeURIComponent(address)}/balance/${encodeURIComponent(wallet)}`,
    ),

  registerToken: (data: RegisterTokenPayload) =>
    request<Token>('/api/tokens', { method: 'POST', body: JSON.stringify(data) }),

  mintTokens: (address: string, to: string, amountWei: string) =>
    request<{ txHash: string }>(`/api/tokens/${encodeURIComponent(address)}/mint`, {
      method: 'POST',
      body: JSON.stringify({ to, amount: amountWei }),
    }),

  checkTransfer: (tokenAddress: string, from: string, to: string, amountWei: string) =>
    request<{ allowed: boolean; from: string; to: string; amountWei: string }>(
      `/api/tokens/${encodeURIComponent(tokenAddress)}/check-transfer?from=${from}&to=${to}&amount=${amountWei}`,
    ),

  // ── Reserves ────────────────────────────────────────────────────────────────
  getReserves: (tokenAddress?: string) => {
    const q = tokenAddress ? `?tokenAddress=${encodeURIComponent(tokenAddress)}` : '';
    return request<ReservesResponse>(`/api/reserves${q}`);
  },

  registerBar: (data: RegisterBarPayload) =>
    request<GoldBar>('/api/reserves', { method: 'POST', body: JSON.stringify(data) }),

  deactivateBar: (barId: string) =>
    request<{ barId: string; active: false }>(`/api/reserves/${encodeURIComponent(barId)}/deactivate`, {
      method: 'PATCH',
    }),

  // ── Identities ──────────────────────────────────────────────────────────────
  getIdentities: () =>
    request<Identity[]>('/api/identities'),

  getIdentity: (address: string) =>
    request<Identity>(`/api/identities/${encodeURIComponent(address)}`),

  registerIdentity: (data: RegisterIdentityPayload) =>
    request<Identity>('/api/identities', { method: 'POST', body: JSON.stringify(data) }),

  // ── Redemptions ─────────────────────────────────────────────────────────────
  getRedemptions: (tokenAddress?: string, investorAddress?: string) => {
    const params = new URLSearchParams();
    if (tokenAddress)   params.set('tokenAddress',   tokenAddress);
    if (investorAddress) params.set('investorAddress', investorAddress);
    const q = params.toString();
    return request<Redemption[]>(`/api/redemptions${q ? `?${q}` : ''}`);
  },

  createRedemption: (data: CreateRedemptionPayload) =>
    request<Redemption>('/api/redemptions', { method: 'POST', body: JSON.stringify(data) }),

  approveRedemption: (ref: string) =>
    request<Redemption>(`/api/redemptions/${encodeURIComponent(ref)}/approve`, { method: 'PATCH' }),

  fulfillRedemption: (ref: string) =>
    request<Redemption>(`/api/redemptions/${encodeURIComponent(ref)}/fulfill`, { method: 'PATCH' }),

  rejectRedemption: (ref: string, rejectReason: string) =>
    request<Redemption>(`/api/redemptions/${encodeURIComponent(ref)}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectReason }),
    }),

  // ── Price ────────────────────────────────────────────────────────────────────
  getPrice: () =>
    request<GoldPrice>('/api/price'),

  updatePrice: (pricePerGramUsd: string, updatedBy?: string) =>
    request<GoldPrice>('/api/price', {
      method: 'POST',
      body: JSON.stringify({ pricePerGramUsd, updatedBy }),
    }),
};
