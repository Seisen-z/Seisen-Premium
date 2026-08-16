import { supabase } from '@/lib/server/db';
import { NextRequest, NextResponse } from 'next/server';

function computeNextVersion(count: number): string {
  const safeCount = Math.max(0, count);
  const minor = Math.floor(safeCount / 11);
  const patch = safeCount % 11;
  return `v1.${minor}.${patch}`;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-update-secret');
  if (!secret || secret !== process.env.SITE_UPDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, tag, image_url, thumbnail_url, footer, game_name, version } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    let finalVersion = version;

    if (!finalVersion) {
      // Calculate version per game (or global if no game_name)
      let query = supabase.from('site_updates').select('*', { count: 'exact', head: true });
      if (game_name) {
        query = query.eq('game_name', game_name);
      }
      const { count } = await query;
      finalVersion = computeNextVersion(count ?? 0);
    }

    const payload: any = {
      title,
      content,
      tag: tag ?? 'Update',
      image_url: image_url || null,
      thumbnail_url: thumbnail_url || null,
      footer: footer || null,
      game_name: game_name || null,
      version: finalVersion,
    };

    // Try inserting with version column
    let { data, error } = await supabase
      .from('site_updates')
      .insert(payload)
      .select()
      .single();

    // If column 'version' does not exist in Supabase DB schema yet, fallback to inserting without version column
    if (error && (error.message?.includes('version') || error.code === 'PGRST204')) {
      delete payload.version;
      const retry = await supabase
        .from('site_updates')
        .insert(payload)
        .select()
        .single();
      data = retry.data ? { ...retry.data, version: finalVersion } : null;
      error = retry.error;
    }

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
