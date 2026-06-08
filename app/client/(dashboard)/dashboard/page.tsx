'use client';

import { useEffect, useState } from 'react';
import { useAuth, readDiscordSession } from '@/lib/client/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, DollarSign, Crown, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { email, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [discordTag, setDiscordTag] = useState<string | null>(null);

  useEffect(() => {
    const ds = readDiscordSession();
    if (ds) setDiscordTag(ds.tag);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/client/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && email) {
      fetch(`/api/client/data?email=${encodeURIComponent(email!)}`)
        .then(r => r.json())
        .then(json => { if (json.success) setData(json.data); })
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [isAuthenticated, email]);

  const greeting = discordTag ?? (email?.startsWith('discord:') ? 'there' : email?.split('@')[0] ?? 'there');

  if (isLoading || !isAuthenticated) return null;

  const totalOrders  = data?.stats?.totalOrders ?? 0;
  const totalSpent   = data?.stats?.totalSpent ?? '0.00';
  const recentOrders = data?.orders?.slice(0, 5) ?? [];

  const STATUS_COLORS: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/10 text-[var(--accent)] border-emerald-500/20',
    paid:       'bg-emerald-500/10 text-[var(--accent)] border-emerald-500/20',
    PENDING:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    FAILED:     'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hello, <span className="text-[var(--accent)]">{greeting}</span>
        </h1>
        <p className="text-sm text-[#555] mt-1">Account overview and recent activity.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Total Orders"  value={String(totalOrders)} icon={ShoppingBag} />
        <StatBlock label="Total Spent"   value={`$${totalSpent}`}    icon={DollarSign} accent />
        <StatBlock label="Account Type"  value="Premium"             icon={Crown} />
        <StatBlock label="Status"        value="Active"              icon={Activity} green />
      </div>

      {/* Recent orders */}
      <div className="bg-[#0e0e0e] rounded-xl border border-[#1a1a1a] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
          <Link
            href="/client/orders"
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Package</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[#555]">Status</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[#555]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131313]">
            {fetching ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#444]">Loading…</td>
              </tr>
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <tr key={order.transaction_id} className="hover:bg-[#111] transition-colors">
                  <td className="px-5 py-3.5 text-white font-medium capitalize">{order.tier} Plan</td>
                  <td className="px-5 py-3.5 text-[var(--accent)] font-bold">${order.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.payment_status] || 'bg-[#1a1a1a] text-[#888] border-[#222]'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/client/orders/${order.transaction_id}`}
                      className="text-xs text-[#555] hover:text-white transition-colors"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#444]">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function StatBlock({
  label, value, icon: Icon, accent, green,
}: {
  label: string;
  value: string;
  icon?: any;
  accent?: boolean;
  green?: boolean;
}) {
  return (
    <div className="bg-[#0e0e0e] rounded-xl border border-[#1a1a1a] px-5 py-5">
      <p className="text-xs text-[#555] mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-[var(--accent)]' : green ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
      {Icon && <Icon className="w-3.5 h-3.5 text-[#2a2a2a] mt-2" />}
    </div>
  );
}
