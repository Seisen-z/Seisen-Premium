import { SCRIPT_METADATA } from './script-metadata';

interface Script {
  id: string;
  name: string;
  scriptUrl: string;
  status: 'Working' | 'Discontinued';
  type: 'Free' | 'Premium' | 'Discontinued';
  universeId?: string;
  displayType?: string;
  additionalUrls?: { url: string; type: string }[];
  description?: string;
  features?: string[];
}

export async function fetchScripts(): Promise<Script[]> {
  try {
    let freeUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/gamelist.lua';
    let premiumUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/premium/gamelist.lua';
    let discontinuedUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/discontinued.lua';

    try {
      const { supabase } = await import('./server/db');
      const { data: config } = await supabase
        .from('github_config')
        .select('*')
        .single();

      if (config) {
        if (config.free_url) freeUrl = config.free_url;
        if (config.premium_url) premiumUrl = config.premium_url;
        if (config.discontinued_url) discontinuedUrl = config.discontinued_url;
      }
    } catch {
      // fall through to defaults
    }

    const [freeRes, premiumRes, discontinuedRes] = await Promise.all([
      fetch(freeUrl, { next: { revalidate: 3600 } }),
      fetch(premiumUrl, { next: { revalidate: 3600 } }),
      fetch(discontinuedUrl, { next: { revalidate: 60 } })
    ]);

    const [freeCode, premiumCode, discontinuedCode] = await Promise.all([
      freeRes.text(),
      premiumRes.text(),
      discontinuedRes.text()
    ]);

    const discontinuedIds = parseDiscontinuedList(discontinuedCode);
    const allGames = [
      ...parseLuaGameList(freeCode, 'Free'),
      ...parseLuaGameList(premiumCode, 'Premium'),
    ];

    allGames.forEach(game => {
      if (discontinuedIds.has(game.id)) {
        game.type = 'Discontinued';
        game.status = 'Discontinued';
      }
    });

    // Deduplicate by URL
    const gamesByUrl = new Map<string, Script>();
    allGames.forEach(game => {
      if (!gamesByUrl.has(game.scriptUrl)) {
        gamesByUrl.set(game.scriptUrl, game);
      }
    });

    // Merge by name
    const gamesByName = new Map<string, Script>();
    Array.from(gamesByUrl.values()).forEach(game => {
      if (gamesByName.has(game.name)) {
        const existing = gamesByName.get(game.name)!;
        if (existing.scriptUrl !== game.scriptUrl) {
          if (!existing.additionalUrls) existing.additionalUrls = [];
          if (!existing.additionalUrls.find(u => u.url === game.scriptUrl)) {
            existing.additionalUrls.push({ url: game.scriptUrl, type: game.type });
          }
        }
        if (
          (game.type === 'Premium' && existing.type === 'Free') ||
          (game.type === 'Free' && existing.type === 'Premium')
        ) {
          existing.displayType = 'Free & Premium';
        }
      } else {
        gamesByName.set(game.name, { ...game, displayType: game.type });
      }
    });

    // Apply metadata
    try {
      const { supabase } = await import('./server/db');
      const { data: metadataData } = await supabase
        .from('script_metadata')
        .select('*');

      if (metadataData) {
        metadataData.forEach((item: any) => {
          const game = gamesByName.get(item.script_name);
          if (game) {
            game.description = item.description;
            game.features = item.features || [];
          }
        });
      }
    } catch {
      // fall through without metadata
    }

    return Array.from(gamesByName.values());

  } catch (error) {
    console.error('Failed to fetch scripts:', error);
    return [];
  }
}

function parseDiscontinuedList(luaCode: string): Set<string> {
  const ids = new Set<string>();
  const regex = /\["(\d+)"\]\s*=\s*true/g;
  let match;
  while ((match = regex.exec(luaCode)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

function parseLuaGameList(luaCode: string, type: 'Free' | 'Premium'): Script[] {
  const games: Script[] = [];
  const lines = luaCode.split('\n');
  let currentComment = '';

  for (const line of lines) {
    const commentMatch = line.match(/--\s*(.+)/);
    if (commentMatch) {
      currentComment = commentMatch[1].trim();
    }

    const entryMatch = line.match(/\["(\d+)"\]\s*=\s*"([^"]+)"/);
    if (entryMatch) {
      const id = entryMatch[1];
      const scriptUrl = entryMatch[2];

      let name = currentComment;
      if (!name) {
        const nameMatch = scriptUrl.match(/Script_([^.]+)\.lua/);
        name = nameMatch ? nameMatch[1].replace(/([A-Z])/g, ' $1').trim() : 'Unknown Game';
      }

      games.push({ id, name, scriptUrl, status: 'Working', type, universeId: id });
      currentComment = '';
    }
  }
  return games;
}
