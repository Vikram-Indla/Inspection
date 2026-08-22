# -*- coding: utf-8 -*-
"""Generate GPS tracks for the live map, and the L1 policy versions that
unblock three dashboard tiles.

Deterministic. Reads factories.csv + journeys.csv.
Writes geo_events.csv, policies.csv, map-preview.json.

Run: python3 build_geo_and_policy.py
"""
import csv, json, hashlib, math
from collections import Counter
from datetime import date, datetime, timedelta

ANCHOR = date(2026, 8, 22)
def h(*p): return int(hashlib.sha256("|".join(map(str,p)).encode()).hexdigest()[:8], 16)

FAC = {f["factory_code"]: f for f in csv.DictReader(open("factories.csv", encoding="utf-8"))}
JRN = list(csv.DictReader(open("journeys.csv", encoding="utf-8")))

# Regional operating bases inspectors set out from — the region's main city.
BASE = {
 "Riyadh":(24.7136,46.6753), "Makkah":(21.4858,39.1925), "Eastern":(26.4207,50.0888),
 "Madinah":(24.5247,39.5692), "Qassim":(26.3260,43.9750), "Asir":(18.2164,42.5053),
 "Hail":(27.5114,41.7208), "Tabuk":(28.3835,36.5662), "Jazan":(16.8892,42.5511),
 "Najran":(17.4933,44.1277), "Al Baha":(20.0129,41.4677),
 "Northern Borders":(30.9753,41.0381), "Al Jouf":(29.9697,40.2064),
}

def metres(lat1,lng1,lat2,lng2):
    R=6371000.0
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1); dl=math.radians(lng2-lng1)
    a=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return round(2*R*math.asin(math.sqrt(a)))

OVERRIDE_REASONS = [
 "Gate relocated; guard directed entry from the service road",
 "Establishment boundary extends beyond the recorded geofence",
 "GPS accuracy degraded inside the plant structure",
 "Recorded coordinates point to the office, not the production site",
 "Access road closed; approached from the adjacent plot",
 "Site rebuilt since the last coordinate survey",
]

LIVE = {"on_the_way","arrived","executing"}
rows, tracks = [], []
for j in JRN:
    if j["operational_state"] not in LIVE: continue
    f = FAC[j["factory_code"]]
    flat, flng = float(f["official_lat"]), float(f["official_lng"])
    radius = int(f["geofence_radius_m"])
    blat, blng = BASE[j["region"]]
    # Set out from a point between the regional base and the site, so tracks vary.
    seed = h("o", j["journey_ref"])
    olat = blat + (flat - blat) * (0.10 + (seed % 25) / 100)
    olng = blng + (flng - blng) * (0.10 + (seed % 25) / 100)
    state = j["operational_state"]
    # How far along the route the inspector is right now.
    progress = {"on_the_way": 0.35 + (seed % 40) / 100, "arrived": 1.0, "executing": 1.0}[state]
    steps = 6
    depart = datetime(ANCHOR.year, ANCHOR.month, ANCHOR.day, 7, 0) + timedelta(minutes=seed % 90)
    pts = []
    for s in range(steps + 1):
        t = (s / steps) * progress
        lat = round(olat + (flat - olat) * t, 7)
        lng = round(olng + (flng - olng) * t, 7)
        # Nudge intermediate points off the straight line so the track reads as a road.
        if 0 < s < steps:
            lat += ((h("j", j["journey_ref"], s) % 11) - 5) * 0.0025
            lng += ((h("k", j["journey_ref"], s) % 11) - 5) * 0.0025
            lat, lng = round(lat, 7), round(lng, 7)
        when = depart + timedelta(minutes=int(s * (12 + seed % 9)))
        dist = metres(lat, lng, flat, flng)
        last = s == steps
        if last and state == "on_the_way":
            kind, fence, reason = "telemetry", None, ""
        elif last and j["gps_override"] == "yes":
            kind, fence, reason = "override", "outside", OVERRIDE_REASONS[seed % len(OVERRIDE_REASONS)]
        elif last:
            kind, fence, reason = "arrival", "inside", ""
        else:
            kind, fence, reason = "telemetry", None, ""
        if kind == "override":
            lat = round(flat + 0.0032, 7); lng = round(flng + 0.0028, 7)
            dist = metres(lat, lng, flat, flng)
        pts.append((lat, lng))
        rows.append({
            "journey_ref": j["journey_ref"], "visit_reference": j["journey_ref"],
            "factory_code": j["factory_code"], "factory_name": j["factory_name"],
            "region": j["region"], "inspector": j["inspector"],
            "seq": s, "kind": kind,
            "observed_lat": lat, "observed_lng": lng,
            "accuracy_m": 8 + (h("a", j["journey_ref"], s) % 22),
            "distance_to_site_m": dist,
            "geofence_radius_m": radius,
            "geofence_result": fence or "",
            "override_reason": reason,
            "gis_version": "v1-accepted-2026-07-11",
            "device_id": f"IPAD-{j['inspector'].replace('inspector','')}".rjust(9, "0") if j["inspector"] else "",
            "occurred_at": when.isoformat(timespec="minutes"),
        })
    cur = pts[-1]
    tracks.append({
        "journey_ref": j["journey_ref"], "inspector": j["inspector"],
        "factory_code": j["factory_code"], "factory_name": j["factory_name"],
        "region": j["region"], "state": state,
        "current_lat": cur[0], "current_lng": cur[1],
        "site_lat": flat, "site_lng": flng, "geofence_radius_m": radius,
        "distance_to_site_m": metres(cur[0], cur[1], flat, flng),
        "override": j["gps_override"] == "yes",
        "points": len(pts),
    })

