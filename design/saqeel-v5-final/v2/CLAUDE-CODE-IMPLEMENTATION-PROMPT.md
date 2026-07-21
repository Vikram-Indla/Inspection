# Claude Code — Saqeel V5 implementation master prompt

You are Claude Code acting as the principal implementation engineer and design-system migration authority for the private repository:

`Vikram-Indla/Inspection`

The design phase is complete. Implement the final **Saqeel Design System V5.1** across the actual Inspection platform:

1. Web operations and review.
2. iPad/field experience.
3. Administration and configuration.
4. Official inspection reports and print/PDF.

Work from the repository root.

The final design-system package will be provided as:

`Saqeel Design System V5.1 Final.zip`

Unzip it inside the repository under:

`design/saqeel-v5-final/`

Do not treat the reference HTML pages as the application. They are visual and behavioral specifications.

# 1. Mission

Complete a once-and-for-all migration from the current V1 production presentation to the approved Saqeel V5.1 system while preserving all existing:

- Routes.
- Authentication.
- Roles.
- RBAC and RLS.
- Database constraints.
- Workflows.
- Data.
- Calculations.
- Audit behavior.
- Immutable versions.
- Offline/sync behavior.
- Functional acceptance already achieved.

This is not a redesign exercise. Do not invent new product capabilities, data fields, statuses, personas, workflows or calculations.

Do not stop after applying tokens to a few pages. Continue until every reachable web, field/iPad, admin and report page has either:

- Been migrated and verified; or
- Been explicitly recorded as blocked with evidence.

Do not request piecemeal approvals. Complete the implementation pass, consolidate defects, and provide one evidence-based completion report.

# 2. Required sources of truth

Read these before editing:

1. `design/saqeel-v5-final/SKILL.md`
2. `design/saqeel-v5-final/readme.md`
3. `design/saqeel-v5-final/v2/SAQEEL-DESIGN-SYSTEM-V2-OVERVIEW.md`
4. `design/saqeel-v5-final/v2/SAQEEL-V2-TOKENS.md`
5. `design/saqeel-v5-final/v2/SAQEEL-V2-COMPONENT-SPEC.md`
6. `design/saqeel-v5-final/v2/SAQEEL-V2-DENSITY-SPEC.md`
7. `design/saqeel-v5-final/v2/SAQEEL-V2-MIGRATION-GUIDE.md`
8. `design/saqeel-v5-final/v2/SAQEEL-V2-DEPRECATION-MAP.md`
9. `design/saqeel-v5-final/v2/SAQEEL-V2-RESPONSIVE-RTL-A11Y.md`
10. `design/saqeel-v5-final/v2/SAQEEL-V2-REPORT-PRINT-SPEC.md`
11. `design/saqeel-v5-final/v2/SAQEEL-V5.1-FINALIZATION-REPORT.md`
12. `design/saqeel-v5-final/patterns/web/*.html`
13. `design/saqeel-v5-final/patterns/ipad/*.html`
14. `design/saqeel-v5-final/patterns/admin/*.html`
15. `design/saqeel-v5-final/patterns/gallery.html`

Use the final canonical source files under:

- `tokens/`
- `styles/`
- `components/`

The archived `explorations/premium-pilot/` directory is provenance only. Do not import its pilot tokens or CSS into production.

# 3. Branch and evidence discipline

1. Confirm the repository and current branch.
2. Record the starting commit SHA.
3. Create:

`feature/saqeel-v5-implementation`

from the latest `setup/Inspection`.

4. Confirm the working tree is clean before editing.
5. Maintain:

`docs/design-system-v5/IMPLEMENTATION-INDEX.md`

with:
- Wave.
- Page family.
- Files changed.
- Components migrated.
- Tests.
- Screenshots.
- Status.
- Remaining issues.

6. Use focused commits by migration wave.
7. Do not merge or push to another branch unless explicitly instructed.
8. Do not modify Supabase schema, migrations, RLS, triggers or governed calculations merely to facilitate the redesign.

# 4. Wave 0 — Discovery and baseline

Before changing code:

