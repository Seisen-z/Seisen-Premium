import crypto from 'crypto';

interface JunkieConfig {
  webhookUrl?: string;
  webhookUrlWeekly?: string;
  webhookUrlMonthly?: string;
  webhookUrlLifetime?: string;
  hmacSecret?: string;
  provider?: string;
  defaultService?: string;
}

export interface JunkieResponse {
  success: boolean;
  keys?: string[];
  webhookResponse?: any;
  error?: string;
  details?: any;
}

export class JunkieKeySystem {
  private webhookUrls: Record<string, string | undefined>;
  private hmacSecret?: string;
  private provider: string;
  private defaultService: string;

  constructor(config: JunkieConfig) {
    this.webhookUrls = {
      weekly: config.webhookUrlWeekly || config.webhookUrl,
      monthly: config.webhookUrlMonthly || config.webhookUrl,
      lifetime: config.webhookUrlLifetime || config.webhookUrl
    };
    this.hmacSecret = config.hmacSecret ? config.hmacSecret.trim() : undefined;
    this.provider = config.provider || 'seisenhub';
    this.defaultService = config.defaultService || 'Premium Key';
  }

  generateHMAC(payload: any): string | null {
    if (!this.hmacSecret) {
      return null;
    }
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * POST with manual redirect following so the method is ALWAYS preserved as POST.
   * axios (and Node's built-in http) silently convert POST → GET on 301/302 redirects —
   * that causes Junkie's server to see "Cannot GET /path".
   */
  private async postWithRedirects(
    url: string,
    body: any,
    headers: Record<string, string>,
    maxRedirects = 5
  ): Promise<{ status: number; data: any }> {
    let currentUrl = url;
    const bodyStr = JSON.stringify(body);

    for (let attempt = 0; attempt <= maxRedirects; attempt++) {
      const res = await fetch(currentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, */*',
          'User-Agent': 'SeisenHub-Webhook/1.0',
          ...headers,
        },
        body: bodyStr,
        // Disable auto-follow so we can re-send as POST instead of GET
        redirect: 'manual',
      } as RequestInit);

      // 3xx — manually follow while keeping POST + body
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
          throw new Error(`Redirect (HTTP ${res.status}) with no Location header`);
        }
        const next = new URL(location, currentUrl).toString();
        console.log(`Junkie redirect ${res.status}: ${currentUrl} → ${next}`);
        currentUrl = next;
        continue;
      }

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      // Treat 4xx/5xx as errors so they hit our catch block
      if (res.status >= 400) {
        const err: any = new Error(`HTTP ${res.status}`);
        err.response = { status: res.status, data };
        throw err;
      }

      return { status: res.status, data };
    }

    throw new Error('Too many redirects when calling Junkie webhook');
  }

  async generateKey(options: any): Promise<JunkieResponse> {
    const {
      tier = 'weekly',
      validity = 168,
      quantity = 1,
      userInfo = {},
      paymentInfo = {}
    } = options;

    const payload = {
      item: {
        product: {
          name: 'Premium Key'
        },
        quantity: quantity
      },
      user: {
        email: userInfo.email || '',
        payerId: userInfo.payerId || '',
        robloxUsername: userInfo.robloxUsername || userInfo.custom || ''
      },
      payment: {
        tier: tier,
        amount: paymentInfo.amount || 0,
        currency: paymentInfo.currency || 'EUR',
        transactionId: paymentInfo.transactionId || '',
        timestamp: new Date().toISOString()
      },
      metadata: {
        provider: this.provider,
        service: this.defaultService,
        validity: validity,
        source: 'paypal_webhook'
      }
    };

    try {
      const headers: Record<string, string> = {};

      if (this.hmacSecret) {
        headers['X-Webhook-Signature'] = this.generateHMAC(payload) ?? '';
      }

      const webhookUrl = this.webhookUrls[tier] || this.webhookUrls.weekly;

      if (!webhookUrl) {
        throw new Error('No webhook URL configured for this tier');
      }

      console.log('Calling Junkie webhook for tier:', tier, '| URL:', webhookUrl);

      const { status, data: responseBody } = await this.postWithRedirects(webhookUrl, payload, headers);

      console.log('Junkie webhook response status:', status, '| body:', responseBody);

      // Detect HTML error pages (Cloudflare challenge / "Cannot GET /...")
      if (typeof responseBody === 'string' && responseBody.trim().startsWith('<')) {
        console.error('Junkie returned HTML — endpoint inactive or URL wrong:', responseBody.substring(0, 300));
        return {
          success: false,
          error: 'Key service is unavailable (received HTML instead of JSON). Please check the Junkie webhook is active.',
          details: status
        };
      }

      let keys: string[] = [];
      if (typeof responseBody === 'string') {
        keys = [responseBody];
      } else if (responseBody.keys && Array.isArray(responseBody.keys)) {
        keys = responseBody.keys;
      } else if (responseBody.key) {
        keys = [responseBody.key];
      } else if (Array.isArray(responseBody)) {
        keys = responseBody;
      }

      return {
        success: true,
        keys,
        webhookResponse: responseBody
      };

    } catch (error: any) {
      const rawError = error.response?.data;
      const status  = error.response?.status;
      console.error('Junkie webhook error (status:', status ?? 'none', '):', rawError ?? error.message);

      // Sanitise HTML errors — never expose raw markup to callers
      let cleanError: string;
      if (typeof rawError === 'string' && rawError.trim().startsWith('<')) {
        cleanError = `Webhook endpoint returned HTTP ${status ?? 'unknown'} — the key service URL may be incorrect or inactive.`;
      } else {
        cleanError = (typeof rawError === 'string' ? rawError : null) ?? error.message ?? 'Unknown webhook error';
      }

      return {
        success: false,
        error: cleanError,
        details: status ?? 'Unknown error'
      };
    }
  }
}
