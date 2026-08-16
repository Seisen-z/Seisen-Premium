'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  Lock,
  Code,
  Key,
  Crown,
  Handshake,
  HelpCircle,
  Youtube,
  Headset,
  Zap,
  Menu,
  X,
  Newspaper,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/obfuscator', icon: Lock, label: 'Obfuscator' },
  { href: '/scripts', icon: Code, label: 'Scripts' },
  { href: '/getkey', icon: Key, label: 'Get Key' },
  { href: '/premium', icon: Crown, label: 'Premium' },

  { href: '/updates', icon: Newspaper, label: 'Updates' },
  { href: '/faq', icon: HelpCircle, label: 'FAQ' },
  { href: 'https://discord.gg/F4sAf6z8Ph', icon: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
    </svg>
  ), label: 'Discord', external: true },
  { href: '/videos', icon: Youtube, label: 'Videos' },

];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[2001] p-2 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] text-gray-400 hover-accent hover-accent-border transition-all md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[1999] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen w-[60px] bg-[#141414] border-r border-[#1f1f1f] z-[2000] flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center h-full py-6">
          {/* Logo */}
          <Link
            href="/"
            className="accent-text hover:scale-110 transition-transform mb-auto"
            onClick={() => setIsOpen(false)}
          >
            <Logo className="w-8 h-8" />
          </Link>

          {/* Navigation Links */}
          <div className="flex flex-col items-center gap-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isExternal = item.external;

              const linkClass = `group relative flex items-center justify-center w-8 h-8 rounded-md transition-all ${
                isActive
                  ? 'accent-text accent-bg border accent-border'
                  : 'text-gray-500 hover-accent'
              }`;

              const content = (
                <>
                  <Icon className="w-[18px] h-[18px]" />
                  {/* Tooltip */}
                  <span className="absolute left-[65px] px-3 py-1.5 bg-[#1a1a1a] text-white text-sm rounded-md border border-[#1f1f1f] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                    {item.label}
                  </span>
                </>
              );

              if (isExternal) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={linkClass}
                  onClick={() => setIsOpen(false)}
                >
                  {content}
                </Link>
              );
            })}
          </div>

          {/* Client Area Profile Icon (Bottom) */}
          <div className="mt-auto mb-4">
             <Link
                href="/client/dashboard"
                className={`group relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                   pathname.startsWith('/client') 
                   ? 'accent-bg accent-text border accent-border' 
                   : 'bg-[#1a1a1a] text-gray-400 hover-accent hover-accent-border border border-[#1f1f1f]'
                }`}
                onClick={() => setIsOpen(false)}
             >
                <div className="w-5 h-5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                {/* Tooltip */}
                <span className="absolute left-[65px] px-3 py-1.5 bg-[#1a1a1a] text-white text-sm rounded-md border border-[#1f1f1f] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                    Client Area
                </span>
             </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
