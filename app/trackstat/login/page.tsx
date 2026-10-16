"use client";
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Mail, Moon, ShieldCheck, Sun } from 'lucide-react';
import { trackstatAuth, trackstatFetch } from '@/lib/client/trackstat-auth';
import CodeInput from './CodeInput';
import { useTrackstatTheme } from '../theme';

export default function TrackstatLogin() {
  const router = useRouter();
  const { theme, toggle } = useTrackstatTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'save'>('email');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (step === 'email') {
        const response = await fetch('/api/trackstat/auth/send-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase() }) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not send your verification code.');
        setStep('code');
      } else {
        if (step === 'code') {
          if (!/^[0-9]{6}$/.test(code)) throw new Error('Enter all six digits.');
          const { error } = await trackstatAuth.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
          if (error) throw error;
          setStep('save'); setCode('');
        }
        const response = await trackstatFetch('/api/trackstat/profile', { method: 'POST' });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not save your connections. Try again.');
        router.replace('/trackstat');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const input = 'mt-2 w-full rounded-xl border border-ts-fg/10 bg-ts-inset px-4 py-3 text-sm text-ts-fg outline-none focus:border-ts-accent disabled:opacity-50';
  return <div data-ts-theme={theme} className="fixed inset-0 z-[200] overflow-auto bg-ts-bg">
  <button type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-ts-fg/[0.06] text-ts-fg/70 hover:text-ts-fg">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
  <div className="mx-auto grid min-h-[75vh] max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:gap-20">
    <div>
      <Link href="/trackstat" className="mb-10 inline-flex items-center gap-2 text-xs text-ts-fg/45 hover:text-ts-accent"><ArrowLeft size={14} />Back to Trackstat</Link>
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-ts-accent">Trackstat account</p>
      <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-ts-fg">Your accounts.<br /><span className="text-ts-fg/40">Any browser.</span></h1>
      <p className="mt-5 max-w-sm text-sm leading-7 text-ts-fg/50">Sign in with your email to open your saved Roblox accounts, inventory and gains. No password needed.</p>
      <p className="mt-6 flex items-center gap-2 text-xs text-ts-accent/80"><ShieldCheck size={15} />Optional. Connection keys still work without sign-in.</p>
    </div>
    <section aria-labelledby="login-title" className="rounded-2xl bg-ts-surface p-6 md:p-8">
      <Mail size={22} className="mb-5 text-ts-accent" />
      <h2 id="login-title" className="text-xl font-semibold text-ts-fg">{step === 'email' ? 'Sign in to Trackstat' : step === 'code' ? 'Check your email' : 'Save your connections'}</h2>
      <p className="mb-6 mt-2 text-xs leading-6 text-ts-fg/45">{step === 'email' ? 'We will send you a one-time verification code.' : step === 'code' ? `Enter the code sent to ${email}.` : 'Your email is verified. Save connections from this browser and continue.'}</p>
      <form onSubmit={submit} className="space-y-4">
        {step === 'email' && <label className="block text-xs text-ts-fg/60">Email address<input autoComplete="email" type="email" required maxLength={254} value={email} disabled={busy} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={input} /></label>}
        {step === 'code' && <CodeInput value={code} onChange={setCode} disabled={busy} />}
        {message && <p role="alert" className="text-xs leading-6 text-ts-warn">{message}</p>}
        <button disabled={busy || step === 'code' && !/^[0-9]{6}$/.test(code)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ts-accent px-4 py-3 text-sm font-semibold text-ts-accent-fg transition-colors hover:bg-ts-accent-hover disabled:opacity-50">{busy ? 'Please wait...' : step === 'email' ? 'Send verification code' : step === 'code' ? 'Verify & sign in' : 'Save & open Trackstat'}<ArrowRight size={15} /></button>
        {step === 'code' && <button type="button" disabled={busy} onClick={() => { setStep('email'); setCode(''); setMessage(''); }} className="text-xs text-ts-fg/45 hover:text-ts-fg">Change email or resend code</button>}
      </form>
    </section>
  </div>
  </div>;
}