- Read the complete application CSS import graph.
- Inventory all global stylesheets, CSS modules, inline styles and raw colors.
- Inventory shared buttons, fields, tables, tabs, cards, drawers, modals, search, date and navigation components.
- Inventory all routes under web, field/iPad and admin.
- Identify page-specific duplicates of shared components.
- Identify all `toISOString().slice(...)` and raw date formatting.
- Identify all route links with tab roles.
- Identify all generic bordered wrappers, 12px input radii, transparent loading labels, full-red toolbar danger actions and raw blue-primary assumptions.
- Capture baseline screenshots of at least:
  - Dashboard.
  - Visit planning.
  - Review workspace.
  - Inspection report.
  - Field checklist.
  - Admin configuration screen.
  - Light and dark modes.

Create:

`docs/design-system-v5/BASELINE-AUDIT.md`

Do not use the baseline audit as a reason to stop. Continue into implementation.

# 5. Wave 1 — Canonical production foundations

## 5.1 Tokens

Migrate the final token system into the production token source.

The production repository currently uses V1 values such as:

- Dark primary `#78AEDA`.
- Input radius `12px`.
- No control-boundary token.
- No metric/label/action type tokens.
- One broad desktop control height.

Apply the V5.1 values, including:

- Light primary: `#176B52`.
- Dark primary: `#64C2A1`.
- Information/link blue remains separate.
- Light control boundary: `#7A8894`.
- Dark control boundary: `#6B7680`.
- Input radius: `6px`.
- Metric typography: `500 28px/32px`.
- Field labels: `500 14px/20px`.
- Actions/tabs: `500 14px/20px`.
- Compact utility: `36px`.
- Standard admin/web: `40px`.
- Principal: `44px`.
- Prominent: `48px`.
- Field/iPad: `52px`.
- Tonal field surface.
- Sticky focus offsets.
- Information-strong semantic.
- Link semantic.
- Gregorian/Asia-Riyadh date contract.

Use IBM Plex Sans Arabic for normal body, controls and input text. JetBrains Mono is restricted to technical identifiers, hashes, logs and governed telemetry.

Remove any local assumptions that dark primary is blue.

## 5.2 Layered production CSS

Do not simply paste the 1,000+ line legacy stylesheet followed by a patch.

Refactor the production CSS into the repository’s appropriate equivalent of:

- Foundations.
- Core controls.
- Navigation.
- Status/feedback.
- Data.
- Process.
- Overlays.
- Domain.
- Web patterns.
- Field/iPad patterns.
- Admin patterns.
- Report.
- Print.
- Utilities.
- Temporary legacy compatibility.

Keep one supported global import entry.

Create a deprecation plan for old selectors. Do not delete a selector until every call site is migrated or a compatibility alias is intentionally retained.

## 5.3 Automated guardrails

Add lint/CI checks that fail on new production use of:

- Generic input `border-radius: 12px`.
- `color: transparent` for loading-button labels.
- Route links with `role="tab"`.
- `toISOString().slice(...)` for user-facing dates.
- Raw hex outside the governed token source, excluding documented assets.
- Filled `ax-btn--danger` outside confirmation or danger-zone contexts.
- Emoji as product icons.
- Generic structural `.ax-surface` use without an approved semantic reason.

# 6. Wave 2 — Shared production components

First reuse and refactor the current canonical application components. Do not create a parallel UI library when an existing shared component can be migrated.

Implement or upgrade the production equivalents of:

- Button.
- SplitButton.
- Field.
- Input.
- Select.
- Textarea.
- Search/combobox.
- Checkbox.
- Radio.
- Switch.
- Segmented view selector.
- In-page Tabs.
- RouteTabs.
- Pagination.
- DataTable.
- PageHeader.
- CommandHeader.
- StatusRail.
- StatusChip.
- MetricStrip.
- TonalField.
- RecordRow.
- ControlGroup/fieldset.
- DateTime.
- DateRange.
- EvidencePreview.
- AuditTimeline.
- Modal.
- Drawer.
- Menu.
- Tooltip.
- Signature.
- ReportHeader.
- ReportFooter.
- FieldActionBar.
- AdminFilterToolbar.

## Mandatory component behavior

### Actions

