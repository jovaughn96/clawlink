# LMTD Studios Phase 1 Runner

This runner implements the first operational loop:
- lead intake + qualification (threshold 70)
- proposal draft + PDF artifact
- kickoff record + ClickUp task creation
- daily Slack digest

## 1) Initialize DB
```bash
python3 agency-workflows/lmtd/run_phase1.py init-db
```

## 2) Add a lead
```bash
python3 agency-workflows/lmtd/run_phase1.py add-lead \
  --name "Acme Founder" \
  --company "Acme Inc" \
  --email "founder@acme.com" \
  --services "video,branding" \
  --budget 25 --timeline 15 --fit 20 --urgency 15
```

## 3) Generate proposal draft (pending approval)
```bash
python3 agency-workflows/lmtd/run_phase1.py gen-proposal --lead-id lead_xxxxx
```

## 4) Kickoff to ClickUp
```bash
python3 agency-workflows/lmtd/run_phase1.py kickoff \
  --lead-id lead_xxxxx \
  --proposal-id prop_xxxxx \
  --service video \
  --target-delivery 2026-03-15
```

## 5) Send daily digest to Slack
```bash
python3 agency-workflows/lmtd/run_phase1.py daily-digest
```

## Scheduling (optional)
Use cron to schedule `daily-digest` at 8:30 AM weekdays.

## Notes
- `config.json` is intentionally git-ignored because it contains secrets.
- If `pandoc` is installed, proposal markdown is rendered to real PDF.
- Without `pandoc`, a placeholder file is still created at the expected `.pdf` path.
