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
    console.log('🔧 PUT /api/admin/github-config called');

    const authorized = await isAdmin(request);
    console.log('🔒 Admin authorized:', authorized);

    if (!authorized) {
      console.log('❌ Unauthorized attempt to update config');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Received body:', body);

    const { free_url, premium_url, discontinued_url } = body;

    if (!free_url || !premium_url || !discontinued_url) {
      console.log('❌ Missing required URLs:', { free_url, premium_url, discontinued_url });
      return NextResponse.json(
        { error: 'All URLs are required' },
        { status: 400 }
      );
    }

    console.log('💾 Saving to database...');
    const config = await db.setGitHubConfig(free_url, premium_url, discontinued_url);
    console.log('✅ Saved config:', config);

    // Clear caches for all pages that use scripts
    console.log('🧹 Clearing caches...');
    revalidatePath('/', 'layout');
    revalidatePath('/scripts');
    revalidatePath('/api/games');
    console.log('✅ Caches cleared');

    return NextResponse.json(config);
  } catch (error) {
    console.error('❌ Error updating GitHub config:', error);
    return NextResponse.json({ error: 'Failed to update config', details: String(error) }, { status: 500 });
  }
}
