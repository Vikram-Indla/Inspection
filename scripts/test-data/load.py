# -*- coding: utf-8 -*-
"""Load the test-data cohort into a non-production database, and take it away again.

  python3 scripts/test-data/load.py preflight
  python3 scripts/test-data/load.py load
  python3 scripts/test-data/load.py verify
  python3 scripts/test-data/load.py unload --dry-run
  python3 scripts/test-data/load.py unload --confirm        # respects immutability
  python3 scripts/test-data/load.py reset --confirm         # full wipe of this batch

Identity: every row's primary key is uuid5(BATCH, "<table>:<logical key>"), so a
re-run upserts instead of duplicating and unload deletes by exact id — never by a
heuristic.

Connection: PGHOST/PGPORT/PGUSER/PGDATABASE or DATABASE_URL drive psql. Setting
SUPABASE_PROJECT_ID and SUPABASE_MGMT_TOKEN instead sends the same SQL to the
hosted platform endpoint over HTTPS, which is the only route into a project
whose database port is unreachable.
"""
import csv, json, os, subprocess, sys, tempfile, urllib.error, urllib.request, uuid
from collections import namedtuple
from datetime import date, datetime, time, timedelta
from pathlib import Path

BATCH = uuid.UUID("5eed0000-0000-4000-8000-000000000001")
ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "product-contract" / "test-data-architecture" / "seed-source"

# The generators carry no clock, so the CSVs are reproducible: every date in them
# is measured against this one. The load is what makes them current — each date
# moves by the distance from the epoch to the run, which leaves every interval
# the cohort encodes ("expires in 45 days", "approved 3 weeks ago") intact while
# "today" really is today. Without it a cohort built in August reads as ancient
# history by November: today's visits empty, every SLA breached, coverage frozen.
COHORT_EPOCH = date(2026, 8, 22)

def _as_of():
    if "--as-of" in sys.argv:
        return date.fromisoformat(sys.argv[sys.argv.index("--as-of") + 1])
    return date.today()

AS_OF = _as_of()
SHIFT = timedelta(days=(AS_OF - COHORT_EPOCH).days)
ANCHOR = datetime.combine(AS_OF, time(8, 0))

def sdate(v):
    return (date.fromisoformat(v) + SHIFT).isoformat() if v else None

def sts(v):
    return (datetime.fromisoformat(v) + SHIFT).isoformat() if v else None
uid = lambda table, key: str(uuid.uuid5(BATCH, f"{table}:{key}"))
read = lambda name: list(csv.DictReader((SRC / name).open(encoding="utf-8")))

# Deletion runs in exactly this order — the reverse of the write order below.
WRITE_ORDER = [
 "auth.users", "profiles", "user_roles", "commercial_registrations", "factories",
 "industrial_licenses", "regulations", "regulation_clauses", "inspection_items",
 "violation_codes", "packages", "package_versions", "dashboard_config_versions",
 "dashboard_config_heads", "visit_plans", "visits", "assignments",
 "journey_sessions", "geo_events", "inspections", "checklist_responses",
 "submission_versions", "reviews", "violations",
]
# Proved by running unload against a real database, not by reading the schema.
# These refuse DELETE outright via a trigger. A submitted inspection's evidence
# chain is permanent by design — the platform treats it as a legal record.
IMMUTABLE = {
 "audit_events", "audit_semantic_events", "submission_versions", "review_comments",
 "dashboard_config_versions", "ai_events", "signature_acts", "report_verifications",
 "notification_delivery_attempts", "compliance_entity_versions",
 "compliance_request_decisions", "compliance_request_publications",
 "factory_government_records", "inspection_factory_snapshots",
 "plant_production_line_items", "senaei_raw_snapshots",
}
# Accepted reference data the seed verifies but never owns.
NEVER_DELETE = IMMUTABLE | {"roles", "capabilities", "permissions", "engine_settings"}
# Not every table is keyed on "id". Assuming so made profiles silently un-deletable.
KEY_COLUMN = {"profiles": "user_id", "dashboard_config_heads": "config_key"}

# Statements carrying thousands of ids exceed the argv limit, so anything large
# goes through a file rather than -c.
ARGV_SAFE = 60000

Result = namedtuple("Result", "returncode stdout stderr")

# A hosted project reachable only over HTTPS has no psql route: port 5432 is raw
# TCP and the database password is not part of the credential set. The platform
# SQL endpoint accepts the same statements over 443 using the management token.
def _transport():
    return "mgmt" if os.environ.get("SUPABASE_MGMT_TOKEN") and \
        os.environ.get("SUPABASE_PROJECT_ID") else "psql"

