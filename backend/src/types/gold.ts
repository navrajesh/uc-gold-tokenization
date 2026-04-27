// ─── API request/response types ───────────────────────────────────────────────

export interface DeployGoldTokenRequest {
  name: string;
  symbol: string;
  decimals?: number;           // defaults to 18
  purityStandard?: string;     // e.g. "999.9"
  custodianAddress?: string;
}

export interface MintTokensRequest {
  to: string;
  amount: string;              // wei string
}

export interface RegisterGoldBarRequest {
  barId: string;
  tokenAddress: string;
  weightGrams: number;
  purityBps: number;           // 9999 = 99.99%
  vaultId: string;
  custodian: string;
  assayRef?: string;
}

export interface RegisterIdentityRequest {
  address: string;
  countryCode?: string;
  verified?: boolean;          // defaults to true
}

export interface CreateRedemptionRequest {
  tokenAddress: string;
  investorAddress: string;
  requestedGrams: number;
  deliveryAddress?: string;
}

export interface ApproveRedemptionRequest {
  redemptionRef: string;
}

export interface FulfillRedemptionRequest {
  redemptionRef: string;
  burnTxHash: string;
}

export interface RejectRedemptionRequest {
  redemptionRef: string;
  rejectReason: string;
}

export interface UpdateGoldPriceRequest {
  pricePerGramUsd: string;     // e.g. "85.32"
  updatedBy?: string;
}

export interface CheckTransferRequest {
  from: string;
  to: string;
  amount: string;              // wei string
}
