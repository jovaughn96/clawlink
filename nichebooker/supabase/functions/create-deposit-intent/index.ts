// Supabase Edge Function scaffold: create-deposit-intent
// Deploy with: supabase functions deploy create-deposit-intent

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
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return new Response("Unauthorized", { status: 401 });

    const { appointmentId } = await req.json();
    if (!appointmentId) return new Response("appointmentId required", { status: 400 });

    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select("id, workspace_id, deposit_required_cents")
      .eq("id", appointmentId)
      .single();

    if (apptErr || !appt) return new Response("Appointment not found", { status: 404 });

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

    const intent = await stripe.paymentIntents.create({
      amount: appt.deposit_required_cents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { appointment_id: appt.id, workspace_id: appt.workspace_id },
    });

    return Response.json({ paymentIntentId: intent.id, clientSecret: intent.client_secret });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(message, { status: 500 });
  }
});
