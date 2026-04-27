import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ─── Tokens ───────────────────────────────────────────────────────────────────

export const tokens = sqliteTable('tokens', {
  id:                      integer('id').primaryKey({ autoIncrement: true }),
  address:                 text('address').notNull().unique(),
  name:                    text('name').notNull(),
  symbol:                  text('symbol').notNull(),
  decimals:                integer('decimals').notNull().default(18),
  deployer:                text('deployer').notNull(),
  deployedAt:              text('deployed_at').notNull(),
  complianceAddress:       text('compliance_address').notNull(),
  identityRegistryAddress: text('identity_registry_address').notNull(),
  goldReserveAddress:      text('gold_reserve_address'),
  txHash:                  text('tx_hash').notNull(),
  purityStandard:          text('purity_standard'),   // e.g. "999.9"
  custodianAddress:        text('custodian_address'),
});

// ─── Identities (KYC) ─────────────────────────────────────────────────────────

export const identities = sqliteTable('identities', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  address:      text('address').notNull().unique(),
  isVerified:   integer('is_verified', { mode: 'boolean' }).notNull().default(true),
  countryCode:  text('country_code'),   // ISO 3166-1 alpha-2, e.g. "SG"
  registeredAt: text('registered_at').notNull(),
  updatedAt:    text('updated_at'),
});

// ─── Gold Bars ────────────────────────────────────────────────────────────────

export const goldBars = sqliteTable('gold_bars', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  barId:        text('bar_id').notNull().unique(),            // e.g. "GB-2024-001"
  tokenAddress: text('token_address').notNull().references(() => tokens.address),
  weightGrams:  real('weight_grams').notNull(),              // physical weight
  purityBps:    integer('purity_bps').notNull(),             // e.g. 9999 = 99.99%
  vaultId:      text('vault_id').notNull(),                  // e.g. "VAULT-SG-01"
  custodian:    text('custodian').notNull(),                 // custodian name
  assayRef:     text('assay_ref'),                          // assay certificate ref
  active:       integer('active', { mode: 'boolean' }).notNull().default(true),
  registeredAt: text('registered_at').notNull(),
  txHash:       text('tx_hash'),
});

// ─── Redemptions ──────────────────────────────────────────────────────────────

export const redemptions = sqliteTable('redemptions', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  redemptionRef:   text('redemption_ref').notNull().unique(),   // e.g. "REDEEM-2024-001"
  tokenAddress:    text('token_address').notNull().references(() => tokens.address),
  investorAddress: text('investor_address').notNull(),
  requestedGrams:  real('requested_grams').notNull(),
  status:          text('status', {
                     enum: ['PENDING', 'APPROVED', 'FULFILLED', 'REJECTED'],
                   }).notNull().default('PENDING'),
  deliveryAddress: text('delivery_address'),
  requestedAt:     text('requested_at').notNull(),
  approvedAt:      text('approved_at'),
  fulfilledAt:     text('fulfilled_at'),
  rejectedAt:      text('rejected_at'),
  rejectReason:    text('reject_reason'),
  burnTxHash:      text('burn_tx_hash'),
});

// ─── Gold Price ───────────────────────────────────────────────────────────────

export const goldPrice = sqliteTable('gold_price', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  pricePerGramUsd:  text('price_per_gram_usd').notNull(),  // string to avoid float drift
  currency:         text('currency').notNull().default('USD'),
  updatedAt:        text('updated_at').notNull(),
  updatedBy:        text('updated_by'),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const tokenRelations = relations(tokens, ({ many }) => ({
  bars:        many(goldBars),
  redemptions: many(redemptions),
}));

export const goldBarRelations = relations(goldBars, ({ one }) => ({
  token: one(tokens, { fields: [goldBars.tokenAddress], references: [tokens.address] }),
}));

export const redemptionRelations = relations(redemptions, ({ one }) => ({
  token: one(tokens, { fields: [redemptions.tokenAddress], references: [tokens.address] }),
}));

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Token        = typeof tokens.$inferSelect;
export type NewToken     = typeof tokens.$inferInsert;
export type Identity     = typeof identities.$inferSelect;
export type NewIdentity  = typeof identities.$inferInsert;
export type GoldBar      = typeof goldBars.$inferSelect;
export type NewGoldBar   = typeof goldBars.$inferInsert;
export type Redemption   = typeof redemptions.$inferSelect;
export type NewRedemption = typeof redemptions.$inferInsert;
export type GoldPrice    = typeof goldPrice.$inferSelect;
export type NewGoldPrice = typeof goldPrice.$inferInsert;

export type RedemptionStatus = 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED';
