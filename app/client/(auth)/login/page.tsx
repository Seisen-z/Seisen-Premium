'use client';

import { useState, useEffect } from 'react';
import { useAuth, readDiscordSession } from '@/lib/client/auth';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push('/client/dashboard');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const ds = readDiscordSession();
    if (ds) {
      const identifier = ds.email || `discord:${ds.id}`;
      localStorage.setItem('client_email', identifier);
      localStorage.setItem('client_auth', 'true');
      router.push('/client/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email);
    setLoading(false);
    if (res.success) router.push('/client/verify');
    else setError(res.error || 'Failed to send code');
  };

  if (isLoading) return null;

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Client Portal</h1>
          <p className="text-sm text-[#555] mt-1">Sign in to access your orders and scripts.</p>
        </div>

        <div className="bg-[#0e0e0e] rounded-2xl border border-[#1a1a1a] p-6 space-y-4">

          <a href="/api/auth/discord?return=/client/login" className="block">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 text-white text-sm font-medium transition-colors"
            >
              <DiscordIcon />
              Continue with Discord
            </button>
          </a>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-xs text-[#444]">or</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#888] mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full bg-[#111] border border-[#222] rounded-xl focus:border-[#333] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[#333]"
              />
              <p className="text-xs text-[#444] mt-1.5">We'll send a one-time code to this address.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-semibold py-2.5 text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

        </div>

        <p className="mt-6 text-xs text-[#333] text-center">© 2026 Seisen Hub. All rights reserved.</p>
      </div>
    </div>
  );
}