- Exactly one principal filled action per action zone.
- Cancel is secondary or tertiary.
- Audit/history is tertiary.
- Delete appears in overflow, a subtle danger action or a dedicated danger zone.
- Solid red is used only in the final destructive confirmation.
- Loading retains its visible action context: `Publishing version…`.
- Disabled actions expose the reason to sighted and assistive-technology users.
- Do not show duplicate actions such as `Publish version` and `Publish` without a governed distinction.

### Forms

- Web/admin label: 14/20.
- Web/admin normal controls: 40px.
- Principal action: 44px.
- iPad controls: 48–52px.
- Input radius: 6px.
- Content-appropriate field width rather than equal-width fields by default.
- Group related controls through fieldset and legend.
- Do not place scope checkbox, planning-mode radio and notification switch in one unlabelled row.
- Validation explains recovery.

### Search

- One canonical SVG icon.
- Full combobox keyboard and announcement behavior where results are shown.
- No generated Unicode search glyph.

### Navigation

- Route-level navigation uses links and `aria-current`, never tab roles.
- In-page tabs implement the WAI-ARIA tabs contract with RTL-aware arrow keys.
- View selectors remain compact and quiet.

### Tables

- Caption.
- Sort button inside sortable headers.
- Managed `aria-sort`.
- Row-specific selection labels.
- Indeterminate select-all.
- Focus-visible controls.
- Responsive alternative where the data is not genuinely two-dimensional.

### Modal and drawer

- Accessible title and optional description.
- Localized close label.
- Escape behavior.
- Initial focus.
- Focus containment when modal.
- Focus restoration.
- Background-scroll management for modal overlays.

# 7. Wave 3 — Governed dates and time

Create one shared date service, for example:

`apps/web/src/lib/dates.ts`

Use:

- `Intl.DateTimeFormat`.
- `timeZone: "Asia/Riyadh"`.
- `calendar: "gregory"`.
- Locale-aware English and Arabic formats.
- Calendar-day calculations based on Riyadh date parts, not raw millisecond division.
- `<bdi>` around Latin/technical values in RTL content.

Required patterns:

- Date: `18 Jul 2026`.
- Date-time: `18 Jul 2026, 11:40 (Riyadh)`.
- Due: `6 Jul 2026 · 14 days overdue`.
- Date range with explicit From/To or Arabic من/إلى.
- Separate labels for:
  - Data refreshed.
  - Report generated.
  - Submitted.
  - Decided.
  - Captured.
  - Signed.

Replace every user-facing UTC ISO slice, including at minimum:

- Shell default date range.
- Dashboard refresh time.
- Inspection report `dt()` and `d10()`.
- Visit lists.
- Review timelines.
- Evidence timestamps.
- Signature timestamps.
- Admin version history.

Unit-test Riyadh midnight boundaries.

# 8. Wave 4 — Premium shell and navigation

Migrate the shared application shell.

Retain the left service rail for deep enterprise navigation.

Create a premium command header containing only:

- Brand/current service context.
- Global search.
- Relevant date and region scope.
- One contextual principal action.
- Notifications/utilities.
- Profile and role context.

Do not place every service into a horizontal menu.

Apply the approved subtle texture only to low-information chrome. Never place texture behind content, tables, forms, evidence or reports.

Create deterministic responsive states:

- 1440 desktop.
- 1280/1024 compact desktop.
- Tablet.
- Mobile drawer.
- 400% zoom / 320 CSS pixel equivalent.
- RTL.

Ensure sticky chrome never entirely obscures focused content.

# 9. Wave 5 — Web operations

Migrate all reachable web operational pages, including their loading, empty, error, partial, long-content and disabled states.

At minimum cover:

- Dashboard.
- Visits list.
- Visit planning.
- Calendar/scheduling.
- Operations.
- Factory dossier/Factory 360.
- Inspection records.
- Level-2 review.
- Violations.
- Corrective actions.
- Evidence.
- Search.
- Maps.
- Notifications.
- Profile.
- Any other enabled web route discovered in Wave 0.

## Dashboard

- Replace repetitive KPI card grids with metric strips, status rails and analytic fields.
- Reserve 32/40 display type for at most one page-defining figure.
- Ordinary KPIs use 28/32.
- Remove formulas from every card; expose methodology on demand.
- Reduce unnecessary bounded containers by at least 30%.
- Preserve all governed metrics and drill-through behavior.

