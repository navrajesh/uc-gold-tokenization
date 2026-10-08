import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Search, Coins, ArrowDownToLine, Clock, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { formatGrams, formatUsd, formatDate } from '../lib/utils';
import type { Token, Redemption, GoldPrice } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { HelpTooltip } from '../components/ui/Tooltip';
import { ExplorerLink } from '../components/ui/ExplorerLink';

export default function InvestorPortal() {
  const [wallet,      setWallet]      = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [tokens,      setTokens]      = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [balance,     setBalance]     = useState<{ grams: number; wei: string } | null>(null);
  const [price,       setPrice]       = useState<GoldPrice | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError,   setBalanceError]   = useState<string | null>(null);

  // Redemption form
  const [rdmForm, setRdmForm] = useState({ grams: '', deliveryAddress: '' });
  const [rdmSaving, setRdmSaving] = useState(false);
  const [rdmMsg,    setRdmMsg]    = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.getTokens().then(t => { setTokens(t); setSelectedToken(t[0] ?? null); }).catch(() => {});
    api.getPrice().then(setPrice).catch(() => {});
  }, []);

  const lookup = async () => {
    const addr = walletInput.trim();
    if (!addr || !selectedToken) return;
    setWallet(addr);
    setBalanceLoading(true);
    setBalanceError(null);
    setBalance(null);
    setRedemptions([]);
    try {
      const [bal, rdms] = await Promise.all([
        api.getTokenBalance(selectedToken.address, addr),
        api.getRedemptions(selectedToken.address, addr),
      ]);
      setBalance({
        grams: Number(bal.balanceWei) / 10 ** bal.decimals,
        wei: bal.balanceWei,
      });
      setRedemptions(rdms);
    } catch (e) {
      setBalanceError((e as Error).message.includes('fetch') ? 'Could not reach the backend or blockchain network.' : (e as Error).message);
    } finally {
      setBalanceLoading(false);
    }
  };

  const submitRedemption = async (e: FormEvent) => {
    e.preventDefault();
    if (!wallet || !selectedToken) return;
    setRdmSaving(true); setRdmMsg(null);
    try {
      await api.createRedemption({
        tokenAddress:    selectedToken.address,
        investorAddress: wallet,
        requestedGrams:  Number(rdmForm.grams),
        deliveryAddress: rdmForm.deliveryAddress || undefined,
      });
      setRdmMsg({ text: `Redemption request submitted for ${rdmForm.grams}g. Status: PENDING.`, ok: true });
      setRdmForm({ grams: '', deliveryAddress: '' });
      api.getRedemptions(selectedToken.address, wallet).then(setRedemptions).catch(() => {});
    } catch (err) {
      setRdmMsg({ text: (err as Error).message, ok: false });
    } finally { setRdmSaving(false); }
  };

  const priceNum  = price ? parseFloat(price.pricePerGramUsd) : 0;
  const usdValue  = balance ? balance.grams * priceNum : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="page-hero px-5 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10">
          <p className="page-eyebrow mb-3">Private holdings</p>
          <h1 className="display-title text-3xl sm:text-4xl font-semibold text-zinc-950 dark:text-zinc-50">Your gold, in full view.</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl leading-6">
            Review verified holdings, understand their current value, and begin a physical redemption.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles size={13} /> One token represents one gram of vaulted gold
          </div>
        </div>
      </div>

      {/* Wallet lookup */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label="Investor Wallet Address"
                placeholder="0x..."
                value={walletInput}
                onChange={e => setWalletInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookup()}
              />
            </div>
            {tokens.length > 1 && (
              <div className="sm:w-44">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Token</label>
                <select
                  value={selectedToken?.address ?? ''}
                  onChange={e => setSelectedToken(tokens.find(t => t.address === e.target.value) ?? null)}
                  className="premium-input w-full text-sm rounded-xl border text-zinc-900 dark:text-zinc-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <Button onClick={lookup} loading={balanceLoading} className="h-10">
                <Search size={14} /> Look up
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {balanceError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {balanceError}
        </div>
      )}

      {balanceLoading && (
        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-sm">
          <Spinner size={4} /> Loading holdings from chain…
        </div>
      )}

      {wallet && balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Holdings */}
          <Card>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2 inline-flex items-center">Gold Holdings <HelpTooltip text="Current token balance read live from the blockchain via JSON-RPC. Each token equals 1 gram of gold. Balance is not cached — each lookup queries the chain directly." /></p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {balance.grams.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                    </span>
                    <Badge variant="gold">{selectedToken?.symbol}</Badge>
                  </div>
                  <p className="text-lg font-semibold text-amber-500 mt-1">{formatUsd(usdValue)}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {formatGrams(balance.grams)} · @{formatUsd(priceNum)}/g
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                  <Coins className="text-amber-600 dark:text-amber-400" size={22} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
                <div className="flex justify-between">
                  <span>Wallet</span>
                  <ExplorerLink value={wallet} kind="address" chars={8} />
                </div>
                <div className="flex justify-between">
                  <span>Token</span>
                  <span>{selectedToken?.name}</span>
                </div>
                {selectedToken && (
                  <div className="flex justify-between">
                    <span>Token contract</span>
                    <ExplorerLink value={selectedToken.address} kind="address" chars={8} />
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Purity</span>
                  <span>{selectedToken?.purityStandard ?? '—'} fine gold</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Redemption request form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Redemption <HelpTooltip text="Submit a request to convert tokens into physical gold. Flow: PENDING → Admin approves → Custodian calls fulfillRedemption on-chain, which burns the tokens and releases the gold for delivery." /></CardTitle>
              <ArrowDownToLine size={16} className="text-zinc-400" />
            </CardHeader>
            <CardBody>
              <form onSubmit={submitRedemption} className="space-y-3">
                <Input
                  label="Amount (grams) *"
                  type="number"
                  min="1"
                  max={Math.floor(balance.grams)}
                  placeholder="50"
                  value={rdmForm.grams}
                  onChange={e => setRdmForm(p => ({ ...p, grams: e.target.value }))}
                  required
                />
                <Input
                  label="Delivery Address"
                  placeholder="123 Gold St, Singapore 049483"
                  value={rdmForm.deliveryAddress}
                  onChange={e => setRdmForm(p => ({ ...p, deliveryAddress: e.target.value }))}
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Submit request → Admin approves → Custodian delivers & burns tokens. Physical settlement only.
                </p>
                <Button type="submit" loading={rdmSaving} className="w-full" disabled={balance.grams < 1}>
                  <ArrowDownToLine size={14} /> Submit Redemption Request
                </Button>
                {rdmMsg && (
                  <div className={`rounded-lg border px-3 py-2 text-xs ${rdmMsg.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300'}`}>
                    {rdmMsg.text}
                  </div>
                )}
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Redemption history */}
      {wallet && (
        <Card>
          <CardHeader>
            <CardTitle>My Redemptions <HelpTooltip text="History of redemption requests submitted from this wallet. The burn transaction hash is recorded when the custodian fulfills the request on-chain." /></CardTitle>
            <Badge variant="gray">{redemptions.length}</Badge>
          </CardHeader>
          {redemptions.length === 0 ? (
            <EmptyState
              icon={<Clock size={20} />}
              title="No redemption history"
              body="Your redemption requests will appear here once submitted."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-zinc-800">
                    {[
                      { label: 'Reference', help: 'Auto-generated unique reference ID for the redemption request (e.g. REDEEM-20240101-abc). Used to track the request through its lifecycle.' },
                      { label: 'Amount',    help: 'Number of grams requested for redemption. Must be at least 1g (MinTransferAmount compliance rule).' },
                      { label: 'Status',    help: 'PENDING = awaiting admin review. APPROVED = ready for custodian fulfillment. FULFILLED = tokens burned on-chain, gold released for delivery. REJECTED = request denied.' },
                      { label: 'Requested', help: 'Date and time the redemption request was submitted.' },
                      { label: 'Burn Tx',   help: 'On-chain transaction hash of the token burn. Only present when status is FULFILLED. Can be verified on a block explorer.' },
                    ].map(({ label, help }) => (
                      <th key={label} className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                        <span className="inline-flex items-center gap-0.5">{label}<HelpTooltip text={help} /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map(r => (
                    <tr key={r.redemptionRef} className="border-b last:border-0 border-stone-50 dark:border-zinc-800/50 hover:bg-stone-50 dark:hover:bg-zinc-800/30">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-900 dark:text-zinc-100">{r.redemptionRef}</td>
                      <td className="px-5 py-3">{formatGrams(r.requestedGrams)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap">{formatDate(r.requestedAt)}</td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                        {r.burnTxHash ? <ExplorerLink value={r.burnTxHash} kind="tx" /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Empty state before lookup */}
      {!wallet && !balanceLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-4">
            <Coins className="text-amber-500" size={28} />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Enter a wallet address</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
            Enter any KYC-verified investor wallet address to view their gold token holdings and redemption history.
          </p>
        </div>
      )}
    </div>
  );
}
