import 'server-only';

import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { EmailService } from './email';
import { REIYA_PLANS, REIYA_PURCHASE_ID, REIYA_TERMS_VERSION, isReiyaPlan, type ReiyaPlan } from '@/lib/reiya-purchase';

export const REIYA_SITE_ORIGIN = 'https://seisen.store';
export const CLAIM_TTL_SECONDS = 48 * 60 * 60;
const PAYPAL_SUBSCRIPTION = /^I-[A-Z0-9]{1,48}$/;

export class ReiyaPurchaseError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

const PAYPAL_KEYS = ['REIYA_PAYPAL_MONTHLY_PLAN_ID', 'REIYA_PAYPAL_YEARLY_PLAN_ID', 'REIYA_PAYPAL_WEBHOOK_ID'] as const;

function storageSettings() {
  const { REIYA_SUPABASE_URL, REIYA_SUPABASE_ADMIN_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const dedicated = Boolean(REIYA_SUPABASE_URL || REIYA_SUPABASE_ADMIN_KEY);
  const url = dedicated ? REIYA_SUPABASE_URL : SUPABASE_URL;
  const key = dedicated ? REIYA_SUPABASE_ADMIN_KEY : SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

function payPalSettings() {
  const { REIYA_PAYPAL_CLIENT_ID, REIYA_PAYPAL_CLIENT_SECRET, REIYA_PAYPAL_SANDBOX,
    PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_SANDBOX } = process.env;
  const dedicated = Boolean(REIYA_PAYPAL_CLIENT_ID || REIYA_PAYPAL_CLIENT_SECRET);
  const clientId = dedicated ? REIYA_PAYPAL_CLIENT_ID : PAYPAL_CLIENT_ID;
  const clientSecret = dedicated ? REIYA_PAYPAL_CLIENT_SECRET : PAYPAL_CLIENT_SECRET;
  const sandbox = dedicated ? REIYA_PAYPAL_SANDBOX : PAYPAL_SANDBOX;
  if (!clientId || !clientSecret || (sandbox !== 'true' && sandbox !== 'false')) return null;
  if (!dedicated && REIYA_PAYPAL_SANDBOX && REIYA_PAYPAL_SANDBOX !== sandbox) return null;
  return { clientId, clientSecret, mode: sandbox === 'true' ? 'sandbox' as const : 'live' as const };
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new ReiyaPurchaseError(503, 'Reiya Premium is temporarily unavailable.');
  return value;
}

export function reiyaStorageConfigured(): boolean {
  return Boolean(storageSettings() && process.env.REIYA_PREMIUM_KEY_PEPPER)
    && /^[0-9a-f]{64}$/i.test(process.env.REIYA_PREMIUM_WRAPPING_KEY ?? '');
}

export function reiyaBillingMode(): 'sandbox' | 'live' | null {
  if (!reiyaStorageConfigured() || !PAYPAL_KEYS.every(key => process.env[key])) return null;
  if (process.env.REIYA_PAYPAL_MONTHLY_PLAN_ID === process.env.REIYA_PAYPAL_YEARLY_PLAN_ID) return null;
  return payPalSettings()?.mode ?? null;
}

export function reiyaCheckoutEnabled(): boolean {
  const mode = reiyaBillingMode();
  return mode !== null && process.env.REIYA_PREMIUM_CHECKOUT_ENABLED !== 'false'
    && (mode === 'sandbox' || (process.env.NODE_ENV === 'production'
      && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production')));
}

export function purchaseOrigin(request: Request): string {
  const origin = request.headers.get('origin');
  const mode = reiyaBillingMode();
  if (!mode) throw new ReiyaPurchaseError(503, 'Reiya Premium is temporarily unavailable.');
  const requestUrl = new URL(request.url);
  const sameOrigin = origin === requestUrl.origin;
  if (sameOrigin && origin === REIYA_SITE_ORIGIN) return REIYA_SITE_ORIGIN;
  const local = requestUrl.protocol === 'http:'
    && ['localhost', '127.0.0.1', '[::1]'].includes(requestUrl.hostname);
  if (mode === 'sandbox' && sameOrigin && local) return requestUrl.origin;
  throw new ReiyaPurchaseError(403, 'Open the Reiya purchase page to continue.');
}

export function claimCookie(id: string): string {
  return 'reiya-claim-' + id;
}

export function digest(purpose: string, value: string): string {
  return createHmac('sha256', env('REIYA_PREMIUM_KEY_PEPPER')).update(purpose + ':' + value).digest('hex');
}

function wrappingKey() {
  return Buffer.from(env('REIYA_PREMIUM_WRAPPING_KEY'), 'hex');
}

function seal(value: string, context: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', wrappingKey(), nonce);
  cipher.setAAD(Buffer.from(context));
  return Buffer.concat([nonce, cipher.update(value, 'utf8'), cipher.final(), cipher.getAuthTag()]).toString('base64');
}

export function unseal(value: string, context: string): string {
  const bytes = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', wrappingKey(), bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString('utf8');
}

export async function database<T>(path: string, method = 'GET', data?: object, prefer = 'return=representation'): Promise<T> {
  const storage = storageSettings();
  if (!storage || new URL(storage.url).protocol !== 'https:') {
    throw new ReiyaPurchaseError(503, 'Reiya Premium database is unavailable.');
  }
  const base = storage.url.replace(/\/$/, '');
  const { key } = storage;
  const response = await fetch(base + '/rest/v1/' + path, {
    method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: prefer },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) throw new ReiyaPurchaseError(503, 'Reiya Premium database is unavailable.');
  return response.status === 204 ? null as T : response.json() as Promise<T>;
}

export async function limit(key: string, count: number, seconds: number): Promise<void> {
  const allowed = await database<boolean>('rpc/seisen_reiya_rate', 'POST', {
    p_bucket: digest('rate', key), p_limit: count, p_seconds: seconds,
  });
  if (!allowed) throw new ReiyaPurchaseError(429, 'Too many requests. Try again later.');
}

let payPalToken: { value: string; expires: number } | undefined;

async function paypal<T>(path: string, data?: object, requestId?: string): Promise<T> {
  const settings = payPalSettings();
  if (!settings) throw new ReiyaPurchaseError(503, 'Reiya Premium PayPal settings are unavailable.');
  const base = settings.mode === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  if (!payPalToken || payPalToken.expires <= Date.now()) {
    const credentials = settings.clientId + ':' + settings.clientSecret;
    const response = await fetch(base + '/v1/oauth2/token', {
      method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: 'Basic ' + Buffer.from(credentials).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new ReiyaPurchaseError(503, 'Could not connect to PayPal.');
    const token = await response.json() as { access_token?: string; expires_in?: number };
    if (!token.access_token || !Number.isFinite(token.expires_in)) throw new ReiyaPurchaseError(503, 'Could not connect to PayPal.');
    payPalToken = { value: token.access_token, expires: Date.now() + Math.max(0, (token.expires_in ?? 0) - 60) * 1000 };
  }
  const response = await fetch(base + path, {
    method: data ? 'POST' : 'GET', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: 'Bearer ' + payPalToken.value, 'Content-Type': 'application/json',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) throw new ReiyaPurchaseError(502, 'PayPal could not process this request.');
  return response.json() as Promise<T>;
}

type Money = { value?: string; currency_code?: string };
interface PayPalPlan {
  status?: string;
  billing_cycles?: {
    tenure_type?: string;
    total_cycles?: number;
    frequency?: { interval_count?: number; interval_unit?: string };
    pricing_scheme?: { fixed_price?: Money };
  }[];
  payment_preferences?: { setup_fee?: Money };
  taxes?: { percentage?: string; inclusive?: boolean };
}
interface PayPalSubscription {
  id?: string;
  status?: string;
  plan_id?: string;
  custom_id?: string;
  links?: { rel?: string; href?: string }[];
  subscriber?: { email_address?: string; payer_id?: string };
  billing_info?: { last_payment?: { time?: string; amount?: Money }; next_billing_time?: string };
}

function planId(plan: ReiyaPlan): string {
  const id = env(plan === 'yearly' ? 'REIYA_PAYPAL_YEARLY_PLAN_ID' : 'REIYA_PAYPAL_MONTHLY_PLAN_ID');
  if (!/^P-[A-Z0-9]{1,48}$/.test(id)) throw new ReiyaPurchaseError(503, 'This Reiya plan is temporarily unavailable.');
  return id;
}

function matchesAmount(money: Money | undefined, plan: ReiyaPlan): boolean {
  return money?.currency_code === 'EUR' && Number(money.value) === Number(REIYA_PLANS[plan].amount);
}

function approvedPayPalUrl(raw: string | undefined): string {
  let url: URL | undefined;
  try { if (raw) url = new URL(raw); } catch { /* Invalid approval URL. */ }
  const hosts = reiyaBillingMode() === 'sandbox'
    ? ['www.sandbox.paypal.com', 'sandbox.paypal.com'] : ['www.paypal.com', 'paypal.com'];
  if (!url || url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.port || url.username || url.password) {
    throw new ReiyaPurchaseError(502, 'PayPal did not provide an approval link.');
  }
  return url.href;
}

export async function createReiyaPurchase(value: unknown, ip: string, origin: string) {
  if (!reiyaCheckoutEnabled()) throw new ReiyaPurchaseError(503, 'Reiya Premium purchases are temporarily unavailable.');
  if (!value || typeof value !== 'object' || !('plan' in value) || !isReiyaPlan(value.plan) ||
      !('accepted' in value) || value.accepted !== true ||
      !('termsVersion' in value) || value.termsVersion !== REIYA_TERMS_VERSION) {
    throw new ReiyaPurchaseError(400, 'Select a plan and accept the current subscription terms.');
  }
  const plan = value.plan;
  const id = planId(plan);
  await limit('checkout:' + ip, 8, 3600);
  const billing = await paypal<PayPalPlan>('/v1/billing/plans/' + id);
  const regular = billing.billing_cycles?.filter(cycle => cycle.tenure_type === 'REGULAR') ?? [];
  const cycle = regular[0];
  if (billing.status !== 'ACTIVE' || regular.length !== 1 || billing.billing_cycles?.some(c => c.tenure_type === 'TRIAL') ||
      cycle?.total_cycles !== 0 || cycle.frequency?.interval_count !== 1 || cycle.frequency.interval_unit !== REIYA_PLANS[plan].interval ||
      !matchesAmount(cycle.pricing_scheme?.fixed_price, plan) ||
      Number(billing.payment_preferences?.setup_fee?.value ?? 0) !== 0 ||
      (Number(billing.taxes?.percentage ?? 0) !== 0 && billing.taxes?.inclusive !== true)) {
    throw new ReiyaPurchaseError(503, 'The PayPal plan must match the displayed price and billing period.');
  }

  const purchaseId = randomUUID();
  const claim = randomBytes(32).toString('hex');
  await database('seisen_reiya_orders', 'POST', {
    id: purchaseId, plan, claim_hash: digest('claim', claim),
    legal_consent: {
      version: REIYA_TERMS_VERSION, accepted: true, plan, amount: REIYA_PLANS[plan].amount,
      currency: 'EUR', accepted_at: new Date().toISOString(), request_hash: digest('consent', ip),
    },
  });
  const subscription = await paypal<PayPalSubscription>('/v1/billing/subscriptions', {
    plan_id: id, custom_id: purchaseId,
    application_context: {
      brand_name: 'Reiya Premium', user_action: 'SUBSCRIBE_NOW',
      return_url: origin + '/reiya?purchase=' + purchaseId, cancel_url: origin + '/reiya?cancelled=1',
    },
  }, purchaseId);
  if (!subscription.id || !PAYPAL_SUBSCRIPTION.test(subscription.id)) {
    throw new ReiyaPurchaseError(502, 'PayPal did not return a valid subscription.');
  }
  const approvalUrl = approvedPayPalUrl(subscription.links?.find(link => link.rel === 'approve')?.href);
  await database('seisen_reiya_orders?id=eq.' + purchaseId, 'PATCH', { paypal_subscription_id: subscription.id });
  return { purchaseId, claim, approvalUrl };
}

interface Order {
  id: string;
  plan: ReiyaPlan;
  created_at: string;
  claim_hash: string;
  paypal_subscription_id: string | null;
  refunded_at: string | null;
  revoked_at: string | null;
  key_ciphertext: string | null;
  email_delivery_status: string | null;
}

function expiresAt(subscription: PayPalSubscription, plan: ReiyaPlan): string {
  const payment = subscription.billing_info?.last_payment;
  if ((subscription.status !== 'ACTIVE' && subscription.status !== 'CANCELLED') || subscription.plan_id !== planId(plan) || !matchesAmount(payment?.amount, plan)) {
    throw new ReiyaPurchaseError(409, 'PayPal has not confirmed your payment yet.');
  }
  const paid = Date.parse(payment?.time ?? '');
  const now = Date.now();
  if (!Number.isFinite(paid) || paid > now + 300000) throw new ReiyaPurchaseError(409, 'PayPal has not confirmed your payment yet.');
  const end = new Date(paid);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + (plan === 'yearly' ? 12 : 1));
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  const next = Date.parse(subscription.billing_info?.next_billing_time ?? '');
  const until = Number.isFinite(next) && next > paid ? Math.min(next, end.getTime()) : end.getTime();
  if (until <= now) throw new ReiyaPurchaseError(409, 'The paid subscription period has expired.');
  return new Date(until).toISOString();
}

function payerInfo(subscription: PayPalSubscription) {
  const email = subscription.subscriber?.email_address;
  const id = subscription.subscriber?.payer_id;
  return {
    payer_email: email && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.toLowerCase() : null,
    payer_id: id && /^[2-9A-HJ-NP-Z]{13}$/.test(id) ? id : null,
  };
}

async function emailPurchase(order: Order, email: string | null, key: string): Promise<boolean> {
  if (order.email_delivery_status === 'sent') return true;
  if (!email || reiyaBillingMode() !== 'live' || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return false;
  const path = 'seisen_reiya_orders?id=eq.' + order.id;
  const claimed = await database<Order[]>(path + '&email_delivery_status=is.null', 'PATCH', { email_delivery_status: 'sending' });
  if (!claimed.length) return false;
  let sent = false;
  try {
    const text = [
      'Purchase: ' + order.id, 'Plan: ' + order.plan, 'Premium key: ' + key, '',
      'Keep this key private. In Reiya, open Premium, paste your key, and select Activate.',
      'Manage or cancel recurring payments in PayPal. Find your purchases at https://seisen.store/reiya/account.',
    ].join('\n');
    sent = await new EmailService().sendReiyaPremiumKey(email, text);
  } finally {
    await database(path, 'PATCH', { email_delivery_status: sent ? 'sent' : 'failed' }).catch(() => {});
  }
  return sent;
}

export async function claimReiyaPurchase(id: string, claim: string | undefined, ip: string) {
  if (!REIYA_PURCHASE_ID.test(id) || !claim || !/^[a-f0-9]{64}$/.test(claim)) {
    throw new ReiyaPurchaseError(403, 'Open the receipt in the browser you used for checkout.');
  }
  await limit('receipt:' + ip, 40, 600);
  const path = 'seisen_reiya_orders?id=eq.' + id;
  const [order] = await database<Order[]>(path + '&select=*');
  if (!order || !/^[a-f0-9]{64}$/.test(order.claim_hash)
      || !timingSafeEqual(Buffer.from(order.claim_hash, 'hex'), Buffer.from(digest('claim', claim), 'hex'))) {
    throw new ReiyaPurchaseError(403, 'This browser does not have the purchase recovery token.');
  }
  const created = Date.parse(order.created_at);
  if (!Number.isFinite(created) || Date.now() - created > CLAIM_TTL_SECONDS * 1000) {
    throw new ReiyaPurchaseError(410, 'This receipt has expired. Recover your key in My Reiya Premium.');
  }
  const { order: fulfilled, email, key } = await fulfillPaidOrder(order);
  await database(path, 'PATCH', { delivered_at: new Date().toISOString() });
  const emailed = await emailPurchase(fulfilled, email, key).catch(() => false);
  return { key, emailed };
}

async function fulfillPaidOrder(order: Order) {
  const path = 'seisen_reiya_orders?id=eq.' + order.id;
  if (order.revoked_at) throw new ReiyaPurchaseError(409, 'This purchase is inactive.');
  if (order.refunded_at) throw new ReiyaPurchaseError(409, 'This purchase has been refunded.');
  const subscriptionId = order.paypal_subscription_id;
  if (!subscriptionId || !PAYPAL_SUBSCRIPTION.test(subscriptionId)) throw new ReiyaPurchaseError(409, 'Payment is still being prepared.');
  if (!isReiyaPlan(order.plan)) throw new ReiyaPurchaseError(503, 'Could not read this Reiya plan.');

  const subscription = await paypal<PayPalSubscription>('/v1/billing/subscriptions/' + subscriptionId);
  if (subscription.id !== subscriptionId || subscription.custom_id !== order.id) {
    throw new ReiyaPurchaseError(403, 'This receipt does not match the PayPal subscription.');
  }
  const expires = expiresAt(subscription, order.plan);
  const payer = payerInfo(subscription);
  await database(path, 'PATCH', payer);
  const proposedKey = 'REIYA-P-' + randomBytes(32).toString('hex').toUpperCase();
  await database('rpc/seisen_reiya_fulfill', 'POST', {
    p_order: order.id, p_subscription: subscriptionId, p_key_hash: digest('license', proposedKey),
    p_key_cipher: seal(proposedKey, 'delivery:' + order.id), p_cloud_cipher: seal(randomBytes(32).toString('base64'), 'cloud'),
    p_expires: expires,
  });
  const [fulfilled] = await database<Order[]>(path + '&select=*');
  if (!fulfilled || fulfilled.refunded_at || fulfilled.revoked_at || !fulfilled.key_ciphertext) {
    throw new ReiyaPurchaseError(409, 'The activation key is unavailable for this purchase.');
  }
  const key = unseal(fulfilled.key_ciphertext, 'delivery:' + order.id);
  return { order: fulfilled, email: payer.payer_email, key };
}


const WEBHOOK_FIELDS = {
  auth_algo: 'paypal-auth-algo', cert_url: 'paypal-cert-url', transmission_id: 'paypal-transmission-id',
  transmission_sig: 'paypal-transmission-sig', transmission_time: 'paypal-transmission-time',
} as const;

interface PayPalEventResource {
  id?: string;
  state?: string;
  status?: string;
  billing_agreement_id?: string;
  sale_id?: string;
  disputed_transactions?: { seller_transaction_id?: string }[];
  amount?: { value?: string; total?: string; currency_code?: string; currency?: string };
}

export async function handleReiyaWebhook(request: Request, value: unknown) {
  if (!reiyaBillingMode()) throw new ReiyaPurchaseError(503, 'Seisen Premium billing is not configured.');
  if (!value || typeof value !== 'object' || !('event_type' in value) || typeof value.event_type !== 'string') {
    throw new ReiyaPurchaseError(400, 'Invalid PayPal event.');
  }
  const verification: Record<string, unknown> = { webhook_id: env('REIYA_PAYPAL_WEBHOOK_ID'), webhook_event: value };
  for (const [name, header] of Object.entries(WEBHOOK_FIELDS)) {
    const field = request.headers.get(header);
    if (!field || field.length > 4096) throw new ReiyaPurchaseError(401, 'Missing PayPal webhook signature.');
    verification[name] = field;
  }
  const result = await paypal<{ verification_status?: string }>('/v1/notifications/verify-webhook-signature', verification);
  if (result.verification_status !== 'SUCCESS') throw new ReiyaPurchaseError(401, 'Invalid PayPal webhook signature.');

  const eventType = value.event_type;
  if (!['PAYMENT.SALE.COMPLETED', 'PAYMENT.SALE.REFUNDED', 'PAYMENT.SALE.REVERSED', 'CUSTOMER.DISPUTE.CREATED'].includes(eventType)) return;
  const resource = 'resource' in value && value.resource && typeof value.resource === 'object'
    ? value.resource as PayPalEventResource : {};
  let subscriptionId = resource.billing_agreement_id;
  let refund = resource;
  if (eventType === 'PAYMENT.SALE.REFUNDED') {
    if (!resource.id || !/^[A-Za-z0-9-]{1,64}$/.test(resource.id)) return;
    refund = await paypal<PayPalEventResource>('/v1/payments/refund/' + resource.id);
    if ((refund.state ?? refund.status)?.toLowerCase() !== 'completed') return;
    subscriptionId ||= refund.billing_agreement_id;
  }
  const saleId = eventType === 'CUSTOMER.DISPUTE.CREATED'
    ? resource.disputed_transactions?.[0]?.seller_transaction_id
    : refund.sale_id ?? (eventType === 'PAYMENT.SALE.REFUNDED' ? resource.sale_id : resource.id);
  if (!subscriptionId && saleId && /^[A-Za-z0-9-]{1,64}$/.test(saleId)) {
    const sale = await paypal<PayPalEventResource>('/v1/payments/sale/' + saleId);
    subscriptionId = sale.billing_agreement_id;
  }
  if (!subscriptionId || !PAYPAL_SUBSCRIPTION.test(subscriptionId)) return;
  const [order] = await database<Order[]>('seisen_reiya_orders?paypal_subscription_id=eq.' + subscriptionId + '&select=*');
  if (!order || !isReiyaPlan(order.plan)) return;
  if (eventType === 'PAYMENT.SALE.REFUNDED') {
    const amount = refund.amount;
    if (!matchesAmount({ value: amount?.value ?? amount?.total, currency_code: amount?.currency_code ?? amount?.currency }, order.plan)) return;
    await database('rpc/seisen_reiya_revoke', 'POST', { p_subscription: subscriptionId, p_refunded: true });
    return;
  }
  if (eventType === 'PAYMENT.SALE.REVERSED' || eventType === 'CUSTOMER.DISPUTE.CREATED') {
    await database('rpc/seisen_reiya_revoke', 'POST', { p_subscription: subscriptionId, p_refunded: false });
    return;
  }
  if (order.revoked_at || order.refunded_at) return;
  const { order: paid, email, key } = await fulfillPaidOrder(order);
  await emailPurchase(paid, email, key).catch(() => false);
}
