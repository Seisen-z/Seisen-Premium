import axios from 'axios';

interface PayPalConfig {
    clientId: string;
    clientSecret: string;
    sandboxMode?: boolean;
}

export class PayPalSDK {
    private clientId: string;
    private clientSecret: string;
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor(config: PayPalConfig) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.baseUrl = config.sandboxMode 
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
    }

    async getAccessToken(): Promise<string> {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            const response = await axios.post(
                `${this.baseUrl}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);
            return this.accessToken!;
        } catch (error: any) {
            console.error('PayPal OAuth error:', error.response?.data || error.message);
            throw new Error('Failed to get PayPal access token');
        }
    }

    async createOrder(orderData: any) {
        const { amount, currency = 'EUR', description, tier, returnUrl, cancelUrl } = orderData;
        try {
            const token = await this.getAccessToken();
            const order = {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                        breakdown: orderData.breakdown
                    },
                    description: `${description} - ${tier}`,
                    custom_id: tier
                }],
                application_context: {
                    return_url: returnUrl,
                    cancel_url: cancelUrl,
                    brand_name: 'Seisen Hub',
                    user_action: 'PAY_NOW',
                    shipping_preference: 'NO_SHIPPING'
                }
            };

            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders`,
                order,
                {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('PayPal create order error:', error.response?.data || error.message);
            throw new Error('Failed to create PayPal order');
        }
    }

    async captureOrder(orderId: string) {
        try {
            const token = await this.getAccessToken();
            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
                {},
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            return response.data;
        } catch (error: any) {
            console.error('PayPal capture error:', error.response?.data || error.message);
            throw new Error('Failed to capture PayPal payment');
        }
    }

    async addTrackingToReleaseFunds(transactionId: string) {
        try {
            const token = await this.getAccessToken();
            const payload = {
                trackers: [
                    {
                        transaction_id: transactionId,
                        status: "SHIPPED",
                        notify_buyer: false
                    }
                ]
            };

            const response = await axios.post(
                `${this.baseUrl}/v1/shipping/trackers-batch`,
                payload,
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            return response.data;
        } catch (error: any) {
            console.error('PayPal add tracking error:', error.response?.data?.details || error.response?.data || error.message);
            // We return null so it doesn't interrupt the main flow if tracking fails
            return null;
        }
    }

    extractPaymentInfo(captureData: any) {
        const purchaseUnit = captureData.purchase_units[0];
        const capture = purchaseUnit.payments.captures[0];
        const payer = captureData.payer;

        return {
            orderId: captureData.id,
            transactionId: capture.id,
            amount: parseFloat(capture.amount.value),
            currency: capture.amount.currency_code,
            tier: purchaseUnit.payments?.captures?.[0]?.custom_id || purchaseUnit.custom_id || 'weekly',
            status: capture.status,
            payerEmail: payer.email_address,
            payerName: `${payer.name.given_name} ${payer.name.surname}`,
            payerId: payer.payer_id,
            createTime: capture.create_time
        };
    }
}
