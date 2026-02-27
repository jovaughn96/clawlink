// Supabase Edge Function scaffold: stripe-webhook
// Set STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@16.10.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) return new Response("Missing stripe-signature", { status: 400 });

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const appointmentId = intent.metadata?.appointment_id;
      if (appointmentId) {
        await supabaseAdmin
          .from("appointments")
          .update({ deposit_paid_cents: intent.amount_received, status: "confirmed" })
          .eq("id", appointmentId);
      }
    }

    return new Response("ok");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(message, { status: 400 });
  }
});
