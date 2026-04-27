import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { initializeDb } from './db';
import { getLatestGoldPrice, insertGoldPrice } from './services/storage';

import tokenRoutes      from './routes/tokens';
import reserveRoutes    from './routes/reserves';
import redemptionRoutes from './routes/redemptions';
import identityRoutes   from './routes/identities';
import priceRoutes      from './routes/price';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/tokens',      tokenRoutes);
app.use('/api/reserves',    reserveRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/identities',  identityRoutes);
app.use('/api/price',       priceRoutes);

// ─── Error handlers ───────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  await initializeDb();

  const existing = await getLatestGoldPrice();
  if (!existing) {
    await insertGoldPrice({
      pricePerGramUsd: '85.00',
      currency:  'USD',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    });
    console.log('Seeded initial gold price: $85.00/gram');
  }

  app.listen(config.port, () => {
    console.log(`Gold API running on http://localhost:${config.port}`);
    console.log(`  GET  /api/tokens`);
    console.log(`  GET  /api/reserves`);
    console.log(`  GET  /api/redemptions`);
    console.log(`  GET  /api/identities`);
    console.log(`  GET  /api/price`);
  });
}

bootstrap().catch(console.error);

export default app;
