import 'server-only';

import { randomBytes } from 'node:crypto';
import { REIYA_PLANS, REIYA_PURCHASE_ID } from '@/lib/reiya-purchase';
import { database, digest, limit, reiyaBillingMode, reiyaCheckoutEnabled, reiyaStorageConfigured, ReiyaPurchaseError, unseal } from './reiya-purchase';

interface License {
  id: string;
  profile_id: string;
  display_name: string;
  expires_at: string;
  revoked: boolean;
  billing_inactive: boolean;
  seisen_reiya_orders?: { refunded_at: string | null };
}
interface Session { license_id: string; device_hash: string; seisen_reiya_licenses: License }

function keyHash(value: unknown): string {
  const key = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^REIYA-P-[A-F0-9]{64}$/.test(key)) throw new ReiyaPurchaseError(400, 'Invalid Reiya Premium key.');
  return digest('license', key);
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function validCiphertext(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 40 && value.length <= 2800000
    && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function nonnegative(value: unknown, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.trunc(value))) : 0;
}

function active(license: License): boolean {
  return !license.revoked && !license.billing_inactive && Date.parse(license.expires_at) > Date.now();
}

async function status(key: unknown) {
  const hash = keyHash(key);
  const [license] = await database<License[]>(
    'seisen_reiya_licenses?key_hash=eq.' + hash
    + '&select=id,profile_id,display_name,expires_at,revoked,billing_inactive,seisen_reiya_orders!inner(refunded_at)',
  );
  if (!license) return { premium: false, state: 'free', refunded: false, erase_local_data: false };
  const refunded = Boolean(license.seisen_reiya_orders?.refunded_at);
  return {
    premium: active(license),
    state: refunded ? 'refunded' : license.revoked ? 'disabled' : license.billing_inactive ? 'inactive' : active(license) ? 'active' : 'expired',
    profile_id: license.profile_id, display_name: license.display_name, expires_at: license.expires_at,
    server_now: new Date().toISOString(), refunded, erase_local_data: false,
  };
}

async function activate(body: Record<string, unknown>) {
  const key = keyHash(body.key);
  if (typeof body.device_id !== 'string' || !/^[a-fA-F0-9]{64}$/.test(body.device_id)) {
    throw new ReiyaPurchaseError(400, 'Invalid Reiya device identifier.');
  }
  const token = randomBytes(32).toString('hex');
  const result = await database<{
    error?: string; cloud_key_ciphertext?: string; profile_id?: string; display_name?: string; expires_at?: string;
  }>('rpc/seisen_reiya_activate', 'POST', {
    p_hash: key, p_device: digest('device', body.device_id), p_token: digest('session', token),
    p_name: typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 48) : '',
  });
  if (result?.error === 'device_limit') throw new ReiyaPurchaseError(409, 'Device limit reached. Deactivate another device.');
  if (!result?.cloud_key_ciphertext) throw new ReiyaPurchaseError(401, 'Reiya Premium key is invalid or inactive.');
  return {
    token, cloud_key: unseal(result.cloud_key_ciphertext, 'cloud'), profile_id: result.profile_id,
    display_name: result.display_name, expires_at: result.expires_at, premium: true,
  };
}

async function authorize(authorization: string | null): Promise<{ session: Session; hash: string }> {
  const token = /^Bearer ([a-f0-9]{64})$/.exec(authorization ?? '')?.[1];
  if (!token) throw new ReiyaPurchaseError(401, 'A Reiya Premium session is required.');
  const hash = digest('session', token);
  const time = encodeURIComponent(new Date().toISOString());
  const [session] = await database<Session[]>(
    'seisen_reiya_sessions?token_hash=eq.' + hash + '&expires_at=gt.' + time
    + '&select=license_id,device_hash,seisen_reiya_licenses!inner(id,profile_id,display_name,expires_at,revoked,billing_inactive)',
  );
  if (!session || !active(session.seisen_reiya_licenses)) throw new ReiyaPurchaseError(401, 'Reiya Premium session has expired.');
  return { session, hash };
}

