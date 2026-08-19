# 2026-08-19 · T-165 — `/admin/workflows` rebuilt on SAQEEL (+ lifecycle-canvas fix)

`task: T-165` · `status: done` · `duration: ~4h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The **Workflow builder** — the largest admin surface so far. A lifecycle builder over
`config_versions(engine='workflow')`: a version card per state-machine version with a
maker-checker approval chain, a lifecycle canvas (states + transitions), a transition
inspector, a live VAL-01..06 validation rail, the SLA calendar model, and the propose
/ edit / publish forms. Owner asks: migrate the way the others were done, **remove any
emoji and use proper icons**, and (on review) **fix the lifecycle canvas — it's
misaligned and doesn't look good**.

## What was wrong

- `AdminShell` + the old `@/components/EmptyState` + a **hand-drawn `<svg>` chevron**
  (rule 8) + `panel`/`badge`/`alert`/`t-caption`/`id-code`/`select`/`sq-field`/
  `sq-input`/`btn`/`check`/`exc` + **heavy inline styles** + raw `<table>`s.
- **~80 strings as English-only `t(key,"English")` fallbacks — no Arabic at all**
  (rule 15).
- `page.tsx` ~210 lines, `WfDeck` ~280 (over the 200 ceiling); `payload as {…}` casts.
- **Five emoji used as icons:** `🔀` (empty state), `⛔` (self-draft SoD badge), `✕`
  (missing actor), `✓` (idempotent fx), `⚠` (non-idempotent fx).
- Flush `RouteLoading`; status as `badge`/`exc`.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/workflows/page.tsx` | rebuilt as a route file (210 → 9) |
| `app/(app)/admin/workflows/loading.tsx` | framed skeleton |
| `features/admin-workflows/{queries,types,strings}.ts` | created — reads + maker/checker names + status localizers |
| `components/sections/admin-workflows/` | screen · workflow-version-card · **wf-deck** (canvas + orchestrator) · **wf-inspector** · **wf-rail** · sla-table · wf-forms · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-workflows.json` | created — new namespace (~80 keys, **en + ar**) + `messages.ts` |
| Deleted | `WfDeck.tsx`, `Controls.tsx`, `workflow-builder.module.css` |
| Untouched | `actions.ts`, `sla-actions.ts`, `task-actions.ts`, `transition-actions.ts`, `layout.tsx`, `lib/workflow/{normalize,validate}` |

## Decisions

**Split the 280-line WfDeck under the 200-line ceiling.** `wf-deck` is the client
orchestrator (holds `selectedState`/`selectedIdx`, computes the lane / branches /
shown / inspected, renders the canvas) and delegates to presentational `wf-inspector`
(inspector read-rows + the transitions `DataTable`) and `wf-rail` (states + validation).
The builder logic — `normalizeWorkflowPayload` + `validateWorkflowPayload`, the
deterministic ordering, keyboard roving on the lane — is carried across unchanged.

**All emoji / `<svg>` → real icons or `StatusPill`s.** `🔀`→`EmptyState icon="workflow"`;
`⛔`→`Icon "restricted"` beside the SoD pill; `✕`→a danger `StatusPill` ("No actor
set"); `✓`→a success `StatusPill` (the ping dot is the mark); `⚠`→a warning
`StatusPill`; the hand-drawn chevron→the `nextPage` icon (mirrored in RTL); the
validation pass/fail marks→`selected`/`dismiss` icons toned success/danger. Confirmed
by grep (zero emoji/`<svg>` in the migrated code) and the v5 debt dropping 60 → 56.

**Governance untouched.** The four action files stay byte-for-byte — including the
`NEUTRAL_LOAD_ERROR` that `neutral-error-sweep` asserts and GAP-08 optimistic
concurrency — as do `layout.tsx` and `lib/workflow/*`. The maker-checker SoD (own draft
shows an explanation, not a failing Approve button), the distinct-approver publish, the
`NotYetBoundary` for the unbuilt simulation/replay, and the "Not configured" SLA states
all carry across.

**The lifecycle-canvas fix.** On review the canvas was genuinely wrong: the old lane
ordered states by raw BFS distance (so a terminal branch, `cancelled` at distance 2,
wedged in front of `closed` at distance 3) **and drew a chevron between every adjacent
card** regardless of whether a transition connected them. The result showed
`in_review → cancelled → closed` arrows that don't exist, while the real happy-path edge
`in_review → closed` was exiled to the branch strip — a diagram implying a flow the state
machine doesn't have. Rebuilt the lane as the real **spine-walk** (`buildLane`: from the
initial state, follow transitions preferring the non-terminal successor, then append
off-spine states last) and draw a chevron **only where a real transition connects two
adjacent cards** (`connectsAfter`). Now `draft → scheduled → in_review → closed` reads as
one honest path, `cancelled` sits at the end with a clean gap, and `scheduled → cancelled`
shows as the branch chip it is. Initial/terminal captions gained a quiet accent/success
tone. `buildLane` is a pure, `let`-free recursive walk (rule 6).

**Bounded English on the error path.** The action files return neutral English error
strings (`NEUTRAL_LOAD_ERROR` etc.). Rather than touch the governed, spec-asserted
`actions.ts`, the forms display those strings as-is — the one bounded English path;
every static string is bilingual.

## No regression

- `mvp3-enterprise-contract` (":93 mounts routes") — `existsSync` on the page, still
  present. Unaffected.
- `neutral-error-sweep` (":31 reads `workflows/actions.ts`") — `actions.ts` untouched,
  still contains `NEUTRAL_LOAD_ERROR` and no raw provider leak. Unaffected.
- `mvp3-retrofit-regression` (live nav) — the heading title is kept **exactly**
  "Workflow builder" and the screen renders `main h2` sections + `nav aria-current`.
- `shell-navigation` owns the "Workflow Builder" nav label — untouched.
- No spec reads `page.tsx`/`WfDeck.tsx` source, so the thin-route + delete need no
  re-point.

## Verification

- [x] `npm run typecheck` — clean
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — **PASSED (−123)**
- [x] `npm run gates:date-inputs` — PASSED (none new)
- [x] `npm run check:design-system-v5` — **56** (down from 60 — the 5 emoji + `<svg>`
      removed); workflows adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] **live render (admin)** — empty state first (framed en + ar, `workflow` +
      `calendar` icons, 0 overflow), then with a throwaway `config_versions` workflow
      draft seeded via the SQL editor (removed after): the **full builder** — version
      card (object / Draft `StatusPill` / **Approve and publish** / maker-checker chain
      with Riyadh timestamp), the **corrected lifecycle** (spine + honest arrows +
      terminal tone), the transition inspector (emoji-free "No actor set" danger pill +
      idempotent / no-idempotency-key pills), the validation rail (`selected`/`dismiss`
      icons, VAL-05/06 failing on the seeded no-actor/no-key transition), the states
      rail, and the SLA empty state
- [x] **axe** — **0 violations** (31 passes) with the full builder; the empty-state
      `scrollable-region-focusable` finding was the **shell's** `#main-content`
      (tabindex=-1, present on other routes when content is tall + interaction-free) and
      clears once the builder's buttons render
- [x] **200% zoom** — **0** page overflow (the canvas scrolls inside its own container)
- [x] **Arabic / RTL** — fully mirrored, all copy from `ar` JSON, the **lane mirrors**
      (flows right-to-left, chevrons point left), Arabic-numeral dates, **0** overflow
- [x] **light theme** — hairline state cards on white, honest arrows, accent publish
- [x] **mobile 375 px** — 0 overflow (deck grid stacks; canvas scrolls internally)

### Manual accessibility checklist

- No `<svg>` in app code and no emoji-as-icon — icon-registry + `StatusPill`s only.
- Lane keyboard roving (`ArrowLeft`/`Right`, roving tabindex, `aria-pressed`) preserved;
  the transitions table's select target is a real `<button>`; forms are `Field`-wrapped.
- Status is text + shape everywhere (`StatusPill` / toned icons), never colour alone.
- Single `<main>`, one `<h1>`, breadcrumb `Workflow settings / Lifecycles`.

## Env note

`config_versions(engine='workflow')` and `sla_calendars` are empty in the seed, so a
throwaway workflow draft was inserted via the SQL editor to exercise the builder
(payload chosen to hit every icon: a no-actor transition, idempotent + non-idempotent
side effects, a branch to a terminal), then removed. The own-draft SoD path (the
`restricted` icon shown when the viewer is the maker) wasn't hit because the seed's
`created_by` was a different profile (so the Approve-and-publish path showed instead) —
it's code-verified (grep confirms the `restricted` icon, no emoji).

## Proposed commit

```
feat(admin): rebuild workflow builder on saqeel, honest lifecycle canvas
```

## Next

The remaining admin surfaces (audit, items, devices, security-access, templates,
violations).
