# Shared test accounts

Governed test identities for the allowlisted non-production Supabase project
`iiozvqntawxfwbgffzqu`.

> **Test project only.** The shared secret is supplied through
> `SAQEEL_UAT_PASSWORD`. It is never committed, printed, or copied to production.
> Provisioning refuses every project except the allowlisted non-production target.

## Inspectors

Inspectors 1–30 are the deterministic primary inventory. Inspectors 1–5 also
own the five linked business-scenario cohorts; 6–30 are reusable UAT inventory.

| Cohort | Sign in with | Secret reference | Scope |
|---|---|---|---|
| Admin 1–5 | `admin1@mim.gov.sa` … `admin5@mim.gov.sa` | `SAQEEL_UAT_PASSWORD` | National |
| Planner 1–5 | `planner1@mim.gov.sa` … `planner5@mim.gov.sa` | `SAQEEL_UAT_PASSWORD` | Regional |
| Supervisor 1–5 | `supervisor1@mim.gov.sa` … `supervisor5@mim.gov.sa` | `SAQEEL_UAT_PASSWORD` | Regional |
| Inspector 1–30 | `inspector1@mim.gov.sa` … `inspector30@mim.gov.sa` | `SAQEEL_UAT_PASSWORD` | Regional |

Sign-in uses the **email**, not the login id. The card is labelled "National ID
/ Staff number", but resolving a national ID or staff number to an account needs
the MIM directory contract, which has not been supplied — the card says so
rather than pretending. Until that contract exists, the email is the identifier.

Specialist legacy personas are outside the numbered primary cohort and must not
be substituted into primary-cohort UAT journeys. Their credentials remain
environment-referenced only.

## Reseeding

Run `node scripts/test-data/provision_governed_uat_identities.mjs` for a guarded
dry run. Applying requires the explicit acknowledgement documented by the
script and succeeds only for the allowlisted non-production project.

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
