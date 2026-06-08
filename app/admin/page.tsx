'use client';

import { useState, useEffect } from 'react';
import {
  Shield, CreditCard, Settings, LogOut, Search, Copy, Check,
  Loader2, AlertCircle, MessageSquare, Eye, FileCode, Plus,
  Save, Trash2, X, TrendingUp, Users, DollarSign, Zap,
  ChevronRight, ChevronLeft, MoreHorizontal, Package
} from 'lucide-react';
import { getApiUrl, copyToClipboard } from '@/lib/utils';
import Link from 'next/link';

interface Payment {
  transaction_id: string;
  payer_email?: string;
  roblox_username?: string;
  tier: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  generated_keys: string | string[];
  discord_id?: string;
  discord_tag?: string;
  discord_avatar?: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  user_name: string;
  user_email: string;
  subject: string;
  status: string;
  created_at: string;
}

interface Stats {
  totalPurchases: number;
  paypalPurchases: number;
  robloxPurchases: number;
  paypalRevenue: number;
  robloxRevenue: number;
}

type PremiumTier   = 'weekly' | 'monthly' | 'lifetime';
type PaymentMethod = 'robux' | 'paypal' | 'gcash' | 'card';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; color: string }[] = [
  { id: 'robux',  label: 'Robux',  color: '#fbbf24' },
  { id: 'paypal', label: 'PayPal', color: '#60a5fa' },
  { id: 'gcash',  label: 'GCash',  color: '#34d399' },
  { id: 'card',   label: 'Card',   color: '#c084fc' },
];

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.slice(0, 2).toUpperCase();
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const s = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs';
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ background: `hsl(${hue}, 50%, 30%)` }}
    >
      {initials}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    weekly:   'bg-blue-500/15 text-blue-300 ring-blue-500/30',
    monthly:  'bg-violet-500/15 text-violet-300 ring-violet-500/30',
    lifetime: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 capitalize ${map[tier] || 'bg-white/5 text-white/50 ring-white/10'}`}>
      {tier}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open:    'bg-blue-500/15 text-blue-300 ring-blue-500/30',
    replied: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
    closed:  'bg-white/5 text-white/30 ring-white/10',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 capitalize ${map[status] || 'bg-white/5 text-white/30 ring-white/10'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'payments' | 'tickets' | 'scripts' | 'settings'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPurchases: 0, paypalPurchases: 0, robloxPurchases: 0, paypalRevenue: 0, robloxRevenue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ email: '', subject: '', message: '' });
  const [isComposing, setIsComposing] = useState(false);

  const [scripts, setScripts] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [scriptSearch, setScriptSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [selectedScript, setSelectedScript] = useState<any | null>(null);
  const [bulkFeatures, setBulkFeatures] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  type MethodStockMap = Record<PremiumTier, Record<PaymentMethod, number>>;
  type MethodDraftMap = Record<PremiumTier, Record<PaymentMethod, string>>;

  const defaultMethodStock = (): MethodStockMap => ({
    weekly:   { robux: 0, paypal: 0, gcash: 0, card: 0 },
    monthly:  { robux: 0, paypal: 0, gcash: 0, card: 0 },
    lifetime: { robux: 0, paypal: 0, gcash: 0, card: 0 },
  });
  const defaultMethodDraft = (): MethodDraftMap => ({
    weekly:   { robux: '0', paypal: '0', gcash: '0', card: '0' },
    monthly:  { robux: '0', paypal: '0', gcash: '0', card: '0' },
    lifetime: { robux: '0', paypal: '0', gcash: '0', card: '0' },
  });

  const [methodStock, setMethodStock] = useState<MethodStockMap>(defaultMethodStock());
  const [methodDraft, setMethodDraft] = useState<MethodDraftMap>(defaultMethodDraft());
  const [savingMethodKey, setSavingMethodKey] = useState<string | null>(null);

  const [githubConfig, setGithubConfig] = useState({ free_url: '', premium_url: '', discontinued_url: '' });
  const [savingGithub, setSavingGithub] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const ITEMS_PER_PAGE       = 8;
  const TABLE_ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) { setIsAuthenticated(true); fetchData(token); }
  }, []);

  const fetchData = async (token: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${getApiUrl()}/api/admin/payments`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      if (data.success) { setPayments(data.payments); setStats(data.stats); }
      const ticketRes = await fetch(`${getApiUrl()}/api/admin/tickets`, { headers: { 'Authorization': `Bearer ${token}` } });
      const ticketData = await ticketRes.json();
      if (ticketData.success) setTickets(ticketData.tickets);
      await fetchPremiumStock(token);
    } catch { setError('Failed to load data'); }
    finally { setIsLoading(false); }
  };

  const fetchPremiumStock = async (token: string) => {
    try {
      setStockLoading(true);
      const res = await fetch(`${getApiUrl()}/api/admin/premium-stock?scope=paymentMethod`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const ms = (await res.json())?.methodStocks || {};
        const newStock = defaultMethodStock(); const newDraft = defaultMethodDraft();
        for (const t of ['weekly', 'monthly', 'lifetime'] as PremiumTier[])
          for (const m of ['robux', 'paypal', 'gcash', 'card'] as PaymentMethod[]) {
            const v = Number(ms[t]?.[m] || 0);
            newStock[t][m] = v; newDraft[t][m] = String(v);
          }
        setMethodStock(newStock); setMethodDraft(newDraft);
      }
    } finally { setStockLoading(false); }
  };

  const loadGitHubConfig = async () => {
    try {
      setGithubLoading(true);
      const res = await fetch(`${getApiUrl()}/api/admin/github-config`);
      if (res.ok) { const c = await res.json(); setGithubConfig({ free_url: c.free_url || '', premium_url: c.premium_url || '', discontinued_url: c.discontinued_url || '' }); }
    } finally { setGithubLoading(false); }
  };

  const saveGitHubConfig = async () => {
    try {
      setSavingGithub(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${getApiUrl()}/api/admin/github-config`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(githubConfig) });
      if (!res.ok) throw new Error('Failed');
      setGithubConfig(await res.json());
      alert('Saved!');
    } catch { alert('Failed to save'); }
    finally { setSavingGithub(false); }
  };

  const saveMethodStock = async (tier: PremiumTier, method: PaymentMethod) => {
    const token = localStorage.getItem('adminToken');
    const value = Number(methodDraft[tier][method]);
    if (!Number.isInteger(value) || value < 0) return alert('Must be a non-negative integer');
    const key = `${method}-${tier}`;
    setSavingMethodKey(key);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/premium-stock`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tier, method, stock: value }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      const ms = data.methodStocks || {};
      const s = defaultMethodStock(); const d = defaultMethodDraft();
      for (const t of ['weekly', 'monthly', 'lifetime'] as PremiumTier[])
        for (const m of ['robux', 'paypal', 'gcash', 'card'] as PaymentMethod[]) {
          const v = Number(ms[t]?.[m] || 0); s[t][m] = v; d[t][m] = String(v);
        }
      setMethodStock(s); setMethodDraft(d);
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setSavingMethodKey(null); }
  };

  const loadScriptData = async () => {
    try {
      setScripts(await (await fetch('/api/scripts')).json());
      const md = await (await fetch('/api/admin/script-metadata')).json();
      const map: Record<string, any> = {};
      md.forEach((i: any) => { map[i.script_name] = i; });
      setMetadata(map);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'scripts' && scripts.length === 0) loadScriptData();
    if (activeTab === 'settings' && !githubConfig.free_url) loadGitHubConfig();
  }, [activeTab]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const data = await (await fetch(`${getApiUrl()}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })).json();
      if (data.success) { localStorage.setItem('adminToken', data.token); setIsAuthenticated(true); fetchData(data.token); }
      else setError(data.error || 'Invalid password');
    } catch { setError('Login failed'); }
    finally { setIsLoading(false); }
  };

  const logout = () => { localStorage.removeItem('adminToken'); setIsAuthenticated(false); setPassword(''); setPayments([]); };

  const handleCopy = async (text: string) => {
    if (await copyToClipboard(text)) { setCopiedKey(text); setTimeout(() => setCopiedKey(null), 2000); }
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Delete this payment?')) return;
    const token = localStorage.getItem('adminToken');
    await fetch('/api/admin/payments', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ transactionId: id }) });
    setPayments(prev => prev.filter(p => p.transaction_id !== id));
  };

  const deleteTicket = async (num: string) => {
    if (!confirm('Delete this ticket?')) return;
    const token = localStorage.getItem('adminToken');
    await fetch('/api/admin/tickets', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ ticketNumber: num }) });
    setTickets(prev => prev.filter(t => t.ticket_number !== num));
  };

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsComposing(true);
    try {
      const { ticket } = await (await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: composeData.email, subject: composeData.subject, category: 'other', message: composeData.message }) })).json();
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/admin/tickets/${ticket.ticketNumber}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: 'replied' }) });
      setTickets(prev => [{ id: ticket.id, ticket_number: ticket.ticketNumber, user_name: composeData.email.split('@')[0], user_email: composeData.email, subject: composeData.subject, status: 'replied', created_at: new Date().toISOString() }, ...prev]);
      setIsComposeOpen(false); setComposeData({ email: '', subject: '', message: '' });
    } catch { alert('Error'); }
    finally { setIsComposing(false); }
  };

  const saveMetadata = async (name: string) => {
    try {
      setSaving(name);
      const data = metadata[name]; if (!data) return;
      const saved = await (await fetch('/api/admin/script-metadata', { method: data.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
      setMetadata(prev => ({ ...prev, [name]: saved })); alert('Saved!');
    } catch { alert('Failed'); }
    finally { setSaving(null); }
  };

  const deleteMetadata = async (name: string) => {
    if (!confirm(`Delete metadata for ${name}?`)) return;
    const data = metadata[name]; if (!data?.id) return;
    await fetch(`/api/admin/script-metadata?id=${data.id}`, { method: 'DELETE' });
    setMetadata(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const updateMetadata = (name: string, field: string, value: any) =>
    setMetadata(prev => ({ ...prev, [name]: { ...prev[name], script_name: name, [field]: value } }));
  const addFeature    = (s: string) => updateMetadata(s, 'features', [...(metadata[s]?.features || []), '']);
  const updateFeature = (s: string, i: number, v: string) => { const f = [...(metadata[s]?.features || [])]; f[i] = v; updateMetadata(s, 'features', f); };
  const removeFeature = (s: string, i: number) => updateMetadata(s, 'features', (metadata[s]?.features || []).filter((_: any, idx: number) => idx !== i));
  const importBulk = (name: string) => {
    const features = bulkFeatures.split('\n').map(l => l.replace(/^[\*\-\>]\s*/, '').trim()).filter(Boolean);
    if (!features.length) return alert('No features found');
    updateMetadata(name, 'features', [...(metadata[name]?.features || []), ...features]);
    setBulkFeatures(''); alert(`Imported ${features.length}!`);
  };

  const filteredPayments = payments.filter(p => {
    const s = searchQuery.toLowerCase();
    return [p.payer_email, p.roblox_username, p.transaction_id, p.tier].some(v => (v || '').toLowerCase().includes(s));
  });
  const totalPaymentPages = Math.max(1, Math.ceil(filteredPayments.length / TABLE_ITEMS_PER_PAGE));
  const paginatedPayments = filteredPayments.slice((paymentsPage - 1) * TABLE_ITEMS_PER_PAGE, paymentsPage * TABLE_ITEMS_PER_PAGE);

  const filteredTickets = tickets.filter(t => {
    const s = ticketSearch.toLowerCase();
    return [t.user_email, t.user_name, t.ticket_number, t.subject].some(v => (v || '').toLowerCase().includes(s));
  });
  const totalTicketPages = Math.max(1, Math.ceil(filteredTickets.length / TABLE_ITEMS_PER_PAGE));
  const paginatedTickets = filteredTickets.slice((ticketsPage - 1) * TABLE_ITEMS_PER_PAGE, ticketsPage * TABLE_ITEMS_PER_PAGE);

  useEffect(() => { setPaymentsPage(1); }, [searchQuery, payments.length]);
  useEffect(() => { setTicketsPage(1); }, [ticketSearch, tickets.length]);

  const getKey = (p: Payment) => {
    try {
      if (Array.isArray(p.generated_keys) && p.generated_keys.length > 0) return p.generated_keys[0];
      if (typeof p.generated_keys === 'string')
        return p.generated_keys.startsWith('[') ? (JSON.parse(p.generated_keys)[0] ?? 'N/A') : p.generated_keys;
    } catch {}
    return 'N/A';
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/10">
              <Shield className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-sm text-[#666] mt-1.5">This area is restricted to authorized staff.</p>
          </div>

          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 shadow-2xl">
            <form onSubmit={login} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl focus:border-white/20 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20"
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-semibold py-3 text-sm rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'payments', label: 'Payments',  icon: CreditCard,  count: payments.length },
    { id: 'tickets',  label: 'Tickets',   icon: MessageSquare, count: tickets.filter(t => t.status === 'open').length || undefined },
    { id: 'scripts',  label: 'Scripts',   icon: FileCode,    count: undefined },
    { id: 'settings', label: 'Settings',  icon: Settings,    count: undefined },
  ];

  const totalRevenue = stats.paypalRevenue + (stats.robloxRevenue * 0.0035);

  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/[0.06] bg-[#080808] flex flex-col sticky top-14 h-[calc(100vh-56px)]">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-[#555]">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-[#555] hover:text-[#999] hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[var(--accent)]' : ''}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${active ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/[0.06] text-[#666]'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#555] hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 bg-[#080808]">

        {/* Page header */}
        <div className="border-b border-white/[0.06] px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white capitalize">{activeTab}</h1>
            <p className="text-xs text-[#555] mt-0.5">
              {activeTab === 'payments' && `${payments.length} total transactions`}
              {activeTab === 'tickets'  && `${tickets.length} total tickets`}
              {activeTab === 'scripts'  && `${scripts.length} scripts`}
              {activeTab === 'settings' && 'Configure store settings'}
            </p>
          </div>
          {activeTab === 'payments' && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-[#555]">Est. Revenue</p>
                <p className="text-sm font-bold text-[var(--accent)]">${(stats.paypalRevenue).toFixed(0)}+</p>
              </div>
            </div>
          )}
          {activeTab === 'tickets' && (
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-sm font-medium transition-colors border border-[var(--accent)]/20"
            >
              <MessageSquare className="w-4 h-4" />
              New Message
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">

          {/* ── Payments ──────────────────────────────────────────────── */}
          {activeTab === 'payments' && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Orders', value: stats.totalPurchases, sub: 'all time', icon: Package, color: 'text-white' },
                  { label: 'PayPal Orders', value: stats.paypalPurchases, sub: `$${stats.paypalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-blue-400' },
                  { label: 'Robux Orders',  value: stats.robloxPurchases, sub: `${stats.robloxRevenue.toLocaleString()} R$`, icon: Zap, color: 'text-yellow-400' },
                  { label: 'Customers',     value: new Set(payments.map(p => p.payer_email || p.roblox_username)).size, sub: 'unique', icon: Users, color: 'text-violet-400' },
                ].map((card) => (
                  <div key={card.label} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-xs text-[#555] font-medium">{card.label}</p>
                      <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{card.value}</p>
                    <p className={`text-xs mt-1 ${card.color} opacity-70`}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                <input
                  type="text"
                  placeholder="Search by email, username, or transaction ID…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl focus:border-white/10 text-sm text-white outline-none transition-colors placeholder:text-[#444]"
                />
              </div>

              {/* Table */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Customer</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Plan</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Amount</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Key</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#444] mx-auto" /></td></tr>
                    ) : paginatedPayments.length === 0 ? (
                      <tr><td colSpan={6} className="py-16 text-center text-sm text-[#444]">No payments found</td></tr>
                    ) : paginatedPayments.map((p) => {
                      const key = getKey(p);
                      const name = p.payer_email || p.roblox_username || 'Unknown';
                      return (
                        <tr key={p.transaction_id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={name} />
                              <div>
                                <p className="text-sm text-white font-medium truncate max-w-[180px]">{name}</p>
                                <p className="text-xs text-[#444] mt-0.5">{p.transaction_id.substring(0, 16)}…</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><TierBadge tier={p.tier} /></td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-white">
                              {p.currency === 'ROBUX' ? `${p.amount} R$` : `$${p.amount}`}
                            </span>
                            <span className={`ml-2 text-xs ${p.currency === 'ROBUX' ? 'text-yellow-400' : 'text-blue-400'}`}>
                              {p.currency === 'ROBUX' ? 'Robux' : 'PayPal'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-[#555]">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-lg max-w-[100px] truncate block">
                                {key}
                              </span>
                              <button onClick={() => handleCopy(key)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#444] hover:text-white">
                                {copiedKey === key ? <Check className="w-3.5 h-3.5 text-[var(--accent)]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/success?orderId=${p.transaction_id}&tier=${p.tier}&amount=${p.amount}&currency=${p.currency}&key=${key}&email=${p.payer_email || ''}&payerId=${p.payer_email || ''}&date=${p.created_at}&method=${p.currency === 'ROBUX' ? 'Robux' : 'PayPal'}&admin=1`} target="_blank">
                                <button className="p-2 rounded-lg hover:bg-white/[0.06] text-[#555] hover:text-white transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              <button onClick={() => deletePayment(p.transaction_id)} className="p-2 rounded-lg hover:bg-red-500/10 text-[#555] hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {totalPaymentPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
                    <span className="text-xs text-[#555]">{filteredPayments.length} results</span>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPaymentPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPaymentsPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === paymentsPage ? 'bg-white/10 text-white' : 'text-[#555] hover:text-white hover:bg-white/[0.04]'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Tickets ───────────────────────────────────────────────── */}
          {activeTab === 'tickets' && (
            <>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                <input type="text" placeholder="Search tickets…" value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl focus:border-white/10 text-sm text-white outline-none transition-colors placeholder:text-[#444]"
                />
              </div>

              <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Subject</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Status</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Date</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTickets.length === 0 ? (
                      <tr><td colSpan={5} className="py-16 text-center text-sm text-[#444]">No tickets</td></tr>
                    ) : paginatedTickets.map((t) => (
                      <tr key={t.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={t.user_name || t.user_email} />
                            <div>
                              <p className="text-sm text-white font-medium">{t.user_name}</p>
                              <p className="text-xs text-[#444] mt-0.5">{t.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-white">{t.subject}</p>
                          <p className="text-xs text-[#444] mt-0.5">#{t.ticket_number}</p>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                        <td className="px-5 py-4 text-xs text-[#555]">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/tickets/${t.ticket_number}`}>
                              <button className="p-2 rounded-lg hover:bg-white/[0.06] text-[#555] hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                            </Link>
                            <button onClick={() => deleteTicket(t.ticket_number)} className="p-2 rounded-lg hover:bg-red-500/10 text-[#555] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalTicketPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
                    <span className="text-xs text-[#555]">{filteredTickets.length} results</span>
                    <div className="flex gap-1">
                      {Array.from({ length: totalTicketPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setTicketsPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === ticketsPage ? 'bg-white/10 text-white' : 'text-[#555] hover:text-white hover:bg-white/[0.04]'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Scripts ───────────────────────────────────────────────── */}
          {activeTab === 'scripts' && (
            <>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                <input type="text" placeholder="Search scripts…" value={scriptSearch} onChange={(e) => { setScriptSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl focus:border-white/10 text-sm text-white outline-none transition-colors placeholder:text-[#444]"
                />
              </div>

              {(() => {
                const filtered    = scripts.filter(s => s.name.toLowerCase().includes(scriptSearch.toLowerCase()));
                const totalPages  = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
                const page        = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
                return (
                  <>
                    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Script</th>
                            <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Type</th>
                            <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Status</th>
                            <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wide">Updated</th>
                            <th className="px-5 py-3.5" />
                          </tr>
                        </thead>
                        <tbody>
                          {page.length === 0 ? (
                            <tr><td colSpan={5} className="py-16 text-center text-sm text-[#444]">No scripts</td></tr>
                          ) : page.map((script: any) => (
                            <tr key={script.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
                                    <FileCode className="w-4 h-4 text-[#555]" />
                                  </div>
                                  <p className="text-sm text-white font-medium">{script.name}</p>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${
                                  script.type === 'Premium' ? 'bg-violet-500/15 text-violet-300 ring-violet-500/30' : 'bg-blue-500/15 text-blue-300 ring-blue-500/30'
                                }`}>{script.type}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${
                                  script.status === 'Working' ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' : 'bg-red-500/15 text-red-300 ring-red-500/30'
                                }`}>{script.status}</span>
                              </td>
                              <td className="px-5 py-4 text-xs text-[#555]">
                                {metadata[script.name]?.updated_at ? new Date(metadata[script.name].updated_at).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="px-5 py-4">
                                <button onClick={() => setSelectedScript(script)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs text-[#888] hover:text-white ml-auto">
                                  Edit <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-1">
                        <p className="text-xs text-[#444]">
                          {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} scripts
                        </p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg text-xs font-medium transition-colors text-[#555] hover:text-white hover:bg-white/[0.04] disabled:opacity-30">
                            <ChevronLeft className="w-4 h-4 mx-auto" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === currentPage ? 'bg-white/10 text-white' : 'text-[#555] hover:text-white hover:bg-white/[0.04]'}`}>{p}</button>
                          ))}
                          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg text-xs font-medium transition-colors text-[#555] hover:text-white hover:bg-white/[0.04] disabled:opacity-30">
                            <ChevronRight className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}

          {/* ── Settings ──────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="grid lg:grid-cols-2 gap-6">

              <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white">Stock Management</h3>
                  <p className="text-xs text-[#555] mt-1">Available keys per payment method and tier.</p>
                </div>
                <div className="p-6">
                  {stockLoading ? (
                    <div className="flex items-center gap-2 text-sm text-[#555]"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                  ) : (
                    <div className="space-y-5">
                      {PAYMENT_METHODS.map(({ id: mId, label, color }) => (
                        <div key={mId}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                            <p className="text-xs font-semibold text-white uppercase tracking-wide">{label}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['weekly', 'monthly', 'lifetime'] as PremiumTier[]).map((tier) => {
                              const k = `${mId}-${tier}`;
                              const v = methodStock[tier][mId];
                              return (
                                <div key={tier} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-white capitalize">{tier}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${v > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                      {v > 0 ? v : '0'}
                                    </span>
                                  </div>
                                  <input
                                    type="number" min={0}
                                    value={methodDraft[tier][mId]}
                                    onChange={(e) => setMethodDraft(prev => ({ ...prev, [tier]: { ...prev[tier], [mId]: e.target.value } }))}
                                    className="w-full px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-white outline-none focus:border-white/15 transition-colors"
                                  />
                                  <button
                                    onClick={() => saveMethodStock(tier, mId)}
                                    disabled={savingMethodKey === k}
                                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs text-[#888] hover:text-white transition-colors disabled:opacity-40"
                                  >
                                    {savingMethodKey === k ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white">GitHub Configuration</h3>
                  <p className="text-xs text-[#555] mt-1">Raw URL endpoints for game list fetching.</p>
                </div>
                <div className="p-6">
                  {githubLoading ? (
                    <div className="flex items-center gap-2 text-sm text-[#555]"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { key: 'free_url',         label: 'Free Games URL' },
                        { key: 'premium_url',      label: 'Premium Games URL' },
                        { key: 'discontinued_url', label: 'Discontinued Games URL' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">{label}</label>
                          <input
                            type="text"
                            value={(githubConfig as any)[key]}
                            onChange={(e) => setGithubConfig({ ...githubConfig, [key]: e.target.value })}
                            placeholder="https://raw.githubusercontent.com/…"
                            className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl focus:border-white/10 text-sm text-white outline-none transition-colors placeholder:text-[#333]"
                          />
                        </div>
                      ))}
                      <button
                        onClick={saveGitHubConfig}
                        disabled={savingGithub}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 mt-2"
                      >
                        {savingGithub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {savingGithub ? 'Saving…' : 'Save Configuration'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Script edit modal */}
      {selectedScript && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0e0e0e] shadow-2xl">
            <div className="p-6 space-y-5">
              {(() => {
                const idx = scripts.findIndex(s => s.name === selectedScript.name);
                const total = scripts.length;
                const goPrev = () => idx > 0 && setSelectedScript(scripts[idx - 1]);
                const goNext = () => idx < total - 1 && setSelectedScript(scripts[idx + 1]);
                return (
                  <div className="flex items-start justify-between pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedScript.status === 'Working' ? '#10b981' : '#ef4444' }} />
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{selectedScript.name}</h3>
                        <p className="text-xs text-[#555] mt-0.5">Edit script metadata and features</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <span className="text-xs text-[#444] mr-1">{idx + 1}/{total}</span>
                      <button onClick={goPrev} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-20 text-[#555] hover:text-white transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={goNext} disabled={idx === total - 1} className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-20 text-[#555] hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => setSelectedScript(null)} className="p-1.5 rounded-xl hover:bg-white/[0.06] text-[#555] hover:text-white transition-colors ml-1">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })()}
              <div>
                <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wide">Description</label>
                <textarea value={metadata[selectedScript.name]?.description || ''} onChange={(e) => updateMetadata(selectedScript.name, 'description', e.target.value)} placeholder="Enter script description…" rows={4}
                  className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl focus:border-white/10 text-sm text-white outline-none transition-colors placeholder:text-[#333] resize-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Features</label>
                  <button onClick={() => addFeature(selectedScript.name)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs text-[#666] hover:text-white transition-colors">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 mb-3">
                  <label className="block text-xs font-medium text-[#888] mb-2">Bulk Import <span className="text-[#444]">(*, -, or &gt; per line)</span></label>
                  <textarea value={bulkFeatures} onChange={(e) => setBulkFeatures(e.target.value)} rows={3} placeholder="* Auto Farm&#10;- Kill Aura"
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg focus:border-white/10 text-sm text-white outline-none transition-colors placeholder:text-[#333] resize-none mb-2"
                  />
                  <button onClick={() => importBulk(selectedScript.name)} disabled={!bulkFeatures.trim()}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs text-[#666] hover:text-white transition-colors disabled:opacity-30">
                    Import
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(metadata[selectedScript.name]?.features || []).map((f: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input value={f} onChange={(e) => updateFeature(selectedScript.name, i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg focus:border-white/10 text-sm text-white outline-none transition-colors"
                      />
                      <button onClick={() => removeFeature(selectedScript.name, i)} className="p-2 rounded-lg text-[#444] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {!metadata[selectedScript.name]?.features?.length && <p className="text-sm text-[#333] italic">No features yet.</p>}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                <button onClick={() => { saveMetadata(selectedScript.name); setSelectedScript(null); }} disabled={saving === selectedScript.name}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-semibold text-sm rounded-xl transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving === selectedScript.name ? 'Saving…' : 'Save Changes'}
                </button>
                {metadata[selectedScript.name]?.id && (
                  <button onClick={() => { deleteMetadata(selectedScript.name); setSelectedScript(null); }}
                    className="p-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedScript(null)} className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm text-[#666] hover:text-white transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0e0e0e] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white">Message Customer</p>
              <button onClick={() => setIsComposeOpen(false)} className="p-2 rounded-xl hover:bg-white/[0.06] text-[#555] hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleComposeSubmit} className="p-6 space-y-4">
              {['email', 'subject'].map((f) => (
                <div key={f}>
                  <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wide">{f === 'email' ? 'Customer Email' : 'Subject'}</label>
                  <input type={f === 'email' ? 'email' : 'text'} required
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl focus:border-white/10 px-3.5 py-2.5 text-sm text-white outline-none transition-colors"
                    value={(composeData as any)[f]} onChange={(e) => setComposeData({ ...composeData, [f]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wide">Message</label>
                <textarea required rows={5}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl focus:border-white/10 px-3.5 py-2.5 text-sm text-white outline-none transition-colors resize-none"
                  value={composeData.message} onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsComposeOpen(false)} className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm text-[#666] hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isComposing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-semibold text-sm rounded-xl transition-colors disabled:opacity-50">
                  {isComposing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
