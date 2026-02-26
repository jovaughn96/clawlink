export type WorkspacePlan = "free" | "pro" | "premium";

export type NicheKey = "lash-tech" | "mobile-detailer" | "tutor";

export interface Workspace {
  id: string;
  name: string;
  owner_user_id: string;
  niche_key: NicheKey;
  plan: WorkspacePlan;
  created_at: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  tags_json?: string[];
  custom_fields_json?: Record<string, unknown>;
  created_at: string;
}

export interface Service {
  id: string;
  workspace_id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  deposit_type: "none" | "fixed" | "percent";
  deposit_value: number;
  is_active: boolean;
  custom_fields_json?: Record<string, unknown>;
}

export interface Appointment {
  id: string;
  workspace_id: string;
  client_id: string;
  service_id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  starts_at: string;
  ends_at: string;
  timezone: string;
  subtotal_cents: number;
  deposit_required_cents: number;
  deposit_paid_cents: number;
  location_text?: string;
  notes?: string;
  custom_fields_json?: Record<string, unknown>;
}
