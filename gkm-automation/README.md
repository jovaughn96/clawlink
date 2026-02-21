# GKM Automation (v1 scaffold)

Local 24/7 automation bridge for production control at Global Kingdom Ministries.

## What this scaffold includes

- Secure local API with API-key auth (`x-api-key`)
- Action endpoint: `POST /api/action`
- Action allowlist policy via env (`ALLOWED_ACTIONS`)
- Dry-run mode (`DRY_RUN=true` by default)
- SQLite audit logging for every request/result
- ATEM live wiring support via `atem-connection`
- ProPresenter live wiring support via HTTP API
- launchd service template for always-on runtime on macOS

## Supported actions (current)

- `system.health`
- `atem.program.set` (input)
- `atem.macro.run` (macroId)
- `propresenter.trigger` (playlistId + itemId)
- `propresenter.next`
- `propresenter.previous`
- `propresenter.clear` (`all|slides|media|audio`)

> Keep `DRY_RUN=true` until you are ready for production cutover.

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

## Test calls (when you're ready)

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

## ProPresenter wiring notes

- Ensure ProPresenter API is enabled.
- Set `PROPRESENTER_HOST`, `PROPRESENTER_PORT`, and optional `PROPRESENTER_PASSWORD`.
- `propresenter.trigger` expects playlist + item identifiers (stable IDs from API output).

## Next steps

1. Add Resolume adapter with strongly-typed actions.
2. Add role tiers (`safe`, `show-critical`) + two-step confirmation for critical actions.
3. Add OpenClaw-facing wrapper so Eden can call these actions safely.
4. Add preset scene names so you can say “walk-in loop”, “sermon lower-third”, etc.

## Security baseline

- Keep service bound to `127.0.0.1` unless LAN access is explicitly needed.
- If exposing on LAN, enforce firewall allowlist to trusted control hosts.
- Rotate API key quarterly or after staff changes.
- Keep dry-run enabled until cutover rehearsal is complete.
