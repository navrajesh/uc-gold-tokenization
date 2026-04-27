// ─── API response types (mirror backend schema) ───────────────────────────────

export interface Token {
  id: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  deployer: string;
  deployedAt: string;
  complianceAddress: string;
  identityRegistryAddress: string;
  goldReserveAddress: string | null;
  txHash: string;
  purityStandard: string | null;
  custodianAddress: string | null;
  // enriched from chain
  totalSupply?: string;
}

export interface GoldBar {
  id: number;
  barId: string;
  tokenAddress: string;
  weightGrams: number;
  purityBps: number;
  vaultId: string;
  custodian: string;
  assayRef: string | null;
  active: boolean;
  registeredAt: string;
  txHash: string | null;
}

export interface ReservesResponse {
  bars: GoldBar[];
  summary: { totalActiveGrams: number; source: 'chain' | 'db' } | null;
}

export type RedemptionStatus = 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED';

export interface Redemption {
  id: number;
  redemptionRef: string;
  tokenAddress: string;
  investorAddress: string;
  requestedGrams: number;
  status: RedemptionStatus;
  deliveryAddress: string | null;
  requestedAt: string;
  approvedAt: string | null;
  fulfilledAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  burnTxHash: string | null;
}

export interface Identity {
  id: number;
  address: string;
  isVerified: boolean;
  countryCode: string | null;
  registeredAt: string;
  updatedAt: string | null;
  onchainVerified?: boolean;
}

export interface GoldPrice {
  id: number;
  pricePerGramUsd: string;
  currency: string;
  updatedAt: string;
  updatedBy: string | null;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface RegisterTokenPayload {
  address: string;
  name: string;
  symbol: string;
  decimals?: number;
  deployer: string;
  txHash: string;
  complianceAddress: string;
  identityRegistryAddress: string;
  goldReserveAddress?: string;
  purityStandard?: string;
  custodianAddress?: string;
}

export interface RegisterBarPayload {
  barId: string;
  tokenAddress: string;
  weightGrams: number;
  purityBps: number;
  vaultId: string;
  custodian: string;
  assayRef?: string;
}

export interface RegisterIdentityPayload {
  address: string;
  tokenAddress: string;
  countryCode?: string;
  verified?: boolean;
}

export interface CreateRedemptionPayload {
  tokenAddress: string;
  investorAddress: string;
  requestedGrams: number;
  deliveryAddress?: string;
}
