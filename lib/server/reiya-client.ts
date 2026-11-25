import 'server-only';

import { canEmailReiyaKey, database, limit, ReiyaPurchaseError, sendReiyaKey, unseal } from './reiya-purchase';
import { isReiyaPlan } from '@/lib/reiya-purchase';

const purchaseFields = 'id,plan,created_at,refunded_at,revoked_at,seisen_reiya_licenses!inner(expires_at,revoked,billing_inactive)';

type PremiumOrder = {
  id: string;
  plan: string;
  created_at: string;
  refunded_at: string | null;
  revoked_at: string | null;
  seisen_reiya_licenses: {
    expires_at: string;
    revoked: boolean;
    billing_inactive: boolean;
  };
};

function purchaseStatus(order: PremiumOrder) {
  const license = order.seisen_reiya_licenses;
  if (order.refunded_at) return 'Refunded';
  if (order.revoked_at || license.revoked) return 'Disabled';
  if (Date.parse(license.expires_at) <= Date.now()) return 'Expired';
  return license.billing_inactive ? 'Inactive' : 'Active';
}

export async function loadReiyaPurchases(email: string, limit = 50) {
  const query = new URLSearchParams({
    payer_email: 'eq.' + email,
    select: purchaseFields,
    order: 'created_at.desc,id.desc',
    limit: String(limit),
  });
  const orders = await database<PremiumOrder[]>('seisen_reiya_orders?' + query.toString());
  return orders.filter(order => isReiyaPlan(order.plan)).map(order => {
    return {
      id: order.id,
      plan: order.plan,
      purchasedAt: order.created_at,
      expiresAt: order.seisen_reiya_licenses.expires_at,
      status: purchaseStatus(order),
    };
  });
}

export async function recoverReiyaKey(email: string, id: string): Promise<void> {
  if (!canEmailReiyaKey()) throw new ReiyaPurchaseError(503, 'Key recovery by email is temporarily unavailable.');
  await limit('key-recovery:' + email, 3, 60 * 60);
  const query = new URLSearchParams({
    id: 'eq.' + id,
    payer_email: 'eq.' + email,
    select: purchaseFields + ',payer_email,key_ciphertext',
    limit: '1',
  });
  const [order] = await database<Array<PremiumOrder & { payer_email: string; key_ciphertext: string | null }>>(
    'seisen_reiya_orders?' + query.toString(),
  );
  if (!order || order.payer_email !== email || !order.key_ciphertext || purchaseStatus(order) !== 'Active') {
    throw new ReiyaPurchaseError(404, 'No recoverable Reiya Premium key was found for this purchase.');
  }
  const key = unseal(order.key_ciphertext, 'delivery:' + order.id);
  if (!/^REIYA-P-[A-F0-9]{64}$/.test(key) || !await sendReiyaKey(order.payer_email, order.id, order.plan, key)) {
    throw new ReiyaPurchaseError(503, 'Key recovery by email is temporarily unavailable.');
  }
}
