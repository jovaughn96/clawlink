# GKM Automation (v1 scaffold)

Local 24/7 automation bridge for production control at Global Kingdom Ministries.

## What this scaffold includes

- Secure local API with API-key auth (`x-api-key`)
- Action endpoint: `POST /api/action`
- Action allowlist policy via env (`ALLOWED_ACTIONS`)
- Dry-run mode (`DRY_RUN=true` by default)
- SQLite audit logging for every request/result
- ATEM adapter stub + one real action contract (`atem.program.set`)
- launchd service template for always-on runtime on macOS

## Supported actions (v1)

- `system.health`
- `atem.program.set` (input)
- `atem.macro.run` (macroId)

> In scaffold mode, ATEM live calls are mocked unless `ATEM_MOCK=false` and adapter is completed.

## Setup

```bash
cd gkm-automation
npm install
cp .env.example .env
npm run gen:key
# paste generated key into API_KEY in .env
npm run build
npm run start
```

## Test

```bash
curl -s http://127.0.0.1:17816/api/health -H "x-api-key: <API_KEY>"

curl -s http://127.0.0.1:17816/api/action \
  -H "content-type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{
    "action": "atem.program.set",
    "payload": { "input": 2 },
    "requestId": "manual-test-001",
    "source": "openclaw"
  }'
```

## launchd (macOS)

```bash
cp gkm.automation.plist ~/Library/LaunchAgents/ai.gkm.automation.plist
launchctl load ~/Library/LaunchAgents/ai.gkm.automation.plist
launchctl start ai.gkm.automation

# status
launchctl list | grep ai.gkm.automation
```

## Next steps

1. Wire live ATEM integration (replace adapter stubs).
2. Add ProPresenter adapter (`propresenter.trigger`, `propresenter.next`, `propresenter.clear`).
3. Add Resolume adapter with strongly-typed actions.
4. Add role tiers (`safe`, `show-critical`) + two-step confirmation for critical actions.
5. Add OpenClaw-facing wrapper so Eden can call these actions safely.

## Security baseline

- Keep service bound to `127.0.0.1` unless LAN access is explicitly needed.
- If exposing on LAN, enforce firewall allowlist to trusted control hosts.
- Rotate API key quarterly or after staff changes.
- Keep dry-run enabled until cutover rehearsal is complete.
