import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { TicketDatabase } from '@/lib/server/db';
import { VatCalculator } from '@/lib/server/vat';

export async function POST(req: NextRequest) {
    try {
        const rawSession = req.cookies.get('discord_session')?.value;
        if (!rawSession) {
            return NextResponse.json(
                { error: 'Discord login is required before starting checkout.' },
                { status: 401 }
            );
        }

        let discordUser: { id: string; tag: string; username: string; avatar?: string } | null = null;
        try {
            discordUser = JSON.parse(Buffer.from(decodeURIComponent(rawSession), 'base64').toString('utf-8'));
        } catch {
            return NextResponse.json(
                { error: 'Invalid Discord session. Please log in with Discord again.' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { tier, quantity: rawQuantity } = body;
        const quantity = Math.max(1, Math.min(10, parseInt(String(rawQuantity || '1'), 10) || 1));

        const pricing: Record<string, number> = {
            weekly: 3,
            monthly: 6,
            lifetime: 10,
        };

        if (!tier || !pricing[tier]) {
            return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        const db = new TicketDatabase();
        const methodStocks = await db.getPaymentMethodStocks();
        const currentStock = methodStocks[tier]?.stripe ?? 0;
        if (currentStock < quantity) {
            return NextResponse.json(
                { error: `Not enough stock. Only ${currentStock} left for this plan.` },
                { status: 409 }
            );
        }

        const baseAmount = pricing[tier] * quantity;
        const country = VatCalculator.getCountryFromRequest(req);
        const taxDetails = VatCalculator.calculateTax(baseAmount, country);
        const amountCents = Math.round(taxDetails.totalAmount * 100);

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
        const frontendUrl = req.nextUrl.origin;

        const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
        const productName = quantity > 1
            ? `Seisen Hub Premium – ${tierLabel} Plan ×${quantity}`
            : `Seisen Hub Premium – ${tierLabel} Plan`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: productName,
                        description: 'All premium scripts · No key system · Priority support · Early access',
                    },
                    unit_amount: amountCents,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${frontendUrl}/premium?stripe_session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/premium?canceled=true`,
            customer_email: undefined,
            metadata: {
                tier,
                quantity: String(quantity),
                discordId: discordUser?.id || '',
                discordTag: discordUser?.tag || '',
                discordAvatar: discordUser?.avatar || '',
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe create-checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create Stripe checkout session' },
            { status: 500 }
        );
    }
}
