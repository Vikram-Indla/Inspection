# Claude Design Progressive Correction Prompt — CD-024 R1

## Identity correction — do this first

This task is **CD-024 / SCR-WEB-140 / P02 Visit Configuration & Assignment**. It is not CD-021.

The first CD-024 submission was accidentally embedded as frames `4route` and `4a–4h` inside a source canvas named `CD-021 Bulk Targeting.dc.html`. Treat that file only as the upstream source containing the existing CD-024 frames. Duplicate/extract those CD-024 frames into a dedicated design file named:

`CD-024 Visit Configuration and Assignment.dc.html`

All corrected frame names, exports, manifests, headings and handoff paths must use `CD-024` and `SCR-WEB-140`. References to CD-021 are allowed only when identifying the upstream `/planning/bulk/review` runtime, `loadBulkSelection`, `publishBulkPlan`, migration 0026 or an inherited component. Never label the current design task, file or deliverable as CD-021.

Continue from the extracted CD-024 frames; do not restart the screen and do not redesign the accepted candidate-first direction. Preserve the score-free Assignment Evidence Ledger, explicit scope decision, truthful automatic-round-robin warning, physical-only mode, frozen Saqeel family grammar and read-only `/planning/plans/:id`.

This is a P1 correction round only. Do not edit application code, create migrations, resolve the route by assumption, self-approve, implement, commit, push, merge or deploy.

Read:

1. `outputs/claude-design-approval-pack/CD-024_DESIGN_PROMPT_V4.md`
2. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
3. `outputs/claude-design-approval-pack/CD-024_DESIGN_REVIEW_R1.md`
4. Current `apps/web/src/app/planning/bulk/review/page.tsx`
5. Current `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
6. Current `apps/web/src/app/planning/bulk/actions.ts`
7. `supabase/migrations/0026_cd021_bulk_publish_atomic.sql`
8. Current shared-shell evidence and components

Apply these corrections progressively:

## 1. Correct runtime truth

- Remove every claim that manual overlap is rechecked inside the atomic RPC/transaction.
- State the current truth: manual pool/overlap validation runs server-side before the RPC; it can become stale before assignment insert; automatic round-robin has no overlap check.
- Add `HANDOFF_BLOCKED` legs for fail-closed query-error handling and concurrency-safe overlap enforcement.
- Require every factory/package/inspector/duplicate/overlap read to return a structured success-or-failure result. A read failure must block readiness with neutral copy and preserved input; it must never appear as zero results or no conflict.
- Preserve raw-error suppression and RLS authority.

## 2. Remove developer artefacts from the product UI

- Remove `SCR-WEB-140`, `HANDOFF_BLOCKED`, requirement IDs, engine IDs, `P03`, migration numbers, RPC names and `SECURITY INVOKER` from inside all user-facing frames.
- Keep those details in annotations outside the frame and in the wiring map.
- Replace technical user copy with operational consequences. Do not call factories “publishable” while another blocker remains; use a precise count such as “10 without active duplicates.”

## 3. Restore the frozen shared shell

- Use the exact accepted desktop and narrow shell: grouped navigation, navigation search, theme/language/notifications/account treatment, collapse/drawer behavior and correct Arabic physical order.
- If a frame intentionally crops to page content, label it `CONTENT_CROP` outside the UI and do not invent replacement chrome.

## 4. Produce real, equal-fidelity design evidence

- Rebuild constraint-first and schedule-context as equal-fidelity primary decision-zone alternatives using the same data, typography and component depth as candidate-first. Do not turn them into full pages; equal-fidelity decision zones are sufficient.
- Keep candidate-first selected only if it still wins against decision time, hidden assumptions, error prevention, Arabic/RTL, keyboard burden, narrow survival and implementation truth.
- Replace the prose hard-state contact sheet with actual designed mini-frames for: no package; no inspectors; legitimate zero candidates; source-service failure; manual conflict; auto overlap gap; stale/concurrent failure; invalid/tampered selection; submit in progress; neutral transaction failure with input preserved; post-scope-reduction/restoration; unauthorized/not-in-scope; success.

## 5. Correct responsive, theme and Arabic parity

- Produce the same complete hard state in desktop dark, desktop light, Arabic RTL and 390–430px narrow.
- The narrow frame must be an operable screen with real configuration controls, candidate cards/table alternative, ledger, scope decision, readiness and publish action—not a numbered outline describing future behavior.
- Arabic and light frames must retain the same fields, blockers, unknowns, readiness and shared shell as English dark. Use realistic long Arabic data and correct `bdi` isolation.
- Export a light-theme PNG and corrected primary/Arabic/narrow PNGs.

## 6. Choose one valid keyboard model

Preferred correction: retain a plain semantic HTML table. Keep native selects/buttons in the normal tab sequence; update the ledger on row `focusin`, explicit “Review evidence” activation or selection. Do not call this a one-tab-stop roving table.

Only choose a one-tab-stop model if you intentionally implement the full ARIA grid contract, including roles, managed cell focus, entry/exit, widget activation/restoration and assistive-technology tests. Do not mix table and grid models.

Show a focused error-summary frame, its linked inline target, focus restoration after correction, polite loading/submit/success status and assertive blocker/failure alert.

## 7. Correct authorization and research handoff

- Add `apps/web/src/app/planning/bulk/review/page.tsx` to the component/handoff map for an explicit Planner direct-route guard while preserving RLS as the data boundary.
- Design unauthorized/not-in-scope separately from empty selection and source failure.
- Replace the obsolete Microsoft citation with exact official Microsoft Field Service pages covering manual scheduling versus constraint-aware scheduling and resource requirements.
- Replace the generic DGA homepage with the exact DGA accessibility/digital-experience guideline used. Treat Arabic-first default as the accepted Saqeel baseline, not an inferred external policy.

## Required corrected output

Return only deltas plus the corrected assets:

1. Dedicated `CD-024 Visit Configuration and Assignment.dc.html` containing only the CD-024 design and its supporting frames
2. `CD-024_R1_CORRECTION_LOG`
3. Corrected route/runtime truth panel
4. Three equal-fidelity decision-zone alternatives and comparison
5. Corrected full primary frame
6. Actual visual hard-state contact sheet
7. Full desktop light, Arabic RTL and 390–430px narrow frames for the same hard state
8. Corrected keyboard/focus/status/alert specification and focused-error visual
9. Updated `IMPLEMENTATION_MANIFEST_CD-024.yaml`
10. Updated `COMPONENT_MAP_CD-024.csv`
11. Updated `WIRING_MAP_CD-024.csv`
12. Updated `ACCEPTANCE_CHECKLIST_CD-024.md` with evidence references, not self-awarded completion
13. Updated `RESEARCH_PROVENANCE_CD-024.md`
14. Updated `CLAUDE_CODE_HANDOFF_CD-024.md`, still `HANDOFF_BLOCKED`
15. Corrected PNG exports including light theme

Finish with `READY_FOR_DESIGN_REVIEW_R2`. Do not state approved or implementation-ready.