# psql -tA renders one row per line, columns joined by a pipe, null as empty and
# boolean as t/f. Callers parse that shape, so JSON rows are rendered into it
# rather than teaching five hundred lines of caller a second format.
def _render(rows):
    cell = lambda v: "" if v is None else ("t" if v is True else
                                           "f" if v is False else
                                           json.dumps(v, ensure_ascii=False)
                                           if isinstance(v, (dict, list)) else str(v))
    return "\n".join("|".join(cell(v) for v in row.values()) for row in rows)

def _mgmt(sql):
    url = (f"https://api.supabase.com/v1/projects/"
           f"{os.environ['SUPABASE_PROJECT_ID']}/database/query")
    req = urllib.request.Request(
        url, data=json.dumps({"query": sql}).encode("utf-8"), method="POST",
        headers={"Authorization": f"Bearer {os.environ['SUPABASE_MGMT_TOKEN']}",
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            payload = resp.read().decode("utf-8").strip()
    except urllib.error.HTTPError as exc:
        return Result(1, "", exc.read().decode("utf-8", "replace").strip()[:500])
    except Exception as exc:
        return Result(1, "", f"{type(exc).__name__}: {exc}")
    rows = json.loads(payload) if payload else []
    return Result(0, _render(rows) if isinstance(rows, list) else str(rows), "")

def _run(sql, flags):
    if _transport() == "mgmt":
        return _mgmt(sql)
    env = dict(os.environ)
    base = ["psql"] + ([env["DATABASE_URL"]] if env.get("DATABASE_URL") else []) + flags
    if len(sql) < ARGV_SAFE:
        return subprocess.run(base + ["-c", sql], capture_output=True, text=True, env=env)
    tmp = tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8")
    tmp.write(sql); tmp.close()
    try:
        return subprocess.run(base + ["-f", tmp.name], capture_output=True, text=True, env=env)
    finally:
        os.unlink(tmp.name)

def psql(sql, quiet=True):
    r = _run(sql, ["-v", "ON_ERROR_STOP=1", "-q" if quiet else "-tA"])
    if r.returncode: raise SystemExit(f"psql failed:\n{sql[:200]}\n{r.stderr.strip()}")
    return r.stdout.strip()

def q(sql):
    r = _run(sql, ["-tA"])
    return r.stdout.strip() if r.returncode == 0 else f"ERR {r.stderr.strip()[:90]}"

# The first query doubles as the reachability probe. Letting an unreachable
# database fall through reports it as a missing schema, which sends whoever
# reads the log looking in the wrong place.
def current_database():
    db = q("select current_database()")
    if db.startswith("ERR ") or not db:
        raise SystemExit(f"REFUSED: cannot reach the database over the "
                         f"{_transport()} transport.\n         {db or 'empty response'}")
    return db

def lit(v):
    if v is None or v == "": return "null"
    return "'" + str(v).replace("'", "''") + "'"

# ---- schema truth. These were wrong in the CSVs until the first real load. ----
# operational_state has no 'assigned'; an assigned visit is 'new' with an
# assignments row. reviews.status is a review_status enum, not 'pending'.
OPSTATE = {"new":"new","assigned":"new","on_the_way":"on_the_way","arrived":"arrived",
           "executing":"executing","under_review":"under_review","closed":"closed"}
REVSTATUS = {"pending":"pending_review","approve":"approved","return":"returned","reject":"rejected"}

TABLE_COUNT_SQL = "select count(*) from information_schema.tables where table_schema='public'"

def preflight():
    print("preflight")
    db = current_database()
    print(f"  database            {db}")
    if any(t in db.lower() for t in ("prod", "production")):
        raise SystemExit("REFUSED: database name looks like production")
    if os.environ.get("NODE_ENV") == "production":
        raise SystemExit("REFUSED: NODE_ENV=production")
    missing = [t for t in ("factories","visits","inspections","checklist_responses","reviews")
               if q(f"select to_regclass('public.{t}') is not null") != "t"]
    if missing: raise SystemExit(f"REFUSED: missing tables {missing}")
    print(f"  tables              {q(TABLE_COUNT_SQL)}")
    print(f"  as of               {AS_OF}  (cohort epoch {COHORT_EPOCH}, shift {SHIFT.days:+d} days)")
    print("  writes nothing      ok")
    return True

def load():
    F, P = read("factories.csv"), read("personas.csv")
    J, G = read("journeys.csv"), read("geo_events.csv")
    REG, CL = read("regulations.csv"), read("clauses.csv")
    IT, VC = read("inspection_items.csv"), read("violation_codes.csv")
    POL = read("policies.csv")
    print("load")

    # personas -------------------------------------------------------------
    rows = []
    for p in P:
        u = uid("profiles", p["username"])
        rows.append(f"({lit(u)},{lit(u)},{lit(p['email'])})")
    psql("insert into auth.users (id, email) values " +
         ",".join(f"({lit(uid('profiles', p['username']))},{lit(p['email'])})" for p in P) +
         " on conflict (id) do nothing;")
    psql("insert into profiles (user_id, full_name, email, region) values " +
         ",".join(f"({lit(uid('profiles',p['username']))},{lit(p['display_name_ar'])},"
                  f"{lit(p['email'])},{lit(p['region'] or None)})" for p in P) +
         " on conflict (user_id) do update set full_name=excluded.full_name, region=excluded.region;")
    print(f"  profiles            {len(P)}")

    # establishments -------------------------------------------------------
    psql("insert into commercial_registrations (id, cr_number, unified_number, legal_name_en, status) values " +
         ",".join(f"({lit(uid('cr',f['factory_code']))},{lit(f['cr_number'])},{lit(f['unified_number'])},"
                  f"{lit(f['name_en'])},'active')" for f in F) +
         " on conflict (id) do update set cr_number=excluded.cr_number;")
    psql("insert into factories (id, factory_code, name, cr_number, license_number, region, city,"
         " activity_class, official_lat, official_lng, geofence_radius_m, employees_total,"
         " license_status, license_stage, license_issue_date, license_expiry_date, source) values " +
         ",".join(f"({lit(uid('factory',f['factory_code']))},{lit(f['factory_code'])},{lit(f['name_en'])},"
                  f"{lit(f['cr_number'])},{lit(f['license_number'])},{lit(f['region'])},{lit(f['city_en'])},"
                  f"{lit(f['activity_class'])},{f['official_lat']},{f['official_lng']},{f['geofence_radius_m']},"
                  f"{f['employees']},{lit(f['license_status'])},{lit(f['license_stage'])},"
                  f"{lit(sdate(f['license_issue_date']))},{lit(sdate(f['license_expiry_date']))},'senaei_stub')" for f in F) +
         " on conflict (id) do update set name=excluded.name, region=excluded.region;")
    print(f"  factories           {len(F)}")
    # guard_bulk_visit_registered_source: a bulk-planned visit requires its factory
    # to carry an industrial_licenses row linked to a commercial_registrations row,
    # both with non-empty numbers. Writing the numbers onto factories is not enough.
    psql("insert into industrial_licenses (id, commercial_registration_id, factory_id, license_number,"
         " plant_number, status, stage, issue_date, expiry_date, holder_name, source_system) values " +
         ",".join(f"({lit(uid('lic',f['factory_code']))},{lit(uid('cr',f['factory_code']))},"
                  f"{lit(uid('factory',f['factory_code']))},{lit(f['license_number'])},"
                  f"{lit(f['plant_number'])},{lit(f['license_status'])},{lit(f['license_stage'])},"
                  f"{lit(sdate(f['license_issue_date']))},{lit(sdate(f['license_expiry_date']))},"
                  f"{lit(f['name_en'])},'senaei_stub')" for f in F) +
         " on conflict (id) do update set status=excluded.status;")
    print(f"  industrial_licenses {len(F)}")

    # compliance library ---------------------------------------------------
    # SBC-801 already exists from the accepted seed (0003_seed_contract_data.sql).
    # Accepted reference rows are never overwritten: insert what is missing, then
    # resolve every regulation id from the database by code, so clauses attach to
    # the accepted row where one exists and to ours only where it does not.
    # regulations_one_open_governed allows only ONE published row per code, so a
    # code that already exists is skipped entirely rather than duplicated.
    existing_codes = set(q("select code from regulations").splitlines())
    fresh = [r for r in REG if r["regulation_code"] not in existing_codes]
    if fresh:
        psql("insert into regulations (id, code, title, issuing_authority, status) values " +
             ",".join(f"({lit(uid('reg',r['regulation_code']))},{lit(r['regulation_code'])},{lit(r['title_en'])},"
                      f"{lit(r['issuing_authority_en'])},'published')" for r in fresh) + ";")
    reg_id = dict(line.split("|", 1)[::-1] for line in
                  q("select id||'|'||code from regulations").splitlines() if "|" in line)
    kept = len(REG) - len(fresh)
    psql("insert into regulation_clauses (id, regulation_id, clause_ref, title, applicability, legal_source) values " +
         ",".join(f"({lit(uid('clause',c['clause_id']))},{lit(reg_id[c['regulation_code']])},"
                  f"{lit(c['clause_ref'])},{lit(c['title_en'])},{lit(c['applicability'])},{lit(c['legal_source'])})"
                  for c in CL if c["regulation_code"] in reg_id) +
         " on conflict (id) do update set title=excluded.title;")
    psql("insert into inspection_items (id, code, title, clause_id, response_model, evidence_rule, score_weight) values " +
         ",".join(f"({lit(uid('item',i['item_code']))},{lit(i['item_code'])},{lit(i['title_en'])},"
                  f"{lit(uid('clause',i['clause_id']))},"
                  f"'{{\"responses\":[\"compliant\",\"non_compliant\",\"na\"]}}'::jsonb,"
                  f"'{{\"on\":\"non_compliant\",\"type\":\"photo\",\"min\":1}}'::jsonb,{i['score_weight']})"
                  for i in IT) + " on conflict (id) do update set title=excluded.title;")
    psql("insert into violation_codes (id, code, title, level, clause_id, active_from) values " +
         ",".join(f"({lit(uid('vcode',v['violation_code']))},{lit(v['violation_code'])},{lit(v['title_en'])},"
                  f"{lit(v['level'])},{lit(uid('clause',v['clause_id']))},{lit(sdate(v['active_from']))})" for v in VC) +
         # A published violation code is immutable by design (guard_governed_violation_code).
         # The seed re-inserts, never updates — changing one needs a governed successor.
         " on conflict (id) do nothing;")
    print(f"  regulations         {len(fresh)} new, {kept} already accepted and left untouched")
    print(f"  clauses             {len(CL)}  items {len(IT)}  codes {len(VC)}")

    # package --------------------------------------------------------------
    pkg, pver = uid("package", "TRAIN-PKG-01"), uid("pkgver", "TRAIN-PKG-01:v1")
    psql(f"insert into packages (id, code, title, scope) values ({lit(pkg)},'TRAIN-PKG-01',"
         f"'Training inspection package','industrial') on conflict (id) do nothing;")
    # RBAC-002 maker-checker: the approver must differ from the creator, so the
    # seed uses two distinct admin personas rather than one service identity.
    psql(f"insert into package_versions (id, package_id, version_label, status, definition,"
         f" created_by, approved_by, published_at) values "
         f"({lit(pver)},{lit(pkg)},'v1','published'::config_status,'{{\"source\":\"training cohort\"}}'::jsonb,"
         f"{lit(uid('profiles','admin1'))},{lit(uid('profiles','admin2'))},{lit(ANCHOR.isoformat())}) "
         f"on conflict (id) do nothing;")

    # policies -------------------------------------------------------------
    keys = sorted({p["config_key"] for p in POL})
    for k in keys:
        vid = uid("cfgver", k)
        payload = "{" + ",".join(f'"{p["parameter"]}":{p["value"]}' for p in POL if p["config_key"] == k) + "}"
        psql(f"insert into dashboard_config_versions (id, config_key, version_number, payload, published_by,"
             f" correlation_id, published_at) values ({lit(vid)},{lit(k)},1,{lit(payload)}::jsonb,"
             f"{lit(uid('profiles','admin1'))},{lit(uid('corr',k))},{lit(ANCHOR.isoformat())}) "
             # dash_block_version_mutation makes config versions append-only:
             # a published version is never rewritten, only superseded.
             f"on conflict (id) do nothing;")
        psql(f"insert into dashboard_config_heads (config_key, current_version_id) values ({lit(k)},{lit(vid)}) "
             f"on conflict (config_key) do update set current_version_id=excluded.current_version_id;")
    print(f"  policies            {len(keys)} config keys, {len(POL)} parameters")

    # journeys -------------------------------------------------------------
    plans, visits, assigns, insps, revs, subs = [], [], [], [], [], []
    approved_ids = []
    for j in J:
        jr, fid = j["journey_ref"], uid("factory", j["factory_code"])
        pid, vid = uid("plan", jr), uid("visit", jr)
        hh, mm = j.get("window_start_time", "07:00").split(":")
        ws = datetime.fromisoformat(j["window_start"]).replace(hour=int(hh), minute=int(mm)) + SHIFT
        we = ws + timedelta(hours=2)
        plans.append(f"({lit(pid)},{lit(j['method'])}::planning_method,'published'::planning_status,"
                     f"{lit(uid('profiles', j['planner']))},{lit('PLAN-'+jr[4:])})")
        visits.append(f"({lit(vid)},{lit(pid)},{lit(fid)},{lit(j['visit_type'])},'physical'::execution_mode,"
                      f"{lit(j['planning_status'])}::planning_status,{lit(OPSTATE[j['operational_state']])}::operational_state,"
                      f"{lit(ws.isoformat())},{lit(we.isoformat())},{lit(j['priority'])},{lit(pver)},"
                      f"{lit(uid('profiles', j['planner']))},{lit(jr)},"
                      f"{lit('Cancelled during training cohort generation' if j['planning_status']=='cancelled' else None)})")
        if j["inspector"]:
            assigns.append(f"({lit(uid('assign',jr))},{lit(vid)},{lit(uid('profiles',j['inspector']))},"
                           f"'manual'::assignment_method,'assigned')")
        if j["inspection_status"]:
            iid = uid("insp", jr)
            # DEF-WF-006: an inspection cannot be 'approved' until its immutable
            # submission version exists. Load it as submitted, then promote below.
            load_status = "submitted" if j["inspection_status"] == "approved" else j["inspection_status"]
            if j["inspection_status"] == "approved": approved_ids.append(iid)
            insps.append(f"({lit(iid)},{lit(vid)},{lit(load_status)},{lit(pver)},"
                         f"{lit(ws.isoformat())},{lit(we.isoformat()) if j['inspection_status']!='in_progress' else 'null'})")
            if j["review_decision"]:
                sid = uid("subv", jr)
                subs.append(f"({lit(sid)},{lit(iid)},1,'{{\"items\":\"training cohort snapshot\"}}'::jsonb)")
                revs.append(f"({lit(uid('review',jr))},{lit(iid)},{lit(sid)},"
                            f"{lit(uid('profiles',j['supervisor']))},"
                            f"{lit(REVSTATUS[j['review_decision']])}::review_status,"
                            f"{lit(j['review_decision'] if j['review_decision']!='pending' else None)})")
    psql("insert into visit_plans (id, method, status, created_by, plan_reference) values " +
         ",".join(plans) + " on conflict (id) do nothing;")
    psql("insert into visits (id, visit_plan_id, factory_id, visit_type, execution_mode, planning_status,"
         " operational_state, window_start, window_end, priority, package_version_id, created_by,"
         " visit_reference, cancellation_reason) values " + ",".join(visits) +
         " on conflict (id) do update set planning_status=excluded.planning_status,"
         " operational_state=excluded.operational_state;")
    if assigns:
        psql("insert into assignments (id, visit_id, inspector_id, method, status) values " +
             ",".join(assigns) + " on conflict (id) do nothing;")
    if insps:
        psql("insert into inspections (id, visit_id, status, package_version_id, started_at, submitted_at) values " +
             ",".join(insps) + " on conflict (id) do update set status=excluded.status;")
    # guard_submission_action_forms_and_config requires a package snapshot per visit
    # whose checksum is sha256 of its definition. The digest is computed in SQL so
    # it matches the guard's own computation byte for byte.
    if subs:
        snap_visits = sorted({uid("visit", j["journey_ref"]) for j in J if j["review_decision"]})
        psql("insert into visit_package_snapshots (id, visit_id, preparation_version,"
             " package_version_id, definition, checksum) select "
             " v.id, v.id, 1, " + lit(pver) + ", d.def,"
             " encode(extensions.digest(d.def::text,'sha256'),'hex')"
             " from (values " + ",".join(f"({lit(x)}::uuid)" for x in snap_visits) + ") as v(id),"
             " lateral (select '{\"source\":\"training cohort\"}'::jsonb as def) d"
             " on conflict (id) do nothing;")
        print(f"  package snapshots   {len(snap_visits)}")
        psql("insert into submission_versions (id, inspection_id, version_number, snapshot) values " +
             ",".join(subs) + " on conflict (id) do nothing;")
    if approved_ids:
        # Submissions now exist, so the guard is satisfied and approval can land.
        psql("update inspections set status='approved' where id in (" +
             ",".join(lit(i) for i in approved_ids) + ");")
        print(f"  approved            {len(approved_ids)}  (promoted after submission)")
    if revs:
        psql("insert into reviews (id, inspection_id, submission_version_id, reviewer_id, status, decision) values " +
             ",".join(revs) + " on conflict (id) do update set status=excluded.status, decision=excluded.decision;")
    print(f"  visit_plans         {len(plans)}")
    print(f"  visits              {len(visits)}")
    print(f"  assignments         {len(assigns)}")
    print(f"  inspections         {len(insps)}")
    print(f"  submission_versions {len(subs)}")
    print(f"  reviews             {len(revs)}")

    # checklist responses --------------------------------------------------
    items_by_auth = {}
    for i in IT: items_by_auth.setdefault(i["issuing_authority_code"], []).append(i["item_code"])
    PACKAGES = {"routine":["SBC","CD","MHRSD","HCIS"], "licensing":["MIM","MOMRAH","SASO"],
                "complaint":["CD","NCEC","SFDA"], "follow_up":["SBC","CD"]}
    total = 0
    for j in J:
        if not j["inspection_status"]: continue
        pool = [c for a in PACKAGES[j["visit_type"]] for c in items_by_auth.get(a, [])]
        n_ans, n_nc, n_na = int(j["responses"]), int(j["non_compliant"]), int(j["na"])
        chosen = pool[:n_ans]
        vals = []
        for idx, code in enumerate(chosen):
            v = "non_compliant" if idx < n_nc else ("na" if idx < n_nc + n_na else "compliant")
            vals.append(f"({lit(uid('resp', j['journey_ref']+':'+code))},{lit(uid('insp', j['journey_ref']))},"
                        f"{lit(uid('item', code))},'{{\"value\":\"{v}\"}}'::jsonb,true)")
        for k in range(0, len(vals), 800):
            psql("insert into checklist_responses (id, inspection_id, item_id, response, is_complete) values " +
                 ",".join(vals[k:k+800]) + " on conflict (id) do update set response=excluded.response;")
        total += len(vals)
    print(f"  checklist_responses {total}")

    # geo events -----------------------------------------------------------
    gv = [f"({lit(uid('geo', g['journey_ref']+':'+g['seq']))},{lit(uid('visit',g['journey_ref']))},"
          f"{lit(g['kind'])},{g['observed_lat']},{g['observed_lng']},{g['accuracy_m']},"
          f"{(lit(g['geofence_result'])+'::geofence_result') if g['geofence_result'] else 'null'},"
          f"{lit(g['override_reason'] or None)},{lit(g['gis_version'])},{lit(sts(g['occurred_at']))})" for g in G]
    for k in range(0, len(gv), 400):
        psql("insert into geo_events (id, visit_id, kind, observed_lat, observed_lng, accuracy_m,"
             " geofence_result, override_reason, gis_version, occurred_at) values " +
             ",".join(gv[k:k+400]) + " on conflict (id) do nothing;")
    print(f"  geo_events          {len(gv)}")
    print(f"\nbatch {BATCH}")

def verify():
    print("verify — what each route will show\n")
    checks = [
      ("Planning · all",        "select count(*) from visits"),
      ("Planning · draft",      "select count(*) from visits where planning_status='draft'"),
      ("Planning · published",  "select count(*) from visits where planning_status='published'"),
      ("Planning · cancelled",  "select count(*) from visits where planning_status='cancelled'"),
      ("Planning · expired",    "select count(*) from visits where planning_status='expired'"),
      ("Operations · in motion","select count(*) from visits where operational_state in ('on_the_way','arrived','executing')"),
      ("Operations · geo events","select count(*) from geo_events"),
      ("Operations · overrides","select count(*) from geo_events where kind='override'"),
      ("Execution · active",    "select count(*) from inspections where status='in_progress'"),
      ("Reviews · pending",     "select count(*) from reviews where status='pending_review'"),
      ("Reviews · approved",    "select count(*) from reviews where decision='approve'"),
      ("Factory 360",           "select count(*) from factories"),
      ("Compliance · items",    "select count(*) from inspection_items"),
      ("Compliance · codes",    "select count(*) from violation_codes"),
      ("Checklist answers",     "select count(*) from checklist_responses"),
      ("Users",                 "select count(*) from profiles"),
    ]
    for label, sql in checks: print(f"  {label:<26} {q(sql)}")
    comp = q("select count(*) from checklist_responses r join inspections i on i.id=r.inspection_id "
             "join reviews v on v.inspection_id=i.id where v.decision='approve' and r.response->>'value'='compliant'")
    nc = q("select count(*) from checklist_responses r join inspections i on i.id=r.inspection_id "
           "join reviews v on v.inspection_id=i.id where v.decision='approve' and r.response->>'value'='non_compliant'")
    if comp.isdigit() and nc.isdigit() and int(comp) + int(nc):
        print(f"\n  STR-KPI-001 compliance     {round(int(comp)/(int(comp)+int(nc))*100,1)}%  ({comp} of {int(comp)+int(nc)})")
    print(f"  policies published         {q('select count(*) from dashboard_config_heads')}")

def batch_ids():
    """Every id this batch owns, derived — never a heuristic match."""
    F, P = read("factories.csv"), read("personas.csv")
    J, G = read("journeys.csv"), read("geo_events.csv")
    REG, CL = read("regulations.csv"), read("clauses.csv")
    IT, VC = read("inspection_items.csv"), read("violation_codes.csv")
    POL = read("policies.csv")
    items_by_auth = {}
    for i in IT: items_by_auth.setdefault(i["issuing_authority_code"], []).append(i["item_code"])
    PACKAGES = {"routine":["SBC","CD","MHRSD","HCIS"], "licensing":["MIM","MOMRAH","SASO"],
                "complaint":["CD","NCEC","SFDA"], "follow_up":["SBC","CD"]}
    resp, snaps = [], []
    for j in J:
        if not j["inspection_status"]: continue
        pool = [c for a in PACKAGES[j["visit_type"]] for c in items_by_auth.get(a, [])]
        for code in pool[:int(j["responses"])]:
            resp.append(uid("resp", j["journey_ref"] + ":" + code))
        if j["review_decision"]: snaps.append(uid("visit", j["journey_ref"]))
    live = [j for j in J if j["inspection_status"]]
    dec = [j for j in J if j["review_decision"]]
    return {
      "violations": [], "reviews": [uid("review", j["journey_ref"]) for j in dec],
      "submission_versions": [uid("subv", j["journey_ref"]) for j in dec],
      "visit_package_snapshots": snaps,
      "checklist_responses": resp,
      "inspections": [uid("insp", j["journey_ref"]) for j in live],
      "geo_events": [uid("geo", g["journey_ref"] + ":" + g["seq"]) for g in G],
      "journey_sessions": [],
      "assignments": [uid("assign", j["journey_ref"]) for j in J if j["inspector"]],
      "visits": [uid("visit", j["journey_ref"]) for j in J],
      "visit_plans": [uid("plan", j["journey_ref"]) for j in J],
      "dashboard_config_heads": sorted({p["config_key"] for p in POL}),
      "dashboard_config_versions": [uid("cfgver", k) for k in sorted({p["config_key"] for p in POL})],
      "package_versions": [uid("pkgver", "TRAIN-PKG-01:v1")],
      "packages": [uid("package", "TRAIN-PKG-01")],
      "violation_codes": [uid("vcode", v["violation_code"]) for v in VC],
      "inspection_items": [uid("item", i["item_code"]) for i in IT],
      "regulation_clauses": [uid("clause", c["clause_id"]) for c in CL],
      "regulations": [uid("reg", r["regulation_code"]) for r in REG],
      "industrial_licenses": [uid("lic", f["factory_code"]) for f in F],
      "factories": [uid("factory", f["factory_code"]) for f in F],
      "commercial_registrations": [uid("cr", f["factory_code"]) for f in F],
      "profiles": [uid("profiles", p["username"]) for p in P],
    }

def unload(confirm):
    print("unload" + ("" if confirm else " — dry run, nothing is written"))
    owned = batch_ids()
    # Reverse of the write order. Only ids this batch derived are ever touched;
    # rows that were already in the database are left exactly as they were.
    order = ["reviews","submission_versions","visit_package_snapshots","checklist_responses",
             "inspections","geo_events","assignments","visits","visit_plans",
             "dashboard_config_heads","dashboard_config_versions","package_versions","packages",
             "violation_codes","inspection_items","regulation_clauses","regulations",
             "industrial_licenses","factories","commercial_registrations","profiles"]
    total, kept_total, blocked = 0, 0, []
    for t in order:
        ids = owned.get(t) or []
        if not ids: continue
        if t in NEVER_DELETE:
            c = q(f"select count(*) from {t} where id in ({','.join(lit(i) for i in ids)})")
            if c.isdigit() and int(c):
                blocked.append((t, int(c))); print(f"  {'IMMUTABLE':<14} {int(c):>6}          {t}")
            continue
        key = KEY_COLUMN.get(t, "id")
        inlist = ",".join(lit(i) for i in ids)
        mine = q(f"select count(*) from {t} where {key} in ({inlist})")
        allrows = q(f"select count(*) from {t}")
        if not mine.isdigit(): continue
        keep = int(allrows) - int(mine) if allrows.isdigit() else 0
        total += int(mine); kept_total += keep
        if int(mine) or keep:
            print(f"  {'delete' if confirm else 'would delete':<14} {int(mine):>6}   keep {keep:>4}   {t}")
        if confirm and int(mine):
            r = _run(f"delete from {t} where {key} in ({inlist});", ["-v", "ON_ERROR_STOP=1", "-q"])
            if r.returncode:
                held = q(f"select count(*) from {t} where {key} in ({inlist})")
                blocked.append((t, int(held) if held.isdigit() else int(mine)))
                total -= int(mine)
                print(f"      held back by a referential or immutability rule: {r.stderr.strip().splitlines()[0][:80]}")
    users = [uid("profiles", p["username"]) for p in read("personas.csv")]
    inlist = ",".join(lit(u) for u in users)
    au = q(f"select count(*) from auth.users where id in ({inlist})")
    if au.isdigit() and int(au):
        print(f"  {'delete' if confirm else 'would delete':<14} {int(au):>6}   keep    0   auth.users")
        total += int(au)
        if confirm: psql(f"delete from auth.users where id in ({inlist});")
    print(f"\n  {'deleted' if confirm else 'would delete'} {total} rows · left {kept_total} rows that were not ours")
    if blocked:
        n_blocked = sum(c for _, c in blocked)
        print(f"  {n_blocked} rows CANNOT be deleted — the platform refuses it:")
        for t, c in blocked: print(f"      {c:>6}  {t}")
        print("  A submitted inspection is a permanent record. To return a training")
        print("  database to empty, recreate the database — deletion cannot do it.")
    print(f"  audit_events        {q('select count(*) from audit_events')}  (append-only, never deleted)")
    if confirm:
        print(f"  visits remaining    {q('select count(*) from visits')}")
        print(f"  factories remaining {q('select count(*) from factories')}  (pre-existing rows intact)")

def reset(confirm):
    """Full removal of the batch, including append-only rows.

    A submitted inspection is immutable during normal operation — that is correct
    and must never be circumvented on a real system. Resetting a TRAINING database
    is a different act, and Postgres has a first-class mechanism for it:
    session_replication_role = replica suspends triggers for the session. It needs
    superuser, which is itself the guard: nobody holds it where it would matter.

    Scope is unchanged — only ids this batch derived are deleted.
    """
    db = current_database()
    if any(t in db.lower() for t in ("prod", "production")):
        raise SystemExit("REFUSED: database name looks like production")
    if os.environ.get("NODE_ENV") == "production":
        raise SystemExit("REFUSED: NODE_ENV=production")
    su = q("select usesuper from pg_user where usename = current_user")
    if su != "t":
        raise SystemExit("REFUSED: reset needs superuser to suspend triggers.\n"
                         "         Use 'unload --confirm' for the trigger-respecting removal.")
    if not confirm:
        print("reset — dry run. Pass --confirm to execute.")
    owned = batch_ids()
    order = ["reviews","submission_versions","visit_package_snapshots","checklist_responses",
             "inspections","geo_events","assignments","visits","visit_plans",
             "dashboard_config_heads","dashboard_config_versions","package_versions","packages",
             "violation_codes","inspection_items","regulation_clauses","regulations",
             "industrial_licenses","factories","commercial_registrations","profiles"]
    print(f"reset  database {db}  batch {BATCH}")
    stmts, total = [], 0
    for t in order:
        ids = owned.get(t) or []
        if not ids or t == "audit_events": continue
        key = KEY_COLUMN.get(t, "id")
        inlist = ",".join(lit(i) for i in ids)
        n = q(f"select count(*) from {t} where {key} in ({inlist})")
        if not n.isdigit():
            raise SystemExit(f"REFUSED: cannot count rows in {t} by {key} — {n}")
        if not int(n): continue
        total += int(n)
        print(f"  {'delete' if confirm else 'would delete':<14} {int(n):>6}  {t}")
        stmts.append(f"delete from {t} where {key} in ({inlist});")
    users = [uid("profiles", p["username"]) for p in read("personas.csv")]
    inlist = ",".join(lit(u) for u in users)
    n = q(f"select count(*) from auth.users where id in ({inlist})")
    if n.isdigit() and int(n):
        total += int(n); print(f"  {'delete' if confirm else 'would delete':<14} {int(n):>6}  auth.users")
        stmts.append(f"delete from auth.users where id in ({inlist});")
    if confirm and stmts:
        # One transaction: either the whole batch goes or nothing does.
        psql("begin; set local session_replication_role = replica;\n" + "\n".join(stmts) + "\ncommit;")
    print(f"\n  {'deleted' if confirm else 'would delete'} {total} rows in one transaction")
    print(f"  audit_events        {q('select count(*) from audit_events')}  (deliberately kept — the")
    print( "                      trail of what the training run did stays readable)")
    if confirm:
        for t in ("visits","inspections","checklist_responses","submission_versions","factories","profiles"):
            print(f"  {t:<20}{q(f'select count(*) from {t}')} remaining")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "verify"
    if cmd == "preflight": preflight()
    elif cmd == "load": preflight(); load()
    elif cmd == "verify": verify()
    elif cmd == "unload": unload("--confirm" in sys.argv)
    elif cmd == "reset": reset("--confirm" in sys.argv)
    else: raise SystemExit(__doc__)
