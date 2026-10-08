import { Router } from 'express';
import {
  insertToken, getAllTokens, getTokenByAddress,
  updateTokenReserveAddress, updateTokenTransactionHash,
} from '../services/storage';
import {
  mintTokens, getTokenOnChainInfo, getTokenBalance, checkTransferCompliance,
} from '../services/blockchain';
import { config } from '../config';

const router = Router();

function hasSeedAccess(token: string | undefined): boolean {
  if (!config.demoSeedToken) return config.nodeEnv !== 'production';
  return token === config.demoSeedToken;
}

function isTransactionHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value) && !/^0x0{64}$/.test(value);
}

// GET /api/tokens — list all registered tokens
router.get('/', async (_req, res, next) => {
  try {
    const tokens = await getAllTokens();
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

// GET /api/tokens/:address — token detail, enriched with live chain data
router.get('/:address', async (req, res, next) => {
  try {
    const token = await getTokenByAddress(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    let onchain: { totalSupply: string; decimals: number } | null = null;
    try {
      onchain = await getTokenOnChainInfo(token.address);
    } catch {
      // Chain may be offline — return DB data only
    }

    return res.json({ ...token, ...(onchain ?? {}) });
  } catch (err) {
    next(err);
  }
});

// GET /api/tokens/:address/balance/:wallet — live balance via server-side RPC
router.get('/:address/balance/:wallet', async (req, res, next) => {
  try {
    const token = await getTokenByAddress(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const result = await getTokenBalance(token.address, req.params.wallet);
    return res.json({
      tokenAddress: token.address,
      walletAddress: req.params.wallet,
      balanceWei: result.balance,
      decimals: result.decimals,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/tokens — register a deployed token in the backend DB
// Called after running the Hardhat deploy script (post-deployment bookkeeping)
router.post('/', async (req, res, next) => {
  try {
    const {
      address, name, symbol, decimals, deployer, txHash,
      complianceAddress, identityRegistryAddress,
      goldReserveAddress, purityStandard, custodianAddress,
    } = req.body as Record<string, string>;

    if (!address || !name || !symbol || !deployer || !txHash ||
        !complianceAddress || !identityRegistryAddress) {
      return res.status(400).json({
        error: 'Required: address, name, symbol, deployer, txHash, complianceAddress, identityRegistryAddress',
      });
    }

    const existing = await getTokenByAddress(address);
    if (existing) {
      if (hasSeedAccess(req.header('x-demo-seed-token')) && isTransactionHash(txHash)) {
        const token = await updateTokenTransactionHash(existing.address, txHash);
        return res.json(token);
      }
      return res.status(409).json({ error: 'Token already registered', token: existing });
    }

    const token = await insertToken({
      address,
      name,
      symbol,
      decimals:                decimals ? parseInt(decimals, 10) : 18,
      deployer,
      deployedAt:              new Date().toISOString(),
      txHash,
      complianceAddress,
      identityRegistryAddress,
      goldReserveAddress:      goldReserveAddress ?? null,
      purityStandard:          purityStandard ?? null,
      custodianAddress:        custodianAddress ?? null,
    });

    return res.status(201).json(token);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tokens/:address/reserve — link a GoldReserve contract after deployment
router.patch('/:address/reserve', async (req, res, next) => {
  try {
    const token = await getTokenByAddress(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const { reserveAddress } = req.body as { reserveAddress: string };
    if (!reserveAddress) return res.status(400).json({ error: 'reserveAddress required' });

    await updateTokenReserveAddress(token.address, reserveAddress);
    return res.json({ address: token.address, goldReserveAddress: reserveAddress });
  } catch (err) {
    next(err);
  }
});

// POST /api/tokens/:address/mint — admin mints gold tokens on-chain
router.post('/:address/mint', async (req, res, next) => {
  try {
    const token = await getTokenByAddress(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const { to, amount } = req.body as { to: string; amount: string };
    if (!to || !amount) return res.status(400).json({ error: 'to and amount (wei) required' });

    const txHash = await mintTokens(token.address, to, BigInt(amount));
    return res.json({ txHash, tokenAddress: token.address, to, amountWei: amount });
  } catch (err) {
    next(err);
  }
});

// GET /api/tokens/:address/check-transfer?from=&to=&amount=
// Pre-flight compliance check — same logic the contract runs on transfer
router.get('/:address/check-transfer', async (req, res, next) => {
  try {
    const token = await getTokenByAddress(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const { from, to, amount } = req.query as { from?: string; to?: string; amount?: string };
    if (!from || !to || !amount) {
      return res.status(400).json({ error: 'Query params required: from, to, amount (wei)' });
    }

    const allowed = await checkTransferCompliance(
      token.complianceAddress,
      from, to,
      BigInt(amount),
    );
    return res.json({ allowed, from, to, amountWei: amount });
  } catch (err) {
    next(err);
  }
});

export default router;
