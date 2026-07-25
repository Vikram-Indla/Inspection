# Shared test accounts

Test-environment credentials for the Supabase project `iiozvqntawxfwbgffzqu`.
Every developer uses the same set, so nobody has to ask for a login.

> **Test project only.** These passwords are deliberately trivial and are
> committed on purpose so the shared environment is self-serve. They must never
> be created in, copied to, or reused against a production project. Anything
> that reaches production gets real credentials issued through the normal route.

## Inspectors

Five inspectors, one per region, each with a live journey seeded toward a real
factory. **The password is the login id.**

| Login | Sign in with | Password | Name | Region | Journey |
|---|---|---|---|---|---|
| Inspector1 | `inspector1@mim.gov.sa` | `Inspector1` | فهد عبدالعزيز الدوسري | Riyadh | Riyadh → F-1101 · on the way · 6.1 km |
| Inspector2 | `inspector2@mim.gov.sa` | `Inspector2` | نورة سعد الغامدي | Makkah | Jeddah → F-2201 · on the way · 10.7 km |
| Inspector3 | `inspector3@mim.gov.sa` | `Inspector3` | خالد إبراهيم الشمري | Eastern | Dammam → F-3301 · arrived · 2.0 km |
| Inspector4 | `inspector4@mim.gov.sa` | `Inspector4` | ريم ماجد الحربي | Madinah | Madinah → F-4401 · executing · 150.8 km |
| Inspector5 | `inspector5@mim.gov.sa` | `Inspector5` | سلطان ناصر القحطاني | Qassim | Buraydah → F-5501 · executing · 7.1 km |

Sign-in uses the **email**, not the login id. The card is labelled "National ID
/ Staff number", but resolving a national ID or staff number to an account needs
the MIM directory contract, which has not been supplied — the card says so
rather than pretending. Until that contract exists, the email is the identifier.

## Pre-existing persona accounts

From `Seeders/CURRENT_LIVE_TEST_DATA_GUIDE.csv` on Drive.

| Role | Email | Password | Lands on |
|---|---|---|---|
| Planner | `planner@mim.gov.sa` | `MimPlan!2026` | Planning |
| Inspector | `inspector@mim.gov.sa` | `MimField!2026` | Field app — the account carrying the original 345 seeded visits |
| Reviewer | `reviewer@mim.gov.sa` | `MimRev!2026` | Reviews |
| Administrator | `admin@mim.gov.sa` | `MimAdmin!2026` | Admin console |
| Operations | `ops@mim.gov.sa` | `MimOps!2026` | Operations dashboard |

`approver@mim.gov.sa` exists but its password was never shared with us.

## Reseeding

```bash
python3 scripts/seed/seed_inspectors.py
```

Re-runnable. Existing users are reused; each run replaces only the geo trail it
wrote previously. It reads `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` from the environment or `apps/web/.env.local`.

What it seeds, and what it refuses to invent:

- Only the **24 curated factories** (`F-1101`…`F-6602`) and their **official
  coordinates**. The 1,644 legacy and ~400 clutter factories are never touched.
- Positions are real `geo_events` rows carrying their own `kind` and
  `occurred_at`, which is exactly what Operations Live reads. No position is
  manufactured from a factory coordinate, and none is future-dated.
- Journey states are spread across `on_the_way`, `arrived` and `executing` so
  the live map has movement, arrivals and on-site work to show.
- If a region has no clean factory or no published visit, that inspector is
  skipped and the script says so. It does not fabricate a visit to fill a gap.
