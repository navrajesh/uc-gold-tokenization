import { Router } from 'express';
import {
  upsertIdentity, getIdentityByAddress, getAllIdentities, getTokenByAddress,
} from '../services/storage';
import { registerIdentityOnChain, isVerifiedOnChain } from '../services/blockchain';

const router = Router();

// GET /api/identities — list all KYC records
router.get('/', async (_req, res, next) => {
  try {
    const identities = await getAllIdentities();
    return res.json(identities);
  } catch (err) {
    next(err);
  }
});

// GET /api/identities/:address — get KYC record for a wallet
// Optionally enriched with on-chain verified status if tokenAddress query param provided
router.get('/:address', async (req, res, next) => {
  try {
    const identity = await getIdentityByAddress(req.params.address);
    if (!identity) return res.status(404).json({ error: 'Identity not found' });

    const tokenAddress = req.query.tokenAddress as string | undefined;
    if (tokenAddress) {
      const token = await getTokenByAddress(tokenAddress);
      if (token?.identityRegistryAddress) {
        try {
          const onchainVerified = await isVerifiedOnChain(
            token.identityRegistryAddress,
            req.params.address,
          );
          return res.json({ ...identity, onchainVerified });
        } catch {
          // chain offline — return DB record only
        }
      }
    }

    return res.json(identity);
  } catch (err) {
    next(err);
  }
});

// POST /api/identities — admin registers or updates KYC (on-chain + DB)
// tokenAddress is required so the backend knows which identity registry to call
router.post('/', async (req, res, next) => {
  try {
    const { address, countryCode, verified, tokenAddress } =
      req.body as {
        address: string; countryCode?: string;
        verified?: boolean; tokenAddress: string;
      };

    if (!address || !tokenAddress) {
      return res.status(400).json({ error: 'Required: address, tokenAddress' });
    }

    const token = await getTokenByAddress(tokenAddress);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    if (!token.identityRegistryAddress) {
      return res.status(409).json({ error: 'Token has no IdentityRegistry linked' });
    }

    const isVerified = verified ?? true;

    // Register on-chain first — if this fails, DB stays clean
    await registerIdentityOnChain(token.identityRegistryAddress, address, isVerified);

    const identity = await upsertIdentity({
      address,
      isVerified,
      countryCode: countryCode ?? null,
      registeredAt: new Date().toISOString(),
    });

    return res.status(201).json(identity);
  } catch (err) {
    next(err);
  }
});

export default router;
