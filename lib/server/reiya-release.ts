import 'server-only';

const REPOSITORY = 'Seisen-z/Seisen-Premium';
const RELEASES = 'https://api.github.com/repos/' + REPOSITORY + '/releases';
const TAG = /^reiya-v((?:0|[1-9][0-9]{0,8})\.(?:0|[1-9][0-9]{0,8})\.(?:0|[1-9][0-9]{0,8}))$/;
const DOWNLOAD_ROOT = '/api/reiya/releases/';

interface GitHubAsset { name: string; id: number }
interface GitHubRelease {
  tag_name?: string;
  draft?: boolean;
  prerelease?: boolean;
  body?: string;
  assets?: GitHubAsset[];
}

export interface ReiyaRelease {
  tag: string;
  version: string;
  notes: string;
  installer: GitHubAsset;
  signature: GitHubAsset;
  checksums: GitHubAsset | undefined;
}

function assetNames(tag: string) {
  const version = TAG.exec(tag)?.[1];
  if (!version) return null;
  const installer = 'ReiyaAccountManager-' + version + '-setup.exe';
  return { version, installer, signature: installer + '.sig', checksums: 'SHA256SUMS.txt' };
}

function signedRelease(release: GitHubRelease): ReiyaRelease | null {
  const tag = typeof release?.tag_name === 'string' ? release.tag_name : '';
  const names = assetNames(tag);
  if (!names || release.draft !== false || release.prerelease !== false || !Array.isArray(release.assets)) return null;
  const find = (name: string) => release.assets?.find(asset =>
    asset?.name === name && Number.isSafeInteger(asset.id) && asset.id > 0);
  const installer = find(names.installer);
  const signature = find(names.signature);
  if (!installer || !signature) return null;
  const notes = typeof release.body === 'string' ? release.body.slice(0, 10000) : '';
  return { tag, version: names.version, notes, installer, signature, checksums: find(names.checksums) };
}

async function releaseMetadata(path: string) {
  return fetch(RELEASES + path, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Seisen-Premium-Reiya' },
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 120 },
  });
}

function compareVersions(a: ReiyaRelease, b: ReiyaRelease): number {
  const left = a.version.split('.').map(Number);
  const right = b.version.split('.').map(Number);
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

export async function latestReiyaRelease(): Promise<ReiyaRelease | null> {
  const response = await releaseMetadata('?per_page=100');
  if (!response.ok) throw new Error('Reiya release listing is unavailable');
  const list: unknown = await response.json();
  if (!Array.isArray(list)) throw new Error('Reiya release listing is invalid');

  return list.reduce<ReiyaRelease | null>((latest, release) => {
    const candidate = signedRelease(release);
    return candidate && (!latest || compareVersions(candidate, latest) > 0) ? candidate : latest;
  }, null);
}

export function downloadPath(release: ReiyaRelease, asset = release.installer) {
  return DOWNLOAD_ROOT + release.tag + '/' + asset.name;
}

export async function downloadReiyaAsset(tag: string, filename: string): Promise<Response> {
  const names = assetNames(tag);
  if (!names || ![names.installer, names.signature, names.checksums].includes(filename)) {
    return Response.json({ error: 'Reiya asset not found' }, { status: 404 });
  }
  const metadata = await releaseMetadata('/tags/' + tag);
  if (metadata.status === 404) return Response.json({ error: 'Reiya release not found' }, { status: 404 });
  if (!metadata.ok) throw new Error('Reiya release is unavailable');
  const release = signedRelease(await metadata.json());
  const asset = [release?.installer, release?.signature, release?.checksums].find(item => item?.name === filename);
  if (release?.tag !== tag || !asset) return Response.json({ error: 'Reiya asset not found' }, { status: 404 });

  return Response.redirect('https://github.com/' + REPOSITORY + '/releases/download/' + tag + '/' + filename, 302);
}
