#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import os
import sqlite3
import subprocess
import textwrap
import uuid
from pathlib import Path
from urllib import request, parse

BASE = Path(__file__).resolve().parent


def load_config():
    with open(BASE / "config.json", "r", encoding="utf-8") as f:
        return json.load(f)


def now_iso():
    return dt.datetime.now().isoformat(timespec="seconds")


def db_conn(cfg):
    p = Path(cfg["crm"]["dbPath"]).resolve()
    p.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(p)


def init_db(cfg):
    schema = (BASE / "schema.sql").read_text(encoding="utf-8")
    with db_conn(cfg) as conn:
        conn.executescript(schema)


def score_lead(budget, timeline, fit, urgency):
    return max(0, min(100, int(budget) + int(timeline) + int(fit) + int(urgency)))


def add_lead(cfg, args):
    score = score_lead(args.budget, args.timeline, args.fit, args.urgency)
    status = "qualified" if score >= cfg["qualifiedThreshold"] else "needs_more_info"
    lid = f"lead_{uuid.uuid4().hex[:10]}"
    ts = now_iso()
    with db_conn(cfg) as conn:
        conn.execute(
            """
            INSERT INTO leads (id, source, name, company, email, phone, services_requested,
                               budget_signal, timeline_signal, fit_notes, score, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                lid,
                args.source,
                args.name,
                args.company,
                args.email,
                args.phone,
                json.dumps(args.services.split(",")),
                str(args.budget),
                str(args.timeline),
                args.notes or "",
                score,
                status,
                ts,
                ts,
            ),
        )
        conn.execute(
            """
            INSERT INTO lead_scores (id, lead_id, budget_score, timeline_score, service_fit_score, urgency_score, total_score, rationale, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"ls_{uuid.uuid4().hex[:10]}",
                lid,
                args.budget,
                args.timeline,
                args.fit,
                args.urgency,
                score,
                args.rationale or "",
                ts,
            ),
        )
    post_slack(cfg, f"🧲 New lead: {args.name} ({args.company}) | score {score}/100 | status: {status}")
    print(lid)


