# 2026-08-19 · T-164 — `/admin/enforcement-recommendations` rebuilt on SAQEEL

`task: T-164` · `status: done` · `duration: ~2.5h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The **Enforcement recommendations** review queue — inspector-submitted `pending`
enforcement recommendations land here; supervisors decide (approve / reject with a
recorded basis), administrators keep read visibility, and every decision is gated
behind a database feature-flag until a safe atomic transition exists. Migrate the
way the others were done.

## What was wrong

- `AdminShell` + the **old** `@/components/EmptyState` + **three `<svg>` icons from
  `@/app/icons`** (`IconBlocked` / `IconEye` / `IconFolder` — a rule-8 violation) +
  `alert`/`alert-warning`/`badge`/`panel`/`saqeel-state`/`t-caption` + inline
  `style={{ padding / marginBlockStart }}` + a **headerless raw `<table>`** for the
  decided list.
- ~40 strings as inline `tr(key, en, ar)` ternaries (`locale === "ar" ? ar :
  t(key, en)`) — rule 15.
- `page.tsx` ~180 lines with all logic inline — rule 3.
- `as unknown as` casts for the joined rows — rule 5.
- `DecideForm` raw `sq-choice` radios + `sq-textarea` + `btn` — WEB-015.
- Flush `RouteLoading`; decision status a colour-class `badge`.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/enforcement-recommendations/page.tsx` | rebuilt as a route file (180 → 10) |
| `app/(app)/admin/enforcement-recommendations/loading.tsx` | **framed skeleton** |
| `app/(app)/admin/enforcement-recommendations/actions.ts` | **untouched** (already codes; the wiring spec asserts it) |
| `features/admin-enforcement-recommendations/{queries,types,strings}.ts` | created — reader/decider/writer resolution + reads + measure/decision localizers |
| `components/sections/admin-enforcement-recommendations/` | screen · pending-list · recommendation-card · decide-form · decided-table · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-enforcement-recommendations.json` | created — new namespace (~40 keys, notices verbatim) + `messages.ts` |
| Deleted | `DecideForm.tsx`, `responsive.module.css` |
| Untouched | no `layout.tsx` (inherits the parent `/admin` boundary — supervisors decide here) |

## Decisions

**Role model preserved exactly.** `queries.ts` keeps the byte-for-byte expressions
the wiring contract asserts: `isDecider = roles.includes("supervisor") ||
roles.includes("admin")` (read: the pending queue + the decided history + no
read-only banner), `canDecide = roles.includes("supervisor")` (write: the decide
form), `isReader = isDecider || inspector || planner` (the parent `/admin` boundary
already restricts entry to admin + supervisor, so the inspector/planner arms are
defensive). The `roleError` and `!isReader` gates render as saqeel `EmptyState`s.

**Governance byte-for-byte.** The three notices — "Enforcement policy: Not
configured.", the read-only "Decision scope", and the role read-only banner — carry
across verbatim as `Card` notices. The decide flow is unchanged: `actions.ts` returns
`backend_guard_required` unless `ENFORCEMENT_P0_RPCS_DEPLOYED`, then calls
`decide_enforcement_recommendation` with idempotency + a validated receipt, mapping
`ENF_MAKER_CHECKER` / `ENF_DECISION_CONFLICT` / … to stable codes. The decide form
renders through `Choice` (radio, `decision`), `Textarea` in `Field`, and `Button`;
codes map to bilingual copy via `decideResultMessage`. The `CLEAN_FACTORY_CODES`
demo-data scope moves into `queries.ts` unchanged.

**The one `useEffect` (rule 10).** The decide form mints its idempotency key
client-side once via `useEffect(() => setIdempotencyKey(crypto.randomUUID()), [])`.
This is the sanctioned external-synchronisation exception: a stable idempotency key
must be unique per form instance and per page load (so a genuine second decision
after a reload is not deduped as a replay), which rules out `useId`; and a
`useState` lazy initialiser would render a different UUID on the server than the
client, a hydration mismatch on the hidden input. Deferring to an effect is the
correct escape hatch and is what the original did.

**Copy drift left as-is.** The read-only / awaiting copy says "Operations or
Compliance Admin role" while the actual gate is `supervisor`; this pre-existing
mismatch is preserved verbatim (migration is not copy correction — changing it would
be inventing governed wording).

## No regression

- **`package-route-wiring-gaps`** (":63 separates reader/decider access and guarded
  writes") — the four page reads (`getUserRoles(user.id)`, the exact `isDecider` and
  `isReader` lines, `sb.from("enforcement_recommendations")`) re-pointed to
  `queries.ts`; the `pendingError &&` truthful-error render re-pointed to the screen
  (`{data.pendingError && …}`); the `action` asserts still hit the **untouched**
  `actions.ts`. Verified pass (in the 408 static set, not in failures).
- **`admin-supervisor-route-boundary`** lists `enforcement-recommendations` under
  `INHERITED_SUPERVISOR_ROUTES` — no `layout.tsx` added, so it keeps inheriting the
  parent `admin + supervisor` boundary. Unaffected.
- **`shell-navigation`** owns the "Enforcement Recommendations" nav label/href —
  untouched.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems** (the retained `useEffect`
      is not lint-blocked; it is the external-sync exception)
- [x] `npm run gates:typography` — **PASSED (−91)**
- [x] `npm run gates:date-inputs` — PASSED (none new)
- [x] `npm run check:design-system-v5` — **60** unchanged; enforcement adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**; the
      re-pointed wiring contract passes
- [x] **live render (admin persona = decider, non-writer)** — framed en + ar;
      breadcrumb, `h1`, 4 `main h2` (both notices + Pending + Recently decided);
      both governance notices **verbatim**; **no read-only banner** (admin is a
      decider — confirmed via `innerText`, the `textContent` positive was Next's
      inline RSC payload); pending + decided **empty states**; the "Recently decided"
      section present (decider-only)
- [x] **axe** — **0 violations** (26 passes)
- [x] **200% zoom** — **0** horizontal overflow
- [x] **Arabic / RTL mobile 375 px** — `dir=rtl`, `lang=ar`, single `<main>`, fully
      mirrored, all copy from `ar` JSON, **0** overflow
- [x] **supervisor decide flow (live, end-to-end)** — with a throwaway seeded
      `pending` row and the signed-in `supervisor1` granted a read role, the pending
      card renders the `ChoiceGroup` (Approve/Reject) + required-reason `Textarea` +
      "Record decision" button + the measure `StatusPill` + the Riyadh-TZ timestamp;
      **submitting returns the `backend_guard_required` guard** mapped to the bilingual
      copy in `Text tone="danger"`, and **nothing is recorded** (the maker-checker RPC
      never runs — the truth model holds). A *successful* decision is impossible here
      by design (`ENFORCEMENT_P0_RPCS_DEPLOYED` is off), so the guard is the expected
      terminal state. Seed row + the temporary role grant removed afterward.

### Manual accessibility checklist

- Keyboard: decide form is a real `<fieldset>`/`<legend>` (`ChoiceGroup`) with native
  radios + `Textarea` + submit `Button`; the decided list is a `DataTable` with
  column headers + a row header (the legacy `<table>` had **no `<thead>`**).
- Icons: the three `<svg>` icons replaced by icon-registry glyphs (`restricted`,
  `enforcement`, `review`); no `<svg>` in app code.
- Status: measure + decision are `StatusPill`s with text labels, never colour alone.
- Single `<main>`, one `<h1>`, breadcrumb `Administration / Enforcement recommendations`.

## Decide flow verified live (with a throwaway seed)

The seed initially had no `pending` recommendations. To exercise the supervisor
decide flow, one throwaway `pending` row was inserted via the Supabase SQL editor
for a `CLEAN_FACTORY_CODES` factory (`F-1101`), and the signed-in `supervisor1`
account was granted a temporary read role — both removed afterward. The result:
the decide form renders and submitting surfaces the `backend_guard_required` guard,
with nothing recorded (see the verification checklist). A successful decision stays
impossible by design here (`ENFORCEMENT_P0_RPCS_DEPLOYED` off).

## Two pre-existing findings surfaced during verification (not from this migration)

1. **admin/supervisor cannot read the enforcement queue via RLS.** The
   `enforcement_recommendations` **read** policy admits only
   `inspector/planner/ops/compliance_admin/auditor/reviewer/leadership`; the
   supervisor amendment (`20260805120000`) widened only the **decide** RPC. So the
   app's `isReader` (which includes admin + supervisor) is broader than RLS — an
   admin/supervisor is admitted to the page but the read returns them zero rows, so
   the queue always looks empty to the very roles meant to work it. (Verifying
   required granting `supervisor1` an `inspector` read role.)
2. **The read policy references roles absent from the catalog.** A later migration
   trimmed the `roles` catalog to `admin/inspector/planner/supervisor`, yet the read
   policy still lists `ops/compliance_admin/auditor/reviewer/leadership` — none of
   which are grantable. So today only `inspector`/`planner` can actually read the
   queue.

   Both are governance/RLS gaps independent of this UI migration — worth a P0/P1
   follow-up on the enforcement RLS, parked here.

## Proposed commit

```
feat(admin): rebuild enforcement recommendations review on saqeel
```

## Next

The remaining admin surfaces (audit, items, devices, security-access, workflows,
templates, violations).