## Visit planning

Apply the exact corrections identified in the approved reference:

- One principal action.
- Delete draft removed from the principal toolbar.
- No anonymous loading rectangle.
- Group Factory scope, Planning mode and Notifications.
- Quiet Board/Table/Map selector.
- Distinct Overview/Evidence/Audit route navigation.
- Unambiguous dates.
- Compact report/version rows.
- No card-inside-card composition.

## Review workspace

Create:

- Issue/section navigator.
- Report canvas.
- Evidence/context panel.
- Immutable version context.
- Review history.
- Sticky decision bar.
- Unsaved-state announcement.
- Governed approve/return/reject confirmation.
- Mandatory reason where required.
- Named returned sections.
- No workflow or decision-rule changes.

# 10. Wave 6 — iPad/field experience

Treat `/field/*` as a field-native experience, not a scaled desktop interface.

Migrate all reachable field routes:

- Inspector home/today.
- Pre-visit readiness.
- Factory identity.
- Start/continue inspection.
- Checklist.
- Evidence capture.
- Evidence annotation.
- Barcode/QR where already supported.
- Geofence/location.
- Violation creation.
- Corrective action.
- Offline outbox.
- Sync conflict/recovery.
- Representative acknowledgement.
- Signature.
- Save and close.
- Submit for review.

Requirements:

- 48px minimum field target; 52px high-frequency/high-risk controls.
- 17/26 field content.
- Portrait and landscape.
- iPad Split View.
- Touch, pointer and keyboard.
- Apple Pencil-compatible annotation targets where existing functionality supports annotation.
- Visible offline/sync state.
- Preserve user work during failure.
- Minimize modal interruption.
- Strong sunlight/readability consideration.
- One principal field action per stage.
- Arabic and RTL parity.

Do not alter offline queues or sync logic while styling them.

# 11. Wave 7 — Administration

Apply compact density to all `/admin/*` and configuration surfaces.

Migrate:

- Roles.
- Permissions.
- Users/access.
- Regulation/package/checklist configuration.
- Form designer.
- Violation registry.
- Risk configuration.
- Rules.
- Workflows.
- Notification configuration.
- Version comparison.
- Approval queues.
- Audit/lineage.
- Any other enabled administration route discovered.

Requirements:

- 36px utility controls.
- 40px standard admin actions.
- 14/20 table and action text.
- Dense but readable tables.
- Filter/toolbars that do not become card grids.
- Bulk actions only when selection exists.
- Destructive configuration actions separated from publish/approve.
- Strong version and maker-checker context.
- Preserve all role, publish and approval restrictions.

# 12. Wave 8 — Official report and print

Rebuild the official inspection report from one governed content model with two renderers:

1. Responsive screen reading.
2. A4 print/PDF.

Use five layers:

1. Official identity and executive outcome.
2. Findings and compliance.
3. Violations and corrective actions.
4. Evidence, versions, decisions and lineage.
5. Acknowledgement, signatures and legal footer.

Requirements:

- Responsive screen view; no fixed A4 sheet width on small screens.
- Complete A4 print.
- Repeated table headers.
- Chapters may continue across pages.
- Keep only atomic rows/signature blocks together.
- Page reference and page numbers where supported.
- Grayscale-safe status.
- Arabic RTL print.
- Long ID/hash/path wrapping.
- Interactive disclosures expanded appropriately in print.
- No texture, command chrome or dark-theme background in print.
- Preserve the DEF-WF-006 invalid-approval block and make invalid official use unmistakable.
- Clarify immutable snapshot versus live reference data.

Test fixtures:

- 1 item.
- 20 items.
- 100 items.
- 300 items.
- No violations.
- Many violations.
- Long Arabic notes.
- Missing signature.
- Multiple versions and decisions.
- Invalid approval with no immutable submission.

# 13. Cross-cutting visual acceptance

Every migrated page must satisfy:

