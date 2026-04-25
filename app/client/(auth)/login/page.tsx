'use client';

import { useState, useEffect } from 'react';
import { useAuth, readDiscordSession } from '@/lib/client/auth';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Mail } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // If already authed (including via Discord cookie), redirect immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/client/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // After Discord OAuth returns to /client/login, the auth context
  // picks up the cookie on mount and redirects above.
  // But if cookie just arrived, check manually:
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
    if (res.success) {
      router.push('/client/verify');
    } else {
      setError(res.error || 'Failed to send code');
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md p-8 bg-[#0f0f0f] border border-[#1f1f1f]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">
            Sign in to view your orders and access support.
          </p>
        </div>

        {/* Discord Login */}
        <a href="/api/auth/discord?return=/client/login" className="block w-full mb-6">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-all duration-200 shadow-lg shadow-[#5865F2]/20 hover:shadow-[#5865F2]/40"
          >
            <DiscordIcon />
            Continue with Discord
          </button>
        </a>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#1f1f1f]" />
          <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">or sign in with email</span>
          <div className="flex-1 h-px bg-[#1f1f1f]" />
        </div>

        {/* Email OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 transition-all placeholder:text-gray-600"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-600">We'll send a one-time code to this address.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full accent-bg hover-accent-bg text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          &copy; 2026 Seisen Hub. All rights reserved.
        </p>
      </Card>
    </div>
  );
}
