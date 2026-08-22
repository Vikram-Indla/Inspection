# -*- coding: utf-8 -*-
"""Generate the journey cohort and compute what every route will show.

Deterministic: no randomness, no clock. Same inputs -> same cohort, always.
Reads factories.csv. Writes personas.csv, journeys.csv, route-preview.json.

Run: python3 build_cohort.py
"""
import csv, json, hashlib
from collections import Counter, defaultdict
from datetime import date, timedelta

ANCHOR = date(2026, 8, 22)
# A visit carries the package for its type, not one 142-item catalogue. Item counts
# come from build_compliance_library.py: the authorities each visit type actually
# inspects. A follow-up re-checks only what failed last time.
PACKAGES = {
 "routine":   {"authorities": ["SBC","CD","MHRSD","HCIS"], "items": 80},
 "licensing": {"authorities": ["MIM","MOMRAH","SASO"],     "items": 26},
 "complaint": {"authorities": ["CD","NCEC","SFDA"],        "items": 34},
 "follow_up": {"authorities": ["prior non-compliant"],     "items": 12},
}

def h(*parts):
    return int(hashlib.sha256("|".join(map(str, parts)).encode()).hexdigest()[:8], 16)

FACTORIES = list(csv.DictReader(open("factories.csv", encoding="utf-8")))

# ---------------------------------------------------------------- personas (4 roles)
ROLES = [("admin", 5, "Admin"), ("planner", 6, "Planner"),
         ("supervisor", 8, "Supervisor"), ("inspector", 24, "Inspector")]
AR_NAMES = ["خالد إبراهيم الشمري","نورة عبدالعزيز الحربي","عمر فهد الدوسري","ريم سعد العتيبي",
  "بندر ناصر المطيري","سلطان عايض الشهري","ماجد سليمان الزهراني","فيصل تركي العنزي",
  "هاني مشعل الغامدي","ياسر راشد البقمي","عبدالله محمد القحطاني","سارة علي الدوسري",
  "تركي سعود الرشيدي","لطيفة حمد السبيعي","مشعل بدر الحارثي","أحمد صالح العتيبي",
  "هند فيصل النعيمي","سعد مبارك الشهراني","وليد عادل الجهني","دانة خالد المالكي",
  "ناصر عوض البلوي","منال يوسف الثقفي","راكان زياد الشمراني","جواهر طلال القرني"]
REGIONS = sorted({f["region"] for f in FACTORIES})

personas = []
for role, n, label in ROLES:
    for i in range(1, n + 1):
        personas.append({
            "username": f"{role}{i}", "email": f"{role}{i}@mim.gov.sa",
            "role": role, "role_label": label,
            "display_name_ar": AR_NAMES[(len(personas)) % len(AR_NAMES)],
            "region": "National" if role == "admin" else REGIONS[(i - 1) % len(REGIONS)],
        })
personas.append({"username":"multi-role","email":"multi-role@mim.gov.sa","role":"planner+supervisor",
                 "role_label":"Planner + Supervisor","display_name_ar":"ضابط تخطيط وإشراف","region":"Riyadh"})
personas.append({"username":"no-workspace","email":"no-workspace@mim.gov.sa","role":"none",
                 "role_label":"None (refusal case)","display_name_ar":"مستخدم بلا صلاحيات","region":""})
with open("personas.csv","w",encoding="utf-8",newline="") as fh:
    w=csv.DictWriter(fh,fieldnames=list(personas[0].keys())); w.writeheader(); w.writerows(personas)

PLANNERS = [p["username"] for p in personas if p["role"] == "planner"]
SUPERVISORS = [p["username"] for p in personas if p["role"] == "supervisor"]
INSPECTORS = [p["username"] for p in personas if p["role"] == "inspector"]

