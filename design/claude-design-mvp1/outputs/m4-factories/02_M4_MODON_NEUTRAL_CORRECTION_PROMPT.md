# M4 MODON-neutral correction prompt (prepared, NOT applied — Codex design-write lease required)

**Superseded in part by `04_M4_DESIGN_WRITE_LEASE_PACKET.md` §2** — re-reading the live files' actual component JS this session (`CLAUDE-M4-DESIGN-WRITE-PREFLIGHT-003`) proved `sel.source`/`sel.sourceSyncedAt`/`row.source`/`row.sourceVersion` do not exist today, as either bindings or JS fields. Item 1/2 below are corrected to add `source`/`source_synced_at` (exact snake_case, matching the real `factories/[id]/page.tsx` column names — not the camelCase `sourceSyncedAt` this file originally proposed) as **new** `DETAIL` fields. Item 3 is **withdrawn**: no real field (`row.source`/`row.sourceVersion` or any equivalent) exists anywhere in the schema for a per-row provider/version pair — `factory_materials.source` is a real column but means `local`/`imported`, not a provider name. See `04_...` §2 for the corrected per-row disposition (remove the column, don't rebind it).

Target project: `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`
Target files: `SAQEEL Factories.dc.html` (WA-DES-026), `SAQEEL Factory 360.dc.html` (WA-DES-027)
Current etag (both, re-verified this session): `1784806013700217` — pass as `if_match` on write so a concurrent edit is caught, not silently overwritten.

## Exact prompt text (corrected)

```
In "SAQEEL Factory 360.dc.html", the component's local DETAIL fixture array
has no source field today. Add two new fields to each DETAIL entry — `source`
and `source_synced_at` (exact snake_case, matching the real backend column
names at apps/web/src/app/(app)/factories/[id]/page.tsx, never a camelCase
invention or a hardcoded vendor name) — then replace every literal
occurrence of the invented provider name "MODON":

1. Header badge "source MODON · recorded 2026-07-20"
   → "source {{ sel.source }} · recorded {{ sel.source_synced_at }}"

2. Right-rail "Source status & freshness" panel:
   "Source system MODON" → "Source system {{ sel.source }}"
   "Recorded sync 2026-07-20 08:41" → "Recorded sync {{ sel.source_synced_at }}"

3. Industrial-information table, three rows tagged "MODON · v6": WITHDRAWN.
   No real field (row-level source name + version) exists anywhere in the
   schema for this table — factory_materials.source is a real column but
   means local/imported, not a provider name, and no per-row source-version
   pair exists at all. Remove this column entirely rather than inventing
   row.source/row.sourceVersion to rebind it to nothing real.

4. Add an explicit "Source not configured" state for when `sel.source` /
   `sel.source_synced_at` is null or empty (item 3's row-level field is
   withdrawn, so no row-level "not configured" state applies there) — render
   this state instead of leaving a blank field or any specific vendor name.
   This state must look like an
   honest gap, not an error: same visual family as the existing
   "Not Available — no governed open/closed state" pattern already used two
   sections above in this same file for Open violations / Active penalties.

In "SAQEEL Factories.dc.html", fix the broken placeholder:
   "Factory identity records sync from the national source ()."
   → "Factory identity records sync from the national source
      {{ sourceLabel }}." where {{ sourceLabel }} resolves via the same
      {source} pattern, falling back to "Source not configured" — never
      inventing a name to fill the parens.

Do not change any other content, section, route, state, RBAC-visible field,
audit note, or history/degradation behavior already present in either file.
Do not introduce a new provider, freshness SLA, version number, or policy of
any kind — this is a like-for-like rename from an invented specific vendor
to the real generic field the code already has, plus one new honest
"not configured" fallback state. Preserve every existing Factory 360
capability exactly as-is: license selector, CR-portfolio-only compliance
rule, approved-inspection compliance formula, violations/corrective-actions
table, documents/media non-merge rule, "Explain saved risk"
advisory-only/human-decision-required framing, and the official-vs-observed
snapshot diff table.
```

## Preservation checklist (verified this session, must survive the correction unchanged)

- License selector driving plant/address/risk sections (CR-410/DSG-CMD-014 business rule) — untouched by this prompt.
- "CR Overview portfolio is counts-only... no CR-level risk/compliance number" (SPC-CMD-011/DSG-CMD-015) — untouched.
- Approved-inspection compliance formula (84%, 126/150 scored answers, Health-distinct) — untouched.
- "Open violations: Not Available — no governed open/closed state" / "Active penalties: Not Available — statuses do not define Active/Expired" — untouched, and reused as the visual pattern for the new "Source not configured" state (consistency, not a new invention).
- Grouped document/media gallery + non-merge rule (SPC-CMD-012) — untouched.
- "Explain saved risk" advisory-only/human-decision-required framing (no invented AI capability) — untouched.
- Official-vs-observed immutable snapshot diff table — untouched.
- All RBAC/RLS-backed conditional content (e.g., `canSeeSensitiveHistory`-gated penalty visibility in real code, §5 of the inventory matrix) is **not yet modeled** in the design at all — this prompt does not fix that; it is separately scoped to Packet A's "add the missing masked/hidden penalty_notices state" item in `01_M4_INVENTORY_MATRIX.md` §7, kept out of this specific MODON-only prompt to keep this correction narrowly scoped and independently reviewable.

## Disposition

Prompt prepared and grounded in the exact real-code field names (`source`, `source_synced_at`) confirmed by reading `apps/web/src/app/(app)/factories/[id]/page.tsx` this session. **Not blocked on any future sponsor MODON-scope decision** — no accepted MODON provider contract exists today, so the canonical no-invention rule already requires this neutral fix independent of whatever the sponsor later decides. The only real dependency is the **Codex-issued design-write lease** for project `5e8154ad-...`. (If MODON is later approved for MVP1 with a real contract, this neutral prompt is superseded by a genuine MODON integration prompt at that point — but that is a future, separate change, not a precondition for applying this one.)
