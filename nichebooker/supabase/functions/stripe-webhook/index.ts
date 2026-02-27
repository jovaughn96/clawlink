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

    const { data: existing } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existing) return new Response("ok");

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const appointmentId = intent.metadata?.appointment_id;
      if (appointmentId) {
        await supabaseAdmin
          .from("appointments")
          .update({
            deposit_paid_cents: intent.amount_received,
            deposit_payment_intent_id: intent.id,
            status: "confirmed",
          })
          .eq("id", appointmentId);
      }
    }

    await supabaseAdmin.from("stripe_webhook_events").insert({
      event_id: event.id,
      event_type: event.type,
    });

    return new Response("ok");
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unknown error", { status: 400 });
  }
});
