#!/usr/bin/env python3
"""Seed the five shared test inspectors and put them in motion.

Creates Inspector1..Inspector5 (password == login id), gives each an inspector
grant in their own region, takes over published visits at the 24 clean
factories, and lays a real GPS trail toward each factory so Operations Live has
source-backed positions to draw.

Only the 24 curated factories (F-1101..F-6602) and their official coordinates
are used. Nothing is invented: every position is a geo_events row carrying its
own kind and occurred_at, which is exactly what the live map reads.

Re-runnable: existing users are reused, and each run replaces only the geo
trail it previously wrote for its own visits.

Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 seed_inspectors.py
"""
import json, math, os, sys, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

def env(*names):
    for n in names:
        v = os.environ.get(n)
        if v: return v
    for f in ("apps/web/.env.local", "apps/web/.env", ".env.local", ".env"):
        try:
            for line in open(f):
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    if k in names: return v.strip().strip('"').strip("'")
        except FileNotFoundError: pass
    sys.exit(f"missing env: {names[0]}")

URL = env("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")
KEY = env("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
HW = dict(H, Prefer="return=representation")

def req(path, method="GET", body=None, headers=None, base="rest/v1"):
    r = urllib.request.Request(f"{URL}/{base}/{path}", method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers or H)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        return {"__error": e.code, "body": e.read().decode()[:300]}

# login id doubles as the password: shared test environment, documented in
# docs/TEST_ACCOUNTS.md. Never reuse this pattern outside the test project.
INSPECTORS = [
    ("Inspector1", "inspector1@mim.gov.sa", "فهد عبدالعزيز الدوسري",  "Riyadh",  "riyadh-region"),
    ("Inspector2", "inspector2@mim.gov.sa", "نورة سعد الغامدي",       "Makkah",  "makkah-region"),
    ("Inspector3", "inspector3@mim.gov.sa", "خالد إبراهيم الشمري",    "Eastern", "eastern-region"),
    ("Inspector4", "inspector4@mim.gov.sa", "ريم ماجد الحربي",        "Madinah", "madinah-region"),
    ("Inspector5", "inspector5@mim.gov.sa", "سلطان ناصر القحطاني",    "Qassim",  "qassim-region"),
]

# Where each inspector starts the day. Real regional centres, so the trail that
# is drawn to the factory is a plausible road distance rather than a random walk.
DEPOT = {
    "Riyadh":  (24.7136, 46.6753),   # Riyadh
    "Makkah":  (21.5433, 39.1728),   # Jeddah
    "Eastern": (26.4207, 50.0888),   # Dammam
    "Madinah": (24.4686, 39.6142),   # Madinah
    "Qassim":  (26.3260, 43.9750),   # Buraydah
}

# Journey mix: two en route, one arrived, two executing on site.
STATE_BY_INSPECTOR = {
    "Inspector1": "on_the_way",
    "Inspector2": "on_the_way",
    "Inspector3": "arrived",
    "Inspector4": "executing",
    "Inspector5": "executing",
}

def haversine_km(a, b):
    R = 6371.0088
    dlat, dlng = math.radians(b[0] - a[0]), math.radians(b[1] - a[1])
    s = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(dlng / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(s))

def main():
    now = datetime.now(timezone.utc)

    factories = req("factories?select=id,factory_code,name,region,official_lat,official_lng"
                    "&factory_code=like.F-*&order=factory_code")
    clean = [f for f in factories if f.get("official_lat") is not None]
    print(f"clean factories with official coordinates: {len(clean)}")

    summary = []
    for login, email, name_ar, region, scope in INSPECTORS:
        users = req(f"admin/users?page=1&per_page=500", base="auth/v1")
        uid = next((u["id"] for u in (users or {}).get("users", []) if u["email"] == email), None)
        if not uid:
            created = req("admin/users", "POST", {"email": email, "password": login,
                          "email_confirm": True,
                          "user_metadata": {"full_name": name_ar, "login_id": login}},
                          HW, base="auth/v1")
            uid = created.get("id")
        req("profiles?on_conflict=user_id", "POST",
            [{"user_id": uid, "full_name": name_ar, "email": email, "region": region,
              "org_scope": scope, "account_status": "active"}],
            dict(HW, Prefer="return=representation,resolution=merge-duplicates"))
        req("user_roles?on_conflict=user_id,role_key", "POST", [{"user_id": uid, "role_key": "inspector"}],
            dict(HW, Prefer="return=representation,resolution=merge-duplicates"))

        target = next((f for f in clean if f["region"] == region), None)
        if not target:
            print(f"{login}: no clean factory in {region} — skipped, nothing invented")
            continue

        visits = req(f"visits?select=id,factory_id,operational_state,planning_status"
                     f"&factory_id=eq.{target['id']}&planning_status=eq.published&limit=1")
        if not visits or isinstance(visits, dict) or not visits:
            print(f"{login}: no published visit at {target['factory_code']} — skipped")
            continue
        visit_id = visits[0]["id"]
        state = STATE_BY_INSPECTOR[login]

        req(f"visits?id=eq.{visit_id}", "PATCH", {"operational_state": state}, HW)
        req(f"assignments?visit_id=eq.{visit_id}", "DELETE", None, H)
        req("assignments", "POST", [{"visit_id": visit_id, "inspector_id": uid,
                                     "method": "manual", "status": "assigned"}], HW)

        start = DEPOT[region]
        end = (float(target["official_lat"]), float(target["official_lng"]))
        legs = 6 if state == "on_the_way" else 8
        frac_done = 0.65 if state == "on_the_way" else 1.0

        req(f"geo_events?visit_id=eq.{visit_id}&device_id=eq.seed-{login.lower()}", "DELETE", None, H)
        events, dist = [], 0.0
        prev = start
        for i in range(legs + 1):
            t = (i / legs) * frac_done
            pt = (start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t)
            dist += haversine_km(prev, pt); prev = pt
            occurred = now - timedelta(minutes=(legs - i) * 12)
            last = (i == legs)
            events.append({
                "visit_id": visit_id,
                "kind": "arrival" if (last and frac_done == 1.0) else "telemetry",
                "observed_lat": round(pt[0], 6), "observed_lng": round(pt[1], 6),
                "accuracy_m": 8.0, "device_id": f"seed-{login.lower()}",
                "occurred_at": occurred.isoformat(),
                "integration_mode": "production",
            })
        r = req("geo_events", "POST", events, HW)
        wrote = len(r) if isinstance(r, list) else f"ERR {r}"
        summary.append((login, region, target["factory_code"], state, round(dist, 1), wrote))
        print(f"{login:11} {region:8} -> {target['factory_code']} {state:11} {dist:6.1f} km  {wrote} points")

    print("\n--- seeded ---")
    for s in summary:
        print(f"  {s[0]}  {s[2]}  {s[3]}  {s[4]} km  {s[5]} geo points")

if __name__ == "__main__":
    main()
