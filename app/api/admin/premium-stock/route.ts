import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';
import { verifyAdminSession } from '@/lib/server/adminSession';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Failed to update premium stock';
}

async function notifyBot(methodStocks: unknown) {
  const botApiUrl = process.env.DISCORD_BOT_API_URL;
  const secret = process.env.VERIFICATION_INTERNAL_SECRET;
  if (!botApiUrl || !secret) {
    console.warn('⚠️ Discord bot notification skipped: DISCORD_BOT_API_URL or VERIFICATION_INTERNAL_SECRET not set');
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${botApiUrl}/api/internal/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methodStocks, secret }),
      signal: controller.signal,
    });
    if (!res.ok) console.warn(`⚠️ Failed to notify bot: HTTP ${res.status}`);
    else console.log('✅ Notified Discord bot of restock');
  } catch (err: any) {
    console.warn('⚠️ Could not notify Discord bot of restock:', err.message);
  } finally {
    clearTimeout(timeout);
  }
}

async function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  return verifyAdminSession(token);
}

export async function GET(req: NextRequest) {
  const authorized = await isAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = new TicketDatabase();
    const methodStocks = await db.getPaymentMethodStocks();
    return NextResponse.json({ methodStocks });
  } catch (error) {
    console.error('Error fetching premium stock:', error);
    return NextResponse.json({ error: 'Failed to fetch premium stock' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authorized = await isAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = new TicketDatabase();

    if (body.updates && typeof body.updates === 'object') {
      // Global stock matrix save
      const skipped: string[] = [];
      for (const tier of Object.keys(body.updates)) {
        if (!['weekly', 'monthly', 'lifetime'].includes(tier)) continue;
        const tierUpdates = body.updates[tier];
        if (!tierUpdates || typeof tierUpdates !== 'object') continue;

        for (const method of Object.keys(tierUpdates)) {
          if (!['robux', 'paypal', 'gcash', 'card', 'local_qr'].includes(method)) continue;
          const stock = Number(tierUpdates[method]);
          if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
            skipped.push(`${tier}.${method} (invalid value: ${tierUpdates[method]})`);
            continue;
          }
          await db.setPaymentMethodStock(tier, method, stock);
        }
      }

      const methodStocks = await db.getPaymentMethodStocks();
      await notifyBot(methodStocks);
      return NextResponse.json({ success: true, methodStocks, ...(skipped.length ? { skipped } : {}) });
    } else {
      // Legacy single cell/row update
      const tier = String(body.tier || '').toLowerCase();
      const stock = Number(body.stock);
      const method = body.method ? String(body.method).toLowerCase() : null;

      if (!['weekly', 'monthly', 'lifetime'].includes(tier)) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }
      if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
        return NextResponse.json({ error: 'Stock must be a non-negative integer' }, { status: 400 });
      }
      if (!method || !['robux', 'paypal', 'gcash', 'card', 'local_qr'].includes(method)) {
        return NextResponse.json({ error: 'Invalid or missing payment method' }, { status: 400 });
      }

      await db.setPaymentMethodStock(tier, method, stock);
    }

    const methodStocks = await db.getPaymentMethodStocks();
    await notifyBot(methodStocks);
    return NextResponse.json({ success: true, methodStocks });
  } catch (error) {
    console.error('Error updating premium stock:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
