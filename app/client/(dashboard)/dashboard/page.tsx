'use client';

import { useEffect, useState } from 'react';
import { useAuth, readDiscordSession } from '@/lib/client/auth';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Crown, ShoppingBag, CreditCard, Clock, CheckCircle, ChevronRight, Download, Star } from 'lucide-react';
import Link from 'next/link';

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
    if (!isLoading && !isAuthenticated) {
        router.push('/client/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && email) {
        fetchDashboardData();
    }
  }, [isAuthenticated, email]);

  const fetchDashboardData = async () => {
    try {
        const res = await fetch(`/api/client/data?email=${encodeURIComponent(email!)}`);
        const json = await res.json();
        if (json.success) {
            setData(json.data);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setFetching(false);
    }
  };

  const greeting = discordTag ?? (email?.startsWith('discord:') ? 'there' : email?.split('@')[0] ?? 'there');

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Good morning, <span className="text-white">{greeting}</span></h1>
            <p className="text-gray-400">Here's a summary of your account and recent activity.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Key Stats */}
        <div className="space-y-6">
            <StatsCard 
                title="Total Orders" 
                value={data?.stats?.totalOrders || '0'} 
                subtext="All time orders"
                icon={ShoppingBag}
            />
            <StatsCard 
                title="Total Reviews" 
                value="1" // Placeholder or fetch if available
                subtext="Reviews given"
                icon={Star}
                highlightIcon
            />
        </div>

        {/* Right Column - Balance & Info & Recent Orders */}
        <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#0f0f0f] border border-[#1f1f1f] p-8 relative overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 relative z-10">
                    <div>
                        <h3 className="text-gray-400 font-medium mb-2">Total Expenses</h3>
                        <p className="text-4xl font-bold accent-text mb-1">${data?.stats?.totalSpent || '0.00'}</p>
                        <p className="text-sm text-gray-500">Lifetime Spend</p>
                        
                        <div className="mt-8">
                             <h3 className="text-gray-400 font-medium mb-2">Active</h3>
                             <p className="text-sm text-gray-500">Account Status</p>
                             <h4 className="text-xl font-bold text-pink-500 mt-1">Active</h4>
                        </div>
                    </div>
                    
                    <div>
                        <div className="mb-0 md:text-right">
                             <h3 className="text-gray-400 font-medium mb-2">{data?.stats?.totalOrders || '0'}</h3>
                             <p className="text-sm text-gray-500">Paid Orders</p>
                        </div>

                         <div className="mt-8 md:text-right">
                             <h3 className="text-gray-400 font-medium mb-2">Premium</h3>
                             <p className="text-sm text-gray-500">Account Type</p>
                             <h4 className="text-xl font-bold text-white mt-1">Premium</h4>
                        </div>
                    </div>
                </div>
                
                 {/* Decorative Icon */}
                 <div className="absolute top-4 right-4 p-4 opacity-5">
                    <CreditCard className="w-32 h-32 accent-text" />
                 </div>
            </Card>

            {/* Recent Orders (Moved to Right Column) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                    <Link href="/client/orders" className="text-sm accent-text flex items-center gap-1">
                        View All Orders <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <Card className="bg-[#0f0f0f] border border-[#1f1f1f] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#141414] text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Package</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1f1f1f]">
                                {fetching ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center">Loading orders...</td></tr>
                                ) : data?.orders?.length > 0 ? (
                                    data.orders.slice(0, 5).map((order: any) => (
                                        <tr key={order.transaction_id} className="hover:bg-[#141414] transition-colors">
                                            <td className="px-6 py-4 text-white capitalize">{order.tier} Plan</td>
                                            <td className="px-6 py-4 accent-text font-bold">${order.amount}</td>
                                            <td className="px-6 py-4">
                                                <span className="accent-bg accent-text px-2 py-1 rounded text-xs font-semibold accent-border border">
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/client/orders/${order.transaction_id}`} className="text-gray-400 hover-accent font-medium">
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No orders found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, subtext, icon: Icon, highlightIcon }: any) {
    return (
        <Card className="bg-[#0f0f0f] border border-[#1f1f1f] p-5 relative overflow-hidden group hover-accent-border transition-all">
            <div className="flex justify-between items-start">
                <div>
                     <h3 className="text-white font-bold mb-1">{title}</h3>
                     <p className="text-gray-500 text-xs mb-4">{subtext}</p>
                     <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${highlightIcon ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </Card>
    )
}
