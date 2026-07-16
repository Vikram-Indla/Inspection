# Independent wiring re-audit (R2) — CD-030 / SCR-WEB-320 (Version Comparison)

**Audit date:** 2026-07-15 (same day as R1; this is a successor audit, not a replacement — `CODEX_AUDIT_CD-030_2026-07-15.md` is left untouched)
**Reviewer:** An independent Claude Code sub-agent invoked for this audit only. This is **not** Codex — there is no Codex CLI installed in this environment. The filename follows this directory's existing `CODEX_AUDIT_*` naming convention for consistency, not a claim of tool identity. No relationship to whoever wrote the code under review; this audit does not defer to any prior self-verification and re-derives every claim from current source, live commands, and the product contract itself.
**Why this audit exists:** DEC-012 requires an independent audit because implementer self-verification is not an acceptable substitute. R1 ran earlier today and found `CONDITIONAL` with 5 open P1s. A **concurrent, still-uncommitted session** (apparently CD-031-style finding/trace-chain work) has since modified the exact files R1 audited, without committing. This R2 audits the CURRENT working tree against R1's 5 P1s and looks for any new regressions.

**Branch:** `setup/Inspection`
**Last commit:** `27789a4 docs(cd-028): fix missed staging gap + record race-guard live confirmation` (unchanged since R1; R1's commit hash was also `27789a4...`)
**Working tree:** dirty. Relevant to CD-030, uncommitted at audit time:
- Modified: `apps/web/src/app/reviews/[id]/page.tsx`, `apps/web/src/app/reviews/[id]/DecisionPanel.tsx`, `apps/web/src/app/reviews/[id]/actions.ts`, `apps/web/e2e/cd-030-version-comparison.spec.ts`
- New/untracked: `apps/web/src/app/reviews/[id]/FindingTraceChain.tsx`, plus unrelated untracked CD-029/CD-031 e2e specs and design-pack docs (out of scope for this audit)
- Also modified but **out of scope for this audit** (different screen, CD-031 Factory 360 work): `apps/web/src/app/factories/[id]/page.tsx` (539-line diff), `apps/web/src/app/factories/[id]/loading.tsx`, `apps/web/src/app/visits/*`. Not reviewed here beyond confirming they don't touch `/reviews/*`.

**Overall gate result: CONDITIONAL** (not PASS, not BLOCKED) — improved from R1, but not clean. See §5.

---

## 1. Evidence run (executed by this agent, live)

| Command | Result |
|---|---|
| `git log --oneline -5` / `git status --short` | Recorded above. Confirmed dirty tree, same HEAD commit as R1. |
| `cd apps/web && npx tsc --noEmit` | **PASS** — `TypeScript: No errors found`, exit 0. |
| `cd apps/web && npm run build` | **PASS** — compiled successfully, all routes emitted including `/reviews/[id]` (3.11 kB), only the pre-existing benign multi-lockfile workspace-root warning. Exit 0. |
| `cd apps/web && npx playwright test e2e/cd-030-version-comparison.spec.ts --reporter=list` (run 1) | **13 passed, 1 failed, 1 skipped.** The single failure was `legs 7/8/9 — evidence/package/metadata comparisons are explicitly unavailable` (a source-truth test that never touches a live page) with `Error: browser.newContext: Target page, context or browser has been closed` and a Chromium **SEGV_ACCERR** crash in the launched headless-shell process. Per the JSON reporter output, **`leg 4` — the test R1 found reproducibly broken — reported `"status": "passed"`** this run. |
| Re-run of the full spec (run 2) | **14 passed, 0 failed, 1 skipped.** Clean. `leg 4` passed again. |

This is a genuine live browser run against `npm run start` on the freshly-built production bundle (webServer auto-started per `playwright.config.ts`), reviewer persona authenticated via `storageStatePath("reviewer")`, not a source-only proxy. I did not fabricate a clean pass: run 1 had one infrastructure-level crash, disclosed above, on a test unrelated to the page under audit; run 2 was fully clean. I take the two runs together as: **the leg-4 race from R1 no longer reproduces**, and the one observed failure is an environment-level headless-Chromium crash (matching this task's own "sandboxed Chromium crash" caveat), not a logic defect — it did not recur on immediate retry with identical code and identical spec file.

---

## 2. Disposition of R1's 5 P1 findings, against the CURRENT working tree

### P1 #1 — `returned_sections` written with no validation against real section keys — **RESOLVED (app layer)**
`apps/web/src/app/reviews/[id]/actions.ts`, current `decide()`:
```
const { data: current } = await sb.from("reviews")
  .select("id, inspection_id, status, decided_at, inspections(package_versions(definition))")
  .eq("id", review_id).maybeSingle();
if (!current) return { error: "The review could not be found, or is outside your review scope (RLS)." };
if (current.decided_at || current.status !== "under_review")
  return { error: "This review is no longer open. Refresh before deciding." };
const definition = (current.inspections as unknown as ...)?.package_versions?.definition;
const validSectionKeys = new Set((definition?.sections ?? []).map(s => s.key));
const invalidSections = sections.filter(s => !validSectionKeys.has(s));
if (invalidSections.length > 0)
  return { error: "Return scope contains a section that is not in the submitted package." };
```
This re-reads the review's own package definition server-side at submit time and rejects any `returned_section` value that isn't a real key from that package version's `sectionsDef`, before the write. This closes the exact hole R1 identified (a crafted request posting arbitrary strings into `reviews.returned_sections`, which CD-030's Scope Rail treats as sole authority). **Residual gap, not a P1:** there is still no database-level CHECK/enum constraint on the `returned_sections jsonb` column (`supabase/migrations/0001_foundation.sql:276` unchanged, no new migration in this diff) — the fix is application-layer only. Since `decide()` is the only write path to this column in the codebase, this is a real fix for the code as it stands today, but it remains a single point of failure rather than defense-in-depth. Recommend still recording this as an open backlog item, not blocking.

### P1 #2 — `decision` value not allow-listed before persisting — **RESOLVED (app layer)**
Same file, top of `decide()`:
```
const validDecisions = ["approve", "return", "reject"] as const;
if (!(validDecisions as readonly string[]).includes(decision))
  return { error: "Choose a valid review decision (approve, return or reject)." };
```
This runs before the value is ever used in the `.update({ decision, ... })` call further down. Same residual note as #1: no DB CHECK constraint on the `decision text` column (`0001_foundation.sql:274` unchanged) — but the actual write path is now gated.

### P1 #3 — Unauthorized / not-found / degraded-source rendered identically — **PARTIALLY CHANGED, still not fully resolved, and now entangled with a new regression (see §3)**
`apps/web/src/app/reviews/[id]/page.tsx:16-31` (new, uncommitted) adds a role check **before** the `inspections` fetch:
```tsx
const { data: roleRows } = user
  ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
  : { data: null };
const authorized = !!user && (roleRows ?? []).some(r => r.role_key === "reviewer" || r.role_key === "ops");
if (!authorized) {
  return (<Shell ... title={t("review.ws.unauthTitle", "You don't have access to this review")}>...</Shell>);
}
```
This does now produce a **third, textually and visually distinct** branch (a dedicated "You don't have access to this review" alert, `role="alert"`) ahead of the pre-existing not-found/degraded logic at lines 42-58. For a user who holds neither `reviewer` nor `ops` role at all, unauthorized is now genuinely distinguishable from not-found/degraded — this is real progress on the letter of R1's finding.

**But the original defect inside the not-found/degraded branch is untouched.** `page.tsx:42-58` still does:
```tsx
if (!ins) {
  return (<Shell title={insErr ? "Could not load" : "Not found"}>...</Shell>);
}
```
against a `.single()` fetch (line 41) — a genuinely nonexistent id and a genuinely degraded fetch still both set `insErr` truthy and render the same "Could not load" banner; the `!insErr` → "Not found" branch is exactly as likely to be dead code as R1 found. **This part of P1 #3 is unchanged and still open.**

Also: the new `authorized` check is **role-based, not record-scoped** — it doesn't re-verify against this specific record; it only asks "does this user hold `reviewer` or `ops` anywhere." Checked against `supabase/migrations/0002_rbac_audit.sql:39-40`, the underlying `inspections_read` RLS policy is *also* blanket-role-based (`is_assigned_inspector(visit_id) or has_any_role(array['reviewer','auditor','ops','planner','leadership'])`), not per-assignment for reviewers — so for a `reviewer`/`ops` user, the new page-level check is not meaningfully narrower or broader than what RLS already grants; it doesn't introduce a false-authorized case there. The problem is who it **excludes** — see §3 new finding.

### P1 #4 — No client-visible AUDITOR badge / no role gating — **CHANGED, and the new state is arguably a worse gap than the original one.** See §3 (new finding) for the full analysis — the short version: R1's finding #4 was "auditor can view and is shown an eventually-failing Start-review button, with no read-only signal." The concurrent session's fix does not add a read-only/auditor-badge state; it **removes auditor access to the workspace outright**, which contradicts both the RLS grant (`inspections_read`, `subs_read`, `reviews_read` all include `auditor`) and the CD-030 design scope itself (see §3). STATE_MATRIX SCR-WEB-320 still lists a `read_only` state as `required` — that state is not implemented; auditors now get `unauthorized` instead.

### P1 #5 — Leg-4 test race (S11 loading-skeleton vs. bare `.count()`) — **RESOLVED**
`apps/web/e2e/cd-030-version-comparison.spec.ts` diff (the only change to this file, +1 line at line 103):
```diff
   test("leg 4 — the returned-scope authority is always stated (stored, not inferred)", async ({ page }) => {
     const opened = await openFirstWorkspace(page);
     test.skip(!opened, "no reviews in this environment to open");
+    await expect(page.getByRole("heading", { name: /Tamper-evident Scope Rail/i })).toBeVisible();
     // Either a scope is on record, or the honest no-scope statement — never silent.
     const authority = await page.getByText(/Returned-scope authority \(stored\)/i).count();
```
This is precisely R1's own recommended fix: an auto-retrying `toBeVisible()` assertion on the resolved heading, which waits past the `loading.tsx` Suspense boundary before the bare `.count()` calls run. Verified live: `leg 4` reported `"status": "passed"` in run 1's JSON output (alongside the unrelated browser crash on a different test) and passed again cleanly in run 2. Reproduced twice, not a fluke.

---

## 3. New findings from the concurrent work

### NEW-1 (severity: P1-equivalent) — The new page-level `authorized` gate blocks roles that RLS grants and that the CD-030 spec explicitly scopes in, converting a required "auditor read-only" state into an incorrect "unauthorized" block
Evidence chain:
- `page.tsx:20`: `authorized = !!user && (roleRows ?? []).some(r => r.role_key === "reviewer" || r.role_key === "ops")` — **only** `reviewer`/`ops` pass; everyone else, including `auditor`, `planner`, `leadership`, is now shown the unauthorized banner and cannot reach the page at all.
- `supabase/migrations/0002_rbac_audit.sql:39-40` (`inspections_read`), `:65-66` (`subs_read`), `:71-73` (`reviews_read`) all explicitly grant blanket read access to `auditor` (and `subs_read`/`reviews_read` also to `leadership`). RLS was deliberately designed to let these roles read this data.
- `outputs/claude-design-approval-pack/CD-030_WIRING_AUDIT_R1.md:3`: the implementer's own scope line reads **"Scope: `/reviews/:id` route-neutral compare mode · P11 · Reviewer/Auditor."** — Auditor is explicitly in this screen's intended audience, not an edge case.
- `outputs/claude-design-approval-pack/CD-030_PROGRESSIVE_CORRECTION_PROMPT_R1.md:40` explicitly lists `"auditor read-only"` as one of the required state-matrix rows that must be proven with a populated screenshot — i.e., "auditor sees a read-only version of this screen" was already a known, named requirement before this session's change.
- `design/claude-design-mvp1/acceptance/SCREEN_STATE_MATRIX.csv:26` (SCR-WEB-320 row): `unauthorized,required` **and** `read_only,required` are two separate required states for this screen — not the same state. The current code only implements `unauthorized`; `read_only` (the auditor case) does not exist anywhere in `page.tsx`.

Net effect: before this session's change, an auditor could open `/reviews/:id` and see the full interactive workspace with no read-only signal (R1's finding #4 — a real, if lesser, gap). After this session's uncommitted change, an auditor cannot open the page **at all** — they get the same "You don't have access to this review" alert as a genuinely unauthorized user. This is a regression against both the RLS design and the screen's own documented scope, not a fix for R1's finding #4. It should not be read as "P1 #4 resolved"; it is P1 #4 **replaced by a different, still-open gap**, and it newly breaks something that previously worked (auditor read access), which the project's own hard rules flag as something to never do silently ("Never remove or weaken an accepted requirement... permission... state").

Recommendation for the implementer (not authorized by this audit, just the shape of the fix): the `authorized` check should be `reviewer`/`ops`/`auditor`/`planner`/`leadership` (mirroring `inspections_read`), and the auditor/planner/leadership case should route to a distinct **read-only** rendering (no `DecisionPanel`/`StartReview` regardless of `canStart`/`open` state, plus a visible role badge) rather than either the current full-access branch or the unauthorized branch. That would actually close R1's #3 and #4 together and satisfy the state matrix's `read_only` row for the first time.

### NEW-2 (severity: informational / maintainability) — `page.tsx`'s data model has grown substantially via unrelated CD-031-style work bolted into the same server component
The query at `page.tsx:32-40` now joins `checklist_responses`, `findings`, `violations(...regulation_clauses)`, `action_forms`, and a separate `inspection_items` fetch at line 62, feeding a new `FindingTraceChain` component (`apps/web/src/app/reviews/[id]/FindingTraceChain.tsx`, untracked) rendered at `page.tsx:225`. This is materially larger than the surface CD-030 (Version Comparison / Scope Rail) requires. I confirmed this does not currently break the CD-030 surface — `tsc`, `build`, and the live Playwright run (including the `Tamper-evident Scope Rail` heading, from/to selectors, disclosure buttons, and the three "unavailable" banners) all pass — but it does mean `/reviews/:id` is now a single server component carrying two screens' worth of data-fetching (CD-030 compare + whatever CD-031's finding-trace-chain work is). A future regression in the trace-chain feature (e.g. a bad join, a missing table before its migration lands) risks taking down the whole review workspace, including the CD-030 compare surface, since they share one `.single()` query and one component tree. Not a defect today; a coupling risk worth naming so it doesn't get missed later.

