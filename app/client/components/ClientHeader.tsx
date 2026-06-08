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

  const displayName = discord?.tag
    ?? (email?.includes('@') ? email.split('@')[0] : email)
    ?? 'User';

  return (
    <header className="w-full border-b border-[#1a1a1a] bg-[#0a0a0a] sticky top-14 z-30">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

        {/* Brand */}
        <Link href="/client/dashboard" className="text-sm font-bold text-white tracking-widest mr-8 shrink-0">
          SEISEN
        </Link>

        {/* Nav */}
        <nav className="flex items-center flex-1 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white'
                    : 'text-[#555] hover:text-[#999] hover:bg-[#111]'
                }`}
              >
                {item.label === 'Support' && hasUnread && (
                  <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]" />
                  </span>
                )}
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {discord ? (
            <div className="flex items-center gap-2">
              <img
                src={discord.avatar}
                alt={discord.tag}
                className="w-6 h-6 rounded-full ring-1 ring-[#2a2a2a]"
              />
              <span className="text-xs text-[#666] hidden sm:block truncate max-w-[120px]">
                {discord.tag}
              </span>
            </div>
          ) : (
            email && (
              <span className="text-xs text-[#555] hidden sm:block truncate max-w-[140px]">
                {displayName}
              </span>
            )
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-[#444] hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
