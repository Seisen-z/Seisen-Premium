'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Home,
  Lock,
  Code,
  Key,
  Crown,
  HelpCircle,
  Youtube,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/obfuscator', icon: Lock, label: 'Obfuscator' },
  { href: '/scripts', icon: Code, label: 'Scripts' },
  { href: '/getkey', icon: Key, label: 'Get Key' },
  { href: '/premium', icon: Crown, label: 'Premium' },

  { href: '/faq', icon: HelpCircle, label: 'FAQ' },
  { href: 'https://discord.gg/F4sAf6z8Ph', icon: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
    </svg>
  ), label: 'Discord', external: true },
  { href: '/videos', icon: Youtube, label: 'Videos' },
];

interface DockIconProps {
  item: typeof navItems[0];
  mouseX: number | null;
  index: number;
}

function DockIcon({ item, mouseX, index }: DockIconProps) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [hoveredLabel, setHoveredLabel] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = pathname === item.href;
  const Icon = item.icon;

  const linkClass = `relative flex items-center justify-center rounded-2xl transition-all duration-200`;
  const linkStyle = isActive
    ? { color: 'var(--accent)', backgroundColor: 'var(--accent)/20', border: '1px solid var(--accent)/30' }
    : { color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)/80', border: '1px solid var(--border)' };

  const content = (
    <div
      ref={ref}
      className="relative flex flex-col items-center"
      onMouseEnter={() => {
        setHoveredLabel(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setHoveredLabel(false);
        setIsHovered(false);
      }}
      style={{
        transform: `scale(${isHovered ? 1.4 : 1})`,
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div className={linkClass} style={{ width: '40px', height: '40px', ...linkStyle }}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Label tooltip */}
      {hoveredLabel && (
        <div className="absolute -top-9 px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap animate-in fade-in zoom-in duration-150" style={{ fontSize: '8px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
          {item.label}
        </div>
      )}
    </div>
  );

  if (item.external) {
    return (
      <a
        key={item.label}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link key={item.label} href={item.href}>
      {content}
    </Link>
  );
}

export default function Dock() {
  const pathname = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Check unread tickets
  useEffect(() => {
    const email = localStorage.getItem('client_email');
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
  }, [pathname]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Burger Menu Button */}
      <div className="fixed top-5 left-5 z-[5000] md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white shadow-xl hover:bg-black/70 transition-all"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[4800] bg-black/60 backdrop-blur-sm md:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[4900] w-24 bg-[#0a0a0a]/95 border-r border-white/10 backdrop-blur-xl md:hidden flex flex-col items-center py-24 space-y-6 overflow-y-auto"
            >
              <div className="flex flex-col items-center gap-4 w-full">
                {/* Logo - kept at top, maybe scaled down slightly if needed, but keeping consistently visible */}
                <div className="mb-4">
                  <Logo className="w-8 h-8 text-[var(--accent)]" />
                </div>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => !item.external && setIsOpen(false)}
                      target={item.external ? "_blank" : undefined}
                      className={`relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:scale-110'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {/* Tooltip on hover/tap-hold */}
                      <div className="absolute left-14 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    </Link>
                  );
                })}

                <div className="w-10 h-px bg-white/10 my-2"></div>

                <Link 
                  href="/client/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                    pathname.startsWith('/client')
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:scale-110'
                  }`}
                >
                  {hasUnread && (
                    <span className="absolute top-2 right-2 flex h-2 w-2 z-10">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <div className="w-5 h-5 flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute left-14 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Client Area
                  </div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none hidden md:block">
        <div
          ref={dockRef}
          className="flex items-end gap-2 px-3 py-2.5 backdrop-blur-xl rounded-3xl pointer-events-auto"
          style={{
            backgroundColor: '#0a0a0aa1', // Higher opacity (90%) but keeping it dark
            border: '1px solid rgba(255, 255, 255, 0.12)', // Slightly brighter border
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.5)', // Stronger shadow for depth
          }}
        >
          {/* Logo */}
          <Link href="/">
            <div className="relative flex flex-col items-center transition-transform duration-200 hover:scale-110">
              <div className="flex items-center justify-center w-10 h-10" style={{ color: 'var(--accent)' }}>
                <Logo className="w-6 h-6" />
              </div>
            </div>
          </Link>

          {/* Divider */}
          <div className="w-px h-10 mx-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Nav Items */}
          {navItems.map((item, index) => (
            <DockIcon key={item.label} item={item} mouseX={null} index={index} />
          ))}

          {/* Divider */}
          <div className="w-px h-10 mx-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Client Area */}
          <Link href="/client/dashboard">
            <div className="relative flex flex-col items-center transition-transform duration-200 hover:scale-110">
              {hasUnread && (
                <span className="absolute top-0 right-0 flex h-2.5 w-2.5 z-10 translate-x-1 -translate-y-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                style={pathname.startsWith('/client')
                  ? { backgroundColor: 'var(--accent)/20', color: 'var(--accent)', border: '2px solid var(--accent)/30' }
                  : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '2px solid var(--border)' }
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
