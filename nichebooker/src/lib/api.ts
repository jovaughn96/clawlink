import { supabase } from "./supabase";
import type { Appointment, Client, Service, Workspace } from "../types/domain";

export async function getSessionUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function ensureWorkspace(nicheKey: Workspace["niche_key"] = "lash-tech") {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data: existing, error: existingErr } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing) return existing as Workspace;

  const { data: created, error: createErr } = await supabase
    .from("workspaces")
    .insert({
      name: "My Workspace",
      owner_user_id: userId,
      niche_key: nicheKey,
      plan: "free",
    })
    .select("*")
    .single();

  if (createErr) throw createErr;

  await supabase.from("workspace_users").insert({
    workspace_id: created.id,
    user_id: userId,
    role: "owner",
  });

  return created as Workspace;
}

export async function listClients(workspaceId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function createClient(
  workspaceId: string,
  payload: Pick<Client, "first_name" | "last_name" | "phone" | "email">
) {
  const { data, error } = await supabase
    .from("clients")
    .insert({ workspace_id: workspaceId, ...payload })
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(clientId: string) {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
}

export async function listServices(workspaceId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function createService(
  workspaceId: string,
  payload: Pick<Service, "name" | "duration_min" | "price_cents">
) {
  const { data, error } = await supabase
    .from("services")
    .insert({ workspace_id: workspaceId, ...payload })
    .select("*")
    .single();
  if (error) throw error;
  return data as Service;
}

export async function deleteService(serviceId: string) {
  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  if (error) throw error;
}

export async function listAppointments(workspaceId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("starts_at", { ascending: true })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function createAppointment(
  workspaceId: string,
  payload: Pick<Appointment, "client_id" | "service_id" | "starts_at" | "ends_at" | "timezone" | "subtotal_cents"> &
    Partial<Pick<Appointment, "deposit_required_cents" | "status">>
) {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      workspace_id: workspaceId,
      status: payload.status ?? "pending",
      deposit_required_cents: payload.deposit_required_cents ?? 0,
      deposit_paid_cents: 0,
      ...payload,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function deleteAppointment(appointmentId: string) {
  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId);
  if (error) throw error;
}

export async function createDepositIntent(appointmentId: string) {
  const { data, error } = await supabase.functions.invoke("create-deposit-intent", {
    body: { appointmentId },
  });
  if (error) throw error;
  return data as { clientSecret?: string; paymentIntentId?: string };
}
