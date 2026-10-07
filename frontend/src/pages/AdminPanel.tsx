import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import {
  Coins, Package, Users, ArrowLeftRight, Hammer, TrendingUp,
  Plus, CheckCircle, XCircle, Truck, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { shortAddress, formatGrams, formatDate, formatPurityBps, formatUsd } from '../lib/utils';
import type { Token, GoldBar, Identity, Redemption, GoldPrice } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { HelpTooltip } from '../components/ui/Tooltip';

// ─── Types ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'tokens',      label: 'Tokens',      Icon: Coins,          help: 'Register deployed token contracts in the backend database so the frontend can discover and display them.' },
  { id: 'bars',        label: 'Gold Bars',   Icon: Package,        help: 'Register physical gold bars on-chain in the GoldReserve contract and manage their active status. Active bar weights determine the maximum mintable supply.' },
  { id: 'kyc',         label: 'KYC',         Icon: Users,          help: 'Whitelist investor wallet addresses on-chain in the IdentityRegistry. Only KYC-verified wallets can hold or transfer tokens — transfers revert at the contract level otherwise.' },
  { id: 'redemptions', label: 'Redemptions', Icon: ArrowLeftRight, help: 'Review and action investor redemption requests. Approve moves the request to APPROVED; Fulfill calls fulfillRedemption on-chain which burns the tokens and releases the physical gold.' },
  { id: 'mint',        label: 'Mint',        Icon: Hammer,         help: 'Issue new tokens to a KYC-verified recipient. Blocked by the smart contract if the vault does not have enough unused reserve to cover the new tokens.' },
  { id: 'price',       label: 'Price',       Icon: TrendingUp,     help: 'Update the manual gold price feed (USD/gram) used for USD value display across the platform. This is an off-chain value — it has no effect on on-chain token operations.' },
] as const;
type TabId = typeof TABS[number]['id'];

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-sm ${ok
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
      : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300'}`}>
      {msg}
    </div>
  );
}

