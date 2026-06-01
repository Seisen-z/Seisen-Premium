import { db } from '@/lib/server/db';
import { TicketDatabase } from '@/lib/server/db';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

async function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const database = new TicketDatabase();
    return await database.validateAdminPassword(decoded);
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const config = await db.getGitHubConfig();
    return NextResponse.json(config || {});
  } catch (error) {
    console.error('Error fetching GitHub config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authorized = await isAdmin(request);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { free_url, premium_url, discontinued_url } = body;

    if (!free_url || !premium_url || !discontinued_url) {
      return NextResponse.json(
        { error: 'All URLs are required' },
        { status: 400 }
      );
    }

    const config = await db.setGitHubConfig(free_url, premium_url, discontinued_url);

    revalidatePath('/');
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating GitHub config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
