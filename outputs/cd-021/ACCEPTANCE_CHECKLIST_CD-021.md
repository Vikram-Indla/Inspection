# ACCEPTANCE_CHECKLIST_CD-021 (DSG-016, DSG-A11Y-001)

## DSG-016 — enterprise-density comprehension
- [ ] Criteria/results/selection legible at 1440 and 1600 widths (frame 1a)
- [ ] Denominator + eligible + excluded visible without scrolling in every state
- [ ] Every distribution shows its denominator and an unknown bucket
- [ ] Exclusion reasons name the removing condition (no bare counts)
- [ ] Focus-a-condition contribution readout works via mouse AND keyboard
- [ ] Select-visible vs select-all-results are distinct, labelled actions
- [ ] Selection summary persists across pagination and result filtering
- [ ] Criteria edit invalidating selection prompts explicit confirmation (frame 1d)
- [ ] No-results state names the last narrowing condition (frame 1h state 5)
- [ ] Partial publish failure shows per-step truth, preserves draft, offers resume (frame 1d)
- [ ] Stale source and partial-source failures are isolated, labelled, retryable (1d)
- [ ] Source name + freshness adjacent to every count they qualify
- [ ] Risk always labelled recorded/advisory with ENG-04 version; no auto-selection language
- [ ] No AI targeting/ranking/recommendation claims anywhere

## DSG-A11Y-001 — accessibility, RTL, responsive
- [ ] Document-level dir=rtl lang=ar; sidebar physically right in AR (frame 1e)
- [ ] Mixed-direction IDs/dates/codes bdi-isolated; long Arabic labels wrap safely
- [ ] Keyboard-only criteria build/edit/reorder (ARIA tree; Alt+arrows; undo on delete)
- [ ] aria-live: polite result counts + selection changes; assertive validation/failures
- [ ] WCAG AA contrast in both themes (light uses darkened RAG tokens)
- [ ] Non-color status: every lozenge carries a glyph
- [ ] Targets >=44px desktop / 48px prominent; text inputs >=16px
- [ ] Narrow 420px: tabs + pinned ledger, no horizontal overflow (frame 1g)
- [ ] Reduced motion: no map fly-to, no stepper animation; instant state swaps
- [ ] Print/zoom 200%: layout reflows without loss

## Runtime verification legs (Codex review)
- [ ] Structured step results from publishBulkPlan match stepper design
- [ ] Neutral catalogued error copy replaces raw e.message
- [ ] Retry never duplicates visits (keyed by visit_plan_id)
- [ ] HANDOFF_BLOCKED legs resolved or explicitly accepted: atomicity RPC; commit/worktree recording; CD-020 family baseline
