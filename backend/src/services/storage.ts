import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../db';
import {
  tokens,      type NewToken,      type Token,
  identities,  type NewIdentity,   type Identity,
  goldBars,    type NewGoldBar,    type GoldBar,
  redemptions, type NewRedemption, type Redemption, type RedemptionStatus,
  goldPrice,   type NewGoldPrice,  type GoldPrice,
} from '../db/schema';

// ─── Tokens ───────────────────────────────────────────────────────────────────

export async function insertToken(token: NewToken): Promise<Token> {
  const rows = await getDb().insert(tokens).values(token).returning().all();
  return rows[0];
}

export async function getTokenByAddress(address: string): Promise<Token | undefined> {
  const rows = await getDb()
    .select()
    .from(tokens)
    .where(eq(sql`lower(${tokens.address})`, address.toLowerCase()))
    .all();
  return rows[0];
}

export async function getAllTokens(): Promise<Token[]> {
  return getDb().select().from(tokens).all();
}

export async function updateTokenReserveAddress(address: string, reserveAddress: string): Promise<void> {
  await getDb()
    .update(tokens)
    .set({ goldReserveAddress: reserveAddress })
    .where(eq(sql`lower(${tokens.address})`, address.toLowerCase()))
    .run();
}

// ─── Identities ───────────────────────────────────────────────────────────────

export async function upsertIdentity(identity: NewIdentity): Promise<Identity> {
  const rows = await getDb()
    .insert(identities)
    .values({ ...identity, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: identities.address,
      set: {
        isVerified:  identity.isVerified,
        countryCode: identity.countryCode,
        updatedAt:   new Date().toISOString(),
      },
    })
    .returning()
    .all();
  return rows[0];
}

export async function getIdentityByAddress(address: string): Promise<Identity | undefined> {
  const rows = await getDb()
    .select()
    .from(identities)
    .where(eq(sql`lower(${identities.address})`, address.toLowerCase()))
    .all();
  return rows[0];
}

export async function getAllIdentities(): Promise<Identity[]> {
  return getDb().select().from(identities).all();
}

// ─── Gold Bars ────────────────────────────────────────────────────────────────

export async function insertGoldBar(bar: NewGoldBar): Promise<GoldBar> {
  const rows = await getDb().insert(goldBars).values(bar).returning().all();
  return rows[0];
}

export async function getGoldBar(barId: string): Promise<GoldBar | undefined> {
  const rows = await getDb()
    .select()
    .from(goldBars)
    .where(eq(goldBars.barId, barId))
    .all();
  return rows[0];
}

export async function getAllGoldBars(tokenAddress?: string): Promise<GoldBar[]> {
  if (tokenAddress) {
    return getDb()
      .select()
      .from(goldBars)
      .where(eq(sql`lower(${goldBars.tokenAddress})`, tokenAddress.toLowerCase()))
      .all();
  }
  return getDb().select().from(goldBars).all();
}

export async function getActiveGoldBars(tokenAddress: string): Promise<GoldBar[]> {
  return getDb()
    .select()
    .from(goldBars)
    .where(
      and(
        eq(sql`lower(${goldBars.tokenAddress})`, tokenAddress.toLowerCase()),
        eq(goldBars.active, true),
      )
    )
    .all();
}

export async function deactivateGoldBar(barId: string): Promise<void> {
  await getDb()
    .update(goldBars)
    .set({ active: false })
    .where(eq(goldBars.barId, barId))
    .run();
}

export async function getTotalActiveWeightGrams(tokenAddress: string): Promise<number> {
  const rows = await getDb()
    .select({ total: sql<number>`coalesce(sum(${goldBars.weightGrams}), 0)` })
    .from(goldBars)
    .where(
      and(
        eq(sql`lower(${goldBars.tokenAddress})`, tokenAddress.toLowerCase()),
        eq(goldBars.active, true),
      )
    )
    .all();
  return rows[0]?.total ?? 0;
}

// ─── Redemptions ──────────────────────────────────────────────────────────────

export async function insertRedemption(redemption: NewRedemption): Promise<Redemption> {
  const rows = await getDb().insert(redemptions).values(redemption).returning().all();
  return rows[0];
}

export async function getRedemption(redemptionRef: string): Promise<Redemption | undefined> {
  const rows = await getDb()
    .select()
    .from(redemptions)
    .where(eq(redemptions.redemptionRef, redemptionRef))
    .all();
  return rows[0];
}

export async function getAllRedemptions(tokenAddress?: string): Promise<Redemption[]> {
  if (tokenAddress) {
    return getDb()
      .select()
      .from(redemptions)
      .where(eq(sql`lower(${redemptions.tokenAddress})`, tokenAddress.toLowerCase()))
      .orderBy(desc(redemptions.requestedAt))
      .all();
  }
  return getDb().select().from(redemptions).orderBy(desc(redemptions.requestedAt)).all();
}

export async function getRedemptionsByInvestor(investorAddress: string): Promise<Redemption[]> {
  return getDb()
    .select()
    .from(redemptions)
    .where(eq(sql`lower(${redemptions.investorAddress})`, investorAddress.toLowerCase()))
    .orderBy(desc(redemptions.requestedAt))
    .all();
}

export async function updateRedemptionStatus(
  redemptionRef: string,
  status: RedemptionStatus,
  extra: Partial<Pick<Redemption, 'approvedAt' | 'fulfilledAt' | 'rejectedAt' | 'rejectReason' | 'burnTxHash'>> = {},
): Promise<Redemption> {
  const rows = await getDb()
    .update(redemptions)
    .set({ status, ...extra })
    .where(eq(redemptions.redemptionRef, redemptionRef))
    .returning()
    .all();
  return rows[0];
}

// ─── Gold Price ───────────────────────────────────────────────────────────────

export async function getLatestGoldPrice(): Promise<GoldPrice | undefined> {
  const rows = await getDb()
    .select()
    .from(goldPrice)
    .orderBy(desc(goldPrice.updatedAt))
    .limit(1)
    .all();
  return rows[0];
}

export async function insertGoldPrice(price: NewGoldPrice): Promise<GoldPrice> {
  const rows = await getDb().insert(goldPrice).values(price).returning().all();
  return rows[0];
}
