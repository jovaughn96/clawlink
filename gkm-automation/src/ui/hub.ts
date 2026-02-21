import { Router } from "express";
import { env } from "../config/env.js";

export const hubRouter = Router();

const atemInputs = [
  { label: "CAM1 FOLLOW", input: 1 },
  { label: "CAM2 WIDE", input: 2 },
  { label: "CAM3 CLOSE", input: 3 },
  { label: "CAM4 HH1", input: 4 },
  { label: "CAM5 JIB", input: 9 },
  { label: "CAM6 DRUM", input: 6 },
  { label: "CAM7 HH2", input: 7 },
  { label: "CAM8 HOST", input: 8 },
  { label: "PLAYBACK MINI", input: 11 },
  { label: "LOOP", input: 20 }
];

hubRouter.get("/", (_req, res) => {
  const inputButtons = atemInputs
    .map(
      (x) => `
    <div class="input-card">
      <div class="input-label">${x.label}</div>
      <div class="row">
        <button class="btn preview" onclick='runAction("atem.preview.set", {"input": ${x.input}, "me": 1})'>Preview</button>
        <button class="btn cut" onclick='runAction("atem.me.program.set", {"input": ${x.input}, "me": 1})'>Cut</button>
      </div>
    </div>`
    )
    .join("");

  res.type("html").send(`<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>GKM Control Hub</title>
<style>
:root { --bg:#0b0f16; --panel:#121a26; --muted:#9aa6bd; --txt:#e7ecf7; --primary:#4c8dff; --danger:#ff5a6b; --ok:#28c76f; }
*{ box-sizing:border-box }
body { margin:0; font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif; background:var(--bg); color:var(--txt); }
.wrap { max-width:1200px; margin:0 auto; padding:14px; }
.top { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.badge{ font-size:12px; color:var(--muted); background:#0f1522; border:1px solid #243146; border-radius:999px; padding:4px 10px; }
.tabs { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
.tab { padding:10px 14px; border-radius:10px; border:1px solid #253248; background:#111827; color:#cfd7ea; }
.tab.active { background:#1b2a42; border-color:#3d5a86; color:#fff; }
.panel { background:var(--panel); border:1px solid #213048; border-radius:14px; padding:12px; margin-bottom:12px; }
.h2 { font-size:15px; color:#dce6fb; margin:0 0 10px; font-weight:700; }
.inputs-grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:8px; }
@media(min-width:980px){ .inputs-grid{ grid-template-columns: repeat(3,minmax(0,1fr)); } }
.input-card{ background:#0f1624; border:1px solid #24344e; border-radius:10px; padding:10px; }
.input-label{ font-size:12px; color:#a9b7d1; margin-bottom:8px; }
.row{ display:flex; gap:8px; }
.btn{ flex:1; border:0; border-radius:10px; padding:12px; font-size:14px; font-weight:600; color:#fff; }
.preview{ background:#2f6bd8; }
.cut{ background:#e6495f; }
.cmd{ background:#2a3a55; }
.ok{ background:#1f7a4f; }
.warn{ background:#7d4f1f; }
.cols{ display:grid; grid-template-columns:1fr; gap:10px; }
@media(min-width:980px){ .cols{ grid-template-columns:1fr 1fr; } }
pre{ margin:0; white-space:pre-wrap; background:#0c111b; border:1px solid #213048; border-radius:10px; padding:12px; color:#b9c7de; max-height:260px; overflow:auto; }
.small{ font-size:12px; color:var(--muted); margin-top:4px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <h2 style="margin:0;">GKM Control Hub</h2>
    <div class="badge">Production UI v1</div>
  </div>

  <div class="tabs">
    <button class="tab active" onclick="showTab('master', this)">Master</button>
    <button class="tab" onclick="showTab('atem', this)">ATEM</button>
    <button class="tab" onclick="showTab('propresenter', this)">ProPresenter</button>
    <button class="tab" onclick="showTab('resolume', this)">Resolume</button>
  </div>

  <section id="tab-master" class="tab-panel">
    <div class="panel">
      <div class="h2">ATEM Quick Cut / Preview (ME1)</div>
      <div class="inputs-grid">${inputButtons}</div>
    </div>

    <div class="cols">
      <div class="panel">
        <div class="h2">ProPresenter Clear</div>
        <div class="row" style="margin-bottom:8px;">
          <button class="btn cmd" onclick='runAction("propresenter.clear", {"target":"all", "instance":"sanctuary"})'>Clear Sanctuary</button>
          <button class="btn cmd" onclick='runAction("propresenter.clear", {"target":"all", "instance":"playback"})'>Clear Playback</button>
        </div>
        <div class="row">
          <button class="btn cmd" onclick='runAction("propresenter.clear", {"target":"all", "instance":"studio"})'>Clear Studio</button>
          <button class="btn ok" onclick='runCommand("next slide on sanctuary")'>Next Sanctuary</button>
        </div>
      </div>

      <div class="panel">
        <div class="h2">Resolume Basic</div>
        <div class="row" style="margin-bottom:8px;">
          <button class="btn cmd" onclick='runAction("resolume.clear.all", {})'>Clear All</button>
          <button class="btn cmd" onclick='runAction("resolume.layer.clear", {"layer":3})'>Clear Layer 3</button>
        </div>
        <div class="row">
          <button class="btn ok" onclick='runAction("resolume.clip.trigger", {"layer":3, "clip":3})'>Trigger L3 C3</button>
          <button class="btn warn" onclick='runAction("companion.button.press", {"page":1,"bank":5})'>Video Prep Cue</button>
        </div>
      </div>
    </div>
  </section>

  <section id="tab-atem" class="tab-panel" style="display:none;">
    <div class="panel">
      <div class="h2">ATEM Scene / Utility</div>
      <div class="row" style="margin-bottom:8px;">
        <button class="btn cmd" onclick='runCommand("go live")'>Go Live</button>
        <button class="btn cmd" onclick='runCommand("clear keys")'>Clear Keys</button>
      </div>
      <div class="row">
        <button class="btn cmd" onclick='runCommand("lobby mirror on")'>Lobby Mirror On</button>
        <button class="btn cmd" onclick='runCommand("lobby mirror off")'>Lobby Mirror Off</button>
      </div>
    </div>
  </section>

  <section id="tab-propresenter" class="tab-panel" style="display:none;">
    <div class="panel">
      <div class="h2">ProPresenter Controls</div>
      <div class="row" style="margin-bottom:8px;">
        <button class="btn cmd" onclick='runCommand("next slide on sanctuary")'>Next Sanctuary</button>
        <button class="btn cmd" onclick='runCommand("previous slide on sanctuary")'>Previous Sanctuary</button>
      </div>
      <div class="row">
        <button class="btn cmd" onclick='runCommand("next slide on playback")'>Next Playback</button>
        <button class="btn cmd" onclick='runCommand("previous slide on playback")'>Previous Playback</button>
      </div>
    </div>
  </section>

  <section id="tab-resolume" class="tab-panel" style="display:none;">
    <div class="panel">
      <div class="h2">Resolume Controls</div>
      <div class="row" style="margin-bottom:8px;">
        <button class="btn ok" onclick='runAction("resolume.clip.trigger", {"layer":3,"clip":3})'>Trigger L3 C3</button>
        <button class="btn cmd" onclick='runAction("resolume.layer.clear", {"layer":3})'>Clear L3</button>
      </div>
      <div class="row">
        <button class="btn cmd" onclick='runAction("resolume.clear.all", {})'>Clear All</button>
      </div>
      <div class="small">Blackout control can be added after you confirm your preferred OSC path.</div>
    </div>
  </section>

  <div class="panel">
    <div class="h2">Output</div>
    <pre id="out">Ready.</pre>
  </div>
</div>
<script>
function showTab(name, btn){
  document.querySelectorAll('.tab-panel').forEach(p=>p.style.display='none');
  document.getElementById('tab-'+name).style.display='block';
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
}

async function runCommand(command){
  const res=await fetch('/hub/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({command})});
  const data=await res.json();
  document.getElementById('out').textContent=JSON.stringify(data,null,2);
}

async function runAction(action,payload){
  const res=await fetch('/hub/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,payload})});
  const data=await res.json();
  document.getElementById('out').textContent=JSON.stringify(data,null,2);
}
</script>
</body>
</html>`);
});

hubRouter.post("/run", async (req, res) => {
  const command = req.body?.command;
  const action = req.body?.action;
  const payload = req.body?.payload ?? {};

  if (!command && !action) {
    res.status(400).json({ ok: false, error: "command_or_action_required" });
    return;
  }

  const targetPath = command ? "/api/command" : "/api/action";
  const body = command ? { command, source: "hub-ui" } : { action, payload, source: "hub-ui" };

  const response = await fetch(`http://${env.host}:${env.port}${targetPath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.apiKey
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  res.status(response.status).json(data);
});
