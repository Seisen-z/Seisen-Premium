import { NextRequest, NextResponse } from 'next/server';
import { PayPalSDK } from '@/lib/server/paypal';
import { VatCalculator } from '@/lib/server/vat';
import { TicketDatabase } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, quantity: rawQuantity } = body;

    // Validate quantity (1–10)
    const quantity = Math.max(1, Math.min(10, parseInt(String(rawQuantity || '1'), 10) || 1));

    // Pricing (Server-side validation) — Updated: Monthly €6, Lifetime €12
    const pricing: Record<string, number> = {
        weekly: 3,
        monthly: 6,
        lifetime: 12
    };

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

    const returnUrl = `${frontendUrl}/premium`;
    const cancelUrl = `${frontendUrl}/premium?canceled=true`;

    // Encode quantity into custom_id so capture-order can read it: "lifetime:3"
    const customId = `${tier}:${quantity}`;
    
    const orderData = {
        amount: taxDetails.totalAmount,
        currency: 'EUR',
        description: quantity > 1 ? `Seisen Hub Premium Key x${quantity}` : 'Seisen Hub Premium Key',
        tier: customId,  // custom_id carries "tier:quantity"
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
