import { Router } from 'express';
import {
  insertRedemption, getRedemption, getAllRedemptions,
  getRedemptionsByInvestor, updateRedemptionStatus, getTokenByAddress,
} from '../services/storage';
import { fulfillRedemptionOnChain } from '../services/blockchain';

const router = Router();

function generateRef(symbol: string): string {
  const ts    = Date.now().toString(36).toUpperCase();
  const rand  = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RDM-${symbol}-${ts}-${rand}`;
}

// GET /api/redemptions?tokenAddress=&investorAddress= — list redemptions
router.get('/', async (req, res, next) => {
  try {
    const { tokenAddress, investorAddress } = req.query as Record<string, string | undefined>;

    const redemptions = investorAddress
      ? await getRedemptionsByInvestor(investorAddress)
      : await getAllRedemptions(tokenAddress);

    return res.json(redemptions);
  } catch (err) {
    next(err);
  }
});

// GET /api/redemptions/:ref — single redemption
router.get('/:ref', async (req, res, next) => {
  try {
    const r = await getRedemption(req.params.ref);
    if (!r) return res.status(404).json({ error: 'Redemption not found' });
    return res.json(r);
  } catch (err) {
    next(err);
  }
});

// POST /api/redemptions — investor submits a redemption request (DB only, status=PENDING)
// The investor may optionally have already called requestRedemption() on-chain for the event log
router.post('/', async (req, res, next) => {
  try {
    const { tokenAddress, investorAddress, requestedGrams, deliveryAddress } =
      req.body as {
        tokenAddress: string; investorAddress: string;
        requestedGrams: number; deliveryAddress?: string;
      };

    if (!tokenAddress || !investorAddress || !requestedGrams) {
      return res.status(400).json({
        error: 'Required: tokenAddress, investorAddress, requestedGrams',
      });
    }
    if (requestedGrams <= 0) {
      return res.status(400).json({ error: 'requestedGrams must be > 0' });
    }

    const token = await getTokenByAddress(tokenAddress);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const redemptionRef = generateRef(token.symbol);
    const redemption = await insertRedemption({
      redemptionRef,
      tokenAddress,
      investorAddress,
      requestedGrams,
      status:          'PENDING',
      deliveryAddress: deliveryAddress ?? null,
      requestedAt:     new Date().toISOString(),
      approvedAt:      null,
      fulfilledAt:     null,
      rejectedAt:      null,
      rejectReason:    null,
      burnTxHash:      null,
    });

    return res.status(201).json(redemption);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/redemptions/:ref/approve — admin approves (status: PENDING → APPROVED)
router.patch('/:ref/approve', async (req, res, next) => {
  try {
    const r = await getRedemption(req.params.ref);
    if (!r) return res.status(404).json({ error: 'Redemption not found' });
    if (r.status !== 'PENDING') {
      return res.status(409).json({ error: `Cannot approve — current status: ${r.status}` });
    }

    const updated = await updateRedemptionStatus(req.params.ref, 'APPROVED', {
      approvedAt: new Date().toISOString(),
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/redemptions/:ref/fulfill — custodian fulfills (on-chain burn + status: APPROVED → FULFILLED)
router.patch('/:ref/fulfill', async (req, res, next) => {
  try {
    const r = await getRedemption(req.params.ref);
    if (!r) return res.status(404).json({ error: 'Redemption not found' });
    if (r.status !== 'APPROVED') {
      return res.status(409).json({ error: `Cannot fulfill — current status: ${r.status}` });
    }

    const token = await getTokenByAddress(r.tokenAddress);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    // Convert grams → wei (1 gram = 1e18 with 18 decimals)
    const decimals  = token.decimals ?? 18;
    const amountWei = BigInt(Math.round(r.requestedGrams)) * (10n ** BigInt(decimals));

    const burnTxHash = await fulfillRedemptionOnChain(
      token.address,
      r.investorAddress,
      amountWei,
      r.redemptionRef,
    );

    const updated = await updateRedemptionStatus(req.params.ref, 'FULFILLED', {
      fulfilledAt: new Date().toISOString(),
      burnTxHash,
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/redemptions/:ref/reject — admin rejects (status: PENDING → REJECTED)
router.patch('/:ref/reject', async (req, res, next) => {
  try {
    const r = await getRedemption(req.params.ref);
    if (!r) return res.status(404).json({ error: 'Redemption not found' });
    if (r.status === 'FULFILLED' || r.status === 'REJECTED') {
      return res.status(409).json({ error: `Cannot reject — current status: ${r.status}` });
    }

    const { rejectReason } = req.body as { rejectReason?: string };
    const updated = await updateRedemptionStatus(req.params.ref, 'REJECTED', {
      rejectedAt:   new Date().toISOString(),
      rejectReason: rejectReason ?? 'Rejected by admin',
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
