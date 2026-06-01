
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const configRes = await fetch(`${baseUrl}/api/admin/github-config`, {
      next: { revalidate: 300 }
    });

    let freeUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/gamelist.lua';
    let premiumUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/premium/gamelist.lua';
    let discontinuedUrl = 'https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/discontinued.lua';

    if (configRes.ok) {
      const config = await configRes.json();
      if (config.free_url) freeUrl = config.free_url;
      if (config.premium_url) premiumUrl = config.premium_url;
      if (config.discontinued_url) discontinuedUrl = config.discontinued_url;
      console.log('📚 Using GitHub URLs from database:', { freeUrl, premiumUrl, discontinuedUrl });
    } else {
      console.log('📚 Using default GitHub URLs');
    }

    const [freeRes, premiumRes, discontinuedRes] = await Promise.all([
      fetch(freeUrl, { next: { revalidate: 3600 } }),
      fetch(premiumUrl, { next: { revalidate: 3600 } }),
      fetch(discontinuedUrl, { next: { revalidate: 60 } })
    ]);

    if (!freeRes.ok) console.error('❌ Free games fetch failed:', freeRes.status, freeUrl);
    if (!premiumRes.ok) console.error('❌ Premium games fetch failed:', premiumRes.status, premiumUrl);
    if (!discontinuedRes.ok) console.error('❌ Discontinued games fetch failed:', discontinuedRes.status, discontinuedUrl);

    const [freeCode, premiumCode, discontinuedCode] = await Promise.all([
      freeRes.text(),
      premiumRes.text(),
      discontinuedRes.text()
    ]);

    const discontinuedIds = parseDiscontinuedList(discontinuedCode);
    const freeGames = parseLuaGameList(freeCode, 'Free');
    const premiumGames = parseLuaGameList(premiumCode, 'Premium');

    // Merge logic
    const gamesByUrl = new Map<string, Script>();
    const gamesByName = new Map<string, Script>();

    // Process Free
    freeGames.forEach(game => {
      if (discontinuedIds.has(game.id)) {
        game.type = 'Discontinued';
        game.status = 'Discontinued';
      }
      gamesByUrl.set(game.scriptUrl, game);
    });

    // Process Premium
    premiumGames.forEach(game => {
      if (gamesByUrl.has(game.scriptUrl)) return; // Skip duplicate URLs

      if (discontinuedIds.has(game.id)) {
        game.type = 'Discontinued';
        game.status = 'Discontinued';
      }
      gamesByUrl.set(game.scriptUrl, game);
    });

    // Fetch metadata from database
    let metadataMap: Record<string, { description: string; features: string[] }> = {};
    try {
      const { supabase } = await import('./server/db');
      const { data: metadataData } = await supabase
        .from('script_metadata')
        .select('*');
      
      if (metadataData) {
        metadataData.forEach((item: any) => {
          metadataMap[item.script_name] = {
            description: item.description,
            features: item.features || []
          };
        });
      }
    } catch (error) {
      console.error('Error fetching metadata from database:', error);
    }

    // Combine by Name and Merge Metadata
    Array.from(gamesByUrl.values()).forEach(game => {
      // Lookup Metadata from database
      const metadata = metadataMap[game.name];
      if (metadata) {
        game.description = metadata.description;
        game.features = metadata.features;
      }

      if (gamesByName.has(game.name)) {
        const existing = gamesByName.get(game.name)!;
        if (!existing.additionalUrls) existing.additionalUrls = [];
        existing.additionalUrls.push({ url: game.scriptUrl, type: game.type });
        
        if (game.type === 'Premium' && existing.type === 'Free') {
          existing.displayType = 'Free & Premium';
        }
        // Merge metadata into existing if it was missing (e.g., from the second variant)
        if (!existing.description && game.description) {
           existing.description = game.description;
           existing.features = game.features;
        }

      } else {
        const gameCopy = { ...game, displayType: game.type };
        gamesByName.set(game.name, gameCopy);
      }
    });

    const result = Array.from(gamesByName.values());
    console.log(`✅ Loaded ${result.length} scripts from GitHub`);
    return result;

  } catch (error) {
    console.error('❌ Failed to fetch scripts:', error);
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
        name = nameMatch ? nameMatch[1].replace(/([A-Z])/g, " $1").trim() : "Unknown Game";
      }

      games.push({
        id,
        name,
        scriptUrl,
        status: 'Working',
        type,
        universeId: id
      });
      currentComment = '';
    }
  }
  return games;
}
