import crypto from 'crypto';

interface JunkieConfig {
  apiKey: string;
  providerId: number;
  serviceId?: number;
}

export interface JunkieResponse {
  success: boolean;
  keys?: string[];
  error?: string;
  details?: any;
}

const VALIDITY_MINUTES: Record<string, number | null> = {
  weekly:        10080,   // 168 h
  monthly:       43200,   // 720 h
  annual:        525600,  // 8760 h
  annual_weekly: 525600,
  lifetime:      null,    // never expires
};

export class JunkieKeySystem {
  private apiKey: string;
  private providerId: number;
  private serviceId?: number;

  constructor(config: JunkieConfig) {
    this.apiKey = config.apiKey;
    this.providerId = config.providerId;
    this.serviceId = config.serviceId;
  }

  async generateKey(options: any): Promise<JunkieResponse> {
    const { tier = 'weekly', userInfo = {}, paymentInfo = {} } = options;

    const validityMinutes = VALIDITY_MINUTES[tier] ?? 10080;

    // Derive a stable UUID from the transactionId so retries stay idempotent.
    const requestId = paymentInfo.transactionId
      ? this.hexToUUID(crypto.createHash('sha256').update(String(paymentInfo.transactionId)).digest('hex'))
      : crypto.randomUUID();

    const body: Record<string, any> = {
      provider_id: this.providerId,
      request_id:  requestId,
      is_premium:  true,
    };

    if (this.serviceId)         body.service_id       = this.serviceId;
    if (validityMinutes !== null) body.validity_minutes = validityMinutes;
    if (userInfo.discordId)     body.discord_id        = String(userInfo.discordId);

    try {
      const res = await fetch('https://api.jnkie.com/api/v2/keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!res.ok) {
        const errMsg = data?.error?.message || data?.message || `HTTP ${res.status}`;
        return { success: false, error: errMsg, details: res.status };
      }

      const keyValue: string | undefined = data?.key?.key_value;
      if (!keyValue) {
        return { success: false, error: 'No key_value in API response', details: data };
      }

      return { success: true, keys: [keyValue] };

    } catch (error: any) {
      return { success: false, error: error.message ?? 'Unknown error', details: null };
    }
  }

  async findKeyByValue(keyValue: string): Promise<{ id: number; expires_at: string | null } | null> {
    const url = new URL('https://api.jnkie.com/api/v2/keys');
    url.searchParams.set('key', keyValue);
    url.searchParams.set('provider_id', String(this.providerId));
    url.searchParams.set('limit', '10');

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const keys: any[] = data?.keys ?? [];
    const match = keys.find((k: any) => k.key_value === keyValue);
    return match ? { id: match.id, expires_at: match.expires_at ?? null } : null;
  }

  async extendKey(keyId: number, addDays: number, currentExpiresAt: string | null): Promise<boolean> {
    const base = currentExpiresAt ? new Date(currentExpiresAt) : new Date();
    if (base.getTime() < Date.now()) base.setTime(Date.now());
    const newExpiry = new Date(base.getTime() + addDays * 86_400_000);

    const res = await fetch(`https://api.jnkie.com/api/v2/keys/${keyId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ expires_at: newExpiry.toISOString() }),
    });
    return res.ok;
  }

  private hexToUUID(hex: string): string {
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  }
}

export function createJunkieFromEnv(): JunkieKeySystem {
  const apiKey     = process.env.JUNKIE_API_KEY;
  const providerId = parseInt(process.env.JUNKIE_PROVIDER_ID || '0', 10);
  const serviceId  = process.env.JUNKIE_SERVICE_ID
    ? parseInt(process.env.JUNKIE_SERVICE_ID, 10)
    : undefined;

  if (!apiKey)     throw new Error('JUNKIE_API_KEY is not set');
  if (!providerId) throw new Error('JUNKIE_PROVIDER_ID is not set');

  return new JunkieKeySystem({ apiKey, providerId, serviceId });
}
