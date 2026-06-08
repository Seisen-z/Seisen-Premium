import { fetchScripts } from '@/lib/scripts';
import ScriptsClient from '@/components/scripts/ScriptsClient';

export const revalidate = 60;

async function fetchLastUpdated(): Promise<string | null> {
  try {
    const res = await fetch(
      'https://api.github.com/repos/Ken-884/roblox/commits?path=gamelist.lua&per_page=1',
      { next: { revalidate: 3600 }, headers: { 'Accept': 'application/vnd.github+json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.commit?.committer?.date ?? null;
  } catch {
    return null;
  }
}

export default async function ScriptsPage() {
  const [scripts, lastUpdated] = await Promise.all([
    fetchScripts(),
    fetchLastUpdated(),
  ]);

  return <ScriptsClient initialScripts={scripts} lastUpdated={lastUpdated} />;
}