async function backups(session: Session, tokenHash: string, method: string, id: string | null, body: Record<string, unknown>) {
  const base = 'seisen_reiya_backups?license_id=eq.' + session.license_id;
  if (method === 'POST') {
    if (!validCiphertext(body.ciphertext)) throw new ReiyaPurchaseError(400, 'Invalid encrypted backup.');
    await limit('backup-write:' + session.license_id, 20, 3600);
    const metadata = record(body.metadata);
    const saved = await database<string | null>('rpc/seisen_reiya_backup', 'POST', {
      p_token: tokenHash, p_ciphertext: body.ciphertext,
      p_metadata: { version: 1, accounts: nonnegative(metadata.accounts, 100000), files: nonnegative(metadata.files, 1000), bytes: nonnegative(metadata.bytes, 2000000) },
    });
    if (!saved) throw new ReiyaPurchaseError(401, 'Reiya Premium session has expired.');
    return { id: saved };
  }
  if (id && !REIYA_PURCHASE_ID.test(id)) throw new ReiyaPurchaseError(400, 'Invalid backup ID.');
  if (method === 'DELETE') {
    if (!id) throw new ReiyaPurchaseError(400, 'A backup ID is required.');
    await database(base + '&id=eq.' + id, 'DELETE');
    return { deleted: true };
  }
  const cutoff = encodeURIComponent(new Date(Date.now() - 15 * 86400000).toISOString());
  const available = base + '&created_at=gt.' + cutoff;
  if (id) {
    const [backup] = await database<object[]>(available + '&id=eq.' + id + '&select=id,ciphertext,metadata,created_at');
    if (!backup) throw new ReiyaPurchaseError(404, 'This backup is unavailable.');
    return backup;
  }
  return { backups: await database(available + '&select=id,metadata,created_at&order=created_at.desc,id.desc&limit=5') };
}

const METHODS: Readonly<Record<string, readonly string[]>> = {
  config: ['GET'], activate: ['POST'], 'key-status': ['POST'], 'refund-status': ['POST'],
  status: ['GET'], backup: ['GET', 'POST', 'DELETE'], deactivate: ['POST'], metadata: ['POST'],
};

export function allowedPremiumMethod(action: string, method: string): boolean {
  return Object.hasOwn(METHODS, action) && METHODS[action].includes(method);
}

export async function desktopPremium(action: string, request: Request, value: unknown, ip: string): Promise<object> {
  if (action === 'config') {
    return {
      plans: Object.entries(REIYA_PLANS).map(([id, plan]) => ({ id, price: plan.amount, currency: 'EUR' })),
      local_test: reiyaBillingMode() === 'sandbox', checkout_enabled: reiyaCheckoutEnabled(),
    };
  }
  if (!reiyaStorageConfigured()) throw new ReiyaPurchaseError(503, 'Reiya Premium storage is temporarily unavailable.');
  const body = record(value);
  if (action === 'activate') {
    await limit('activate:' + ip, 60, 600);
    return activate(body);
  }
  if (action === 'key-status' || action === 'refund-status') {
    await limit('key-status:' + ip, 180, 600);
    return status(body.key);
  }
  const { session, hash } = await authorize(request.headers.get('authorization'));
  await limit('premium:' + session.license_id, 180, 3600);
  if (action === 'status') {
    const { profile_id, display_name, expires_at } = session.seisen_reiya_licenses;
    return { premium: true, profile_id, display_name, expires_at, server_now: new Date().toISOString() };
  }
  if (action === 'backup') {
    return backups(session, hash, request.method, new URL(request.url).searchParams.get('id'), body);
  }
  if (action === 'deactivate') {
    await database('seisen_reiya_devices?license_id=eq.' + session.license_id + '&device_hash=eq.' + session.device_hash, 'DELETE');
    return { deactivated: true };
  }
  if (action === 'metadata') {
    const ownership = body.ownership_hash;
    const username = typeof body.username === 'string' ? body.username.trim().slice(0, 32) : '';
    if (!username || typeof ownership !== 'string' || !/^[a-f0-9]{64}$/.test(ownership)) {
      throw new ReiyaPurchaseError(400, 'Invalid account metadata.');
    }
    await database('seisen_reiya_account_metadata', 'POST', {
      license_id: session.license_id, ownership_hash: digest('account', ownership), username,
      display_name: typeof body.display_name === 'string' ? body.display_name.slice(0, 48) : '',
      robux: nonnegative(body.robux, 1000000000000), updated_at: new Date().toISOString(),
    }, 'resolution=merge-duplicates,return=minimal');
    return { saved: true };
  }
  throw new ReiyaPurchaseError(405, 'Premium action is not supported.');
}
