import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export async function GET() {
  try {
    const config = await db.getGitHubConfig();
    return NextResponse.json(config || {});
  } catch (error) {
    console.error('Error fetching GitHub config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
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