### NEW-3 (severity: informational) — `DecisionPanel.tsx` accessibility improvements are real and additive, not a regression
`useEffect`/`useRef` added to focus the error banner on submit failure, `role="alert"` added to the error banner, `htmlFor`/`id` association added between the reason label and textarea, `aria-required` added. These are genuine improvements (better screen-reader/focus behavior on decision errors) and don't change any of the 5 P1s' disposition; noting them so they aren't lost in the audit and aren't mistaken for scope creep — they're a real quality gain in a file already in scope.

### Checked and found NOT to be new problems
- `actions.ts`'s `startReview()` also picked up extra validation (re-checking the submission version belongs to the inspection and is genuinely the latest version, and switching several `.single()`/no-op-checked updates to `.maybeSingle()` with an explicit "no row transitioned" error). This is a real hardening of `startReview()` against a stale/tampered form post; it doesn't touch any of the 5 P1s but is a legitimate improvement, verified by reading the diff directly (`apps/web/src/app/reviews/[id]/actions.ts` lines ~22-45 in the working tree).
- No DB migration files were added or modified in this working tree (confirmed via `git status --short` — no `supabase/migrations/*` entries), so the residual "no DB CHECK constraint" gap noted under P1 #1/#2 is exactly that: unchanged, not silently worsened.
- `apps/web/src/app/reviews/page.tsx` (the queue, unmodified/committed) already uses the identical `roles.has("reviewer") || roles.has("ops")` gate (line 71) with an identical "You don't have access to the review queue" banner. This means the new `/reviews/:id` gate is not a novel invention — it mirrors an existing, already-shipped pattern at the queue level. That makes it a **consistency move**, but the queue-level version has the same defect (it also excludes auditor/leadership, who per RLS and the SCR-WEB-300/description this queue serves may also need at least partial visibility) — this is worth flagging to the decision-maker as a pattern that may need correcting in two places, not one, if NEW-1's fix is accepted.

