import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
  try {
    // Construct proper base URL for server-side fetches
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const configRes = await fetch(`${baseUrl}/api/admin/github-config`, {
      next: { revalidate: 300 }
    });

    let freeUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/gamelist.lua';
    let premiumUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/premium/gamelist.lua';

    if (configRes.ok) {
      const config = await configRes.json();
      if (config.free_url) freeUrl = config.free_url;
      if (config.premium_url) premiumUrl = config.premium_url;
    }

    const [freeRes, premiumRes] = await Promise.all([
      fetch(freeUrl, {
        next: { revalidate: 3600 },
      }),
      fetch(premiumUrl, {
        next: { revalidate: 3600 },
      }),
    ]);

    const [freeCode, premiumCode] = await Promise.all([freeRes.text(), premiumRes.text()]);

    const freeNames = parseLuaGameNames(freeCode);
    const premiumNames = parseLuaGameNames(premiumCode);

    // Merge, deduplicate, sort
    const all = Array.from(new Set([...freeNames, ...premiumNames])).sort();

    return NextResponse.json({ success: true, games: all });
  } catch (error) {
    console.error('Failed to fetch game list:', error);
    // Fallback list in case GitHub is unreachable
    return NextResponse.json({
      success: true,
      games: [
        'Blox Fruits',
        'Pet Simulator 99',
        'Anime Defenders',
        'Fisch',
        'Rivals',
        'Slap Battles',
        'Murder Mystery 2',
        'Da Hood',
        'Brookhaven',
        'Arsenal',
      ],
    });
  }
}
