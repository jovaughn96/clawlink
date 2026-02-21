# GKM Automation (v1 scaffold)

Local 24/7 automation bridge for production control at Global Kingdom Ministries.

## What this scaffold includes

- Secure local API with API-key auth (`x-api-key`)
- Action endpoint: `POST /api/action`
- Natural-language command endpoint: `POST /api/command`
- Action allowlist policy via env (`ALLOWED_ACTIONS`)
- Dry-run mode (`DRY_RUN=true` by default)
- SQLite audit logging for every request/result
- ATEM live wiring support via `atem-connection`
- ProPresenter live wiring support via HTTP API
- launchd service template for always-on runtime on macOS

## Supported actions (current)

- `system.health`
- `atem.program.set` (input on ME1)
- `atem.me.program.set` (input + me)
- `atem.scene.take` (scene preset + optional me override)
- `atem.overlay.set` (USK1/USK2 on a specific ME)
- `atem.scene.compose` (scene + optional overlay states in one call)
- `atem.feed.mirror` (mirror program input ME-to-ME)
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

## Command examples (natural language)

```bash
curl -s http://127.0.0.1:17816/api/command \
  -H "content-type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"command":"take sermon-wide to broadcast with propresenter on, gfx off"}'

curl -s http://127.0.0.1:17816/api/command \
  -H "content-type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"command":"mirror broadcast to auditorium"}'

curl -s http://127.0.0.1:17816/api/command \
  -H "content-type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"command":"next slide on studio"}'

# shorthand intents
curl -s http://127.0.0.1:17816/api/command -H "content-type: application/json" -H "x-api-key: <API_KEY>" -d '{"command":"go live"}'
curl -s http://127.0.0.1:17816/api/command -H "content-type: application/json" -H "x-api-key: <API_KEY>" -d '{"command":"clear keys"}'
curl -s http://127.0.0.1:17816/api/command -H "content-type: application/json" -H "x-api-key: <API_KEY>" -d '{"command":"lobby mirror on"}'
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
- Main configured instance (primary): `Pro7 - PC` at `172.16.14.223:64910`.
- Secondary configured instances:
  - `Studio iMac` at `172.16.12.148:1025`
  - `Playback Mini` at `172.16.14.222:1025`
- Set `PROPRESENTER_NAME`, `PROPRESENTER_HOST`, `PROPRESENTER_PORT`, and `PROPRESENTER_PASSWORD` in `.env`.
- `propresenter.trigger` expects playlist + item identifiers (stable IDs from API output).

## Church profile encoded

- Inputs aligned to live labels: `CAM1 FOLLOW`, `CAM2 WIDE`, `CAM3 CLOSEUP`, `CAM4 HH1`, `CAM5 JIB (input 9)`, `CAM6 DRUMS`, `CAM7 HH2`, `CAM8 HOSTS`, `MINI/Play (11)`, `LOOP (20)`
- Jib camera is remapped to input `9` (SDI 5 is bad)
- Playback Mini (ProPresenter/slide loop) is input `11`
- Loop return is input `20` (used for ME1->ME2 workflow)
- ME aliases include `broadcast|bcast|stream` -> ME1 and `auditorium|sanct|sanctuary|lobby|atrium` -> ME2
- MEs: broadcast/live -> ME1, auditorium/lobby/atrium -> ME2
- Key layer labels tracked: USK1 = ProPresenter, USK2 = GFXPC/TitleLive
- Scene presets added:
  - `sermon-follow`
  - `sermon-wide`
  - `sermon-close`
  - `auditorium-wide`
  - `auditorium-follow`
  - `host-input`

You can fetch this mapping through `system.profile.get`.

Note: `atem.feed.mirror` currently mirrors program input only. Overlay mirroring should be done explicitly with `atem.overlay.set`.

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
