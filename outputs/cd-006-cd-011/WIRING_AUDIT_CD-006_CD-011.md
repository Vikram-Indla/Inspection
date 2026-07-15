# CD-006 + CD-011 — Live Wiring Audit

**Auditor scope:** read-only, code-side + **live** (project `iiozvqntawxfwbgffzqu`). These slices are **in flight on the parallel session's branch** `feat/admin-control-plane` (`4e24096`, "Admin Control Plane vertical CD-004..CD-011 R2", commit note: *"Parked for separate go: main push"*). This audit hands findings to that owner; it does **not** commit or fix them.
**Method:** same as the CD-041/CD-042 audits — verify source claims against the live database (WA-06 lesson: source ≠ live).

- **CD-006** = SCR-ADM-011, Regulation Detail + Version — `apps/web/src/app/admin/regulations/{page,Controls,actions}.tsx`; migration `20260715100000_cd005_cd006_ar_strings.sql`; spec `cd-005-006-regulations.spec.ts`.
- **CD-011** = SCR-ADM-041, Penalty Mapping (logical mode inside `/admin/violations`) — `admin/violations/{page,Controls,actions}.tsx`; migration `20260715102000_cd010_cd011_ar_strings.sql`.

## Verdict
Both **substantially wired and live-correct**. No P0/P1. RLS is the write authority and is present + admin-gated live; unique constraints backing the negative paths exist live; the R2 Arabic strings are applied live. Findings are P2/P3 provenance/robustness items + notes.

---

## Live verification (passed)
| Check | Result |
|---|---|
| RLS enabled on `regulations`, `regulation_clauses`, `violation_codes`, `penalty_mappings` | ✅ all `rls_on=true`, 2 policies each |
| Write authority | ✅ `*_admin` policy = `has_any_role(['compliance_admin','form_admin'])` (real role gate, not `true`) |
| Unique constraints (negative paths) | ✅ live: `penalty_mappings.violation_code_id` UNIQUE (CD-011 one-to-one), `violation_codes.code` UNIQUE, `regulations.code` UNIQUE |
| R2 Arabic strings applied live | ✅ `ui_strings` admin.* → 290/299 have `ar`, status `draft` (unreviewed, as designed) |
| Penalty presets | ✅ config tokens only (`{schedule:approved}`, `{repeat_12mo:escalate_one_level}`) — **no invented monetary/legal values** (respects "never invent policy") |

No WA-06-class gap: unlike CD-041, these migrations **are** applied live, and RLS is intact.

---

## Findings

| ID | Sev | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| CD006-WA-01 | P2 | **`publishRegulation` loses approval provenance.** It sets `status='published'` but never populates `published_at` or `approved_by` — columns that **exist** on `regulations` live. Publish leaves maker-checker provenance NULL. | `admin/regulations/actions.ts:49`; live `regulations` cols | Set `published_at = now()`, `approved_by = user.id` in the same update. |
| CD006-WA-02 | P3 | **`publishRegulation` reports false success on no-op.** `.update(...).eq(id).eq(status,'draft')` has no `.select()` length check, so an RLS-denied or already-published call returns `{ok:true}`. | `admin/regulations/actions.ts:49-52` | `.select("id")` and return an error/neutral message when `!data.length` (same pattern as the virtual actions). |
| CD006-WA-03 | note | **"Version" = status lifecycle, not a versioned entity.** No `regulation_versions` table / `version` column exists; the screen's "version" is the `draft → published` (`status`/`published_at`/`approved_by`) lifecycle. If SCR-ADM-011 intends true version history, that is a design-vs-data scope gap to reconcile — not currently backed. | live `regulations` schema | Confirm against the SCR-ADM-011 design intent; no invented versioning added. |
| CD006-WA-04 | note | **i18n content drift.** `admin.reg.form.code` live `ar='الرمز'`, but the CD-006 migration seeds `'الكود'` for that key. The guarded upsert (`status='draft'` preserve) did not overwrite a pre-existing draft, or the key is owned by an earlier migration. Both are `draft`/unreviewed, so no accepted Arabic is affected. | live `ui_strings` vs migration | Reconcile the source key value or let human localization review settle it; low impact. |
| CD011-WA-01 | P3/contract | **No audit trigger on `penalty_mappings` / `violation_codes`.** The code is **honest** about this (explicit comments). Whether M09-003/004 + FND-003 require append-only audit on penalty-catalogue changes is a **contract question**, not a code defect. | `admin/violations/actions.ts:33,64` | Confirm the requirement; if audit is required for catalogue mutations, add triggers (as on other M09 tables). |

CD-011 penalty mapping is otherwise clean: one-to-one enforced live, immutable `mapping_version` reference, dup surfaced via 23505, admin-only writes, no invented values.

---

## Ownership / next step
These belong to the `feat/admin-control-plane` session and are **parked pending its own go** — not merged, not applied beyond the (already-live) string seeds. Findings are advisory to that owner. No code committed by this audit. Recorded per DEC-012.
