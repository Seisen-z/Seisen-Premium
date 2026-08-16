'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, CreditCard, MessageSquare, FileCode,
  Package, LogOut, Shield, Search, Loader2, AlertCircle,
  Trash2, Eye, ShieldCheck, Copy, Check, Save, Plus, X,
  ChevronLeft, ChevronRight, ArrowRight, Clock, Send
} from 'lucide-react';
import Link from 'next/link';
import { getApiUrl, copyToClipboard } from '@/lib/utils';
import InsightsOverview from '@/components/admin/InsightsOverview';

interface Payment {
  transaction_id: string; payer_email?: string; roblox_username?: string;
  tier: string; amount: number; currency: string; status: string; created_at: string;
  generated_keys: string | string[];
}
interface Ticket {
  id: string; ticket_number: string; user_name: string; user_email: string;
  subject: string; status: string; created_at: string;
}
interface Stats {
  totalPurchases: number; paypalPurchases: number; robloxPurchases: number;
  paypalRevenue: number; robloxRevenue: number;
}
type PremiumTier   = 'weekly' | 'monthly' | 'lifetime';
type PaymentMethod = 'robux' | 'paypal' | 'gcash' | 'card' | 'local_qr';
type Tab = 'overview' | 'payments' | 'tickets' | 'scripts' | 'store';

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview'  },
  { id: 'payments', icon: CreditCard,      label: 'Payments'  },
  { id: 'tickets',  icon: MessageSquare,   label: 'Tickets'   },
  { id: 'scripts',  icon: FileCode,        label: 'Scripts'   },
  { id: 'store',    icon: Package,         label: 'Store'     },
];

const METHODS: { id: PaymentMethod; label: string; color: string }[] = [
  { id: 'robux',  label: 'Robux',  color: '#fbbf24' },
  { id: 'paypal', label: 'PayPal', color: '#38bdf8' },
  { id: 'gcash',  label: 'GCash',  color: '#34d399' },
  { id: 'card',   label: 'Card',   color: '#a78bfa' },
  { id: 'local_qr', label: 'Wise', color: '#f47fff' },
];
const TIERS: PremiumTier[] = ['weekly', 'monthly', 'lifetime'];
const TIER_COLOR: Record<string, string> = { weekly: '#38bdf8', monthly: '#a78bfa', lifetime: '#34d399' };

function initStock(): Record<PremiumTier, Record<PaymentMethod, number>> {
  return { 
    weekly:{robux:0,paypal:0,gcash:0,card:0,local_qr:0}, 
    monthly:{robux:0,paypal:0,gcash:0,card:0,local_qr:0}, 
    lifetime:{robux:0,paypal:0,gcash:0,card:0,local_qr:0} 
  };
}
function initDraft(): Record<PremiumTier, Record<PaymentMethod, string>> {
  return { 
    weekly:{robux:'0',paypal:'0',gcash:'0',card:'0',local_qr:'0'}, 
    monthly:{robux:'0',paypal:'0',gcash:'0',card:'0',local_qr:'0'}, 
    lifetime:{robux:'0',paypal:'0',gcash:'0',card:'0',local_qr:'0'} 
  };
}

