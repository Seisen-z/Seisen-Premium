import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, plan, qty } = body;

        if (!plan) {
            return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
        }

        const quantity = Math.max(1, qty || 1);

        // PHP amounts in centavos (multiply by 100).
        // Matching the gcashPlans prices: Weekly ₱250, Monthly ₱400, Lifetime ₱700
        let unitAmount = 0;
        let planName = '';

        switch (plan.toLowerCase()) {
            case 'weekly':
                unitAmount = 25000; // ₱250
                planName = 'Seisen Premium - Weekly (7 Days)';
                break;
            case 'monthly':
                unitAmount = 40000; // ₱400
                planName = 'Seisen Premium - Monthly (30 Days)';
                break;
            case 'lifetime':
                unitAmount = 70000; // ₱700
                planName = 'Seisen Premium - Lifetime';
                break;
            default:
                return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        if (!process.env.PAYMONGO_SECRET_KEY) {
             return NextResponse.json({ error: 'Server configuration error: missing payment keys' }, { status: 500 });
        }

        // Base64 encode secret key for HTTP Basic Auth
        const base64Auth = Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64');

        // Build an email prefix for the reference number  
        const emailPrefix = email ? email.substring(0, 12).replace('@', '_') : 'customer';
        const referenceNumber = `${plan.toUpperCase()}_${quantity}_${emailPrefix}_${Date.now()}`;

        const origin = req.headers.get('origin') || 'https://seisenpremium.com';

        const payload = {
            data: {
                attributes: {
                    ...(email ? { billing: { email } } : {}),
                    line_items: [
                        {
                            currency: 'PHP',
                            amount: unitAmount,
                            description: planName,
                            name: `Seisen Premium (${plan.toUpperCase()})`,
                            quantity: quantity
                        }
                    ],
                    payment_method_types: ['gcash', 'paymaya', 'card'],
                    send_email_receipt: true,
                    show_description: true,
                    show_line_items: true,
                    description: `${quantity}x ${planName}`,
                    cancel_url: `${origin}/premium`,
                    success_url: `${origin}/premium?payment_success=true&method=gcash`,
                    reference_number: referenceNumber
                }
            }
        };

        const res = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64Auth}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('PayMongo Checkout Error:', JSON.stringify(data));
            return NextResponse.json({ 
                error: data?.errors?.[0]?.detail || 'Payment gateway error' 
            }, { status: res.status });
        }

        return NextResponse.json({ checkoutUrl: data.data.attributes.checkout_url });

    } catch (error: any) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
