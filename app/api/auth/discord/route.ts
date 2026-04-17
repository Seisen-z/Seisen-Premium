import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Discord OAuth not configured' }, { status: 500 });
  }

  const baseUrl = req.nextUrl.origin; // auto-detects: localhost in dev, real domain in prod
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  // Grab the "return" query param so we can bounce back after login
  const returnTo = req.nextUrl.searchParams.get('return') || '/premium';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    // Store the returnTo in state so the callback can read it
    state: Buffer.from(JSON.stringify({ returnTo })).toString('base64'),
  });

  return NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?${params.toString()}`
  );
}
