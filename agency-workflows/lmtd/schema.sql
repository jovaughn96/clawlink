-- LMTD Studios CRM + Ops schema (SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  services_requested TEXT, -- JSON array
  budget_signal TEXT,
  timeline_signal TEXT,
  fit_notes TEXT,
  score INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('new','qualified','needs_more_info','nurture_later','won','lost')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_scores (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  budget_score INTEGER DEFAULT 0,
  timeline_score INTEGER DEFAULT 0,
  service_fit_score INTEGER DEFAULT 0,
  urgency_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  rationale TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  markdown_path TEXT,
  pdf_path TEXT,
  service_mix TEXT, -- JSON array
  scope_summary TEXT,
  assumptions TEXT,
  pricing_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft','pending_approval','approved','sent','accepted','rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),
  proposal_id TEXT REFERENCES proposals(id),
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  stage TEXT NOT NULL,
  health TEXT NOT NULL DEFAULT 'on_track' CHECK (health IN ('on_track','at_risk','blocked')),
  target_delivery TEXT,
  clickup_space_id TEXT,
  clickup_list_id TEXT,
  clickup_project_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('internal','client')),
  due_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo','in_progress','blocked','done')),
  clickup_task_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_projects_health ON projects(health);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);