// ─── Tokens tab ───────────────────────────────────────────────────────────────
function TokensTab({ tokens, reload }: { tokens: Token[]; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ address: '', name: '', symbol: '', deployer: '', txHash: '', complianceAddress: '', identityRegistryAddress: '', goldReserveAddress: '', purityStandard: '', custodianAddress: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.registerToken({ ...form, decimals: 18 });
      setMsg({ text: 'Token registered.', ok: true });
      reload(); setOpen(false);
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus size={13} /> Register Token
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle>Register Deployed Token</CardTitle></CardHeader>
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Token Address *" placeholder="0x..." value={form.address} onChange={f('address')} required />
              <Input label="Name *" placeholder="Singapore Fine Gold" value={form.name} onChange={f('name')} required />
              <Input label="Symbol *" placeholder="SGT999" value={form.symbol} onChange={f('symbol')} required />
              <Input label="Deployer Address *" placeholder="0x..." value={form.deployer} onChange={f('deployer')} required />
              <Input label="Deploy Tx Hash *" placeholder="0x..." value={form.txHash} onChange={f('txHash')} required />
              <Input label="Compliance Address *" placeholder="0x..." value={form.complianceAddress} onChange={f('complianceAddress')} required />
              <Input label="Identity Registry Address *" placeholder="0x..." value={form.identityRegistryAddress} onChange={f('identityRegistryAddress')} required />
              <Input label="Gold Reserve Address" placeholder="0x..." value={form.goldReserveAddress} onChange={f('goldReserveAddress')} />
              <Input label="Purity Standard" placeholder="999.9" value={form.purityStandard} onChange={f('purityStandard')} />
              <Input label="Custodian Address" placeholder="0x..." value={form.custodianAddress} onChange={f('custodianAddress')} />
              <div className="sm:col-span-2 flex items-center gap-3">
                <Button type="submit" loading={saving}>Register</Button>
                <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                {msg && <Toast msg={msg.text} ok={msg.ok} />}
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Registered Tokens <HelpTooltip text="Tokens known to the backend database. Deploying a contract on-chain does not automatically add it here — you must register it manually or run the deploy script, which auto-registers." /></CardTitle><Badge variant="gray">{tokens.length}</Badge></CardHeader>
        {tokens.length === 0
          ? <EmptyState icon={<Coins size={20} />} title="No tokens registered" body="Deploy a token via Hardhat then register it here." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-100 dark:border-zinc-800">
                  {[
                    { label: 'Symbol',   help: 'Token ticker symbol (e.g. SGT999). Shown in displays and used to distinguish between deployed tokens.' },
                    { label: 'Name',     help: 'Full descriptive name of the token (e.g. Singapore Fine Gold).' },
                    { label: 'Address',  help: 'Ethereum address of the UUPS proxy contract. This is the canonical address users interact with — the implementation can be upgraded behind it without changing this address.' },
                    { label: 'Purity',   help: 'Gold fineness standard this token represents (e.g. 999.9 for fine gold, 916 for 22-karat gold).' },
                    { label: 'Deployed', help: 'Date the token was registered in the backend database.' },
                  ].map(({ label, help }) => (
                    <th key={label} className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      <span className="inline-flex items-center gap-0.5">{label}<HelpTooltip text={help} /></span>
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {tokens.map(t => (
                    <tr key={t.address} className="border-b last:border-0 border-stone-50 dark:border-zinc-800/50 hover:bg-stone-50 dark:hover:bg-zinc-800/30">
                      <td className="px-5 py-3"><Badge variant="gold">{t.symbol}</Badge></td>
                      <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">{t.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-500">{shortAddress(t.address)}</td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{t.purityStandard ?? '—'}</td>
                      <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap">{formatDate(t.deployedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}

// ─── Gold Bars tab ────────────────────────────────────────────────────────────
function BarsTab({ tokens }: { tokens: Token[] }) {
  const [tokenAddr, setTokenAddr] = useState(tokens[0]?.address ?? '');
  const [bars, setBars] = useState<GoldBar[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ barId: '', weightGrams: '', purityBps: '', vaultId: '', custodian: '', assayRef: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!tokenAddr) return;
    api.getReserves(tokenAddr).then(r => setBars(r.bars)).catch(() => {});
  }, [tokenAddr]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.registerBar({ ...form, tokenAddress: tokenAddr, weightGrams: Number(form.weightGrams), purityBps: Number(form.purityBps) });
      setMsg({ text: 'Bar registered on-chain and saved.', ok: true });
      setOpen(false);
      api.getReserves(tokenAddr).then(r => setBars(r.bars)).catch(() => {});
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  const deactivate = async (barId: string) => {
    if (!confirm(`Deactivate bar ${barId}?`)) return;
    try {
      await api.deactivateBar(barId);
      setBars(bs => bs.map(b => b.barId === barId ? { ...b, active: false } : b));
    } catch (err) { alert((err as Error).message); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {tokens.length > 0 && (
          <select value={tokenAddr} onChange={e => setTokenAddr(e.target.value)}
            className="text-sm rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500">
            {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
          </select>
        )}
        <Button size="sm" onClick={() => setOpen(!open)}><Plus size={13} />Register Bar</Button>
      </div>

      {msg && <Toast msg={msg.text} ok={msg.ok} />}

      {open && (
        <Card>
          <CardHeader><CardTitle>Register Gold Bar</CardTitle></CardHeader>
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Bar ID *" placeholder="GB-2024-001" value={form.barId} onChange={f('barId')} required />
              <Input label="Weight (grams) *" type="number" min="1" placeholder="1000" value={form.weightGrams} onChange={f('weightGrams')} required />
              <Input label="Purity BPS *" type="number" placeholder="9999 (=999.9)" value={form.purityBps} onChange={f('purityBps')} required />
              <Input label="Vault ID *" placeholder="Vault-SG-A" value={form.vaultId} onChange={f('vaultId')} required />
              <Input label="Custodian *" placeholder="Brinks Singapore" value={form.custodian} onChange={f('custodian')} required />
              <Input label="Assay Reference" placeholder="ASSAY-SG-001" value={form.assayRef} onChange={f('assayRef')} />
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" loading={saving}>Register On-Chain</Button>
                <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bar Registry <HelpTooltip text="Physical gold bars registered on-chain in the GoldReserve contract. The sum of active bar weights determines the maximum mintable token supply." /></CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="green">{bars.filter(b => b.active).length} active</Badge>
            <Badge variant="gray">{bars.length} total</Badge>
          </div>
        </CardHeader>
        {bars.length === 0
          ? <EmptyState icon={<Package size={20} />} title="No bars registered" body="Register physical gold bars to back the token supply." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-100 dark:border-zinc-800">
                  {[
                    { label: 'Bar ID',    help: 'Unique identifier for the physical bar (e.g. GB-2024-001). Set at registration and immutable on-chain.' },
                    { label: 'Weight',    help: 'Physical weight in grams. Added to the vault total while the bar is active.' },
                    { label: 'Purity',    help: 'Gold purity in basis points. 9999 = 99.99% fine gold. 9160 = 91.6% (916 standard / 22-karat).' },
                    { label: 'Vault',     help: 'Physical storage facility ID where this bar is held (e.g. Vault-SG-A, Vault-SG-B).' },
                    { label: 'Custodian', help: 'Institution responsible for safeguarding this bar (e.g. Brinks Singapore). Off-chain field stored in the backend database.' },
                    { label: 'Status',    help: 'Active = counted in vault total. Deactivating removes the bar weight from the reserve, reducing how many tokens can be minted.' },
                    { label: '' },
                  ].map(({ label, help }, i) => (
                    <th key={i} className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      {label && <span className="inline-flex items-center gap-0.5">{label}{help && <HelpTooltip text={help} />}</span>}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {bars.map(bar => (
                    <tr key={bar.barId} className="border-b last:border-0 border-stone-50 dark:border-zinc-800/50 hover:bg-stone-50 dark:hover:bg-zinc-800/30">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">{bar.barId}</td>
                      <td className="px-5 py-3">{bar.weightGrams.toLocaleString()}g</td>
                      <td className="px-5 py-3"><Badge variant="gold">{formatPurityBps(bar.purityBps)}</Badge></td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{bar.vaultId}</td>
                      <td className="px-5 py-3 text-zinc-500">{bar.custodian}</td>
                      <td className="px-5 py-3"><StatusBadge status={bar.active ? 'Active' : 'Inactive'} /></td>
                      <td className="px-5 py-3">
                        {bar.active && (
                          <Button size="sm" variant="ghost" onClick={() => deactivate(bar.barId)}>
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}

// ─── KYC tab ──────────────────────────────────────────────────────────────────
function KycTab({ tokens }: { tokens: Token[] }) {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ address: '', countryCode: '', tokenAddress: tokens[0]?.address ?? '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.getIdentities().then(setIdentities).catch(() => {});
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.registerIdentity({ ...form, verified: true });
      setMsg({ text: `KYC registered on-chain for ${shortAddress(form.address)}.`, ok: true });
      api.getIdentities().then(setIdentities).catch(() => {});
      setOpen(false);
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(!open)}><Plus size={13} />Register Identity</Button>
      </div>
      {msg && <Toast msg={msg.text} ok={msg.ok} />}
      {open && (
        <Card>
          <CardHeader><CardTitle>Register KYC Identity</CardTitle></CardHeader>
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Wallet Address *" placeholder="0x..." value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required />
              <Input label="Country Code" placeholder="SG" maxLength={2} value={form.countryCode} onChange={e => setForm(p => ({ ...p, countryCode: e.target.value.toUpperCase() }))} />
              <Select label="Token (registry) *" value={form.tokenAddress} onChange={e => setForm(p => ({ ...p, tokenAddress: e.target.value }))}>
                {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
              </Select>
              <div className="flex gap-3 items-end">
                <Button type="submit" loading={saving}>Register On-Chain</Button>
                <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>KYC Registry <HelpTooltip text="On-chain whitelist of investor wallets in the IdentityRegistry contract. Any transfer involving an address not in this list will revert at the smart contract level." /></CardTitle><Badge variant="gray">{identities.length}</Badge></CardHeader>
        {identities.length === 0
          ? <EmptyState icon={<Users size={20} />} title="No identities registered" body="KYC-verified wallets can receive and transfer tokens." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-100 dark:border-zinc-800">
                  {[
                    { label: 'Wallet',     help: 'Full Ethereum wallet address of the KYC-verified investor.' },
                    { label: 'Country',    help: 'ISO 3166-1 alpha-2 country code (e.g. SG = Singapore). Used by the CountryRestrictions compliance module to enforce geographic transfer rules.' },
                    { label: 'Status',     help: 'Verified (Active) = the address can hold and transfer tokens. Transfers revert if either the sender or receiver is not verified.' },
                    { label: 'Registered', help: 'Date and time the wallet address was added to the IdentityRegistry on-chain.' },
                  ].map(({ label, help }) => (
                    <th key={label} className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      <span className="inline-flex items-center gap-0.5">{label}<HelpTooltip text={help} /></span>
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {identities.map(id => (
                    <tr key={id.address} className="border-b last:border-0 border-stone-50 dark:border-zinc-800/50 hover:bg-stone-50 dark:hover:bg-zinc-800/30">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-900 dark:text-zinc-100">{id.address}</td>
                      <td className="px-5 py-3 text-zinc-500">{id.countryCode ?? '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={id.isVerified ? 'Active' : 'Inactive'} /></td>
                      <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap">{formatDate(id.registeredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}

// ─── Redemptions tab ──────────────────────────────────────────────────────────
function RedemptionsTab({ tokens }: { tokens: Token[] }) {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [tokenAddr, setTokenAddr] = useState(tokens[0]?.address ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    api.getRedemptions(tokenAddr || undefined).then(setRedemptions).catch(() => {});
  }, [tokenAddr]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>, label: string, ref: string) => {
    setActing(ref); setMsg(null);
    try {
      await fn();
      setMsg({ text: `${label} successful.`, ok: true });
      load();
    } catch (err) {
      setMsg({ text: (err as Error).message, ok: false });
    } finally { setActing(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {tokens.length > 0 && (
          <select value={tokenAddr} onChange={e => setTokenAddr(e.target.value)}
            className="text-sm rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All tokens</option>
            {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
          </select>
        )}
      </div>
      {msg && <Toast msg={msg.text} ok={msg.ok} />}
      <Card>
        <CardHeader>
          <CardTitle>Redemption Queue <HelpTooltip text="Investor requests to convert tokens into physical gold. Workflow: PENDING (submitted) → APPROVED (admin review) → FULFILLED (on-chain burn + physical delivery) or REJECTED." /></CardTitle>
          <div className="flex gap-2">
            <Badge variant="amber">{redemptions.filter(r => r.status === 'PENDING').length} pending</Badge>
            <Badge variant="blue">{redemptions.filter(r => r.status === 'APPROVED').length} approved</Badge>
          </div>
        </CardHeader>
        {redemptions.length === 0
          ? <EmptyState icon={<ArrowLeftRight size={20} />} title="No redemption requests" body="Investor redemption requests will appear here." />
          : (
            <div className="divide-y divide-stone-100 dark:divide-zinc-800">
              {redemptions.map(r => (
                <div key={r.redemptionRef}>
                  <div
                    className="flex items-center justify-between px-5 py-3 hover:bg-stone-50 dark:hover:bg-zinc-800/30 cursor-pointer"
                    onClick={() => setExpanded(e => e === r.redemptionRef ? null : r.redemptionRef)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">{r.redemptionRef}</span>
                      <span className="text-sm text-zinc-500">{formatGrams(r.requestedGrams)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.status === 'PENDING' && (
                        <>
                          <Button size="sm" loading={acting === r.redemptionRef + 'a'} onClick={e => { e.stopPropagation(); act(() => api.approveRedemption(r.redemptionRef), 'Approval', r.redemptionRef + 'a'); }}>
                            <CheckCircle size={12} /> Approve
                          </Button>
                          <Button size="sm" variant="danger" loading={acting === r.redemptionRef + 'r'} onClick={e => { e.stopPropagation(); act(() => api.rejectRedemption(r.redemptionRef, 'Rejected by admin'), 'Rejection', r.redemptionRef + 'r'); }}>
                            <XCircle size={12} /> Reject
                          </Button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <Button size="sm" variant="secondary" loading={acting === r.redemptionRef + 'f'} onClick={e => { e.stopPropagation(); act(() => api.fulfillRedemption(r.redemptionRef), 'Fulfillment (burn)', r.redemptionRef + 'f'); }}>
                          <Truck size={12} /> Fulfill & Burn
                        </Button>
                      )}
                      {expanded === r.redemptionRef ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                  {expanded === r.redemptionRef && (
                    <div className="px-5 pb-4 bg-stone-50/50 dark:bg-zinc-800/20 text-xs text-zinc-500 dark:text-zinc-400 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <span><b>Investor:</b> {shortAddress(r.investorAddress, 8)}</span>
                      <span><b>Requested:</b> {formatDate(r.requestedAt)}</span>
                      <span><b>Delivery:</b> {r.deliveryAddress ?? '—'}</span>
                      {r.burnTxHash && <span className="col-span-2"><b>Burn tx:</b> <span className="font-mono">{shortAddress(r.burnTxHash)}</span></span>}
                      {r.rejectReason && <span className="col-span-2 text-red-500"><b>Reason:</b> {r.rejectReason}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </Card>
    </div>
  );
}

// ─── Mint tab ─────────────────────────────────────────────────────────────────
function MintTab({ tokens }: { tokens: Token[] }) {
  const [form, setForm] = useState({ tokenAddress: tokens[0]?.address ?? '', to: '', grams: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const token = tokens.find(t => t.address === form.tokenAddress);
    if (!token) return;
    const amountWei = (BigInt(Math.round(Number(form.grams))) * (10n ** BigInt(token.decimals))).toString();
    try {
      const r = await api.mintTokens(token.address, form.to, amountWei);
      setMsg({ text: `Minted ${form.grams}g → ${shortAddress(form.to)}. Tx: ${shortAddress(r.txHash)}`, ok: true });
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-md space-y-4">
      <Card>
        <CardHeader><CardTitle>Mint Gold Tokens <HelpTooltip text="Issue new tokens to a KYC-verified wallet. The smart contract checks: (1) recipient is KYC-registered, (2) all compliance rules pass, and (3) new total supply will not exceed the vault's gold weight." /></CardTitle></CardHeader>
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <Select label="Token *" value={form.tokenAddress} onChange={e => setForm(p => ({ ...p, tokenAddress: e.target.value }))}>
              {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol} — {t.name}</option>)}
            </Select>
            <Input label="Recipient Address *" placeholder="0x..." value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} required />
            <Input label="Amount (grams) *" type="number" min="1" placeholder="100" value={form.grams} onChange={e => setForm(p => ({ ...p, grams: e.target.value }))} required />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Requires: recipient KYC verified · vault reserve ≥ current supply + mint amount
            </p>
            <Button type="submit" loading={saving} className="w-full">Mint Tokens</Button>
            {msg && <Toast msg={msg.text} ok={msg.ok} />}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Price tab ────────────────────────────────────────────────────────────────
function PriceTab() {
  const [price, setPrice]   = useState<GoldPrice | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => { api.getPrice().then(setPrice).catch(() => {}); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const p = await api.updatePrice(newPrice);
      setPrice(p);
      setMsg({ text: `Price updated to $${newPrice}/gram.`, ok: true });
      setNewPrice('');
    } catch (err) { setMsg({ text: (err as Error).message, ok: false }); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-md space-y-4">
      {price && (
        <Card>
          <CardBody>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1 inline-flex items-center">Current Gold Price <HelpTooltip text="Manual USD/gram price used for display purposes only. Does not affect on-chain token balances or compliance. Replace with a Chainlink XAU/USD oracle for production." /></p>
            <p className="text-3xl font-bold text-amber-500">{formatUsd(parseFloat(price.pricePerGramUsd))}<span className="text-sm font-normal text-zinc-400 ml-1">/gram</span></p>
            <p className="text-xs text-zinc-400 mt-1">Updated {formatDate(price.updatedAt)} by {price.updatedBy ?? 'system'}</p>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Update Gold Price <HelpTooltip text="Manual update — this value is stored off-chain in SQLite and used only for USD calculations in the UI. It has no effect on on-chain operations. In production, replace with a Chainlink XAU/USD feed." /></CardTitle></CardHeader>
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <Input label="New Price (USD/gram) *" type="number" step="0.01" min="0.01" placeholder="85.00" value={newPrice} onChange={e => setNewPrice(e.target.value)} required />
            <p className="text-xs text-zinc-400">Manual update — interface is ready for a Chainlink oracle swap.</p>
            <Button type="submit" loading={saving} className="w-full">Update Price</Button>
            {msg && <Toast msg={msg.text} ok={msg.ok} />}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState<TabId>('tokens');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTokens = useCallback(() => {
    setLoading(true);
    api.getTokens().then(setTokens).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Admin Panel</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage tokens, reserves, KYC, and redemptions</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-stone-200 dark:border-zinc-800">
        {TABS.map(({ id, label, Icon, help }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors -mb-px border-b-2
              ${tab === id
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
          >
            <Icon size={14} />
            {label}
            <HelpTooltip text={help} />
          </button>
        ))}
      </div>

      {tab === 'tokens'      && <TokensTab      tokens={tokens} reload={loadTokens} />}
      {tab === 'bars'        && <BarsTab         tokens={tokens} />}
      {tab === 'kyc'         && <KycTab          tokens={tokens} />}
      {tab === 'redemptions' && <RedemptionsTab  tokens={tokens} />}
      {tab === 'mint'        && <MintTab         tokens={tokens} />}
      {tab === 'price'       && <PriceTab />}
    </div>
  );
}
