'use client';
import { createClient } from '@supabase/supabase-js';
import { TRACKSTAT_URL, TRACKSTAT_PUBLIC_KEY } from '@/lib/trackstat-config';
export const trackstatAuth = createClient(TRACKSTAT_URL, TRACKSTAT_PUBLIC_KEY, { auth: { storageKey: 'seisen-trackstat-auth', detectSessionInUrl: false } });
export async function trackstatFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await trackstatAuth.auth.getSession();
  const headers = new Headers(options.headers);
  if (session) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(url, { ...options, headers });
}
