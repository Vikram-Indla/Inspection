# -*- coding: utf-8 -*-
"""Assert every figure the Product Owner approved, against live SQL.

Run after a load. Exits non-zero on any mismatch.
Approved values: product-contract/test-data-architecture/CONSENT-RECORD.md

  python3 scripts/test-data/acceptance.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from load import q

# Cohort rows carry an F-<site>-nnn code. Rows already in the database use a
# different shape (F-1101). Counting all of them was an early false failure.
COHORT = r"^F-[A-Z]{1,2}[0-9]?-[0-9]{3}$"

CHECKS = [
 ("Total visits",        "select count(*) from visits", 300),
 ("Establishments",      f"select count(*) from factories where factory_code ~ '{COHORT}'", 73),
 ("Users",               "select count(*) from profiles", 45),
 ("Checklist answers",   "select count(*) from checklist_responses", 5371),
 ("Draft",               "select count(*) from visits where planning_status='draft'", 24),
 ("Pending supervision", "select count(*) from visits where planning_status='pending_supervision'", 18),
 ("Published",           "select count(*) from visits where planning_status='published'", 226),
 ("Returned",            "select count(*) from visits where planning_status='returned'", 10),
 ("Cancelled",           "select count(*) from visits where planning_status='cancelled'", 14),
 ("Expired",             "select count(*) from visits where planning_status='expired'", 8),
 ("Routine visits",      "select count(*) from visits where visit_type='routine'", 79),
 ("Complaint visits",    "select count(*) from visits where visit_type='complaint'", 71),
 ("Licensing visits",    "select count(*) from visits where visit_type='licensing'", 71),
 ("Follow-up visits",    "select count(*) from visits where visit_type='follow_up'", 79),
 ("In motion",           "select count(*) from visits where operational_state in ('on_the_way','arrived','executing')", 44),
 ("GPS events",          "select count(*) from geo_events", 308),
 ("Geofence overrides",  "select count(*) from geo_events where kind='override'", 6),
 ("Reviews pending",     "select count(*) from reviews where status='pending_review'", 48),
 ("Approved",            "select count(*) from reviews where decision='approve'", 60),
 ("Returned reviews",    "select count(*) from reviews where decision='return'", 12),
 ("Rejected",            "select count(*) from reviews where decision='reject'", 10),
 ("Policies published",  "select count(*) from dashboard_config_heads", 3),
]

def main():
    print("acceptance — approved figures against live SQL\n")
    failed = 0
    for label, sql, expect in CHECKS:
        got = q(sql)
        ok = got == str(expect)
        failed += 0 if ok else 1
        print(f"  {'PASS' if ok else 'FAIL'}  {label:<22}{got:>7}" + ("" if ok else f"   expected {expect}"))
    j = ("from checklist_responses r join inspections i on i.id=r.inspection_id"
         " join reviews v on v.inspection_id=i.id where v.decision='approve'")
    c = int(q(f"select count(*) {j} and r.response->>'value'='compliant'"))
    n = int(q(f"select count(*) {j} and r.response->>'value'='non_compliant'"))
    rate = round(c / (c + n) * 100, 1)
    ok = rate == 82.9
    failed += 0 if ok else 1
    print(f"  {'PASS' if ok else 'FAIL'}  {'Compliance rate':<22}{rate:>6}%   ({c} of {c + n})")
    print(f"\n  audit trail           {q('select count(*) from audit_events'):>7} events (kept, per consent)")
    total = len(CHECKS) + 1
    print(f"\n{'ALL ' + str(total) + ' CHECKS PASS' if not failed else str(failed) + ' OF ' + str(total) + ' FAILED'}")
    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
