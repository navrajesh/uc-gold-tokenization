import { useState, useEffect, useCallback } from 'react';
import { JsonRpcProvider, Contract } from 'ethers';
import { api } from '../lib/api';
import type { Token, GoldPrice, Identity, Redemption } from '../lib/types';

const RPC_URL = 'http://127.0.0.1:8545';
const BALANCE_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export interface InvestorData {
  wallet: string;
  token: Token | null;
  balance: { grams: number; wei: string } | null;
  price: GoldPrice | null;
  identity: Identity | null;
  redemptions: Redemption[];
  reserveGrams: number;
  loading: boolean;
  error: string | null;
  setWallet: (addr: string) => void;
  clearWallet: () => void;
  refetch: () => void;
}

export function useInvestorWallet(): InvestorData {
  const [wallet, setWalletState] = useState<string>(() => localStorage.getItem('gold-wallet') ?? '');
  const [token, setToken] = useState<Token | null>(null);
  const [balance, setBalance] = useState<{ grams: number; wei: string } | null>(null);
  const [price, setPrice] = useState<GoldPrice | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [reserveGrams, setReserveGrams] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setWallet(addr: string) {
    const t = addr.trim();
    localStorage.setItem('gold-wallet', t);
    setWalletState(t);
  }

  function clearWallet() {
    localStorage.removeItem('gold-wallet');
    setWalletState('');
    setBalance(null);
    setIdentity(null);
    setRedemptions([]);
  }

  const fetchData = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    setError(null);
    try {
      const [tkns, pr] = await Promise.all([api.getTokens(), api.getPrice()]);
      setPrice(pr);
      const base = tkns[0] ?? null;
      if (!base) { setLoading(false); return; }

      const [balResult, resResult, idResult, rdmResult, tokResult] = await Promise.allSettled([
        (async () => {
          const provider = new JsonRpcProvider(RPC_URL);
          const contract = new Contract(base.address, BALANCE_ABI, provider);
          const balRaw = await contract.balanceOf(wallet);
          const decRaw = await contract.decimals();
          const grams = Number(balRaw) / 10 ** Number(decRaw);
          return { grams, wei: balRaw.toString() };
        })(),
        api.getReserves(base.address),
        api.getIdentity(wallet),
        api.getRedemptions(base.address, wallet),
        api.getToken(base.address),
      ]);

      if (balResult.status === 'fulfilled') setBalance(balResult.value);
      if (resResult.status === 'fulfilled') setReserveGrams(resResult.value.summary?.totalActiveGrams ?? 0);
      setIdentity(idResult.status === 'fulfilled' ? idResult.value : null);
      setRedemptions(rdmResult.status === 'fulfilled' ? rdmResult.value : []);
      setToken(tokResult.status === 'fulfilled' ? tokResult.value : base);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg.includes('fetch') || msg.includes('Failed') ? 'Could not connect — is Hardhat running?' : msg);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return {
    wallet, token, balance, price, identity, redemptions, reserveGrams,
    loading, error, setWallet, clearWallet, refetch: fetchData,
  };
}
