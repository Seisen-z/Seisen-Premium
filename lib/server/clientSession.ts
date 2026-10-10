import { createHmac, timingSafeEqual } from 'crypto';

// Server-trusted identity for the client area. The readable `discord_session` cookie is only for UI;
// anything that decides access (like claiming a Robux key) must use these signed, httpOnly cookies.
export const DISCORD_AUTH_COOKIE = 'discord_auth';
export const ROBUX_ORDER_COOKIE = 'robux_order';
export const DISCORD_AUTH_TTL_SECONDS = 60 * 60 * 24 * 7;
export const ROBUX_ORDER_TTL_SECONDS = 60 * 60 * 2;

export type DiscordAuth = {
  id: string;
  tag: string;
  username: string;
  avatar?: string;
  email?: string | null;
  exp: number; // unix seconds
};

export type RobuxOrder = {
  discordId: string;
  userId: number;     // Roblox user ID
  username: string;
  tier: string;
  baseline: number[]; // UAIDs the Roblox account already owned when checkout started
  exp: number;
};

function secret(): string {
  const key = process.env.CLIENT_SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET;
  if (!key) throw new Error('CLIENT_SESSION_SECRET (or DISCORD_CLIENT_SECRET) is not configured');
  return key;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function signValue(value: object): string {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSignedValue<T extends { exp?: number }>(raw: string | undefined | null): T | null {
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;
  try {
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as T;
    if (value.exp !== undefined && value.exp < Math.floor(Date.now() / 1000)) return null;
    return value;
  } catch {
    return null;
  }
}

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  const raw = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  return raw ? decodeURIComponent(raw) : undefined;
}

export function readDiscordAuth(cookieHeader: string | null): DiscordAuth | null {
  const auth = readSignedValue<DiscordAuth>(readCookie(cookieHeader, DISCORD_AUTH_COOKIE));
  return auth && auth.id ? auth : null;
}

export function readRobuxOrder(cookieHeader: string | null): RobuxOrder | null {
  return readSignedValue<RobuxOrder>(readCookie(cookieHeader, ROBUX_ORDER_COOKIE));
}
