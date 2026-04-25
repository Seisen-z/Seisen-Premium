'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, FileCode, Headset, LogOut } from 'lucide-react';
import { useAuth, readDiscordSession, DiscordSession } from '@/lib/client/auth';

export default function ClientHeader() {
  const pathname = usePathname();
  const { email, logout } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);
  const [discord, setDiscord] = useState<DiscordSession | null>(null);

  // Read Discord session for avatar display
  useEffect(() => {
    setDiscord(readDiscordSession());
  }, []);

  useEffect(() => {
    if (email) {
      fetch(`/api/tickets?email=${email}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.tickets) {
            setHasUnread(d.tickets.some((t: any) => t.status === 'replied'));
          }
        })
        .catch(console.error);
    }
  }, [email, pathname]);

  const navItems = [
    { href: '/client/dashboard', label: 'Home',    icon: LayoutDashboard },
    { href: '/client/orders',    label: 'Orders',  icon: ShoppingBag },
    { href: '/client/downloads', label: 'Script',  icon: FileCode },
    { href: '/client/support',   label: 'Support', icon: Headset },
  ];

  // Display name: Discord tag > email prefix > raw email
  const displayName = discord?.tag
    ?? (email?.includes('@') ? email.split('@')[0] : email)
    ?? 'User';

  return (
    <header className="w-full bg-[#0a0a0a] border-b border-[#1f1f1f] px-8 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                {item.label === 'Support' && hasUnread && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'accent-text' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="flex items-center gap-3">
          {/* Discord badge (if connected) */}
          {discord ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={discord.avatar}
                  alt={discord.tag}
                  className="w-7 h-7 rounded-full ring-2 ring-[#5865F2]/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
              </div>
              <span className="text-sm text-white font-medium hidden sm:block truncate max-w-[120px]">
                {discord.tag}
              </span>
            </div>
          ) : (
            email && (
              <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[140px]">
                {displayName}
              </span>
            )
          )}

          {/* Sign Out */}
          <button
            onClick={logout}
            className="text-gray-500 hover:text-red-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
