# Independent wiring re-audit (R3) — CD-030 / SCR-WEB-320 (Version Comparison)

**Audit date:** 2026-07-15 (same day as R1/R2; this is a successor audit — `CODEX_AUDIT_CD-030_2026-07-15.md` and `_R2.md` are left untouched)
**Reviewer:** An independent Claude sub-agent invoked for this audit only. This is **not** Codex — there is no Codex CLI installed in this environment. The `CODEX_AUDIT_*` filename follows this directory's existing naming convention for consistency, not a claim of tool identity. No relationship to the implementer(s) of CD-030 or the concurrent CD-031-style session. This audit satisfies DEC-012 (implementer self-verification is not an acceptable substitute for independent audit) and re-derives every claim below from current source, live commands, and the product contract itself — it does not defer to R1's, R2's, or any self-report's conclusions.

**Branch:** `setup/Inspection`
**Last commit:** `27789a4 docs(cd-028): fix missed staging gap + record race-guard live confirmation` — unchanged since R1/R2.
**Working tree:** dirty. Relevant to this audit, uncommitted at audit time:
- Modified: `apps/web/src/app/reviews/[id]/page.tsx`, `apps/web/src/app/reviews/[id]/VersionCompare.tsx`, `apps/web/src/app/reviews/[id]/DecisionPanel.tsx`, `apps/web/src/app/reviews/[id]/StartReview.tsx`, `apps/web/src/app/reviews/[id]/actions.ts`, `apps/web/e2e/cd-030-version-comparison.spec.ts`
- New/untracked: `apps/web/src/app/reviews/[id]/FindingTraceChain.tsx`, `apps/web/src/app/reviews/[id]/stale-check.ts`, `supabase/migrations/20260715140000_cd030_review_decision_check.sql`
- Also modified/untracked but **out of scope for this audit** (CD-031 Factory 360 / other concurrent work): `apps/web/src/app/factories/[id]/*`, `apps/web/src/app/visits/*`, `apps/web/e2e/cd-029-review-workspace.spec.ts`, `apps/web/e2e/cd-031-factory-360.spec.ts`, `outputs/**`, `product-contract/**` bookkeeping. Not reviewed here beyond confirming they don't touch `/reviews/[id]`'s runtime files (confirmed — no reviews/* paths in that diff set).

**Overall gate result: CONDITIONAL** — real, verifiable progress on every R2 open item, but a new functional gap surfaced by this audit (roles admitted to the page that cannot actually read the data the page depends on), a residual DB-constraint gap, and — critically — **no live browser evidence could be obtained in this session** (see §1). Not PASS. Not BLOCKED (nothing here indicates active data corruption or a broken build).

---

## 1. Evidence run (exact commands, exact results)

| Command | Result |
|---|---|
| `git log --oneline -5` | `27789a4`, `1b530af`, `ac3597f`, `2f24a7b`, `04e69cf` — recorded above. |
| `git status --short` | Recorded above; dirty, matches the task brief's description of two independent uncommitted change sets in the same tree. |
| `cd apps/web && npx tsc --noEmit` | **PASS** — `TypeScript: No errors found`, exit 0. |
| `cd apps/web && npm run build` | **PASS** — compiled successfully; `/reviews/[id]` emitted (3.61 kB / 179 kB First Load JS); only the pre-existing benign multi-lockfile workspace-root warning. Exit 0. |
| `cd apps/web && npx playwright test e2e/cd-030-version-comparison.spec.ts --reporter=list` (run 1) | **0 passed, 3 failed, 13 skipped.** All 3 failures are the `setup` project's persona logins (`authenticate planner`, `authenticate inspector`, `authenticate reviewer`), each `TimeoutError: page.waitForURL … Timeout 20000ms exceeded` at `auth.setup.ts:18`. Browser console captured (via the log's `tee` file) `[browser:<persona>] Failed to load resource: the server responded with a status of 400 (Bad Request)` twice per persona — i.e., the real `/login` UI's POST to Supabase Auth was rejected with 400 for **all three** distinct seeded accounts (`planner@mim.gov.sa`, `inspector@mim.gov.sa`, `reviewer@mim.gov.sa`, from `e2e/personas.ts`). Because the `e2e` test project declares `dependencies: ["setup"]` in `playwright.config.ts`, Playwright skips every test in the dependent project when its dependency fails — this is why all 12 `cd-030-version-comparison.spec.ts` tests show `"status": "skipped"` in the JSON reporter output, **including the 6 pure source-truth tests that read local files via `readFileSync` and never touch the browser or network at all** (e.g. "legs 4/5/6", "S08 — a newer version submitted…"). Screenshot evidence: `test-results/auth.setup.ts-authenticate-planner-setup/test-failed-1.png` shows the `/login` page with **both the email and password fields empty** at time of failure — consistent with the app resetting the form after a rejected login rather than a hung/frozen page. |
| Retry of the identical command (run 2) | **Identical result** — 0 passed, 3 failed (same 3 auth setups, same error), 13 skipped. Reproducible, not a one-off flake. |
| Supplementary connectivity check (not one of the 4 required commands, run to determine whether the failure was network/environment vs. product): `curl https://iiozvqntawxfwbgffzqu.supabase.co/auth/v1/health` with the project's own anon key | `200` — the configured Supabase project (`apps/web/.env.local`) is reachable and its Auth service is up. This rules out "no network" or "wrong project URL" as the cause; the 400 is a genuine rejection by Supabase Auth of the login POST itself, not a connectivity failure. |

**Honest statement of the evidence gap, as required by this task's instructions:** I could not get a real, live Playwright pass or fail for a single CD-030 test in this session — not leg 4, not the new S08 leg, not the RTL leg, nothing. Both R1 and R2 report successful persona logins earlier the same day against this identical project with these identical hardcoded credentials (`e2e/personas.ts`, unchanged, last touched 2026-07-12 per its own header comment). The most likely explanation, given the Auth service itself is reachable and returns a clean 200 on an unauthenticated health check, is Supabase Auth-side rate-limiting or a lockout state accumulated from the repeated live login attempts already run today by R1, R2, and other concurrent CD-029/CD-031 audit sessions against the same project — but I have no dashboard or project-log access to confirm this diagnosis, and I am not asserting it as fact. What I can assert as fact: the failure is reproducible (2/2 runs), it is not a TypeScript or build problem (both pass cleanly), and it is not a network-reachability problem (the Auth endpoint itself answers). **I am not claiming a live pass I did not get, for any leg, including the ones R1 and R2 previously verified live.** Everything below about live-rendered behavior is therefore based on source-code analysis and cross-reference against the RLS migrations and the product contract, exactly as the R1→R2 escalation for NEW-1 was itself partly conducted (R2 also disposed of some items by source-reading alone) — not on a browser observation I do not have this round.

---

## 2. NEW-1 disposition (R2's top blocking finding)

**Verdict: substantively RESOLVED, with one new, concrete side-effect that R2's own recommended fix did not anticipate (see §6, new finding NF-1).**

Current `page.tsx:16-41`:
```tsx
const { data: roleRows } = user
  ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
  : { data: null };
const authorized = !!user && (roleRows ?? []).some(r => ["reviewer", "ops", "auditor", "planner", "leadership"].includes(r.role_key));
const canDecide = !!user && (roleRows ?? []).some(r => r.role_key === "reviewer" || r.role_key === "ops");
const viewerRole = (roleRows ?? []).find(r => ["reviewer", "ops", "auditor", "planner", "leadership"].includes(r.role_key))?.role_key ?? null;
if (!authorized) { /* unauthorized Shell, role="alert" */ }
```

This is exactly R2's own recommended shape: `authorized` now mirrors `inspections_read`'s role list (`supabase/migrations/0002_rbac_audit.sql:39-40`: `is_assigned_inspector(visit_id) or has_any_role(array['reviewer','auditor','ops','planner','leadership'])`), and `canDecide` stays narrowly `reviewer`/`ops` — matching `reviews_insert`'s RLS (`has_any_role(array['reviewer','ops'])`, line 75) and the CD-030 design scope's decision-making roles. Concretely:

- Auditor, planner, and leadership are **no longer blocked** by the page-level gate — they pass `authorized` and reach the workspace. This directly fixes R2's regression (auditor/planner/leadership had been converted from "no read-only signal" to "fully blocked").
- A distinct **read-only rendering now exists**: `page.tsx:354-358` — `!canDecide` renders a dedicated `<p className="ax-caption">{t("review.ws.readOnlyNote", "Read-only for this role — decision controls are limited to Level 2 Reviewer / Operations.")}</p>` in place of `StartReview`/`DecisionPanel`, regardless of `open`/`canStart` state. A visible role badge also now exists in the page header (`page.tsx:233`): `{!canDecide && <span className="ax-lozenge ax-lozenge--warning">{t("review.ws.readOnlyRole", "{role} · read-only")...}</span>}`.
- This closes the `SCREEN_STATE_MATRIX.csv` gap R2 flagged: row 26 (`SCR-WEB-320,required,required,required,required,required,required,required,required,na,na,required,...`) lists `read_only` as `required` (5th data column after `screen_id,populated`); per the header row (`screen_id,populated,loading,empty,validation,unauthorized,read_only,stale,degraded,offline,sync_conflict,recovery,...`), column 7 is `read_only` = `required` — this state now has a real, distinguishable implementation (badge + note + controls hidden), not just RLS enforcement with no UI signal.

**This is a genuine fix, verified by direct source reading against the current RLS grants** (`inspections_read`, `reviews_read` after its own later fix at `20260715120000_cd028_reviewer_read_fix.sql` — `reviewer_id = auth.uid() or has_any_role(array['reviewer','auditor','ops','leadership']) or assigned inspector`). I could not verify it live in this session for the reason stated in §1.

**What this fix did not anticipate — see NF-1 in §6:** widening `authorized`/`canDecide` to match `inspections_read`/`reviews_insert` did not check whether `submission_versions` (the `subs_read` policy, which was **not** touched by this session or the CD-028 reviewer-read fix) grants read to the same roles. It does not, for `ops` and `planner`. This is a materially important finding for anyone relying on this page working for those two roles specifically.

---

## 3. S08 (stale/concurrent version) verification

**Code-level verdict: correctly designed, one real gap (Arabic parity, self-disclosed by the implementer's own comment) and one minor UX gap I found independently (stale-select re-sync). No live confirmation obtained (see §1) — the new e2e leg for this is a source-truth regex test only, and even that could not run this session because the whole spec file's project was skipped upstream of any individual test.**

### 3a. Query correctness — `stale-check.ts`
```ts
export async function latestVersionNumber(inspectionId: string): Promise<number | null> {
  const sb = await supabaseServer();
  const { data } = await sb.from("submission_versions")
    .select("version_number")
    .eq("inspection_id", inspectionId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.version_number ?? null;
}
```
- Correctly scoped by `inspection_id` (no cross-inspection leakage).
- Correct ordering (`descending`) + `limit(1)` + `maybeSingle()` — returns the true max version number or `null` if the inspection has no rows visible to the caller. `maybeSingle()` is the right choice over `.single()` here (no error thrown on zero rows, matching this function's `Promise<number | null>` contract).
- **RLS-safety caveat, confirmed by reading `0002_rbac_audit.sql:65-66` directly:** `subs_read` grants `reviewer`, `auditor`, `leadership` (plus assigned inspector) — **not `ops`, not `planner`**. For those two roles (both of which now pass `page.tsx`'s `authorized` gate per §2), this function will silently return `null` forever, regardless of the true state of the DB, because RLS filters the row set to empty before it ever reaches the `order`/`limit`. This is not a bug in `stale-check.ts` itself — it does exactly what it should given its RLS context — but it means **the S08 feature is silently inert for ops/planner users**, who will never see a stale banner even when a genuinely newer version exists. This is the same underlying RLS asymmetry as NF-1 (§6), just manifesting a second time in a second piece of the CD-030 surface.

### 3b. Polling / re-render logic — `VersionCompare.tsx:72-90,133-144`
```ts
const [staleAt, setStaleAt] = useState<number | null>(null);
useEffect(() => {
  setStaleAt(null);
  const id = params?.id;
  if (!id) return;
  const check = () => {
    latestVersionNumber(id).then(n => { if (n != null && n > latest) setStaleAt(n); }).catch(() => {});
  };
  const timer = setInterval(check, STALE_POLL_MS);
  return () => clearInterval(timer);
}, [params?.id, latest]);
```
- `latest` is in the dependency array and is recomputed each render from the `versions` prop (`const latest = numbers[0]`, where `numbers = versions.map(v => v.n)`). When the surrounding server component re-renders with a fresher `versions` array (e.g., after the user clicks the banner's `router.refresh()`), `latest` changes, the effect re-runs, `staleAt` is reset to `null` (clearing the banner), and a new polling closure captures the new `latest`. **This is correct — no stale-closure bug.** The comment in the source claiming this behavior ("resets once `versions` itself refreshes past the version that was flagged") is accurate to what the code does.
- **Independent finding (minor, not in R1/R2, not disclosed by the implementer's comment):** `toN`/`fromN` are initialized via `useState<number>(latest)` / `useState<number | undefined>(prior)` **once, at mount**. Because `router.refresh()` in Next.js App Router re-fetches server data and updates props on an already-mounted client component without remounting it, a `versions` prop update after a refresh does **not** reset `toN`/`fromN` — they keep whatever value the user last had selected (or the original mount-time default). Net effect: after a user dismisses the stale banner via "Refresh," the newly-arrived version appears as a **selectable option** in the `to`/`from` `<select>`s (since `numbers` is recomputed fresh from the prop every render) but is **not auto-selected** — the user is looking at the same from/to pair as before unless they manually reselect. Whether this is desired ("respect the user's manual selection") or a real gap ("the whole point of refreshing was to see the new version, and it doesn't default to it") is a product judgment call, not a crash or data-integrity bug — flagging it as a minor UX finding, not a blocking defect.

### 3c. Arabic parity — self-disclosed, confirmed present
`VersionCompareStrings.staleTitle/staleBody/staleRefresh` (`VersionCompare.tsx:42-44`) are typed `optional`. `page.tsx`'s `compareStrings` object (lines 154-180) does **not** set any of the three — confirmed by direct read, no `staleTitle`/`staleBody`/`staleRefresh` key appears anywhere in that object literal. Therefore the banner (`VersionCompare.tsx:134-141`) always renders its hardcoded English fallback text (`"A newer version was submitted."` / `"Version v{n} arrived while you had this open — refresh before relying on this comparison."` / `"Refresh"`) regardless of the active locale — **confirmed, not merely claimed**: an Arabic-locale reviewer would see this one banner in English while everything else on the page is in Arabic. This is exactly the known gap the task description states was deliberately accepted to avoid touching `page.tsx`'s larger string table. It is a real, standing Arabic-parity gap for S08 specifically, not yet closed.

### 3d. e2e leg for S08
`cd-030-version-comparison.spec.ts:90-99` — a source-truth-only test (`readFileSync`, no `page` fixture) asserting: `stale.ts` orders by `version_number` descending, `VersionCompare.tsx` calls `setInterval(check, STALE_POLL_MS)`, compares `n > latest`, and uses `role="alert"`. All four regex assertions are true against the current source (verified by direct reading in §3a/3b above). **However, this test never ran in this session** — it was skipped as a side-effect of the `setup` project's failure (§1), so I cannot report a live pass for it; I can only confirm its assertions would currently match the source if it had run.

---

## 4. Migration — `20260715140000_cd030_review_decision_check.sql`

```sql
alter table reviews
  add constraint reviews_decision_check
  check (decision is null or decision in ('approve', 'return', 'reject'));
```

- **Syntactically correct** standard Postgres `CHECK` constraint syntax.
- **Compatible with the current app-produced row shape**, confirmed by cross-reading `0001_foundation.sql:274` (`decision text`, nullable, no default) and `actions.ts`'s only two write paths to this column: `startReview()` (`actions.ts:55-57`, inserts a `reviews` row without ever setting `decision` — leaves it `null`) and `decide()` (`actions.ts:110-114`, sets `decision` to exactly one of the three allow-listed literal strings after the `validDecisions` check at line 87-89). No other `.insert(`/`.update(` on `reviews.decision` exists anywhere in the reviewed files. So for **new** writes going forward through the app, this constraint would never reject a value the app itself produces.
- **Explicit limitation, stated plainly per this task's instructions:** I have **no Supabase credentials or project access in this environment** and cannot connect to or run this migration against the live database. I cannot verify (a) that it applies cleanly (Postgres will refuse to add a `CHECK` constraint if any *existing* row in the live `reviews` table already violates it — i.e., any historical row with a `decision` value outside `{null, 'approve','return','reject'}`), or (b) that the migration has even been applied to any environment. This is stated as an open unknown, not verified, exactly as the task requires — I am not claiming this is "verified live" because it is not.
- **Scope note:** this migration closes R2's residual (non-blocking) gap for `reviews.decision` only. It does **not** add a constraint for `reviews.returned_sections` — see §5 below, that gap is explicitly still open.

---

## 5. Disposition of every other still-open R1/R2 item

| Item | R1/R2 status | R3 finding |
|---|---|---|
| **`returned_sections` app-layer validation** (R1 P1 #1) | R2: resolved at the app layer in `decide()`, DB-level gap noted as residual/non-blocking | **Unchanged.** `actions.ts:100-104` still re-derives `validSectionKeys` from the review's own package definition and rejects unknown keys before write — confirmed present, identical to R2's finding. **The DB-level gap is still fully open**: the new migration (§4) only adds a CHECK for `decision`, not for `returned_sections jsonb` (`0001_foundation.sql:276`, no constraint, no new migration touches it). Still app-layer-only, single point of failure, exactly as R2 flagged as a non-blocking residual item. |
| **`decision` value allow-listing** (R1 P1 #2) | R2: resolved at the app layer; DB-level gap noted as residual | **Now also closed at the DB level** (assuming live application — see §4's stated limitation). App-layer check (`actions.ts:87-89`) is unchanged and still correct on its own. |
| **Not-found vs. degraded-fetch ambiguity inside `insErr` branch** (R1 P1 #3, R2 confirmed still open) | R2: unchanged, still open | **Still open, narrower in scope but not resolved.** `page.tsx:42-67` is functionally identical to what R2 read: `.single()` on the `inspections` join still throws the same `PGRST116`-style error for a genuinely nonexistent id AND for a true degraded fetch of an id that does exist and that this user's role could otherwise see — both still fall into the same `insErr`-truthy branch and render the identical "Could not load" banner. The code comment directly above this block (`page.tsx:52-54`) now asserts more confidently that "insErr distinguishes an actual fetch failure (degraded source) from a genuinely missing id," but this claim is not actually true of the code beneath it — the comment describes an intent, not a mechanism; the mechanism is unchanged from R1/R2. What **has** genuinely narrowed the practical blast radius of this ambiguity is unrelated to this branch itself: the new role-based `authorized` gate (§2) now intercepts the large "no role at all" unauthorized case *before* this branch is ever reached, so the only remaining ambiguous cases are: a truly nonexistent id, vs. a genuinely degraded fetch of an id this (already-role-checked) user's RLS would otherwise let them see. Smaller blast radius, same unresolved mechanism. |
| **No client-visible AUDITOR badge / role gating** (R1 P1 #4) | R2: replaced by NEW-1 (auditor fully blocked) | **Now resolved as originally intended** — see §2. A visible role badge (`{role} · read-only`) and a dedicated read-only note now exist, and auditor/planner/leadership are no longer blocked outright. |
| **Leg-4 Playwright race** (R1 P1 #5) | R2: resolved, verified live twice | **Cannot be re-confirmed this session** (§1 evidence gap). The fix itself (`await expect(page.getByRole("heading", {name: /Tamper-evident Scope Rail/i})).toBeVisible()` before the bare `.count()` calls) is still present in the current spec file, unchanged from what R2 read and verified live. No reason from source alone to believe it regressed; simply not independently re-run. |
| **WIRING_MAP CSV legs 1/16 "PASS" markings disputed by R1/R2** | R2: still incorrect as written | **Still not corrected in this session's diff** (the WIRING_MAP CSV itself is not part of this diff set) — the underlying leg-1 "not-found distinct" claim remains only partially true (unauthorized-by-role is now distinct; degraded-vs-not-found within an authorized role is not) and leg-16(b) "auditor" is now more accurate than at R2's audit time (auditor gets read-only access with a badge, not a block, not silence) but still does not match a blanket "PASS" without the caveats stated here. |

---

## 6. New findings from this round

### NF-1 (severity: P1-equivalent — functional, not cosmetic) — Widening `authorized`/`viewerRole` to match `inspections_read` did not check that `submission_versions` (`subs_read`) and its downstream consequences (`latest`, `canStart`) grant the same roles, silently breaking the compare surface and the Start-review action for `ops`, and silently disabling S08 for `ops` and `planner`

Evidence chain, all from direct source + RLS cross-reference (no live DB access, stated plainly as a limitation):

- `page.tsx:28-29`: `authorized` includes `ops` and `planner`; `canDecide` includes `ops` (not `planner`).
- `supabase/migrations/0002_rbac_audit.sql:65-66` (`subs_read` on `submission_versions`, **not modified by any later migration** — confirmed via `grep` across all `supabase/migrations/*.sql`, only one file defines this policy): `has_any_role(array['reviewer','auditor','leadership']) or exists (... is_assigned_inspector ...)`. **`ops` and `planner` are absent from this list.**
- `page.tsx:69-70`: `subs = ins.submission_versions...; latest = subs[0]`. Because `submission_versions` is a nested relation on the same `inspections` select, RLS filters it independently of the parent row's own visibility — for an `ops` or `planner` viewer, this array will be **empty**, so `latest` is `undefined`, **even though the parent `inspections` row itself is visible to them** (`inspections_read` does grant `ops`/`planner`).
- Downstream consequences, all directly traceable in `page.tsx`:
  - `canStart = !open && !!latest && ins.status === "submitted"` (`page.tsx:79`) — **always `false` for `ops`**, because `latest` is always `undefined` for that role. An `ops` user can never see or click "Start review" on this screen, even though `reviews_insert`'s RLS (`has_any_role(array['reviewer','ops'])`, `0002_rbac_audit.sql:75`) explicitly intends to let them.
  - `open = reviews.find(r => r.submission_version_id === latest?.id && ...)` (`page.tsx:78`) — can never match for `ops` either (`latest?.id` is `undefined`), so `DecisionPanel` never renders for an `ops` viewer, so an `ops` user cannot decide a review from this screen despite `canDecide === true` for them.
  - The compare surface itself: `latest ? <VersionCompare .../> : <banner role="status">Comparison source unavailable…</banner>` (`page.tsx:317-336`) — an `ops` or `planner` viewer will **always** see the S07 "Comparison source unavailable / the data source may be degraded" banner, **every single time**, even when the data is perfectly healthy — because the message is written for a genuine fetch failure, not for "your role cannot read this specific child table." This mislabels an RBAC/RLS design gap as a data-availability problem, which is misleading to whoever reads it (an ops user would reasonably conclude "the system is degraded" rather than "my role isn't wired for this specific read").
  - S08 (§3a): for the same reason, `latestVersionNumber()` always returns `null` for `ops`/`planner`, so those two roles will never see a stale-version warning even when one is genuinely warranted.
- **Is this new, or pre-existing?** The RLS asymmetry itself (`subs_read` never having included `ops`/`planner`, unlike its sibling `inspections_read`/`reviews_read` policies) predates this session — it is not something introduced by either concurrent change set audited here. What is new is that it is now **consequential** for two additional roles: before this session's `authorized`/`canDecide` widening, `ops` and `planner` could not reach this page at all (NEW-1's original bug, per R2), so this downstream `subs_read` gap was moot for them. Now that they can reach the page, they hit this second, previously-irrelevant gap immediately. R2's own recommended fix ("the `authorized` check should be reviewer/ops/auditor/planner/leadership, mirroring `inspections_read`") is exactly what was implemented, but R2 did not itself check whether `subs_read`/`reviews_insert`'s effective row-visibility matched that broader list — so this is a gap in R2's own recommendation surfacing here, not a fabrication or regression by whoever wrote this session's fix.
- **Practical severity:** for `planner`/`leadership`, this is arguably tolerable — CD-030's own design scope says "P11 · Reviewer/Auditor," so a planner seeing a permanently-blank compare surface (mislabeled as "unavailable") is a UX/labeling defect but not a broken *required* workflow for that role. For **`ops`**, this is materially more serious: `ops` is explicitly named in `reviews_insert`'s RLS as a role meant to start/decide reviews (predating CD-030, established by CD-028's own design), and `canDecide` in this very file treats `ops` as a decision-capable role — yet the page's own data-fetch makes it structurally impossible for an `ops` user to ever see `canStart === true` or an open `DecisionPanel` on this specific screen. **This could not be verified live in this session (§1)** — it is a code+RLS-policy-level deduction, not an observed browser failure, and should be verified with a live `ops`-role login before being treated as certain. It is concrete enough, with exact file:line evidence in both the app code and the RLS migration, that it should not be dismissed as speculative.
- **Shape of a fix (not authorized by this audit):** either broaden `subs_read` to also grant `ops` (mirroring `reviews_insert`'s intent), or — if `ops` is genuinely not meant to read submission snapshot content — narrow `canStart`'s reliance on `latest` so it doesn't silently assume every decision-capable role can also read `submission_versions`, and give the S07/degraded-source banner a way to distinguish "no data because RLS role gap" from "no data because the fetch broke."

### NF-2 (severity: informational, confirms R2's NF-3 still holds) — `DecisionPanel.tsx`/`StartReview.tsx` further edits since R2 remain additive, not regressive
Re-read both files in full this round (not just diffed). `DecisionPanel.tsx`'s focus-on-error (`useRef`/`useEffect`), `role="alert"`, and label/`htmlFor` association are unchanged from what R2 described and remain correct. `StartReview.tsx`'s `router.refresh()` + a `window.setTimeout(() => window.location.reload(), 2_000)` fallback inside `onSubmit` is a slightly unusual double-mechanism (both a React-level refresh on `state.started` and a hard 2-second timeout reload regardless of outcome) — worth naming as a minor code-smell (the hard reload will fire even if the server action returned an error, potentially discarding an error banner the user hasn't finished reading, and even if the action is still pending past 2 seconds it forces a reload mid-flight) but not a functional defect I can prove without a live run; flagging as an observation, not a finding requiring action.

### NF-3 (severity: informational) — `page.tsx`'s data model coupling (R2's NEW-2) is unchanged and slightly larger
`FindingTraceChain.tsx` (untracked, unchanged since R2's read) is still mounted at `page.tsx:235`, still fed by the same expanded query (`checklist_responses`, `findings`, `violations(...)`, `action_forms`, a separate `inspection_items` fetch). `tsc` and `build` both pass cleanly with this coupling in place (confirmed this round, §1), so it is not currently breaking anything — R2's coupling-risk observation stands unchanged, still worth naming for whoever eventually separates CD-030 from CD-031-style work into distinct commits.

---

## 7. Overall conclusion

**Production-ready / contract-complete: NO.**

Genuinely fixed and verified **by source + RLS cross-reference** in the current (uncommitted) working tree:
1. NEW-1 (R2's blocking finding) — auditor/planner/leadership are no longer blocked from `/reviews/:id`; a real, distinguishable read-only state (badge + note + hidden controls) now exists, closing `SCREEN_STATE_MATRIX.csv`'s `read_only` requirement for SCR-WEB-320 for the first time.
2. `decision` value now has a DB-level `CHECK` constraint in addition to the existing app-layer allow-list (§4) — though its live application is **unverified**, stated as a limitation, not a pass.
3. S08 stale-detection is soundly designed at the code level (correct RLS-scoped query, correct polling/re-render logic, no stale-closure bug) with two disclosed gaps: no Arabic strings yet (confirmed, not just claimed) and a minor stale-select-doesn't-auto-advance UX gap (newly found this round).

What still blocks a clean PASS:
1. **NF-1 (new this round):** the very fix that resolved NEW-1 exposes that `ops` (and, less critically, `planner`) can reach `/reviews/:id` but cannot actually read `submission_versions` under current RLS (`subs_read` was never widened to match), which — traced through the code — makes `canStart`, the `DecisionPanel` open-check, the compare surface, and S08 all silently non-functional for `ops` specifically, despite `ops` being an intended decision-capable role per `reviews_insert` and `canDecide`. Not verified live; verify with an actual `ops`-role login before treating as certain, but the file:line evidence is concrete and should not be waved off as speculation.
2. **No live evidence obtained this session for anything in this spec file** — the entire `cd-030-version-comparison.spec.ts` was skipped because the shared `setup` project's persona logins failed with a reproducible (2/2) `400 Bad Request` from Supabase Auth for all three seeded personas, despite the Auth service itself being reachable (`200` on an unauthenticated health check). Root cause not established (most likely Auth-side rate-limiting/lockout from the volume of live logins already run today across R1/R2/CD-029/CD-031 audits against the same project, but this is a plausible explanation, not a confirmed one). This means **none** of R1's/R2's previously-live-verified legs (1, 3, 4, 10, 11, 17/RTL) were re-confirmed this round — they should be treated as "last verified live in R2," not "verified live in R3."
3. The not-found-vs-degraded-fetch ambiguity inside the `insErr` branch is unchanged and still open, now narrower in scope but not resolved, and the code comment above it slightly overstates what the mechanism actually does.
4. `reviews.returned_sections` still has no DB-level constraint (only `decision` was closed this round) — a residual, non-blocking gap carried forward unchanged from R1/R2.
5. The DB migration for `decision` cannot be confirmed to apply cleanly against live data — no Supabase credentials in this environment, stated plainly rather than assumed.

**Recommended status: CONDITIONAL.** Do not certify CD-030 contract-complete until (a) NF-1 is resolved or explicitly scoped out by a recorded decision (is `ops` actually required to function on this specific screen, or was `canDecide`'s inclusion of `ops` here itself always aspirational?), (b) a live Playwright run of this exact spec file actually completes with real persona logins (not skipped upstream), producing genuine pass/fail signal on all 12 tests including the new S08 leg, and (c) the `returned_sections` DB-level gap and the not-found/degraded ambiguity are either closed or explicitly deferred by a recorded decision the way `HANDOFF_BLOCKED_ACCEPT` was. This report does not authorize implementation, merge, or deployment.
