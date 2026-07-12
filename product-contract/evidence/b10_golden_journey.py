#!/usr/bin/env python3
"""B10-EV-001 — Golden journey walked end-to-end with real persona sessions
against the live database (sponsor-authorized sacrificial inspection).

plan -> publish -> assign -> execute -> submit v1 -> Level-2 RETURN (scope s1)
-> correct -> resubmit v2 -> Level-2 APPROVE, plus negative proofs:
decided-review immutability, submitted-version immutability, duplicate-submit.

Every step runs over PostgREST with the acting persona's own JWT — RLS and
triggers are the enforcement under test, exactly as the product exercises them.
"""
import json, urllib.request, urllib.error, uuid, datetime, pathlib, sys

BASE = "https://iiozvqntawxfwbgffzqu.supabase.co"
ANON = open(pathlib.Path(__file__).parents[2] / "apps/web/.env.local").read().split("ANON_KEY=")[1].strip()
LOG: list[str] = []

def log(step: str, detail: str):
    line = f"[{datetime.datetime.utcnow().isoformat()}Z] {step}: {detail}"
    LOG.append(line); print(line)

def login(email, pw):
    req = urllib.request.Request(f"{BASE}/auth/v1/token?grant_type=password",
        data=json.dumps({"email": email, "password": pw}).encode(), method="POST",
        headers={"apikey": ANON, "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req)); return d["access_token"], d["user"]["id"]

def rest(method, path, jwt, body=None, prefer="return=representation"):
    req = urllib.request.Request(f"{BASE}/rest/v1/{path}",
        data=json.dumps(body).encode() if body is not None else None, method=method,
        headers={"apikey": ANON, "Authorization": f"Bearer {jwt}",
                 "Content-Type": "application/json", "Prefer": prefer})
    try:
        r = urllib.request.urlopen(req)
        raw = r.read().decode()
        return (json.loads(raw) if raw else None), None
    except urllib.error.HTTPError as e:
        return None, f"{e.code} {e.read().decode()[:220]}"

def must(val, err, step):
    if err: log(step, f"FAIL — {err}"); write_out(); sys.exit(1)
    return val

def write_out():
    out = pathlib.Path(__file__).parent / "B10-EV-001-golden-journey.txt"
    out.write_text("\n".join(LOG) + "\n")

now = datetime.datetime.now(datetime.timezone.utc)
iso = lambda d: d.isoformat()

planner, planner_id = login("planner@mim.gov.sa", "MimPlan!2026")
inspector, inspector_id = login("inspector@mim.gov.sa", "MimField!2026")
reviewer, reviewer_id = login("reviewer@mim.gov.sa", "MimRev!2026")
log("P0-auth", f"planner/inspector/reviewer sessions established")

# ---- P1 · planner: plan + visit + assignment + publish (M01-034/040/042) ----
fac, err = rest("GET", "factories?select=id,name&factory_code=eq.F-1102", planner)
fac = must(fac, err, "P1-factory")[0]
pkg, err = rest("GET", "package_versions?select=id,version_label&status=eq.published&order=published_at.desc&limit=1", planner)
pkg = must(pkg, err, "P1-package")[0]
plan, err = rest("POST", "visit_plans", planner, {"method": "single", "status": "draft", "created_by": planner_id})
plan = must(plan, err, "P1-plan")[0]
visit, err = rest("POST", "visits", planner, {
    "visit_plan_id": plan["id"], "factory_id": fac["id"], "visit_type": "periodic",
    "execution_mode": "physical", "planning_status": "draft",
    "window_start": iso(now + datetime.timedelta(days=3)),
    "window_end": iso(now + datetime.timedelta(days=3, hours=4)),
    "package_version_id": pkg["id"]})
visit = must(visit, err, "P1-visit")[0]
_, err = rest("POST", "assignments", planner, {"visit_id": visit["id"], "inspector_id": inspector_id, "method": "manual"}, prefer="return=minimal")
must([1], err, "P1-assign")
_, err = rest("PATCH", f"visits?id=eq.{visit['id']}", planner, {"planning_status": "published"}, prefer="return=minimal")
must([1], err, "P1-publish")
log("P1", f"SACRIFICIAL visit {visit['id'][:8]} at {fac['name']} published + assigned ({pkg['version_label']})")

# ---- P2 · inspector: start inspection, answer items, submit v1 --------------
ins, err = rest("POST", "inspections", inspector, {
    "visit_id": visit["id"], "package_version_id": pkg["id"], "status": "in_progress",
    "started_at": iso(now)})
ins = must(ins, err, "P2-start")[0]
items, err = rest("GET", "inspection_items?select=id,code&code=in.(FS-101,FS-102,EG-201)", inspector)
items = {i["code"]: i["id"] for i in must(items, err, "P2-items")}
answers_v1 = {"FS-101": "non_compliant", "FS-102": "compliant", "EG-201": "compliant"}
for code, val in answers_v1.items():
    _, err = rest("POST", "checklist_responses?on_conflict=inspection_id,item_id", inspector,
        {"inspection_id": ins["id"], "item_id": items[code], "response": {"value": val}, "is_complete": True},
        prefer="resolution=merge-duplicates,return=minimal")
    must([1], err, f"P2-answer-{code}")
idem = str(uuid.uuid4())
sub1, err = rest("POST", "submission_versions", inspector, {
    "inspection_id": ins["id"], "version_number": 1,
    "snapshot": {"answers": answers_v1, "journey": "B10 golden"},
    "idempotency_key": idem, "acknowledgement": {"name": "Factory representative", "signed": True},
    "submitted_by": inspector_id})
sub1 = must(sub1, err, "P2-submit-v1")[0]
_, err = rest("PATCH", f"inspections?id=eq.{ins['id']}", inspector, {"status": "submitted"}, prefer="return=minimal")
must([1], err, "P2-status")
log("P2", f"inspection {ins['id'][:8]} submitted v1 (FS-101 non_compliant -> V-FS-09 path)")

# NEG-1 · duplicate v1 must be rejected (idempotent submission, ERR-SUB-002)
_, err = rest("POST", "submission_versions", inspector, {
    "inspection_id": ins["id"], "version_number": 1, "snapshot": {}, "idempotency_key": idem,
    "acknowledgement": {}, "submitted_by": inspector_id})
log("NEG-1", f"duplicate v1 submit rejected as expected: {err[:120]}" if err else "FAIL — duplicate v1 accepted!")

# NEG-2 · submitted version immutable (no UPDATE policy)
patched, err = rest("PATCH", f"submission_versions?id=eq.{sub1['id']}", inspector, {"snapshot": {"tampered": True}})
tampered = bool(patched)
log("NEG-2", "FAIL — submitted v1 was mutable!" if tampered else f"v1 tamper attempt returned 0 rows / denied (immutable) {('- ' + err) if err else ''}")

# ---- P3 · reviewer: RETURN with exact scope (M06-006/FLD-REV-004) -----------
rev1, err = rest("POST", "reviews", reviewer, {
    "inspection_id": ins["id"], "submission_version_id": sub1["id"], "reviewer_id": reviewer_id,
    "status": "returned", "decision": "return", "decision_reason": "FS-101 evidence insufficient — retag and re-shoot (B10 golden).",
    "returned_sections": ["s1"], "decided_at": iso(now)})
rev1 = must(rev1, err, "P3-return")[0]
_, err = rest("PATCH", f"inspections?id=eq.{ins['id']}", inspector, {"status": "returned"}, prefer="return=minimal")
log("P3", f"review {rev1['id'][:8]} RETURNED scope=s1 with mandatory reason")

# NEG-3 · decided review immutable (M06-009, trg_guard_review)
_, err = rest("PATCH", f"reviews?id=eq.{rev1['id']}", reviewer, {"decision_reason": "edited after decision"})
log("NEG-3", f"decided-review edit rejected by trigger: {err[:140]}" if err else "FAIL — decided review was editable!")

# ---- P4 · inspector: correct returned scope, resubmit v2 (SB17) -------------
_, err = rest("POST", "checklist_responses?on_conflict=inspection_id,item_id", inspector,
    {"inspection_id": ins["id"], "item_id": items["FS-101"], "response": {"value": "compliant"}, "is_complete": True},
    prefer="resolution=merge-duplicates,return=minimal")
must([1], err, "P4-correct")
answers_v2 = dict(answers_v1, **{"FS-101": "compliant"})
sub2, err = rest("POST", "submission_versions", inspector, {
    "inspection_id": ins["id"], "version_number": 2,
    "snapshot": {"answers": answers_v2, "corrected_scope": ["s1"]},
    "idempotency_key": str(uuid.uuid4()), "acknowledgement": {"name": "Factory representative", "signed": True},
    "submitted_by": inspector_id})
sub2 = must(sub2, err, "P4-resubmit")[0]
_, err = rest("PATCH", f"inspections?id=eq.{ins['id']}", inspector, {"status": "submitted"}, prefer="return=minimal")
log("P4", f"corrected s1, resubmitted as v2 ({sub2['id'][:8]}); v1 remains locked")

# ---- P5 · reviewer: APPROVE v2 ----------------------------------------------
rev2, err = rest("POST", "reviews", reviewer, {
    "inspection_id": ins["id"], "submission_version_id": sub2["id"], "reviewer_id": reviewer_id,
    "status": "approved", "decision": "approve", "decision_reason": "Corrected evidence adequate (B10 golden).",
    "decided_at": iso(now)})
rev2 = must(rev2, err, "P5-approve")[0]
_, err = rest("PATCH", f"inspections?id=eq.{ins['id']}", inspector, {"status": "approved"}, prefer="return=minimal")
log("P5", f"review {rev2['id'][:8]} APPROVED v2 — journey complete")

# ---- Final state assertions --------------------------------------------------
subs, _ = rest("GET", f"submission_versions?select=version_number,snapshot&inspection_id=eq.{ins['id']}&order=version_number", reviewer)
revs, _ = rest("GET", f"reviews?select=decision,status,returned_sections&inspection_id=eq.{ins['id']}&order=decided_at", reviewer)
v1_intact = subs and subs[0]["snapshot"].get("answers", {}).get("FS-101") == "non_compliant"
log("ASSERT", f"versions={[s['version_number'] for s in (subs or [])]} v1-intact={v1_intact} decisions={[r['decision'] for r in (revs or [])]}")
log("RESULT", "GOLDEN JOURNEY COMPLETE — plan/publish/execute/submit/return/correct/resubmit/approve all via persona-scoped RLS"
    if (subs and len(subs) == 2 and v1_intact and revs and [r["decision"] for r in revs] == ["return", "approve"] and not tampered)
    else "JOURNEY INCOMPLETE — inspect log")
write_out()
print("\nevidence -> B10-EV-001-golden-journey.txt")
