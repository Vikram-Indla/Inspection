# CD-042 Decision Sheet — residual blocks after schema verification

Date: 2026-07-16
Verified against: `supabase/migrations/*`, `apps/web/src/*` (see stop-line resolutions in `../prompts/03_COMMAND_BUSINESS_RECONCILIATION.md`).

Six of eight original stop-lines were resolved factually. **The CD-042 design run is unblocked** — it can proceed on everything except the multi-license shell, rendering the remaining gaps as explicit unavailable/not-configured states. What follows is what still needs a human answer before those specific surfaces can move from "unavailable state" to "real feature".

## Resolved by staging truth (no decision needed)
- Auditor nav entry → `role_key = 'auditor'` confirmed; wire it.
- Government Information, Machines → no source; render unavailable-boundary.
- Document/image viewer → metadata-only; galleries stay layout+metadata.
- License exposure (S5) → derive from `factory_documents.valid_to` (already used), not a license column.
- Penalties → show mapped penalty reference only (no issued-penalty lifecycle).

## Open — needs your decision

### D1 · Regional Performance Map colour bands (SL-2) — POLICY
Ops Center regional choropleth wants colours by "configurable performance thresholds". No threshold policy is governed. Cannot invent.
- **Option A (default, safe):** ship greyscale/ranked map now; add colour banding later when thresholds are set.
- **Option B:** you provide the threshold bands (e.g. compliance ≥X green / ≥Y amber / <Y red) now.
- **Blocks:** SPC-CMD-004, DSG-CMD-012 moving past ranked default.

### D2 · Inspection cycle / year (SL-2 twin, SL-7) — POLICY
Dashboard "Coverage" and "Uninspected-overdue" need "due for inspection" = an inspection frequency/cycle and an inspection-year boundary. Neither is configured.
- **Option A (default, safe):** keep both as "Not available — not configured"; still show zero-visit counts (derivable) without the overdue leg.
- **Option B:** you define the cycle (e.g. once per 12 months per factory/stage) and the year boundary.
- **Blocks:** DSG-CMD-005 (S7/S8) becoming real KPIs.

### D3 · CR → multi-license → plant model (SL-3) — SCHEMA / SCOPE
The Factory 360 docx IA (CR Overview portfolio, License Selector, "select license refreshes all sections") assumes one CR owns many licenses. **Staging does not model this** (flat `cr_number`/`license_number` columns, no licenses table). This is a genuine data-model gap, not a UI choice.
- **Option A (default, MVP1-safe):** design/build Factory 360 as single-factory (one CR + one license); defer the multi-license shell.
- **Option B:** open a change-control task to add a `licenses` table + CR→license→factory relation (broad implementation; migration + backfill + RLS). Larger scope.
- **Blocks:** DSG-CMD-014, SPC-CMD-011 (CR overview + selector).

### D4 · Factory 360 PDF export (SL-6) — BUILD
"Export Factory" (license-profile PDF) does not exist. It is a net-new capability, not design-only.
- **Option A (default):** design the action + Export-Factory permission; leave unbuilt this slice.
- **Option B:** authorize building the export now (server render + governed content).
- **Blocks:** DSG-CMD-019, factory export action.

## Recommended defaults (if you just want to move)
D1-A · D2-A · D3-A · D4-A → CD-042 design run proceeds immediately, single-factory, no invented policy, gaps shown as honest unavailable states. Multi-license, colour banding, cycle KPIs and PDF export become follow-on change-control items when you're ready.

## Effect on the design run
- Not blocked. Claude Design can run CD-042 today under the recommended defaults.
- The only things that stay "spec-only / unavailable" in the output are exactly D1-D4's Option-B features.
