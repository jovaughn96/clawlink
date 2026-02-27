// Cron target scaffold. Run every 5-10 minutes.
// Finds due reminder_jobs, sends SMS/email when configured, logs result, marks jobs sent/failed.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type ReminderType = "24h" | "2h";

function buildReminderText(reminderType: ReminderType, clientName: string, startsAt: string, serviceName: string) {
  const when = new Date(startsAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const lead = reminderType === "24h" ? "in about 24 hours" : "in about 2 hours";
  return `Hi ${clientName}, reminder: your ${serviceName} appointment is ${lead} (${when}). Reply if you need to reschedule.`;
}

async function sendTwilioSms(to: string, body: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!sid || !token || !from) throw new Error("Twilio not configured");

  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  const payload = await resp.text();
  if (!resp.ok) throw new Error(`Twilio send failed: ${resp.status} ${payload}`);

  return payload;
}

async function sendResendEmail(to: string, subject: string, text: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!key || !from) throw new Error("Resend not configured");

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  const payload = await resp.text();
  if (!resp.ok) throw new Error(`Resend send failed: ${resp.status} ${payload}`);

  return payload;
}

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: dueJobs, error } = await supabaseAdmin
    .from("reminder_jobs")
    .select("id, workspace_id, appointment_id, reminder_type, attempts")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(100);

  if (error) return new Response(error.message, { status: 500 });

  for (const job of dueJobs ?? []) {
    try {
      await supabaseAdmin.from("reminder_jobs").update({ status: "processing" }).eq("id", job.id).eq("status", "pending");

      const { data: appointment, error: apptErr } = await supabaseAdmin
        .from("appointments")
        .select("id, starts_at, workspace_id, client_id, service_id")
        .eq("id", job.appointment_id)
        .single();
      if (apptErr || !appointment) throw new Error(apptErr?.message ?? "Missing appointment");

      const [{ data: client, error: clientErr }, { data: service, error: serviceErr }] = await Promise.all([
        supabaseAdmin.from("clients").select("first_name, last_name, phone, email").eq("id", appointment.client_id).single(),
        supabaseAdmin.from("services").select("name").eq("id", appointment.service_id).single(),
      ]);
      if (clientErr || !client) throw new Error(clientErr?.message ?? "Missing client");
      if (serviceErr || !service) throw new Error(serviceErr?.message ?? "Missing service");

      const clientName = `${client.first_name} ${client.last_name}`.trim();
      const text = buildReminderText(job.reminder_type as ReminderType, clientName, appointment.starts_at, service.name);

      let channel: "sms" | "email" = "sms";
      let recipient = client.phone ?? "";
      let providerPayload = "";

      if (client.phone) {
        providerPayload = await sendTwilioSms(client.phone, text);
      } else if (client.email) {
        channel = "email";
        recipient = client.email;
        providerPayload = await sendResendEmail(client.email, "Appointment reminder", text);
      } else {
        throw new Error("Client has no phone or email for reminders");
      }

      await supabaseAdmin.from("message_logs").insert({
        workspace_id: job.workspace_id,
        appointment_id: job.appointment_id,
        channel,
        recipient,
        template_key: `reminder_${job.reminder_type}`,
        status: "sent",
        sent_at: new Date().toISOString(),
        payload_json: { source: "send-reminders", providerPayload },
      });

      await supabaseAdmin
        .from("reminder_jobs")
        .update({ status: "sent", attempts: (job.attempts ?? 0) + 1, last_error: null })
        .eq("id", job.id);
    } catch (e) {
      await supabaseAdmin
        .from("reminder_jobs")
        .update({
          status: "failed",
          attempts: (job.attempts ?? 0) + 1,
          last_error: e instanceof Error ? e.message : "unknown",
        })
        .eq("id", job.id);
    }
  }

  return Response.json({ processed: dueJobs?.length ?? 0 });
});
