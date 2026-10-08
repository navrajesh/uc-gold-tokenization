import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { config } from '../config';

// ─── Minimal human-readable ABIs ──────────────────────────────────────────────

const GOLD_TOKEN_ABI = [
  'function mint(address to, uint256 amount)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function fulfillRedemption(address investor, uint256 amountWei, string redemptionRef)',
  'function identityRegistry() view returns (address)',
  'function goldReserveAddress() view returns (address)',
  'function purityStandard() view returns (string)',
];

const IDENTITY_REGISTRY_ABI = [
  'function registerIdentity(address user, bool verified)',
  'function isVerified(address user) view returns (bool)',
];

const GOLD_RESERVE_ABI = [
  'function registerBar(string barId, uint256 weightGrams, uint16 purityBps, string vaultId, string assayRef)',
  'function deactivateBar(string barId)',
  'function getTotalActiveWeightGrams() view returns (uint256)',
  'function getBarCount() view returns (uint256)',
];

const COMPLIANCE_ABI = [
  'function canTransfer(address from, address to, uint256 amount) view returns (bool)',
];

// ─── Signer helpers ───────────────────────────────────────────────────────────

function getProvider() {
  return new JsonRpcProvider(config.rpcUrl);
}

function getDeployerSigner() {
  if (!config.deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured');
  }
  return new Wallet(config.deployerPrivateKey, getProvider());
}

function getCustodianSigner() {
  if (!config.custodianPrivateKey) {
    throw new Error('CUSTODIAN_PRIVATE_KEY not configured');
  }
  return new Wallet(config.custodianPrivateKey, getProvider());
}

// ─── Token operations ─────────────────────────────────────────────────────────

export async function mintTokens(
  tokenAddress: string,
  to: string,
  amountWei: bigint,
): Promise<string> {
  const token = new Contract(tokenAddress, GOLD_TOKEN_ABI, getDeployerSigner());
  const tx = await token.mint(to, amountWei);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function getTokenOnChainInfo(tokenAddress: string): Promise<{
  totalSupply: string;
  decimals: number;
}> {
  const token = new Contract(tokenAddress, GOLD_TOKEN_ABI, getProvider());
  const [totalSupply, decimals] = await Promise.all([
    token.totalSupply() as Promise<bigint>,
    token.decimals()    as Promise<number>,
  ]);
  return { totalSupply: totalSupply.toString(), decimals: Number(decimals) };
}

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
): Promise<{ balance: string; decimals: number }> {
  const token = new Contract(tokenAddress, GOLD_TOKEN_ABI, getProvider());
  const [balance, decimals] = await Promise.all([
    token.balanceOf(walletAddress) as Promise<bigint>,
    token.decimals() as Promise<number>,
  ]);
  return { balance: balance.toString(), decimals: Number(decimals) };
}

// ─── Identity / KYC operations ────────────────────────────────────────────────

export async function registerIdentityOnChain(
  registryAddress: string,
  investorAddress: string,
  verified: boolean,
): Promise<string> {
  const registry = new Contract(registryAddress, IDENTITY_REGISTRY_ABI, getDeployerSigner());
  const tx = await registry.registerIdentity(investorAddress, verified);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function isVerifiedOnChain(
  registryAddress: string,
  investorAddress: string,
): Promise<boolean> {
  const registry = new Contract(registryAddress, IDENTITY_REGISTRY_ABI, getProvider());
  return registry.isVerified(investorAddress) as Promise<boolean>;
}

// ─── Reserve / bar operations ─────────────────────────────────────────────────

export async function registerBarOnChain(
  reserveAddress: string,
  barId: string,
  weightGrams: number,
  purityBps: number,
  vaultId: string,
  assayRef: string,
): Promise<string> {
  const reserve = new Contract(reserveAddress, GOLD_RESERVE_ABI, getCustodianSigner());
  const tx = await reserve.registerBar(barId, weightGrams, purityBps, vaultId, assayRef);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function deactivateBarOnChain(
  reserveAddress: string,
  barId: string,
): Promise<string> {
  const reserve = new Contract(reserveAddress, GOLD_RESERVE_ABI, getCustodianSigner());
  const tx = await reserve.deactivateBar(barId);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function getTotalActiveWeightGrams(reserveAddress: string): Promise<number> {
  const reserve = new Contract(reserveAddress, GOLD_RESERVE_ABI, getProvider());
  const total = await reserve.getTotalActiveWeightGrams() as bigint;
  return Number(total);
}

// ─── Redemption operations ────────────────────────────────────────────────────

export async function fulfillRedemptionOnChain(
  tokenAddress: string,
  investor: string,
  amountWei: bigint,
  redemptionRef: string,
): Promise<string> {
  const token = new Contract(tokenAddress, GOLD_TOKEN_ABI, getCustodianSigner());
  const tx = await token.fulfillRedemption(investor, amountWei, redemptionRef);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

// ─── Compliance check (read-only) ─────────────────────────────────────────────

export async function checkTransferCompliance(
  complianceAddress: string,
  from: string,
  to: string,
  amount: bigint,
): Promise<boolean> {
  const compliance = new Contract(complianceAddress, COMPLIANCE_ABI, getProvider());
  return compliance.canTransfer(from, to, amount) as Promise<boolean>;
}
