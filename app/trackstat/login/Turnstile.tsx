"use client";
import { useEffect, useRef } from 'react';

type TurnstileApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<TurnstileApi> | undefined;
const api = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;
const load = () => loading ??= new Promise<TurnstileApi>((resolve, reject) => {
  const script = document.createElement('script');
  script.src = scriptUrl; script.async = true;
  script.onload = () => { const found = api(); if (found) resolve(found); else reject(new Error('Turnstile unavailable')); };
  script.onerror = () => { loading = undefined; reject(new Error('Turnstile blocked')); };
  document.head.appendChild(script);
});

// onToken gets the one-time token once the visitor passes, and an empty string when it expires or fails
export default function Turnstile({ siteKey, theme, onToken }: { siteKey: string; theme: 'dark' | 'light'; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | undefined, live = true, turnstile: TurnstileApi | undefined;
    load().then(found => {
      turnstile = found;
      if (live && box.current) id = found.render(box.current, { sitekey: siteKey, theme, callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken('') });
    }).catch(() => onToken(''));
    return () => { live = false; if (id) turnstile?.remove(id); };
  }, [siteKey, theme, onToken]);
  return <div ref={box} className="min-h-[65px]" />;
}