# ---------------------------------------------------------------- journeys
# Terminal stop -> (count, planning_status, operational_state, inspection_status, review_decision)
STOPS = [
 ("J00", 24, "draft",              "new",       None,          None),
 ("J01", 18, "pending_supervision","new",       None,          None),
 ("J02", 22, "published",          "new",       None,          None),
 ("J03", 10, "returned",           "new",       None,          None),
 ("J04", 14, "cancelled",          "new",       None,          None),
 ("J05",  8, "expired",            "new",       None,          None),
 ("J06", 30, "published",          "assigned",  None,          None),
 ("J07", 12, "published",          "on_the_way",None,          None),
 ("J08",  8, "published",          "arrived",   None,          None),
 ("J09",  6, "published",          "arrived",   None,          None),
 ("J10", 18, "published",          "executing", "in_progress", None),
 ("J11", 40, "published",          "under_review","submitted", "pending"),
 ("J12", 12, "published",          "under_review","submitted", "return"),
 ("J13",  8, "published",          "under_review","submitted", "pending"),
 ("J14", 60, "published",          "closed",    "approved",    "approve"),
 ("J15", 10, "published",          "under_review","submitted", "reject"),
]
TOTAL = sum(s[1] for s in STOPS)

journeys, n = [], 0
for stop, count, pstat, ostat, istat, decision in STOPS:
    for k in range(count):
        n += 1
        if stop == "J14" and k < len(REGIONS):
            pool = [x for x in FACTORIES if x["region"] == REGIONS[k]]
            f = pool[h("f", stop, k) % len(pool)]
        else:
            f = FACTORIES[h("f", stop, k) % len(FACTORIES)]
        # Spread windows across 12 months back from the anchor; today's work for live tiles.
        if stop in ("J07","J08","J09","J10") or (stop == "J06" and k < 8):
            offset = 0
        elif stop == "J05":
            offset = -(20 + h("d", stop, k) % 40)
        elif stop == "J14":
            # 40% inside the rolling 30-day analytics window, the rest across 12 months,
            # so /analytics has signal and the 12-month trend still has shape.
            offset = -(h("d", stop, k) % 30) if k % 5 < 2 else -(30 + h("d2", stop, k) % 335)
        else:
            offset = -(h("d", stop, k) % 120)
        wstart = ANCHOR + timedelta(days=offset)
        journeys.append({
            "journey_ref": f"JRN-{ANCHOR.year}-{n:04d}",
            "terminal_stop": stop,
            "factory_code": f["factory_code"], "factory_name": f["name_en"],
            "region": f["region"], "city": f["city_en"],
            "planner": PLANNERS[h("p", n) % len(PLANNERS)],
            "supervisor": SUPERVISORS[h("s", n) % len(SUPERVISORS)],
            "inspector": INSPECTORS[h("i", n) % len(INSPECTORS)] if ostat != "new" or stop == "J06" else "",
            "planning_status": pstat, "operational_state": ostat,
            "inspection_status": istat or "", "review_decision": decision or "",
            "method": "bulk" if n % 17 == 0 else ("immediate" if n % 29 == 0 else "single"),
            "gps_override": "yes" if stop == "J09" else "no",
            "window_start": wstart.isoformat(),
            "visit_type": ["routine","follow_up","complaint","licensing"][k % 4],
            "priority": ["low","normal","high","urgent"][(k // 4 + k) % 4],
        })

# Checklist responses + findings/violations on inspections that exist.
for j in journeys:
    if not j["inspection_status"]:
        j.update(responses="0", compliant="0", non_compliant="0", na="0",
                 evidence="0", findings="0", violations="0", penalties="0")
        continue
    size = PACKAGES[j["visit_type"]]["items"]
    answered = int(size * 0.6) if j["inspection_status"] == "in_progress" else size
    na = answered // 10
    eligible = answered - na
    nc_rate = 0.30 if j["region"] in ("Riyadh", "Eastern") and h("nc", j["journey_ref"]) % 5 == 0 else 0.16
    nc = round(eligible * nc_rate)
    approved = j["review_decision"] == "approve"
    findings = min(nc, 1 + h("fd", j["journey_ref"]) % 3) if nc else 0
    # Scale to the package: a fixed count made small packages unable to reach it,
    # so follow-up visits could never carry a violation.
    threshold = max(2, round(answered * 0.15))
    violations = (1 + h("vi", j["journey_ref"]) % 2) if (approved and nc >= threshold) else 0
    penalties = 1 if (violations and h("pe", j["journey_ref"]) % 2 == 0) else 0
    j.update(responses=str(answered), compliant=str(eligible - nc), non_compliant=str(nc), na=str(na),
             evidence=str(3 + h("ev", j["journey_ref"]) % 4), findings=str(findings),
             violations=str(violations), penalties=str(penalties))

# The platform enforces inspector capacity (guard_assignment_window_overlap):
# one inspector cannot hold two assignments whose windows overlap. Allocate each
# inspector a distinct slot on each date, so the cohort is actually schedulable.
SLOTS = ["07:00","09:30","12:00","14:30","17:00"]
booked = {}
for j in journeys:
    if not j["inspector"]:
        j["window_start_time"] = SLOTS[0]; j["slot_index"] = "0"; continue
    d = j["window_start"]; who = j["inspector"]
    used = booked.setdefault((who, d), [])
    if len(used) < len(SLOTS):
        idx = len(used)
    else:
        # Slots exhausted for that inspector on that date: push to the next free day.
        day = date.fromisoformat(d); idx = 0
        while True:
            day += timedelta(days=1); d = day.isoformat()
            used = booked.setdefault((who, d), [])
            if len(used) < len(SLOTS): idx = len(used); break
        j["window_start"] = d
    used.append(idx)
    j["window_start_time"] = SLOTS[idx]; j["slot_index"] = str(idx)

overlaps = sum(1 for v in booked.values() if len(v) != len(set(v)))
assert overlaps == 0, f"{overlaps} inspector-day slots double-booked"
print(f"scheduling      0 overlaps across {len(booked)} inspector-days")

with open("journeys.csv","w",encoding="utf-8",newline="") as fh:
    w=csv.DictWriter(fh,fieldnames=list(journeys[0].keys())); w.writeheader(); w.writerows(journeys)

# ---------------------------------------------------------------- route projections
I = lambda j, k: int(j[k])
today = ANCHOR.isoformat()
approved = [j for j in journeys if j["review_decision"] == "approve"]
decided  = [j for j in journeys if j["review_decision"] in ("approve","return","reject")]
subs     = [j for j in journeys if j["inspection_status"] == "submitted"]

comp = sum(I(j,"compliant") for j in approved)
ncomp = sum(I(j,"non_compliant") for j in approved)
tabs = Counter(j["planning_status"] for j in journeys)
states = Counter(j["operational_state"] for j in journeys)

P = {
 "totals": {
   "factories": len(FACTORIES), "personas": len(personas), "journeys": len(journeys),
   "regions": len(REGIONS), "checklist_responses": sum(I(j,"responses") for j in journeys),
   "evidence": sum(I(j,"evidence") for j in journeys),
   "findings": sum(I(j,"findings") for j in journeys),
   "violations": sum(I(j,"violations") for j in journeys),
   "penalties": sum(I(j,"penalties") for j in journeys),
 },
 "planning_tabs": {
   "all": len(journeys), "draft": tabs["draft"], "pending_supervision": tabs["pending_supervision"],
   "published": tabs["published"], "returned": tabs["returned"],
   "cancelled": tabs["cancelled"], "expired": tabs["expired"],
 },
 "operations": {
   "pipeline_total": len(journeys),
   "by_state": dict(states),
   "on_map_today": sum(1 for j in journeys if j["operational_state"] in ("on_the_way","arrived","executing")),
   "gps_overrides_today": sum(1 for j in journeys if j["gps_override"]=="yes" and j["window_start"]==today),
 },
 "execution": {
   "active": states["executing"],
   "assigned_today": sum(1 for j in journeys if j["operational_state"]=="assigned" and j["window_start"]==today),
   "responses_in_progress": sum(I(j,"responses") for j in journeys if j["inspection_status"]=="in_progress"),
   "package_sizes": {k: v["items"] for k, v in PACKAGES.items()},
 },
 "reviews": {
   "queue_pending": sum(1 for j in journeys if j["review_decision"]=="pending"),
   "decided": len(decided),
   "approve": sum(1 for j in decided if j["review_decision"]=="approve"),
   "returned": sum(1 for j in decided if j["review_decision"]=="return"),
   "reject": sum(1 for j in decided if j["review_decision"]=="reject"),
 },
 "enforcement": {
   "violations": sum(I(j,"violations") for j in journeys),
   "penalties": sum(I(j,"penalties") for j in journeys),
   "factories_with_violations": len({j["factory_code"] for j in journeys if I(j,"violations")}),
 },
 "dashboard": {
   "STR-KPI-001_compliance_rate": round(comp / (comp + ncomp) * 100, 1) if comp + ncomp else None,
   "STR-KPI-001_numerator": comp, "STR-KPI-001_denominator": comp + ncomp,
   "STR-KPI-004_approval_rate": round(len(approved) / len(decided) * 100, 1) if decided else None,
   "STR-KPI-006_cancellation_rate": round(tabs["cancelled"] / len(journeys) * 100, 1),
   "STR-KPI-009_checklist_items": 142,
   "OPS-KPI-001_visit_pipeline": len(journeys),
   "OPS-KPI-003_active_executions": states["executing"],
   "OPS-KPI-004_pending_approvals": sum(1 for j in journeys if j["review_decision"]=="pending"),
   "OPS-KPI-007_gps_overrides_today": sum(1 for j in journeys if j["gps_override"]=="yes" and j["window_start"]==today),
   "STR-KPI-002_risk_distribution": "Unavailable — no Health Score source",
   "STR-KPI-003_violation_trend": "Decision required — no issue-date column",
   "STR-KPI-005_licence_exposure": "Unavailable — no governed rule",
   "STR-KPI-011_repeat_violation": "Unavailable — no repeat window rule",
   "STR-KPI-007_coverage": "Not configured — publish inspection-cycle policy",
   "STR-KPI-008_uninspected": "Not configured — publish inspection-cycle policy",
   "OPS-KPI-002_expiring_soon": "Not configured — publish SLA urgency policy",
 },
 "analytics": {
   "approved_in_last_30_days": sum(1 for j in approved
       if (ANCHOR - date.fromisoformat(j["window_start"])).days <= 30),
   "approved_total": len(approved),
   "by_region": {r: sum(1 for j in approved if j["region"]==r) for r in REGIONS},
 },
 "factory360": {
   "establishments": len(FACTORIES),
   "with_history": len({j["factory_code"] for j in journeys}),
   "max_visits_one_factory": max(Counter(j["factory_code"] for j in journeys).values()),
 },
 "field_inspector": {
   "inspectors": len(INSPECTORS),
   "avg_assignments": round(sum(1 for j in journeys if j["inspector"]) / len(INSPECTORS), 1),
 },
}
json.dump(P, open("route-preview.json","w",encoding="utf-8"), indent=1, ensure_ascii=False)

print(f"personas.csv  {len(personas)}")
print(f"journeys.csv  {len(journeys)}")
print(f"responses     {P['totals']['checklist_responses']:,}")
print(f"planning tabs {P['planning_tabs']}")
print(f"compliance    {P['dashboard']['STR-KPI-001_compliance_rate']}%  ({comp}/{comp+ncomp})")
print(f"approval      {P['dashboard']['STR-KPI-004_approval_rate']}%")
print(f"violations    {P['enforcement']['violations']}  penalties {P['enforcement']['penalties']}")
