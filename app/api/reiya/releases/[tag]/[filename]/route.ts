import { downloadReiyaAsset } from '@/lib/server/reiya-release';

export async function GET(_request: Request, { params }: { params: Promise<{ tag: string; filename: string }> }) {
  const { tag, filename } = await params;
  try {
    return await downloadReiyaAsset(tag, filename);
  } catch {
    return Response.json({ error: 'Reiya download is unavailable' }, { status: 503 });
  }
}