def post_slack(cfg, text):
    token = cfg["secrets"]["slackBotToken"]
    channel = cfg["comms"]["channelId"]
    payload = json.dumps({"channel": channel, "text": text}).encode("utf-8")
    req = request.Request("https://slack.com/api/chat.postMessage", data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    with request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    if not body.get("ok"):
        raise RuntimeError(f"Slack error: {body}")


def render_pdf(md_path, pdf_path):
    # Try pandoc first; if unavailable, produce a txt placeholder with .pdf extension notice.
    try:
        subprocess.run(["pandoc", str(md_path), "-o", str(pdf_path)], check=True)
        return
    except Exception:
        pass
    pdf_path.write_text("PDF renderer missing. Install pandoc to generate real PDFs.\n\n" + md_path.read_text(encoding="utf-8"), encoding="utf-8")


def generate_proposal(cfg, args):
    with db_conn(cfg) as conn:
        lead = conn.execute("SELECT id,name,company,services_requested FROM leads WHERE id=?", (args.lead_id,)).fetchone()
        if not lead:
            raise SystemExit("Lead not found")
        lead_id, name, company, services = lead
    out_dir = Path(cfg["proposals"]["outputDir"]).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    pid = f"prop_{uuid.uuid4().hex[:10]}"
    ts = now_iso()
    date = dt.date.today().isoformat()
    md = out_dir / f"{pid}.md"
    pdf = out_dir / f"{pid}.pdf"
    body = textwrap.dedent(f"""
    # Proposal — {company}

    Client: {name} ({company})
    Date: {date}

    Services requested: {services}

    ## Option A — Good
    Baseline scope and delivery.

    ## Option B — Better
    Expanded strategy + production support.

    ## Option C — Best
    Full-service execution + optimization cycle.

    ## Assumptions
    - Timely client feedback
    - Asset availability
    - Scope changes handled by change request

    Status: pending approval
    """).strip() + "\n"
    md.write_text(body, encoding="utf-8")
    render_pdf(md, pdf)
    with db_conn(cfg) as conn:
        conn.execute(
            """
            INSERT INTO proposals (id,lead_id,version,title,markdown_path,pdf_path,service_mix,scope_summary,assumptions,pricing_json,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (pid, lead_id, 1, f"Proposal for {company}", str(md), str(pdf), services, "TBD", "Standard assumptions", "{}", "pending_approval", ts, ts),
        )
    post_slack(cfg, f"📄 Proposal draft ready for {company}: {pdf.name} (status: pending_approval)")
    print(pid)


def create_clickup_task(cfg, list_id, name, desc):
    token = cfg["secrets"]["clickupApiToken"]
    payload = json.dumps({"name": name, "description": desc, "status": "to do"}).encode("utf-8")
    url = f"https://api.clickup.com/api/v2/list/{list_id}/task"
    req = request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", token)
    req.add_header("Content-Type", "application/json")
    with request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode("utf-8"))


def kickoff_project(cfg, args):
    service = args.service.lower()
    list_id = cfg["projectTracker"]["lists"].get(service) or cfg["projectTracker"]["lists"]["mixed"]
    proj_id = f"proj_{uuid.uuid4().hex[:10]}"
    ts = now_iso()
    with db_conn(cfg) as conn:
        lead = conn.execute("SELECT id,name,company FROM leads WHERE id=?", (args.lead_id,)).fetchone()
        if not lead:
            raise SystemExit("Lead not found")
        lead_id, name, company = lead
        conn.execute(
            "INSERT INTO projects (id,lead_id,proposal_id,client_name,service_type,stage,health,target_delivery,clickup_list_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (proj_id, lead_id, args.proposal_id, company, service, "kickoff", "on_track", args.target_delivery or "", list_id, ts, ts),
        )
    click = create_clickup_task(cfg, list_id, f"{company} — Kickoff", f"Lead: {name}\nProject: {proj_id}\nService: {service}")
    with db_conn(cfg) as conn:
        conn.execute("UPDATE projects SET clickup_project_id=?, updated_at=? WHERE id=?", (click.get("id"), now_iso(), proj_id))
    post_slack(cfg, f"🚀 Project kickoff created for {company} in ClickUp ({service}).")
    print(proj_id)


def daily_digest(cfg):
    with db_conn(cfg) as conn:
        rows = conn.execute("SELECT client_name,service_type,health,stage,target_delivery FROM projects ORDER BY updated_at DESC LIMIT 20").fetchall()
    if not rows:
        post_slack(cfg, "📬 Daily digest: no active projects yet.")
        return
    lines = ["📬 LMTD Daily Project Digest"]
    for c, s, h, st, td in rows:
        lines.append(f"• {c} [{s}] — {h} / {st}" + (f" / target {td}" if td else ""))
    post_slack(cfg, "\n".join(lines))


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init-db")

    a = sub.add_parser("add-lead")
    a.add_argument("--source", default="slack")
    a.add_argument("--name", required=True)
    a.add_argument("--company", required=True)
    a.add_argument("--email", default="")
    a.add_argument("--phone", default="")
    a.add_argument("--services", default="video")
    a.add_argument("--budget", type=int, default=20)
    a.add_argument("--timeline", type=int, default=15)
    a.add_argument("--fit", type=int, default=20)
    a.add_argument("--urgency", type=int, default=15)
    a.add_argument("--notes", default="")
    a.add_argument("--rationale", default="")

    g = sub.add_parser("gen-proposal")
    g.add_argument("--lead-id", required=True)

    k = sub.add_parser("kickoff")
    k.add_argument("--lead-id", required=True)
    k.add_argument("--proposal-id", default="")
    k.add_argument("--service", choices=["video", "branding", "web", "mixed"], default="mixed")
    k.add_argument("--target-delivery", default="")

    sub.add_parser("daily-digest")

    args = p.parse_args()
    cfg = load_config()

    if args.cmd == "init-db":
        init_db(cfg)
    elif args.cmd == "add-lead":
        add_lead(cfg, args)
    elif args.cmd == "gen-proposal":
        generate_proposal(cfg, args)
    elif args.cmd == "kickoff":
        kickoff_project(cfg, args)
    elif args.cmd == "daily-digest":
        daily_digest(cfg)


if __name__ == "__main__":
    main()
