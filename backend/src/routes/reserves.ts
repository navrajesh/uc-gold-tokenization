import { Router } from 'express';
import {
  insertGoldBar, getGoldBar, getAllGoldBars, getActiveGoldBars,
  deactivateGoldBar, getTotalActiveWeightGrams as getTotalFromDb,
  getTokenByAddress,
} from '../services/storage';
import {
  registerBarOnChain, deactivateBarOnChain, getTotalActiveWeightGrams,
} from '../services/blockchain';

const router = Router();

// GET /api/reserves?tokenAddress= — list all bars (optionally filtered by token)
// Includes live reserve summary from chain when tokenAddress is provided
router.get('/', async (req, res, next) => {
  try {
    const tokenAddress = req.query.tokenAddress as string | undefined;
    const bars = await getAllGoldBars(tokenAddress);

    let summary: { totalActiveGrams: number; source: string } | null = null;
    if (tokenAddress) {
      const token = await getTokenByAddress(tokenAddress);
      if (token?.goldReserveAddress) {
        try {
          const onchain = await getTotalActiveWeightGrams(token.goldReserveAddress);
          summary = { totalActiveGrams: onchain, source: 'chain' };
        } catch {
          const db = await getTotalFromDb(tokenAddress);
          summary = { totalActiveGrams: db, source: 'db' };
        }
      }
    }

    return res.json({ bars, summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/reserves/:barId — single bar detail
router.get('/:barId', async (req, res, next) => {
  try {
    const bar = await getGoldBar(req.params.barId);
    if (!bar) return res.status(404).json({ error: 'Bar not found' });
    return res.json(bar);
  } catch (err) {
    next(err);
  }
});

// POST /api/reserves — custodian registers a new gold bar (on-chain + DB)
router.post('/', async (req, res, next) => {
  try {
    const { barId, tokenAddress, weightGrams, purityBps, vaultId, custodian, assayRef } =
      req.body as {
        barId: string; tokenAddress: string; weightGrams: number;
        purityBps: number; vaultId: string; custodian: string; assayRef?: string;
      };

    if (!barId || !tokenAddress || !weightGrams || !purityBps || !vaultId || !custodian) {
      return res.status(400).json({
        error: 'Required: barId, tokenAddress, weightGrams, purityBps, vaultId, custodian',
      });
    }

    const token = await getTokenByAddress(tokenAddress);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    if (!token.goldReserveAddress) {
      return res.status(409).json({ error: 'Token has no GoldReserve contract linked' });
    }

    // Check for duplicate in DB first (on-chain will also revert if duplicate)
    const existing = await getGoldBar(barId);
    if (existing) return res.status(409).json({ error: 'Bar already registered', bar: existing });

    const txHash = await registerBarOnChain(
      token.goldReserveAddress,
      barId,
      weightGrams,
      purityBps,
      vaultId,
      assayRef ?? '',
    );

    const bar = await insertGoldBar({
      barId,
      tokenAddress,
      weightGrams,
      purityBps,
      vaultId,
      custodian,
      assayRef:     assayRef ?? null,
      active:       true,
      registeredAt: new Date().toISOString(),
      txHash,
    });

    return res.status(201).json(bar);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reserves/:barId/deactivate — custodian deactivates a bar (on-chain + DB)
// Used when a bar is removed from the vault (e.g. after full redemption of that lot)
router.patch('/:barId/deactivate', async (req, res, next) => {
  try {
    const bar = await getGoldBar(req.params.barId);
    if (!bar) return res.status(404).json({ error: 'Bar not found' });
    if (!bar.active) return res.status(409).json({ error: 'Bar is already inactive' });

    const token = await getTokenByAddress(bar.tokenAddress);
    if (!token?.goldReserveAddress) {
      return res.status(409).json({ error: 'Token has no GoldReserve contract linked' });
    }

    await deactivateBarOnChain(token.goldReserveAddress, bar.barId);
    await deactivateGoldBar(bar.barId);

    return res.json({ barId: bar.barId, active: false });
  } catch (err) {
    next(err);
  }
});

// GET /api/reserves/active?tokenAddress= — only active bars
router.get('/active/:tokenAddress', async (req, res, next) => {
  try {
    const bars = await getActiveGoldBars(req.params.tokenAddress);
    const dbTotal = await getTotalFromDb(req.params.tokenAddress);
    return res.json({ bars, totalActiveGrams: dbTotal });
  } catch (err) {
    next(err);
  }
});

export default router;
