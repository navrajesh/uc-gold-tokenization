import { Router } from 'express';
import { getLatestGoldPrice, insertGoldPrice } from '../services/storage';

const router = Router();

// GET /api/price — current gold price
router.get('/', async (_req, res, next) => {
  try {
    const price = await getLatestGoldPrice();
    if (!price) return res.status(404).json({ error: 'No price set' });
    return res.json(price);
  } catch (err) {
    next(err);
  }
});

// POST /api/price — admin updates gold price (manual; interface is Chainlink-swap ready)
router.post('/', async (req, res, next) => {
  try {
    const { pricePerGramUsd, updatedBy } =
      req.body as { pricePerGramUsd: string; updatedBy?: string };

    if (!pricePerGramUsd) {
      return res.status(400).json({ error: 'pricePerGramUsd required' });
    }

    const parsed = parseFloat(pricePerGramUsd);
    if (isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ error: 'pricePerGramUsd must be a positive number' });
    }

    const price = await insertGoldPrice({
      pricePerGramUsd,
      currency:  'USD',
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy ?? 'admin',
    });

    return res.status(201).json(price);
  } catch (err) {
    next(err);
  }
});

export default router;
