'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, FileCode, Headset, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/client/auth'; // For logout

export default function ClientHeader() {
  const pathname = usePathname();
  const { email, logout } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

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
  }, [email, pathname]); // Re-fetch on navigation
  
  const navItems = [
    { href: '/client/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/client/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/client/downloads', label: 'Script', icon: FileCode },
    { href: '/client/support', label: 'Support', icon: Headset },
  ];

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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'accent-text' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout / User Actions */}
        <button 
            onClick={logout}
            className="text-gray-500 hover:text-red-400 text-xs font-medium flex items-center gap-2 transition-colors"
        >
            <LogOut className="w-3 h-3" />
            Sign Out
        </button>
      </div>
    </header>
  );
}
