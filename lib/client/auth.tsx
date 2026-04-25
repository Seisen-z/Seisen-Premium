'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  verify: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check localStorage (email OTP flow)
    const storedEmail = localStorage.getItem('client_email');
    const storedAuth  = localStorage.getItem('client_auth');

    if (storedEmail && storedAuth === 'true') {
      setEmail(storedEmail);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // 2. Fallback: Discord session cookie
    const ds = readDiscordSession();
    if (ds) {
      // Use Discord email if available, otherwise "discord:<id>" as identifier
      const identifier = ds.email || `discord:${ds.id}`;
      setEmail(identifier);
      setIsAuthenticated(true);
      // Persist so refreshes keep the session
      localStorage.setItem('client_email', identifier);
      localStorage.setItem('client_auth', 'true');
    }

    setIsLoading(false);
  }, []);

  const login = async (emailInput: string) => {
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ email: emailInput }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setEmail(emailInput);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const verify = async (code: string) => {
    if (!email) return { success: false, error: 'No email found' };
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('client_email', email);
        localStorage.setItem('client_auth', 'true');
        router.push('/client/dashboard');
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Verification error' };
    }
  };

  const logout = () => {
    setEmail(null);
    setIsAuthenticated(false);
    localStorage.removeItem('client_email');
    localStorage.removeItem('client_auth');
    // Also clear discord session cookie
    document.cookie = 'discord_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/client/login');
  };

  return (
    <AuthContext.Provider value={{ email, isAuthenticated, login, verify, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Helper: read discord_session cookie ──────────────────────────────────────
export interface DiscordSession {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string | null;
  tag: string;
}

export function readDiscordSession(): DiscordSession | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)discord_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(atob(decodeURIComponent(match[1])));
  } catch {
    return null;
  }
}
