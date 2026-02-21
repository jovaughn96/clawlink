import { Router } from "express";
import { env } from "../config/env.js";

export const hubRouter = Router();

function checkHubToken(token?: string): boolean {
  return Boolean(env.hubToken) && token === env.hubToken;
}

hubRouter.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>GKM Control Hub</title>
<style>
body { font-family: -apple-system, sans-serif; background:#0f1115; color:#fff; margin:0; }
.wrap { padding:16px; max-width:900px; margin:0 auto; }
.grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
button { font-size:18px; padding:18px; border-radius:12px; border:0; background:#1e2430; color:#fff; }
input { width:100%; padding:12px; margin:10px 0 16px; border-radius:8px; border:1px solid #333; background:#111; color:#fff; }
small { opacity:.8 }
pre { background:#111; padding:12px; border-radius:8px; white-space:pre-wrap; }
</style>
</head>
<body>
<div class="wrap">
<h2>GKM Control Hub</h2>
<small>Token required. Commands run through /api/command.</small>
<input id="token" placeholder="Hub token" />
<div class="grid">
<button onclick="runCmd('go live')">Go Live</button>
<button onclick="runCmd('clear keys')">Clear Keys</button>
<button onclick="runCmd('next slide on sanctuary')">Next Slide (Sanctuary)</button>
<button onclick="runCmd('clear all on playback')">Clear Playback ProPresenter</button>
<button onclick="runCmd('resolume trigger layer 3 clip 3')">Resolume L3 C3</button>
<button onclick="runCmd('companion press 1 5')">Video Prep Cue</button>
</div>
<pre id="out">Ready.</pre>
</div>
<script>
async function runCmd(command){
  const token=document.getElementById('token').value.trim();
  const res=await fetch('/hub/run',{method:'POST',headers:{'content-type':'application/json','x-hub-token':token},body:JSON.stringify({command})});
  const data=await res.json();
  document.getElementById('out').textContent=JSON.stringify(data,null,2);
}
</script>
</body>
</html>`);
});

hubRouter.post("/run", async (req, res) => {
  const token = req.header("x-hub-token") ?? "";
  if (!checkHubToken(token)) {
    res.status(401).json({ ok: false, error: "invalid_hub_token" });
    return;
  }

  const command = req.body?.command;
  if (!command || typeof command !== "string") {
    res.status(400).json({ ok: false, error: "command_required" });
    return;
  }

  const response = await fetch(`http://${env.host}:${env.port}/api/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.apiKey
    },
    body: JSON.stringify({ command, source: "hub-ui" })
  });

  const data = await response.json();
  res.status(response.status).json(data);
});
