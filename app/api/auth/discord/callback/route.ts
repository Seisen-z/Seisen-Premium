import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Discord denied / user cancelled
  if (error || !code) {
    return NextResponse.redirect(new URL('/premium?discord_error=cancelled', req.url));
  }

  // Decode returnTo from state
  let returnTo = '/premium';
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decoded.returnTo) returnTo = decoded.returnTo;
    }
  } catch { /* ignore bad state */ }

  const clientId     = process.env.DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;
  const redirectUri  = `${baseUrl}/api/auth/discord/callback`;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Discord token exchange failed:', err);
      return NextResponse.redirect(new URL('/premium?discord_error=token_failed', req.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // 2. Fetch the user object
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/premium?discord_error=user_fetch_failed', req.url));
    }

    const user = await userRes.json();
    // user = { id, username, discriminator, avatar, email, ... }

    // 3. Build a minimal "discord session" payload stored as a cookie
    const session = {
      id:            user.id,
      username:      user.username,
      discriminator: user.discriminator || '0',
      avatar:        user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`,
      email:         user.email || null,
      tag:           user.discriminator && user.discriminator !== '0'
        ? `${user.username}#${user.discriminator}`
        : user.username,
    };

    const cookieValue = Buffer.from(JSON.stringify(session)).toString('base64');

    // 4. Redirect back with the session cookie set
    const destination = new URL(returnTo, req.url);
    const response = NextResponse.redirect(destination);

    response.cookies.set('discord_session', cookieValue, {
      httpOnly: false,   // needs to be readable client-side for the modal
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    });

    return response;
  } catch (err: any) {
    console.error('Discord OAuth callback error:', err);
    return NextResponse.redirect(new URL('/premium?discord_error=server_error', req.url));
  }
}