---

## 4. Verdict on R1's per-leg WIRING_MAP disagreements (legs 1, 16)
R1 found the WIRING_MAP CSV's blanket "PASS" for legs 1 and 16 unsupported. That disagreement stands and is **still correct** in the current tree:
- Leg 1's "not-found distinct" sub-claim: still not supported — see P1 #3 analysis above, `!insErr` branch is still effectively dead code.
- Leg 16(b) "auditor": the WIRING_MAP's claim of "RLS + design" PASS is now **less** true than at R1's audit time, not more — auditors are no longer shown a same-but-unbadged workspace (R1's complaint), they're shown nothing at all (NEW-1). Any future update to the WIRING_MAP CSV should reflect this, not mark it resolved.

---

## 5. Overall conclusion

**Production-ready / contract-complete: NO.** Improved since R1, but still `CONDITIONAL`.

Genuinely fixed and verified in the current (uncommitted) working tree:
1. Server-side validation of `returned_sections` against the package's real section keys before persisting (P1 #1) — confirmed by reading `actions.ts`'s `decide()` directly.
2. Server-side allow-listing of the `decision` value before persisting (P1 #2) — same file, confirmed.
3. The leg-4 Playwright race is fixed by the added `toBeVisible()` wait (P1 #5) — confirmed by two consecutive live runs, one of which was fully clean (14/14) and one of which had only an unrelated browser-crash failure on a different, page-independent test.
4. A genuinely distinct "unauthorized" state now exists for users with no `reviewer`/`ops` role at all — partial progress on P1 #3/state-matrix's `unauthorized` row.

What still blocks a clean PASS:
1. **NEW-1**: the new authorization gate in `page.tsx` (lines 16-31) excludes `auditor`/`planner`/`leadership` — roles RLS explicitly grants read access to (`inspections_read`, `subs_read`, `reviews_read`, `supabase/migrations/0002_rbac_audit.sql`) and that the CD-030 design scope itself names ("P11 · Reviewer/Auditor", `CD-030_WIRING_AUDIT_R1.md:3`). This is a regression, not a fix, against the state matrix's required `read_only` row for SCR-WEB-320 (`design/claude-design-mvp1/acceptance/SCREEN_STATE_MATRIX.csv:26`).
2. The not-found-vs-degraded-fetch ambiguity inside the `insErr` branch (`page.tsx:42-58`) is completely unchanged from R1 — still open.
3. No database-level CHECK constraints exist for `reviews.decision` or `reviews.returned_sections` — the P1 #1/#2 fixes are application-layer only, a residual (not blocking) gap.
4. This is all against an **uncommitted, still-in-flux working tree** shared with unrelated CD-031-style work (`FindingTraceChain.tsx`, the expanded `page.tsx` query). Nothing here should be merged as CD-030-complete until (a) NEW-1 is fixed (route auditor/planner/leadership to a real read-only state, not "unauthorized"), (b) the not-found/degraded distinction is actually implemented (e.g. a role/assignment pre-check independent of the `.single()` fetch, or a distinguishable PostgREST error path), and (c) the CD-030-scoped changes are separated from the CD-031-scoped changes in the eventual commit so each can be reviewed and reverted independently if needed.

**Recommended status: CONDITIONAL**, not PASS, not BLOCKED. This report does not authorize implementation, merge, or deployment.
