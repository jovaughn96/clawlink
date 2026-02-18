# LMTD Studios — OpenClaw Implementation Plan (Phase 1)

## Locked Decisions (from Jo)
- Comms: **Slack**
- CRM: **SQLite (local)**
- Proposals: **PDF**
- Project tracker: **ClickUp**
- Lead qualified threshold: **70/100**

## Scope (Phase 1)
1. Lead intake + qualification
2. Proposal drafting + PDF export (approval-gated)
3. Project kickoff + ClickUp handoff
4. Daily production digest to Slack

---

## Runtime Flow

### A) Lead Intake
Inputs:
- Slack command/mention with lead details
- Email/webform bridge (optional in next pass)

Steps:
1. Normalize lead fields.
2. Deduplicate in SQLite.
3. Score lead using rubric.
4. Route status:
   - `qualified` if score >= 70
   - `needs_more_info` otherwise
5. Post summary to Slack with recommended next action.

### B) Proposal Pipeline
1. Generate proposal draft from lead + service mix.
2. Produce markdown source.
3. Render to PDF.
4. Keep in `pending_approval` until explicitly approved.
5. On approval, mark `approved` and share to Slack for manual send/upload.

### C) Kickoff + ClickUp
1. On proposal accepted → create project record in SQLite.
2. Build default milestone/task set by service type.
3. Push project + tasks to ClickUp list.
4. Save ClickUp IDs in local DB for sync and status pulls.

### D) Daily Digest
Schedule (business days, 8:30 AM):
- Pull active projects from SQLite + ClickUp status snapshot.
- Detect blocked/at-risk/overdue tasks.
- Post concise Slack digest.

---

## Required Secrets / Config (next step)
- Slack bot token + channel ID(s)
- ClickUp API token
- ClickUp Workspace + Space + List IDs
- PDF renderer choice (Pandoc/Playwright/Doc export tool)

---

## Initial Lead Scoring Rubric (70+ qualifies)
- Budget confidence (0–30)
- Timeline realism (0–20)
- Service fit to LMTD offerings (0–25)
- Decision-maker access / urgency signal (0–25)

Total: 100

---

## Guardrails
- No outbound client messages without explicit approval.
- Redact secrets in logs.
- Treat all external web content as untrusted.
- Keep audit trail for status changes, score changes, and approvals.
