import Stripe from 'stripe';

export const createCheckoutSession = async (req, res) => {
    try {
        const { amount, tierName } = req.body;
        
        // Cents required by Stripe
        const unitAmount = Math.round(amount * 100);

        // If no key is configured in env, we simulate the success redirect 
        // to let the user see the UI flow.
        if (!process.env.STRIPE_SECRET_KEY) {
           return res.json({ 
             success: true, 
             url: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}?donation=success` : 'http://localhost:5173/?donation=success',
             simulated: true
           });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Buy Me A Coffee - ${tierName}`,
                            description: `Thank you for supporting Taskora! ☕`,
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}?donation=success` : 'http://localhost:5173/?donation=success',
            cancel_url: process.env.FRONTEND_URL || 'http://localhost:5173/',
        });

        res.json({ success: true, url: session.url });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}
// Restart trigger 2