with open("geo_events.csv","w",encoding="utf-8",newline="") as fh:
    w=csv.DictWriter(fh,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

# ---------------------------------------------------------------- L1 policies
# TEST VALUES for a non-production training database. Each needs business
# sign-off before any real use; each is editable here and nowhere else.
POLICIES = [
 {"config_key":"inspection_cycle_policy","version":"test-v1","parameter":"cycle_months","value":"12",
  "unlocks":"STR-KPI-007 Inspection coverage · STR-KPI-008 Uninspected factories",
  "meaning":"Every establishment is due an inspection once every 12 months.",
  "status":"TEST VALUE — needs business sign-off"},
 {"config_key":"inspection_cycle_policy","version":"test-v1","parameter":"annual_target_pct","value":"80",
  "unlocks":"STR-KPI-007 Inspection coverage",
  "meaning":"80% of due establishments should be inspected within the cycle.",
  "status":"TEST VALUE — needs business sign-off"},
 {"config_key":"sla_urgency_policy","version":"test-v1","parameter":"warn_at_fraction","value":"0.75",
  "unlocks":"OPS-KPI-002 Expiring soon",
  "meaning":"A visit is flagged once 75% of its window has elapsed.",
  "status":"TEST VALUE — needs business sign-off"},
 {"config_key":"kpi_parameters","version":"test-v1","parameter":"compliance_rate_trend.target","value":"85",
  "unlocks":"STR-KPI-001 target line",
  "meaning":"Target national compliance rate of 85%.",
  "status":"TEST VALUE — needs business sign-off"},
 {"config_key":"kpi_parameters","version":"test-v1","parameter":"level2_decision_mix.target","value":"80",
  "unlocks":"STR-KPI-004 target line",
  "meaning":"Target approval rate of 80%.",
  "status":"TEST VALUE — needs business sign-off"},
]
with open("policies.csv","w",encoding="utf-8",newline="") as fh:
    w=csv.DictWriter(fh,fieldnames=list(POLICIES[0].keys())); w.writeheader(); w.writerows(POLICIES)

# ---------------------------------------------------------------- what unlocks
CYCLE_MONTHS, TARGET_PCT, WARN = 12, 80, 0.75
approved = [j for j in JRN if j["review_decision"] == "approve"]
in_cycle = {j["factory_code"] for j in approved
            if (ANCHOR - date.fromisoformat(j["window_start"])).days <= CYCLE_MONTHS * 30}
due = len(FAC)
covered = len(in_cycle)
coverage = round(covered / due * 100, 1)
uninspected = due - covered
published_open = [j for j in JRN if j["planning_status"] == "published" and j["operational_state"] in ("new","assigned")]
expiring = sum(1 for j in published_open
               if 0 <= (ANCHOR - date.fromisoformat(j["window_start"])).days <= 30)

M = {
 "map": {
   "live_journeys": len(tracks),
   "geo_events": len(rows),
   "telemetry_points": sum(1 for r in rows if r["kind"] == "telemetry"),
   "arrivals": sum(1 for r in rows if r["kind"] == "arrival"),
   "overrides": sum(1 for r in rows if r["kind"] == "override"),
   "regions_with_movement": len({t["region"] for t in tracks}),
   "geofences": len(FAC),
   "by_state": dict(Counter(t["state"] for t in tracks)),
   "sample_tracks": tracks[:6],
   "sample_override": next(({k: r[k] for k in
       ("journey_ref","factory_name","inspector","observed_lat","observed_lng",
        "distance_to_site_m","geofence_radius_m","override_reason")}
       for r in rows if r["kind"] == "override"), None),
 },
 "unlocked_by_policy": {
   "STR-KPI-007_coverage_pct": coverage,
   "STR-KPI-007_numerator": covered, "STR-KPI-007_denominator": due,
   "STR-KPI-007_target_pct": TARGET_PCT,
   "STR-KPI-008_uninspected": uninspected,
   "OPS-KPI-002_expiring_soon": expiring,
 },
}
json.dump(M, open("map-preview.json","w",encoding="utf-8"), indent=1, ensure_ascii=False)

print(f"geo_events.csv  {len(rows)} events over {len(tracks)} live journeys")
print(f"  telemetry {M['map']['telemetry_points']} · arrivals {M['map']['arrivals']} · overrides {M['map']['overrides']}")
print(f"  regions with movement: {M['map']['regions_with_movement']} · geofences {len(FAC)}")
print(f"policies.csv    {len(POLICIES)} parameters")
print(f"  coverage    {coverage}% ({covered}/{due}) vs {TARGET_PCT}% target")
print(f"  uninspected {uninspected}")
print(f"  expiring    {expiring}")
