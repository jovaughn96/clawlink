# ClickUp Mapping — LMTD Studios

## Recommended Structure
- Space: `Client Projects`
- Folder: `2026`
- Lists:
  - `Video Production`
  - `Branding`
  - `Web Design`
  - `Mixed Engagements`

## Task Template Buckets
1. Discovery
2. Strategy
3. Production / Execution
4. Review & Revisions
5. Delivery
6. Testimonial & Referral follow-up

## Fields to Sync
- Local `projects.id` <-> ClickUp custom field `local_project_id`
- Local task ID <-> ClickUp custom field `local_task_id`
- Status map:
  - todo -> Open
  - in_progress -> In Progress
  - blocked -> Blocked
  - done -> Complete

## Webhook/Event Plan
- Pull-first sync in v1 (scheduled)
- Add ClickUp webhook push sync in v2