- Recognizably Saqeel, not generic SaaS.
- Brand green is scarce and purposeful.
- Information blue is not used as the principal action.
- One principal action per context.
- No permanent full-red destructive toolbar action.
- No anonymous loading controls.
- No field labels that resemble section headings.
- No routine KPI at 32/40.
- No generic 12px capsule fields.
- No unnecessary cards or nested bordered boxes.
- Pills only for filters/status/selections.
- Three structural surface levels.
- Consistent 4/6/8px radius semantics.
- Clear light and dark surface hierarchy.
- English and Arabic parity.
- Correct RTL order and bidi isolation.
- Keyboard-visible focus.
- Focus not obscured.
- Status is never color-only.
- 3:1 meaningful non-text contrast.
- 4.5:1 normal text contrast.
- Responsive reflow at 400% zoom.
- Reduced-motion behavior.

# 14. Functional regression protection

The redesign must not change:

- Data queries.
- Record visibility.
- RLS behavior.
- Status transitions.
- Permission checks.
- Immutable snapshot rules.
- Review-decision rules.
- SLA calculations.
- Dashboard formulas.
- Offline queue behavior.
- Evidence custody.
- Submission behavior.
- Notification semantics.
- Report legal content.

Where a component refactor touches functional code, write or update regression tests before replacing it.

# 15. Testing loop

Continue in a loop:

1. Implement a coherent page family.
2. Run typecheck, lint, unit and relevant integration tests.
3. Start the real application.
4. Validate through the browser.
5. Test English and Arabic.
6. Test light and dark.
7. Test desktop and responsive.
8. Test keyboard.
9. Record screenshots and findings.
10. Correct regressions before continuing.

Do not stop after the first defect or first successful page.

If one route is blocked, document it and continue every unaffected route.

# 16. Required implementation evidence

Create:

- `docs/design-system-v5/IMPLEMENTATION-INDEX.md`
- `docs/design-system-v5/CHANGED-FILE-INVENTORY.md`
- `docs/design-system-v5/COMPONENT-MIGRATION-MATRIX.md`
- `docs/design-system-v5/PAGE-COVERAGE.md`
- `docs/design-system-v5/ACCESSIBILITY-RESULTS.md`
- `docs/design-system-v5/RTL-DARK-RESPONSIVE-RESULTS.md`
- `docs/design-system-v5/PRINT-RESULTS.md`
- `docs/design-system-v5/FINAL-IMPLEMENTATION-REPORT.md`
- Screenshot evidence folder.

The final report must include:

- Repository and branch.
- Starting and final commit SHAs.
- Build result.
- Test result.
- Routes migrated.
- Routes blocked.
- Tokens changed.
- Shared components changed.
- Page-specific changes.
- Number of bordered containers reduced on the principal references.
- Accessibility checks.
- Remaining risks.
- Running URL.

# 17. Minimum implementation screenshots

Before claiming implementation completion, capture at least:

1. Shell desktop.
2. Shell compact.
3. Dashboard light.
4. Dashboard dark.
5. Visit planning.
6. Visits table.
7. Factory dossier.
8. Review workspace.
9. Review confirmation.
10. Report screen.
11. Report Arabic.
12. Report print preview.
13. iPad home landscape.
14. iPad home portrait.
15. iPad checklist.
16. iPad evidence.
17. iPad offline/sync.
18. iPad acknowledgement.
19. Admin table.
20. Admin template/rule editor.
21. Admin approval queue.
22. Arabic RTL web.
23. Arabic RTL iPad.
24. 320px/400%-zoom equivalent.
25. Error/partial-data state.

These are implementation evidence. An independent ChatGPT Work visual acceptance audit will run afterward and must not rely solely on these screenshots.

# 18. Completion gate

Do not state “implemented” until:

- The application is running from the implementation branch.
- All reachable page families have been migrated or evidenced as blocked.
- Build and tests pass.
- Dates are Riyadh-correct.
- English/Arabic and light/dark have been checked.
- Web, iPad and admin use their correct density.
- Report and print fixtures pass.
- No P0 accessibility defect is known.
- The screenshots show the actual application, not reference HTML.

End with exactly one status:

- `SAQEEL V5 IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT VISUAL ACCEPTANCE`
- `SAQEEL V5 IMPLEMENTATION CONDITIONALLY COMPLETE — LISTED BLOCKERS REMAIN`
- `SAQEEL V5 IMPLEMENTATION BLOCKED — APPLICATION NOT READY`

Do not merge into `setup/Inspection` during this task.
