# Consent record — training cohort

**Approved by:** Product Owner (Vikram), 2026-08-22, in session.
**Scope:** all 41 decisions in `outputs/MIM-Test-Data-Consent.xlsx`, approved as proposed.
**Explicit ruling:** the audit trail is **kept** after `reset`.

## What this authorises

Generating and loading the cohort exactly as specified below into a
**non-production** Inspection database. It does not authorise any application
code change, any schema migration, or any load into a production environment.

## Approved as proposed

| Area | Approved |
|---|---|
| Volume | 300 visits · 73 establishments · 45 users · 5,371 answers · 12 months to 2026-08-22 |
| Planning tabs | 24 draft · 18 pending · 226 published · 10 returned · 14 cancelled · 8 expired |
| Visit types | routine 79/80 items · complaint 71/34 · licensing 71/26 · follow-up 79/12 |
| Operations | 44 in motion · 308 GPS events · 6 overrides · 5 slots per inspector-day |
| Review | 48 pending · 60 approve / 12 return / 10 reject |
| Compliance | 9 authorities · 17 regulations · 76 clauses · 142 items · 38 codes · 30 requests |
| Dashboard | compliance 82.9% · approval 73.2% · coverage 52.1% vs 80% target |
| Establishments | fictitious names · 53 unified + 20 legacy CR · governorate-derived coordinates |
| Policies | cycle 12 months / 80% target · SLA warn at 75% · targets 85% and 80% |
| Load and unload | load idempotent · unload pre-submission · reset full, superuser only |

## Carried forward as accepted risk

The Product Owner approved these with the limitation stated, not resolved:

1. **Licence number format is unverified.** No public source documents it. A
   trainee cross-checking a licence number against a live system will not get a
   hit. Approved for training use as format-plausible.
2. **60 of 73 coordinates are governorate-centre derived.** Correct in region,
   city and governorate, within a few kilometres — sufficient for map pins, not
   for navigating to a plot.
3. **Three policy values are test values.** 12-month cycle, 80% annual target,
   75% SLA warning, 85%/80% KPI targets. They drive four visible dashboard
   figures and still need business sign-off before any non-training use.
4. **Four dashboard measures stay blank.** Risk distribution, licence exposure,
   repeat violation rate and violation trend need application changes that are
   explicitly out of scope and were not proposed.

## Not authorised by this record

- Any database migration or projection change.
- Any load into a production or production-adjacent environment.
- Overwriting accepted reference data. The loader skips regulation codes that
  already exist and never rewrites an immutable row.
