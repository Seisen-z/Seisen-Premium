import { NextResponse } from 'next/server';
import { DISCORD_AUTH_COOKIE, ROBUX_ORDER_COOKIE } from '@/lib/server/clientSession';

// The signed auth cookie is httpOnly, so the browser can't clear it itself.
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(DISCORD_AUTH_COOKIE);
  res.cookies.delete(ROBUX_ORDER_COOKIE);
  res.cookies.delete('discord_session');
  return res;
}
