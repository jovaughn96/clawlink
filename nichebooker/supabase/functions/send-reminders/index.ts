// Cron target scaffold. Run every 5-10 minutes.
// Finds due reminder_jobs, emits message_logs entries, marks jobs sent/failed.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: dueJobs, error } = await supabaseAdmin
    .from("reminder_jobs")
    .select("id, workspace_id, appointment_id, reminder_type")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(100);

  if (error) return new Response(error.message, { status: 500 });

  for (const job of dueJobs ?? []) {
    try {
      // Placeholder: integrate Twilio/Resend here.
      await supabaseAdmin.from("message_logs").insert({
        workspace_id: job.workspace_id,
        appointment_id: job.appointment_id,
        channel: "sms",
        template_key: `reminder_${job.reminder_type}`,
        status: "sent",
        sent_at: new Date().toISOString(),
        payload_json: { source: "send-reminders" },
      });

      await supabaseAdmin.from("reminder_jobs").update({ status: "sent", attempts: 1 }).eq("id", job.id);
    } catch (e) {
      await supabaseAdmin
        .from("reminder_jobs")
        .update({
          status: "failed",
          attempts: 1,
          last_error: e instanceof Error ? e.message : "unknown",
        })
        .eq("id", job.id);
    }
  }

  return Response.json({ processed: dueJobs?.length ?? 0 });
});
