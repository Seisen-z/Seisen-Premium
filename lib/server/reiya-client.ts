import 'server-only';

import { database } from './reiya-purchase';
import { isReiyaPlan } from '@/lib/reiya-purchase';

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

export async function loadReiyaPurchases(email: string, limit = 50) {
  const query = new URLSearchParams({
    payer_email: 'eq.' + email,
    select: 'id,plan,created_at,refunded_at,revoked_at,seisen_reiya_licenses!inner(expires_at,revoked,billing_inactive)',
    order: 'created_at.desc,id.desc',
    limit: String(limit),
  });
  const orders = await database<PremiumOrder[]>('seisen_reiya_orders?' + query.toString());
  const now = Date.now();
  return orders.filter(order => isReiyaPlan(order.plan)).map(order => {
    const license = order.seisen_reiya_licenses;
    const status = order.refunded_at ? 'Refunded'
      : order.revoked_at || license.revoked ? 'Disabled'
      : Date.parse(license.expires_at) <= now ? 'Expired'
      : license.billing_inactive ? 'Inactive'
      : 'Active';
    return {
      id: order.id,
      plan: order.plan,
      purchasedAt: order.created_at,
      expiresAt: license.expires_at,
      status,
    };
  });
}
