'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/client/auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyPage() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const { verify, login, email } = useAuth();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email in context (didn't go through login)
  useEffect(() => {
    if (!email) router.replace('/client/login');
  }, [email, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [email]);

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError('');
    setNotice('');
    const res = await verify(code);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Verification failed');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const fill = (start: number, raw: string) => {
    const incoming = raw.replace(/\D/g, '').slice(0, CODE_LENGTH - start).split('');
    if (incoming.length === 0) return;
    const next = [...digits];
    incoming.forEach((d, i) => { next[start + i] = d; });
    setDigits(next);
    const nextIndex = Math.min(start + incoming.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Enter all 6 digits of the code.');
      return;
    }
    submit(code);
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError('');
    setNotice('');
    const res = await login(email);
    if (res.success) {
      setNotice('A new code has been sent.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setCooldown(RESEND_COOLDOWN);
    } else {
      setError(res.error || 'Could not send a new code.');
    }
  };

  if (!email) return null;

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-sm text-[#555] mt-1">
            Enter the 6-digit code we sent to{' '}
            <span className="text-[#aaa] break-all">{email}</span>.
          </p>
        </div>

        <div className="bg-[#0e0e0e] rounded-2xl border border-[#1a1a1a] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  pattern="[0-9]*"
                  maxLength={CODE_LENGTH}
                  value={digit}
                  disabled={loading}
                  aria-label={`Digit ${index + 1}`}
                  onChange={(e) => fill(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={(e) => e.target.select()}
                  onPaste={(e) => {
                    e.preventDefault();
                    fill(0, e.clipboardData.getData('text'));
                  }}
                  className="w-full min-w-0 aspect-[4/5] bg-[#111] border border-[#222] rounded-xl text-center text-lg font-semibold text-white outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}
            {notice && !error && (
              <div className="rounded-xl border border-[#222] bg-[#111] px-3 py-2.5 text-sm text-[#aaa]">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-semibold py-2.5 text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify and sign in'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs text-[#555]">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="transition-colors enabled:hover:text-white disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/client/login')}
              className="transition-colors hover:text-white"
            >
              Use a different email
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-[#333] text-center">The code expires in 15 minutes.</p>
      </div>
    </div>
  );
}
