import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';

function parseLuaGameNames(luaCode: string): string[] {
  const names: string[] = [];
  const lines = luaCode.split('\n');
  let currentComment = '';

  for (const line of lines) {
    const commentMatch = line.match(/--\s*(.+)/);
    if (commentMatch) {
      currentComment = commentMatch[1].trim();
    }

    const entryMatch = line.match(/\["(\d+)"\]\s*=\s*"([^"]+)"/);
    if (entryMatch) {
      const scriptUrl = entryMatch[2];
      let name = currentComment;
      if (!name) {
        const nameMatch = scriptUrl.match(/Script_([^.]+)\.lua/);
        name = nameMatch ? nameMatch[1].replace(/([A-Z])/g, ' $1').trim() : 'Unknown Game';
      }
      if (name && !names.includes(name)) names.push(name);
      currentComment = '';
    }
  }
  return names;
}

export async function GET() {
  try {
    let freeUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/gamelist.lua';
    let premiumUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/premium/gamelist.lua';

    try {
      const { data: config } = await supabase
        .from('github_config')
        .select('free_url, premium_url')
        .single();

      if (config) {
        if (config.free_url) freeUrl = config.free_url;
        if (config.premium_url) premiumUrl = config.premium_url;
      }
    } catch {
      // fall through to defaults
    }

    const [freeRes, premiumRes] = await Promise.all([
      fetch(freeUrl, { next: { revalidate: 3600 } }),
      fetch(premiumUrl, { next: { revalidate: 3600 } }),
    ]);

    const [freeCode, premiumCode] = await Promise.all([freeRes.text(), premiumRes.text()]);

    const all = Array.from(new Set([
      ...parseLuaGameNames(freeCode),
      ...parseLuaGameNames(premiumCode),
    ])).sort();

    return NextResponse.json({ success: true, games: all });
  } catch (error) {
    console.error('Failed to fetch game list:', error);
    return NextResponse.json({
      success: true,
      games: [
        'Blox Fruits', 'Pet Simulator 99', 'Anime Defenders',
        'Fisch', 'Rivals', 'Slap Battles', 'Murder Mystery 2',
        'Da Hood', 'Brookhaven', 'Arsenal',
      ],
    });
  }
}
