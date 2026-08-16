import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Billing isn't configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID." },
      { status: 501 }
    );
  }

  const stripe = new Stripe(secretKey);
  const origin = req.headers.get("origin") ?? "https://clipcompass.netlify.app";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/dashboard`,
    metadata: { userId: user.id }
  });

  return NextResponse.json({ url: session.url });
}
