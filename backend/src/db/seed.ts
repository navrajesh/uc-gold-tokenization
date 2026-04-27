import { initializeDb } from './index';
import { goldPrice } from './schema';

async function seed() {
  const db = await initializeDb();

  const existing = await db.select().from(goldPrice).all();
  if (existing.length > 0) {
    console.log('DB already seeded — skipping.');
    return;
  }

  await db.insert(goldPrice).values({
    pricePerGramUsd: '85.00',
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  }).run();

  console.log('Seeded initial gold price: $85.00/gram');
}

seed().catch(console.error);
