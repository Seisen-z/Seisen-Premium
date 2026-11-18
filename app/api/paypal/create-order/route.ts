import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { VatCalculator } from '@/lib/server/vat';
import { TicketDatabase } from '@/lib/server/db';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  try {
        const limitResult = rateLimit(`paypal:create-order:${getClientIp(req)}`, 8, 60_000);
        if (!limitResult.allowed) return rateLimitResponse(limitResult);

        // Require Discord auth before starting PayPal checkout.
        const rawSession = req.cookies.get('discord_session')?.value;
        if (!rawSession) {
            return NextResponse.json(
                { error: 'Discord login is required before starting PayPal checkout.' },
                { status: 401 }
            );
        }

        try {
            JSON.parse(Buffer.from(decodeURIComponent(rawSession), 'base64').toString('utf-8'));
        } catch {
            return NextResponse.json(
                { error: 'Invalid Discord session. Please log in with Discord again.' },
                { status: 401 }
            );
        }

    const body = await req.json();

    // Pricing (server-side authoritative)
    const pricing: Record<string, number> = {
        weekly: 3, monthly: 6, annual: 60, annual_weekly: 30, lifetime: 12,
    };

    // ── Cart mode: body.items = [{tier, quantity}, ...] ──────────────────────
    type CartItem = { tier: string; quantity: number };
    const cartItems: CartItem[] | undefined = Array.isArray(body.items) ? body.items : undefined;

    if (cartItems) {
        // Validate every item
        for (const ci of cartItems) {
            const qty = Math.max(1, Math.min(5, parseInt(String(ci.quantity || 1), 10) || 1));
            ci.quantity = qty;
            if (!ci.tier || !pricing[ci.tier]) {
                return NextResponse.json({ error: `Invalid tier: ${ci.tier}` }, { status: 400 });
            }
        }

        const db = new TicketDatabase();
        const methodStocks = await db.getPaymentMethodStocks();
        for (const ci of cartItems) {
            const stock = methodStocks[ci.tier]?.paypal ?? 0;
            if (stock < ci.quantity) {
                return NextResponse.json({ error: `Not enough stock for ${ci.tier}. Only ${stock} left.` }, { status: 409 });
            }
        }

        const totalBase = cartItems.reduce((s, ci) => s + pricing[ci.tier] * ci.quantity, 0);
        const country = VatCalculator.getCountryFromRequest(req);
        const taxDetails = VatCalculator.calculateTax(totalBase, country);

        const paypal = new PayPalSDK({
            clientId: process.env.PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
            sandboxMode: process.env.PAYPAL_SANDBOX === 'true',
        });

        const frontendUrl = req.nextUrl.origin;
        // Encode cart: "cart|monthly:2|lifetime:1"
        const customId = 'cart|' + cartItems.map(ci => `${ci.tier}:${ci.quantity}`).join('|');
        const totalQty  = cartItems.reduce((s, ci) => s + ci.quantity, 0);

        const order = await paypal.createOrder({
            amount: taxDetails.totalAmount,
            currency: 'EUR',
            description: `Seisen Hub Premium x${totalQty}`,
            tier: customId,
            returnUrl: `${frontendUrl}/cart`,
            cancelUrl: `${frontendUrl}/cart?canceled=true`,
            breakdown: {
                item_total: { currency_code: 'EUR', value: totalBase.toFixed(2) },
                tax_total:  { currency_code: 'EUR', value: taxDetails.taxAmount.toFixed(2) },
            },
        });

        return NextResponse.json({ ...order, taxDetails: { country, ...taxDetails } });
    }

    // ── Single-tier mode (existing flow) ─────────────────────────────────────
    const { tier, quantity: rawQuantity } = body;

    // Validate quantity (1–10)
    const quantity = Math.max(1, Math.min(10, parseInt(String(rawQuantity || '1'), 10) || 1));

    if (!tier || !pricing[tier]) {
         return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

        const db = new TicketDatabase();
        const methodStocks = await db.getPaymentMethodStocks();
        const currentStock = methodStocks[tier]?.paypal ?? 0;
        if (currentStock < quantity) {
            return NextResponse.json({ error: `Not enough stock. Only ${currentStock} left for this plan.` }, { status: 409 });
        }

    const baseAmount = pricing[tier];
    const totalBaseAmount = baseAmount * quantity;

    // VAT Calculation (on total)
    const country = VatCalculator.getCountryFromRequest(req);
    const taxDetails = VatCalculator.calculateTax(totalBaseAmount, country);

    const paypal = new PayPalSDK({
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        sandboxMode: process.env.PAYPAL_SANDBOX === 'true'
    });

    // Dynamic Frontend URL for Redirects
    const frontendUrl = req.nextUrl.origin;

    const returnUrl = `${frontendUrl}/checkout?plan=${tier}`;
    const cancelUrl = `${frontendUrl}/checkout?plan=${tier}&canceled=true`;

    // Encode quantity into custom_id so capture-order can read it: "lifetime:3"
    const customId = `${tier}:${quantity}`;

    const orderData = {
        amount: taxDetails.totalAmount,
        currency: 'EUR',
        description: quantity > 1 ? `Seisen Hub Premium Key x${quantity}` : 'Seisen Hub Premium Key',
        tier: customId,
        returnUrl,
        cancelUrl,
        breakdown: {
            item_total: { currency_code: 'EUR', value: totalBaseAmount.toFixed(2) },
            tax_total: { currency_code: 'EUR', value: taxDetails.taxAmount.toFixed(2) }
        }
    };

    const order = await paypal.createOrder(orderData);
    return NextResponse.json({
        ...order,
        taxDetails: {
            country,
            vatRate: taxDetails.vatRate,
            taxAmount: taxDetails.taxAmount,
            subtotal: taxDetails.subtotal,
            totalAmount: taxDetails.totalAmount
        }
    });

  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json(
        { error: error.message || 'Failed to create order' }, 
        { status: 500 }
    );
  }
}
