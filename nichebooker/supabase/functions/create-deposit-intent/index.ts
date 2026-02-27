import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@16.10.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { appointmentId } = await req.json();
    if (!appointmentId) return new Response("appointmentId required", { status: 400 });

    const { data: appt } = await supabase
      .from("appointments")
      .select("id, workspace_id, deposit_required_cents, deposit_payment_intent_id")
      .eq("id", appointmentId)
      .single();

    if (!appt) return new Response("Appointment not found", { status: 404 });

    const { data: member } = await supabase
      .from("workspace_users")
      .select("workspace_id")
      .eq("workspace_id", appt.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) return new Response("Forbidden", { status: 403 });

    if (!appt.deposit_required_cents || appt.deposit_required_cents <= 0) {
      return Response.json({ paymentIntentId: null, clientSecret: null, message: "No deposit required" });
    }

    if (appt.deposit_payment_intent_id) {
      const existing = await stripe.paymentIntents.retrieve(appt.deposit_payment_intent_id);
      return Response.json({ paymentIntentId: existing.id, clientSecret: existing.client_secret });
    }

    const idemKey = `deposit:${appt.id}:${appt.deposit_required_cents}`;
    const intent = await stripe.paymentIntents.create(
      {
        amount: appt.deposit_required_cents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { appointment_id: appt.id, workspace_id: appt.workspace_id },
      },
      { idempotencyKey: idemKey }
    );

    await supabase
      .from("appointments")
      .update({ deposit_payment_intent_id: intent.id })
      .eq("id", appt.id);

    return Response.json({ paymentIntentId: intent.id, clientSecret: intent.client_secret });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unknown error", { status: 500 });
  }
});