function Av({ name, size = 34 }: { name: string; size?: number }) {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div className="rounded-lg flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: 12, background: `hsl(${hue},38%,12%)`, color: `hsl(${hue},55%,62%)`, border: `1px solid hsl(${hue},30%,18%)` }}>
      {(name.replace(/[^a-zA-Z0-9]/, '').slice(0, 2) || '??').toUpperCase()}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false);
  const [pw, setPw]           = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [tab, setTab]         = useState<Tab>('overview');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [stats,    setStats]    = useState<Stats>({ totalPurchases:0,paypalPurchases:0,robloxPurchases:0,paypalRevenue:0,robloxRevenue:0 });

  const [paySearch,    setPaySearch]    = useState('');
  const [tkSearch,     setTkSearch]     = useState('');
  const [scriptSearch, setScriptSearch] = useState('');
  const [copiedKey,    setCopiedKey]    = useState<string|null>(null);
  const [payPage,      setPayPage]      = useState(1);
  const [tkPage,       setTkPage]       = useState(1);
  const [scrPage,      setScrPage]      = useState(1);

  const [scripts,    setScripts]   = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [metadata,   setMeta]      = useState<Record<string,any>>({});
  const [saving,     setSaving]    = useState<string|null>(null);
  const [selScript,  setSelScript] = useState<any|null>(null);
  const [bulk,       setBulk]      = useState('');

  const [stock,     setStock]     = useState(initStock());
  const [draft,     setDraft]     = useState(initDraft());
  const [savingStock, setSavingStock] = useState(false);
  const [stockLoad, setStockLoad] = useState(false);
  const [ghConfig,  setGhConfig]  = useState({ free_url:'', premium_url:'', discontinued_url:'' });
  const [savingGh,  setSavingGh]  = useState(false);
  const [ghLoad,    setGhLoad]    = useState(false);

  const [compose,   setCompose]   = useState(false);
  const [compData,  setCompData]  = useState({ email:'', subject:'', message:'' });
  const [composing, setComposing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const PER = 10; const SPER = 9;

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  useEffect(() => {
    const tok = localStorage.getItem('adminToken');
    if (tok) { setAuthed(true); fetchAll(tok); }
  }, []);

  const fetchAll = async (tok: string) => {
    try {
      setLoading(true);
      const pr = await fetch(`${getApiUrl()}/api/admin/payments`, { headers: { Authorization: `Bearer ${tok}` } });
      if (pr.status === 401) { logout(); return; }
      const pd = await pr.json();
      if (pd.success) { setPayments(pd.payments); setStats(pd.stats); }
      const tr = await fetch(`${getApiUrl()}/api/admin/tickets`, { headers: { Authorization: `Bearer ${tok}` } });
      const td = await tr.json();
      if (td.success) setTickets(td.tickets);
      await loadStock(tok);
    } catch { setErr('Failed to load data'); }
    finally { setLoading(false); }
  };

  const loadStock = async (tok: string) => {
    setStockLoad(true);
    try {
      const r = await fetch(`${getApiUrl()}/api/admin/premium-stock?scope=paymentMethod`, { headers: { Authorization: `Bearer ${tok}` } });
      if (r.ok) {
        const ms = (await r.json())?.methodStocks || {};
        const s = initStock(); const d = initDraft();
        for (const t of TIERS) for (const m of ['robux','paypal','gcash','card','local_qr'] as PaymentMethod[]) { const v = Number(ms[t]?.[m] || 0); s[t][m] = v; d[t][m] = String(v); }
        setStock(s); setDraft(d);
      }
    } finally { setStockLoad(false); }
  };

  const loadGh = async () => {
    setGhLoad(true);
    try {
      const r = await fetch(`${getApiUrl()}/api/admin/github-config`);
      if (r.ok) { const c = await r.json(); setGhConfig({ free_url: c.free_url || '', premium_url: c.premium_url || '', discontinued_url: c.discontinued_url || '' }); }
    } finally { setGhLoad(false); }
  };

  const saveGh = async () => {
    setSavingGh(true);
    try {
      const tok = localStorage.getItem('adminToken');
      const r = await fetch(`${getApiUrl()}/api/admin/github-config`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify(ghConfig) });
      if (!r.ok) throw new Error();
      setGhConfig(await r.json());
      showToast('GitHub configuration saved!');
    } catch {
      showToast('Failed to save configuration', 'error');
    } finally {
      setSavingGh(false);
    }
  };

  const saveAllStock = async () => {
    const tok = localStorage.getItem('adminToken');
    const updates: Record<string, Record<string, number>> = {};
    
    for (const t of TIERS) {
      updates[t] = {};
      for (const m of ['robux','paypal','gcash','card','local_qr'] as PaymentMethod[]) {
        const v = Number(draft[t][m]);
        if (!Number.isInteger(v) || v < 0) {
          showToast('Non-negative integers only', 'error');
          return;
        }
        updates[t][m] = v;
      }
    }

    setSavingStock(true);
    try {
      const r = await fetch(`${getApiUrl()}/api/admin/premium-stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok}`
        },
        body: JSON.stringify({ updates })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Failed to save');
      const ms = data.methodStocks || {};
      const s = initStock();
      const d = initDraft();
      for (const t of TIERS) {
        for (const m of ['robux','paypal','gcash','card','local_qr'] as PaymentMethod[]) {
          const val = Number(ms[t]?.[m] || 0);
          s[t][m] = val;
          d[t][m] = String(val);
        }
      }
      setStock(s);
      setDraft(d);
      showToast('All stocks saved successfully!');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save stocks', 'error');
    } finally {
      setSavingStock(false);
    }
  };

  const loadScripts = async () => {
    try {
      setScripts(await (await fetch('/api/scripts')).json());
      const md = await (await fetch('/api/admin/script-metadata')).json();
      const map: Record<string, any> = {};
      md.forEach((i: any) => { map[i.script_name] = i; });
      setMeta(map);
    } catch {}
  };

  useEffect(() => {
    const ids = scripts.map((s: any) => s.universeId).filter(Boolean) as string[];
    if (ids.length === 0) return;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
    chunks.forEach(async chunk => {
      try {
        const res  = await fetch(`/api/proxy/thumbnails?universeIds=${chunk.join(',')}`);
        const data = await res.json();
        if (data.data) {
          setThumbnails(prev => {
            const next = { ...prev };
            data.data.forEach((item: any) => { next[item.targetId] = item.imageUrl; });
            return next;
          });
        }
      } catch { /* silent */ }
    });
  }, [scripts]);

  useEffect(() => {
    if (tab === 'scripts' && scripts.length === 0) loadScripts();
    if (tab === 'store' && !ghConfig.free_url) loadGh();
  }, [tab]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const d = await (await fetch(`${getApiUrl()}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })).json();
      if (d.success) { localStorage.setItem('adminToken', d.token); setAuthed(true); fetchAll(d.token); }
      else setErr(d.error || 'Invalid password');
    } catch { setErr('Login failed'); } finally { setLoading(false); }
  };

  const logout = () => { localStorage.removeItem('adminToken'); setAuthed(false); setPw(''); setPayments([]); };

  const copy = async (text: string) => { if (await copyToClipboard(text)) { setCopiedKey(text); setTimeout(() => setCopiedKey(null), 2000); } };

  const delPayment = async (id: string) => {
    if (!confirm('Delete this payment?')) return;
    const tok = localStorage.getItem('adminToken');
    const r = await fetch('/api/admin/payments', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ transactionId: id }) });
    if (r.ok) { setPayments(p => p.filter(x => x.transaction_id !== id)); showToast('Payment deleted successfully.'); } else { showToast('Failed to delete payment.', 'error'); }
  };

  const delTicket = async (num: string) => {
    if (!confirm('Delete this ticket?')) return;
    const tok = localStorage.getItem('adminToken');
    const r = await fetch('/api/admin/tickets', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ ticketNumber: num }) });
    if (r.ok) { setTickets(p => p.filter(x => x.ticket_number !== num)); showToast('Ticket closed successfully.'); } else { showToast('Failed to close ticket.', 'error'); }
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault(); setComposing(true);
    try {
      const { ticket } = await (await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: compData.email, subject: compData.subject, category: 'other', message: compData.message }) })).json();
      const tok = localStorage.getItem('adminToken');
      await fetch(`/api/admin/tickets/${ticket.ticketNumber}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ status: 'replied' }) });
      setTickets(p => [{ id: ticket.id, ticket_number: ticket.ticketNumber, user_name: compData.email.split('@')[0], user_email: compData.email, subject: compData.subject, status: 'replied', created_at: new Date().toISOString() }, ...p]);
      setCompose(false); setCompData({ email: '', subject: '', message: '' });
    } catch { showToast('Failed to reply/compose ticket.', 'error'); } finally { setComposing(false); }
  };

  const saveMeta = async (name: string) => {
    setSaving(name);
    try {
      const data = metadata[name]; if (!data) return;
      const tok = localStorage.getItem('adminToken');
      const r = await fetch('/api/admin/script-metadata', { method: data.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error();
      const saved = await r.json();
      setMeta(p => ({ ...p, [name]: saved })); showToast('Script metadata saved!');
    } catch { showToast('Failed to save script metadata', 'error'); } finally { setSaving(null); }
  };

  const delMeta = async (name: string) => {
    if (!confirm(`Delete metadata for ${name}?`)) return;
    const data = metadata[name]; if (!data?.id) return;
    const tok = localStorage.getItem('adminToken');
    const r = await fetch(`/api/admin/script-metadata?id=${data.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok}` } });
    if (r.ok) { setMeta(p => { const n = { ...p }; delete n[name]; return n; }); showToast('Script metadata deleted.'); } else { showToast('Failed to delete script metadata.', 'error'); }
  };

  const updMeta = (name: string, field: string, val: any) => setMeta(p => ({ ...p, [name]: { ...p[name], script_name: name, [field]: val } }));
  const addFeat  = (s: string) => updMeta(s, 'features', [...(metadata[s]?.features || []), '']);
  const updFeat  = (s: string, i: number, v: string) => { const f = [...(metadata[s]?.features || [])]; f[i] = v; updMeta(s, 'features', f); };
  const remFeat  = (s: string, i: number) => updMeta(s, 'features', (metadata[s]?.features || []).filter((_: any, x: number) => x !== i));
  const impBulk  = (name: string) => {
    const feats = bulk.split('\n').map(l => l.replace(/^[\*\-\>]\s*/, '').trim()).filter(Boolean);
    if (!feats.length) { showToast('No features found', 'error'); return; }
    updMeta(name, 'features', [...(metadata[name]?.features || []), ...feats]);
    setBulk(''); showToast(`Imported ${feats.length} features successfully!`);
  };

  const getKey = (p: Payment) => {
    try {
      if (Array.isArray(p.generated_keys) && p.generated_keys.length > 0) return p.generated_keys[0];
      if (typeof p.generated_keys === 'string') return p.generated_keys.startsWith('[') ? JSON.parse(p.generated_keys)[0] ?? 'N/A' : p.generated_keys;
    } catch {}
    return 'N/A';
  };

  const filtPay  = payments.filter(p => { const s = paySearch.toLowerCase(); return [p.payer_email, p.roblox_username, p.transaction_id, p.tier].some(v => (v || '').toLowerCase().includes(s)); });
  const filtTk   = tickets.filter(t  => { const s = tkSearch.toLowerCase();  return [t.user_email, t.user_name, t.ticket_number, t.subject].some(v => (v || '').toLowerCase().includes(s)); });
  const filtScr  = scripts.filter(s  => s.name.toLowerCase().includes(scriptSearch.toLowerCase()));
  const payPages = Math.max(1, Math.ceil(filtPay.length / PER));
  const tkPages  = Math.max(1, Math.ceil(filtTk.length / PER));
  const scrPages = Math.max(1, Math.ceil(filtScr.length / SPER));
  const pagPay   = filtPay.slice((payPage - 1) * PER, payPage * PER);
  const pagTk    = filtTk.slice((tkPage - 1) * PER, tkPage * PER);
  const pagScr   = filtScr.slice((scrPage - 1) * SPER, scrPage * SPER);
  useEffect(() => setPayPage(1), [paySearch]);
  useEffect(() => setTkPage(1),  [tkSearch]);
  useEffect(() => setScrPage(1), [scriptSearch]);

  /* ── Login ── */
  if (!authed) {
    return (
      <div className="min-h-[88vh] flex items-center justify-center">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
              style={{ background: 'rgba(var(--accent-rgb,200,255,100),0.08)', border: '1px solid rgba(var(--accent-rgb,200,255,100),0.18)' }}>
              <Shield className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <h1 className="text-xl font-black text-white">Admin</h1>
            <p className="text-sm text-neutral-600 mt-1">Restricted access</p>
          </div>
          <form onSubmit={login} className="space-y-3">
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password"
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: '#101010', border: '1px solid #1e1e1e' }} autoFocus />
            {err && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-black transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="min-h-screen" style={{ background: '#060606' }}>

      {/* ── Sticky horizontal tab bar ── */}
      <div className="sticky top-14 z-30" style={{ background: '#080808', borderBottom: '1px solid #141414' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-12">
          {/* Tabs */}
          <div className="flex items-center gap-0.5">
            {TABS.map(({ id, icon: Icon, label }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{ color: active ? '#fff' : '#383838', background: active ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: active ? 'var(--accent)' : undefined }} />
                  {label}
                  {id === 'tickets' && openCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-px rounded tabular-nums"
                      style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}>
                      {openCount}
                    </span>
                  )}
                  {active && <span className="absolute bottom-0 left-3 right-3 h-px rounded-full" style={{ background: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
          {/* Sign out */}
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ color: '#2a2a2a' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#2a2a2a'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Overview */}
        {tab === 'overview' && <InsightsOverview payments={payments} />}

        {/* Payments */}
        {tab === 'payments' && (() => {
          const isR = (p: Payment) => p.currency === 'ROBUX';
          return (
            <>
              {/* Stat strip */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { l: 'Total orders',   v: stats.totalPurchases,                                              c: '#6b7280' },
                  { l: 'PayPal revenue', v: `$${stats.paypalRevenue.toFixed(2)}`,                              c: '#38bdf8' },
                  { l: 'Robux earned',   v: `${stats.robloxRevenue.toLocaleString()} R$`,                      c: '#fbbf24' },
                  { l: 'Unique buyers',  v: new Set(payments.map(p => p.payer_email || p.roblox_username)).size, c: '#a78bfa' },
                ].map(s => (
                  <div key={s.l} className="rounded-xl px-5 py-4" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#282828' }}>{s.l}</p>
                    <p className="text-2xl font-black tabular-nums" style={{ color: s.c }}>
                      {typeof s.v === 'number' ? s.v.toLocaleString() : s.v}
                    </p>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#252525' }} />
                  <input placeholder="Search by email, username, ID…" value={paySearch} onChange={e => setPaySearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }} />
                </div>
                <span className="text-[12px] tabular-nums" style={{ color: '#252525' }}>{filtPay.length} results</span>
              </div>

              {/* Table */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #141414' }}>
                <table className="w-full">
                  <thead style={{ background: '#0a0a0a', borderBottom: '1px solid #141414' }}>
                    <tr>{['Customer', 'Tier', 'Amount', 'Date', 'Key', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#252525' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody style={{ background: '#080808' }}>
                    {loading && <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" style={{ color: '#222' }} /></td></tr>}
                    {!loading && pagPay.length === 0 && <tr><td colSpan={6} className="py-16 text-center text-sm" style={{ color: '#222' }}>No transactions.</td></tr>}
                    {!loading && pagPay.map(p => {
                      const key = getKey(p); const name = p.payer_email || p.roblox_username || 'Unknown';
                      const tc = TIER_COLOR[p.tier] || '#555'; const rc = isR(p);
                      return (
                        <tr key={p.transaction_id} className="group" style={{ borderTop: '1px solid #0f0f0f' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0c0c0c'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Av name={name} />
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-white truncate max-w-[150px]">{name}</p>
                                <p className="text-[10px] font-mono mt-0.5" style={{ color: '#252525' }}>{p.transaction_id.slice(0, 10)}…</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded capitalize"
                              style={{ background: `${tc}12`, color: tc, border: `1px solid ${tc}25` }}>{p.tier}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[14px] font-black tabular-nums" style={{ color: rc ? '#fbbf24' : '#38bdf8' }}>
                              {rc ? `${p.amount} R$` : `$${p.amount}`}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[12px] tabular-nums" style={{ color: '#2e2e2e' }}>
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-1 rounded max-w-[80px] truncate"
                                style={{ background: 'rgba(var(--accent-rgb,200,255,100),0.07)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb,200,255,100),0.12)' }}>
                                {key}
                              </span>
                              <button onClick={() => copy(key)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#2a2a2a' }}>
                                {copiedKey === key ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/success?orderId=${p.transaction_id}&tier=${p.tier}&amount=${p.amount}&currency=${p.currency}&key=${key}&email=${p.payer_email || ''}&payerId=${p.payer_email || ''}&date=${p.created_at}&method=${rc ? 'Robux' : 'PayPal'}&admin=1`} target="_blank">
                                <button className="p-2 rounded-lg" style={{ color: '#252525' }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#888'}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#252525'}>
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                              <Link href={`/admin/evidence/${p.transaction_id}`} target="_blank">
                                <button className="p-2 rounded-lg" style={{ color: '#252525' }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#888'}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#252525'}>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                              <button onClick={() => delPayment(p.transaction_id)} className="p-2 rounded-lg" style={{ color: '#252525' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#252525'}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {payPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3" style={{ background: '#0a0a0a', borderTop: '1px solid #141414' }}>
                    <span className="text-[11px] tabular-nums" style={{ color: '#252525' }}>{filtPay.length} total</span>
                    <div className="flex gap-1">
                      {Array.from({ length: payPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPayPage(p)}
                          className="w-7 h-7 rounded text-[11px] font-medium"
                          style={{ background: p === payPage ? '#1c1c1c' : 'transparent', color: p === payPage ? '#e0e0e0' : '#333', border: '1px solid #181818' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Tickets */}
        {tab === 'tickets' && (() => {
          const stStyle: Record<string, { c: string; bg: string }> = {
            open:    { c: '#fb923c', bg: 'rgba(251,146,60,0.08)'  },
            replied: { c: '#38bdf8', bg: 'rgba(56,189,248,0.08)'  },
            closed:  { c: '#374151', bg: 'rgba(55,65,81,0.06)'    },
          };
          return (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-white">Inbox</h2>
                  <p className="text-[12px] mt-0.5" style={{ color: '#2a2a2a' }}>
                    {openCount} open · {tickets.filter(t => t.status === 'replied').length} replied · {tickets.length} total
                  </p>
                </div>
                <div className="flex-1" />
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#252525' }} />
                  <input placeholder="Search tickets…" value={tkSearch} onChange={e => setTkSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl text-sm text-white outline-none w-52"
                    style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }} />
                </div>
                <button onClick={() => setCompose(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-black transition-opacity hover:opacity-80"
                  style={{ background: 'var(--accent)' }}>
                  <MessageSquare className="w-3.5 h-3.5" /> New message
                </button>
              </div>

              {pagTk.length === 0
                ? <div className="py-24 text-center"><p className="text-sm" style={{ color: '#2a2a2a' }}>{tkSearch ? 'No tickets match.' : 'No tickets yet.'}</p></div>
                : <div className="space-y-2">
                    {pagTk.map(t => {
                      const st = stStyle[t.status] || stStyle.closed;
                      return (
                        <div key={t.id} className="group flex items-center gap-5 px-5 py-4 rounded-xl transition-colors"
                          style={{ background: '#0c0c0c', border: '1px solid #141414' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#141414'}>
                          <div className="w-1 h-10 rounded-full shrink-0" style={{ background: st.c, opacity: 0.7 }} />
                          <Av name={t.user_name || t.user_email} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{t.subject}</p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: '#3a3a3a' }}>
                              {t.user_name && <span style={{ color: '#4a4a4a' }}>{t.user_name} · </span>}{t.user_email}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize shrink-0"
                            style={{ background: st.bg, color: st.c, border: `1px solid ${st.c}20` }}>{t.status}</span>
                          <span className="text-[11px] flex items-center gap-1.5 shrink-0" style={{ color: '#252525' }}>
                            <Clock className="w-3 h-3" />{new Date(t.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/tickets/${t.ticket_number}`}>
                              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                                style={{ background: '#141414', border: '1px solid #1e1e1e', color: '#444' }}>
                                View <ArrowRight className="w-3 h-3" />
                              </button>
                            </Link>
                            <button onClick={() => delTicket(t.ticket_number)} className="p-2 rounded-lg" style={{ color: '#252525' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#252525'}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
              {tkPages > 1 && (
                <div className="flex justify-end gap-1 mt-4">
                  {Array.from({ length: tkPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setTkPage(p)}
                      className="w-7 h-7 rounded text-[11px] font-medium"
                      style={{ background: p === tkPage ? '#1c1c1c' : 'transparent', color: p === tkPage ? '#e0e0e0' : '#333', border: '1px solid #181818' }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Scripts */}
        {tab === 'scripts' && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white">Scripts</h2>
                <p className="text-[12px] mt-0.5" style={{ color: '#2a2a2a' }}>{filtScr.length} scripts</p>
              </div>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#252525' }} />
                <input placeholder="Filter scripts…" value={scriptSearch} onChange={e => setScriptSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl text-sm text-white outline-none w-52"
                  style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }} />
              </div>
            </div>

            {pagScr.length === 0
              ? <div className="py-24 text-center"><p className="text-sm" style={{ color: '#2a2a2a' }}>No scripts found.</p></div>
              : <div className="grid grid-cols-3 gap-4">
                  {pagScr.map((script: any) => {
                    const isPrem = script.type === 'Premium';
                    const isWork = script.status === 'Working';
                    const desc   = metadata[script.name]?.description;
                    const fLen   = metadata[script.name]?.features?.length ?? 0;
                    return (
                      <div key={script.id} className="group rounded-xl p-5 flex flex-col gap-4 transition-all"
                        style={{ background: '#0c0c0c', border: '1px solid #141414' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#222'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#141414'}>
                        <div className="flex items-start justify-between">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                            style={{ background: isPrem ? 'rgba(167,139,250,0.1)' : 'rgba(56,189,248,0.08)', border: `1px solid ${isPrem ? 'rgba(167,139,250,0.2)' : 'rgba(56,189,248,0.15)'}` }}>
                            {script.universeId && thumbnails[script.universeId] ? (
                              <img src={thumbnails[script.universeId]} alt={script.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileCode className="w-4.5 h-4.5" style={{ color: isPrem ? '#a78bfa' : '#38bdf8', width: 18, height: 18 }} />
                            )}
                          </div>
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold"
                            style={{ color: isWork ? '#34d399' : '#ef4444' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isWork ? '#34d399' : '#ef4444' }} />
                            {script.status}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-bold text-white mb-1.5">{script.name}</p>
                          {desc
                            ? <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: '#3a3a3a' }}>{desc}</p>
                            : <p className="text-[12px] italic" style={{ color: '#202020' }}>No description</p>}
                        </div>
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #141414' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                              style={{ background: isPrem ? 'rgba(167,139,250,0.1)' : 'rgba(56,189,248,0.08)', color: isPrem ? '#a78bfa' : '#38bdf8' }}>
                              {script.type}
                            </span>
                            {fLen > 0 && <span className="text-[11px]" style={{ color: '#2a2a2a' }}>{fLen} features</span>}
                          </div>
                          <button onClick={() => setSelScript(script)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: '#141414', border: '1px solid #1e1e1e', color: '#555' }}>
                            Edit <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
            {scrPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-[11px] tabular-nums" style={{ color: '#252525' }}>
                  {(scrPage - 1) * SPER + 1}–{Math.min(scrPage * SPER, filtScr.length)} of {filtScr.length}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setScrPage(p => Math.max(1, p - 1))} disabled={scrPage === 1}
                    className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20"
                    style={{ border: '1px solid #1a1a1a', color: '#444' }}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: scrPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setScrPage(p)}
                      className="w-7 h-7 rounded text-[11px] font-medium"
                      style={{ background: p === scrPage ? '#1c1c1c' : 'transparent', color: p === scrPage ? '#e0e0e0' : '#333', border: '1px solid #1a1a1a' }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setScrPage(p => Math.min(scrPages, p + 1))} disabled={scrPage === scrPages}
                    className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20"
                    style={{ border: '1px solid #1a1a1a', color: '#444' }}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Store */}
        {tab === 'store' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Store</h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#2a2a2a' }}>Key inventory and platform links</p>
            </div>

            {/* Method totals */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {METHODS.map(m => {
                const total = TIERS.reduce((a, t) => a + stock[t][m.id], 0);
                return (
                  <div key={m.id} className="rounded-xl p-4 text-center"
                    style={{ background: '#0d0d0d', border: `1px solid ${m.color}18` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: `${m.color}66` }}>{m.label}</p>
                    <p className="text-2xl font-black tabular-nums" style={{ color: m.color }}>{total}</p>
                  </div>
                );
              })}
              <div className="rounded-xl p-4 text-center" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#282828' }}>Total</p>
                <p className="text-2xl font-black tabular-nums text-white">
                  {METHODS.reduce((a, m) => a + TIERS.reduce((b, t) => b + stock[t][m.id], 0), 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              {/* Matrix */}
              <div className="col-span-2 rounded-xl overflow-hidden" style={{ border: '1px solid #141414' }}>
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: '#0a0a0a', borderBottom: '1px solid #141414' }}>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-white">Stock matrix</p>
                    {stockLoad && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#333' }} />}
                  </div>
                  {TIERS.some(t => (['robux','paypal','gcash','card','local_qr'] as PaymentMethod[]).some(m => draft[t][m] !== String(stock[t][m]))) && (
                    <button onClick={saveAllStock} disabled={savingStock}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                      style={{
                        background: 'var(--accent)',
                        boxShadow: '0 0 10px rgba(184,144,96,0.3)',
                      }}>
                      {savingStock ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save All Changes
                    </button>
                  )}
                </div>
                {stockLoad
                  ? <div className="py-12 flex items-center justify-center" style={{ background: '#080808' }}><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#2a2a2a' }} /></div>
                  : <table className="w-full" style={{ background: '#080808' }}>
                      <thead><tr style={{ borderBottom: '1px solid #111' }}>
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#252525' }}>Method</th>
                        {TIERS.map(t => <th key={t} className="text-center px-5 py-3 text-[10px] font-bold uppercase tracking-widest capitalize" style={{ color: '#252525' }}>{t}</th>)}
                      </tr></thead>
                      <tbody>
                        {METHODS.map(({ id: mId, label, color }) => (
                          <tr key={mId} style={{ borderTop: '1px solid #0f0f0f' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0c0c0c'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                <span className="text-[13px] font-semibold text-white">{label}</span>
                              </div>
                            </td>
                            {TIERS.map(tier => {
                              const live = stock[tier][mId];
                              return (
                                <td key={tier} className="px-4 py-3">
                                  <div className="flex items-center justify-center">
                                    <input type="number" min={0} value={draft[tier][mId]}
                                      onChange={e => setDraft(p => ({ ...p, [tier]: { ...p[tier], [mId]: e.target.value } }))}
                                      className="w-24 px-3 py-2 text-center text-[13px] rounded-lg outline-none font-mono font-bold tabular-nums"
                                      style={{
                                        background: live > 0 ? 'rgba(52,211,153,0.07)' : 'rgba(239,68,68,0.06)',
                                        border: `1px solid ${live > 0 ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.18)'}`,
                                        color: live > 0 ? '#34d399' : '#ef4444',
                                      }} />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>

              {/* Platform URLs */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #141414' }}>
                <div className="px-5 py-3.5" style={{ background: '#0a0a0a', borderBottom: '1px solid #141414' }}>
                  <p className="text-[13px] font-bold text-white">Platform URLs</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#252525' }}>GitHub raw endpoints</p>
                </div>
                <div className="p-5 space-y-4" style={{ background: '#080808' }}>
                  {ghLoad
                    ? <div className="flex items-center gap-2 text-[12px]" style={{ color: '#333' }}><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</div>
                    : <>
                        {[{ key: 'free_url', label: 'Free games' }, { key: 'premium_url', label: 'Premium games' }, { key: 'discontinued_url', label: 'Discontinued' }].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#2e2e2e' }}>{label}</label>
                            <input type="text" value={(ghConfig as any)[key]} onChange={e => setGhConfig({ ...ghConfig, [key]: e.target.value })}
                              placeholder="https://raw.githubusercontent.com/…"
                              className="w-full px-3 py-2.5 rounded-lg text-[11px] font-mono outline-none text-white"
                              style={{ background: '#111', border: '1px solid #1e1e1e' }} />
                          </div>
                        ))}
                        <button onClick={saveGh} disabled={savingGh}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-black mt-1 disabled:opacity-50"
                          style={{ background: 'var(--accent)' }}>
                          {savingGh ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {savingGh ? 'Saving…' : 'Save URLs'}
                        </button>
                      </>
                  }
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Script edit modal ── */}
      {selScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: '#0d0d0d', border: '1px solid #222' }}>
            <div className="p-6 space-y-5">
              {(() => {
                const idx = scripts.findIndex(s => s.name === selScript.name);
                return (
                  <div className="flex items-center justify-between pb-5" style={{ borderBottom: '1px solid #181818' }}>
                    <div className="min-w-0">
                      <h3 className="text-[16px] font-black text-white truncate">{selScript.name}</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: '#2e2e2e' }}>{idx + 1} of {scripts.length}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button onClick={() => idx > 0 && setSelScript(scripts[idx - 1])} disabled={idx === 0} className="p-2 rounded-lg disabled:opacity-20" style={{ color: '#333' }}><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => idx < scripts.length - 1 && setSelScript(scripts[idx + 1])} disabled={idx === scripts.length - 1} className="p-2 rounded-lg disabled:opacity-20" style={{ color: '#333' }}><ChevronRight className="w-4 h-4" /></button>
                      <button onClick={() => setSelScript(null)} className="p-2 rounded-lg ml-1" style={{ color: '#333' }}><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })()}
              <div>
                <label className="block text-[11px] font-semibold mb-2" style={{ color: '#3a3a3a' }}>Description</label>
                <textarea value={metadata[selScript.name]?.description || ''} onChange={e => updMeta(selScript.name, 'description', e.target.value)}
                  placeholder="Describe what this script does…" rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#111', border: '1px solid #1e1e1e' }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-semibold" style={{ color: '#3a3a3a' }}>Features</label>
                  <button onClick={() => addFeat(selScript.name)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                    style={{ background: '#141414', border: '1px solid #1e1e1e', color: '#555' }}>
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="p-4 rounded-xl mb-3" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                  <label className="block text-[11px] mb-2" style={{ color: '#2e2e2e' }}>Bulk import (one per line)</label>
                  <textarea value={bulk} onChange={e => setBulk(e.target.value)} rows={3} placeholder="* Auto Farm&#10;- Kill Aura"
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none mb-2"
                    style={{ background: '#111', border: '1px solid #1a1a1a' }} />
                  <button onClick={() => impBulk(selScript.name)} disabled={!bulk.trim()} className="px-3 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-25"
                    style={{ background: '#141414', border: '1px solid #1e1e1e', color: '#555' }}>Import</button>
                </div>
                <div className="space-y-2">
                  {(metadata[selScript.name]?.features || []).map((f: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input value={f} onChange={e => updFeat(selScript.name, i, e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white outline-none"
                        style={{ background: '#111', border: '1px solid #1e1e1e' }} />
                      <button onClick={() => remFeat(selScript.name, i)} className="p-2.5 rounded-lg" style={{ color: '#2a2a2a' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2a2a2a'}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {!metadata[selScript.name]?.features?.length && <p className="text-[12px] italic py-2" style={{ color: '#1e1e1e' }}>No features yet.</p>}
                </div>
              </div>
              <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid #181818' }}>
                <button onClick={() => { saveMeta(selScript.name); setSelScript(null); }} disabled={saving === selScript.name}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}>
                  <Save className="w-4 h-4" />{saving === selScript.name ? 'Saving…' : 'Save changes'}
                </button>
                {metadata[selScript.name]?.id && (
                  <button onClick={() => { delMeta(selScript.name); setSelScript(null); }} className="p-3 rounded-xl"
                    style={{ border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelScript(null)} className="px-5 py-3 rounded-xl text-sm"
                  style={{ background: '#141414', border: '1px solid #1e1e1e', color: '#555' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Compose modal ── */}
      {compose && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: '#0d0d0d', border: '1px solid #222' }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #181818' }}>
              <p className="text-[15px] font-black text-white">New message</p>
              <button onClick={() => setCompose(false)} className="p-1.5 rounded-lg" style={{ color: '#333' }}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCompose} className="p-6 space-y-4">
              {[{ f: 'email', l: 'Customer email', t: 'email' }, { f: 'subject', l: 'Subject', t: 'text' }].map(({ f, l, t }) => (
                <div key={f}>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#3a3a3a' }}>{l}</label>
                  <input type={t} required className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#111', border: '1px solid #1e1e1e' }}
                    value={(compData as any)[f]} onChange={e => setCompData({ ...compData, [f]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#3a3a3a' }}>Message</label>
                <textarea required rows={4} className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#111', border: '1px solid #1e1e1e' }}
                  value={compData.message} onChange={e => setCompData({ ...compData, message: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCompose(false)} className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: '#141414', border: '1px solid #1e1e1e', color: '#555' }}>Cancel</button>
                <button type="submit" disabled={composing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-black disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}>
                  {composing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
