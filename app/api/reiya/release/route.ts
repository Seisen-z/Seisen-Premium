import { downloadPath, latestReiyaRelease } from '@/lib/server/reiya-release';

export async function GET() {
  try {
    const release = await latestReiyaRelease();
    if (!release) return Response.json({ error: 'No signed Reiya release yet' }, { status: 404 });
    return Response.json({
      version: release.version,
      notes: release.notes,
      download_url: 'https://seisen.store' + downloadPath(release),
    }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120' } });
  } catch {
    return Response.json({ error: 'Reiya release listing is unavailable' }, { status: 503 });
  }
}
