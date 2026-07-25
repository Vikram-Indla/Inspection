# CLAUDE-M4-DESIGN-WRITE-PREFLIGHT-003 — bounded design-write lease packet

Read-only preparation. No Claude Design or product-code write performed this session. Project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`.

## 1. Live revision check — NOT BLOCKED, re-verified this session

`read_file` called against both target files this session:

| File | Current etag | Recorded etag (prior sessions) | Match |
|---|---|---|---|
| `SAQEEL Factories.dc.html` | `1784806013700217` | `1784806013700217` | **Unchanged** |
| `SAQEEL Factory 360.dc.html` | `1784806013700217` | `1784806013700217` | **Unchanged** |

Live access is working (not blocked). Both files are exactly as previously read — no concurrent edit occurred. Use these two etags as `if_match` on the eventual write; if either has changed by the time the write executes, **abort the entire write for both files** (do not write one and skip the other — see §7).

## 2. Data-model verification — corrected, does NOT match my prior prompt's assumption

Re-read both files' component JS state this session. Result:

- **`source`, `sourceSyncedAt` do not exist anywhere in either file** — not as `{{ }}` template bindings, not as fields on any JS object. The MODON references (header badge, right-rail panel) are **raw static HTML text**, e.g. `<p class="t-caption">Source system <strong>MODON</strong></p>` — no binding of any kind to remove or relabel; a new field must be **added** to the component's local `DETAIL` array (WA-DES-027) and factory fixture rows (WA-DES-026).
- **`row.source`, `row.sourceVersion` do not exist, and — more importantly — have no real backend counterpart at all.** Checked `apps/web/src/app/(app)/factories/[id]/page.tsx`: the real field names are **snake_case** `f.source` / `f.source_synced_at` (confirmed lines 61, 241, 271, 407-408) — a single factory-level pair, not per-row. Checked `factory_materials`/`factory_products` schema (`0017_w3_factory_master_data.sql:16-41`): `factory_materials.source` is a real column but means **`local` vs `imported`** (a domestic/import flag, `check (source in ('local','imported'))`) — an entirely different concept from a provider name+version. **No column anywhere provides a per-row "provider · version" pair for the industrial-information table** — the design's "MODON · v6" ×3 rows have no real data source to bind to at all, invented or otherwise.

**Corrected implementation (uses only real existing data, invents no new variable beyond matching the real column names):**
- Header badge + right-rail panel (WA-DES-027, factory-level, single value): add `source` and `source_synced_at` (exact snake_case, matching the real backend field names, not a camelCase invention) to the `DETAIL` array entries. Render `Source system {{ sel.source }}` / `Recorded sync {{ sel.source_synced_at }}`; when either is null/empty, render `Source not configured` (reusing the file's own existing "Not Available" visual pattern, per `02_M4_MODON_NEUTRAL_CORRECTION_PROMPT.md` §"Add an explicit... state").
- WA-DES-026's blank `national source ()`: same fix, factory-level `source` field, `Source not configured` fallback when absent.
- **Industrial-information table's per-row "MODON · v6" column: remove the per-row source/version column entirely** — it does not correspond to any real field (no invented `row.source`/`row.sourceVersion`). Replace with either (a) nothing (drop the column), or (b) a single "Source" column showing the *factory-level* `{{ sel.source }}` repeated per row if a per-row indicator is still wanted for layout parity — Codex/design owner to choose; this packet does not invent a per-row concept the schema doesn't have.

## 3. Bounded scope — exactly what this write covers

| Area | Change | Grounded in |
|---|---|---|
| Provider-neutral labels | §2 above | `factories/[id]/page.tsx` real `source`/`source_synced_at` fields |
| Required-state controls | Add the `sc-if`-gated state toggle bar (loading/empty/error/degraded/unauthorized/stale/provider-unavailable) to both files, same pattern as `WA-DES-033-C3`/`034-C3` | `01_M4_INVENTORY_MATRIX.md` §2 |
| Legacy `/factories/:id` frame | New, separate frame distinct from the CR dossier — reflects the real, different service layer (`[id]/page.tsx` direct-table reads vs `cr/[id]/page.tsx`'s `@/lib/factory360/*`) | `01_M4_INVENTORY_MATRIX.md` §3 |
| Responsive named viewports | Frame-picker for 1440/1200×860/1024/412/390/320, extending WA-DES-027's existing 1280/900px breakpoints down to named mobile treatments; add the missing `[data-mode="drawer"\|"mobile"]` sidebar-collapse to WA-DES-026 (currently zero breakpoints) | `03_M4_RESPONSIVE_RTL_A11Y_AUDIT.md` §1 |
| EN/LTR + AR/RTL scaffold | Add `dir`/`lang` state + visible toggle to both root wrappers — **currently absent entirely, not just untoggled** | `03_...` §3 |
| Keyboard/focus/selection | Add `aria-pressed`/`aria-selected` (or equivalent) + a visible focus-ring rule to WA-DES-027's license picker (currently the only interactive control, currently color-signaled only) | `03_...` §5 |
| Light/dark evidence | Demonstrate the existing `toggleTheme` against the corrected content via the same frame-picker tooling, so it is evidenced, not just wired | `03_...` §1/§6 |

**Out of scope for this lease:** no route change, no RBAC change, no new business content beyond the items above, no per-row source/version concept invented (§2), no MODON reintroduction under any name pending a real contract.

## 4. Preservation checklist (must survive unchanged — re-verified against the actual file content this session)

- License selector (`sc-for licenses`) driving plant/address/risk sections — untouched.
- "CR Overview... counts-only... no CR-level risk/compliance number" — untouched (no CR-level number added anywhere).
- Approved-inspection compliance formula (84%, 126/150 scored answers) — untouched.
- "Open violations: Not Available — no governed open/closed state" / "Active penalties: Not Available..." — untouched, reused as the visual pattern for the new `Source not configured` state (§2).
- Grouped document/media gallery + non-merge rule — untouched.
- "Explain saved risk" advisory-only/human-decision-required framing — untouched.
- Official-vs-observed immutable snapshot diff table — untouched.
- WA-DES-026's List/Map toggle, filter bar, 8-row fixture table — untouched in content, only gains the state-toggle bar (§3) around it.

## 5. Post-write hashes/revision naming (planned, for after the write executes — not performed here)

- `SAQEEL Factories.dc.html` → revision label `WA-DES-026-C1` (first correction; no prior `-C` suffix exists per `01_M4_INVENTORY_MATRIX.md` §1).
- `SAQEEL Factory 360.dc.html` → revision label `WA-DES-027-C1`.
- Record each file's new post-write etag (returned by `write_files`) in the next handoff, exactly as `WA-DES-033-C3`/`034-C3`'s etags were recorded in the M3 package.

## 6. Positive / negative evidence required after the write (not yet captured — design-write lease has not executed)

- Positive: each new required state (loading/empty/error/degraded/unauthorized/stale/provider-unavailable) renders distinctly via the new toggle bar; the `Source not configured` state renders when `source`/`source_synced_at` are empty in the fixture; the AR/RTL toggle visibly mirrors the layout (once added, since none exists today).
- Negative: confirm the removed per-row "MODON · v6" column does not silently reappear via a cached/duplicate template block; confirm the legacy `/factories/:id` frame does NOT reuse the CR-dossier's license-selector affordance (that control is `cr/:id`-specific, per real code's differing service layer).

## 7. Abort behavior if either file changed before the write executes

Before writing, re-run `read_file` (or `list_files` at the project root) on both files and compare etags to §1's recorded values. **If either etag differs from `1784806013700217`, abort the entire write for both files** — do not write the unchanged one and skip the changed one, and do not proceed with a stale `if_match` (which `write_files` would reject anyway as a structured conflict). Re-read the changed file's current content, reconcile the delta with whoever edited it, and only then re-issue this lease with updated etags.

## 8. Disposition

Preflight complete. Live access confirmed working, not blocked — both files' etags re-verified unchanged this session. Data-model claim corrected: no existing `source`/`sourceSyncedAt`/`row.source`/`row.sourceVersion` bindings exist in either file; the factory-level `source`/`source_synced_at` pair is real (from `factories/[id]/page.tsx`) and should be newly added under those exact snake_case names; the per-row industrial-info "provider · version" concept has no real backend counterpart at all and must be removed, not relabeled. Ready for Codex to issue the design-write lease with the two `if_match` etags in §1.
