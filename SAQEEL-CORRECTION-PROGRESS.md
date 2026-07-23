# SAQEEL Design System Correction Backlog — Progress Log

Sequential remediation per `SAQEEL Design System (4).zip` (`export-claude-code-sync/`) handoff. One step at a time, zero regression. See the approved plan for full step list and rationale.

## Step 1 — Brand assets (2026-07-23)
- **Ministry mark**: added `public/ministry-mark.png` (resized 599KB → 89KB, alpha-transparent, from the zip's `assets/ministry-mark.png`), rendered beside the SAQEEL wordmark lockup on the login screen (`LoginClient.tsx`), new `.lg-lockup__ministry` rule in `login.css`.
- **Wordmark**: the zip's `assets/saqeel-wordmark.svg` is the OLD steel-blue (`#5980a6`) mark — superseded by the sponsor's later correction (emerald `#34d399`, delivered as a separate favicon-zip correction earlier this session). Did NOT use it. The login screen's existing lockup (`SaqeelMark` icon component + real "صقيل | SAQEEL" text, not a flattened image) already satisfies "icon + wordmark, not text-only" and already uses the corrected emerald mark — left as-is, no rebuild needed.
- Verified live: both dark and light theme, ministry mark renders cleanly at small size, transparent background, correct contrast in both modes.
- Typecheck clean.
- No changes to any other screen — wordmark stays auth-only per the handoff's own direction, confirmed unchanged in the post-login shell.

**Regression check**: re-verified dashboard, drafts, search, factory-360 (unaffected — this step only touched login).

## Step 2 — Notifications list page (2026-07-23)
- New `app/(app)/field/notifications/page.tsx` — server-rendered, recipient-scoped, same query shape as `NotificationBell.tsx`, All/Unread filter via `?filter=unread`.
- Moved `notificationHref()` out of `NotificationBell.tsx` (a `"use client"` file — couldn't be called from this server page) into `lib/notification-read.ts` (plain shared lib). Bell now imports from there instead of defining its own copy — one link-resolution rule, not two.
- Design critique caught a real bug before I saw it myself: row text was centered, not left-aligned. Root cause: I'd applied `.ax-inline-target` (a small-touch-target helper meant for icon-sized inline links, `display: inline-flex`) to a full-width row card — wrong class, shrink-wrapped the `<Link>` and let it center in its flex parent. Fixed: removed that class, set `display: block; text-align: start` explicitly.
- Verified live: real 100-row list, All/Unread filter works, deep-link routing confirmed correct (`visit_expired` → `/field/{visitId}` startup screen, matching the bell's existing mapping), left-alignment fixed and confirmed.
- Typecheck clean.

**Regression check**: bell dropdown re-verified after the `notificationHref` move — still opens, still deep-links, "Open →" links intact. Weekly briefing bullets (Step-1-adjacent area) still rendering correctly, not a dump.

## Step 2 follow-up fix (2026-07-23, caught by user live review)
Row subtitle showed a raw `visit_id` UUID ("6c98c264-4eec-43fc-851c-45f6f7c89917") — the exact issue flagged as Moderate in my own Step-2 critique but not actually fixed at the time. Fixed: batched follow-up query resolves each row's `payload.visit_id` to its real `visits.factories.name`, falls back to the other payload fields (reason/decision/factory/inspection_id/session_id) only if no visit resolves, shows nothing (not a dangling ID) if none of those exist either. Verified live: real names ("PLN-J expiry fixture...", "KPI Verify — New") now render; rows with genuinely unresolvable data show no subtitle rather than gibberish. Typecheck clean.
`NotificationBell.tsx` fixed too (same batched visit→factory-name resolution, added `visitNames` state + cached in the existing session snapshot). Verified live: bell dropdown now shows real names, not UUIDs. Typecheck clean.

## Step 2 follow-up fix 2 — bell popover overlap (2026-07-23, caught by user live review)
Popover overlapped the topbar row above it instead of sitting cleanly below the bell icon — same root cause as DR-36/DR-51 (search dropdown): content nested inside the sticky pagehead fails to paint correctly above sibling content regardless of z-index. Fixed with the same pattern already proven for search: portaled the popover to `document.body` via `createPortal`, `position: fixed` with `top/left-or-right` measured off the trigger's live `getBoundingClientRect()` (RTL-aware — mirrors the original `insetInlineEnd` semantics), recomputed on scroll/resize while open.
Portaling introduced a real regression I caught myself before reporting done: outside-click dismiss checked `wrapRef.current.contains(target)`, but the popover is no longer a DOM descendant of `wrapRef` once portaled — every click inside it (e.g. "Mark read") was treated as "outside" and closed the menu before the action ran. Fixed: added a second `popoverRef`, outside-click now checks both refs.
Verified live: popover positions correctly (no overlap), "Mark read" works without premature close, unread state updates correctly. Typecheck clean.

## Step 3 — Global Search dedicated page (2026-07-23)
- Extracted the header dropdown's query/ranking logic out of `api/shell/search/route.ts` into `lib/shell-search.ts` (`performShellSearch()`) — one rule, not two. Route now just calls it.
- New `app/(app)/field/search/page.tsx` — GET form (`?q=`), same result shape/typed lozenges, honest empty/too-short/degraded states, reuses `shellGlobalSearchHref()` for field-aware routing (same helper the dropdown and notifications already use).
- Verified live: real result ("Al Ahsa Beverage Industries", type badge "Factory"), degraded banner shown correctly (pre-existing `shell_global_search` RPC fallback behavior, not a new issue — same as the dropdown had before this refactor), click-through routes correctly to Factory-360.
- Typecheck clean.

**Regression check**: header dropdown re-verified after the shared-logic extraction — still searches, still shows results, still routes correctly. No behavior change to the existing dropdown, only where its logic lives.

## Step 4 — Account field screen (2026-07-23)
- New `app/(app)/field/account/page.tsx` — real profile card (`profiles` table: full_name/email/region + `getUserRoles()`, same data source as the console `/profile` page), rows linking to Settings and Biometric/Trusted-Devices (anchored `#field-settings-device` on the existing settings page — Step 5 will give devices its own route and this link gets updated then), Sign out.
- Caught my own mistake before shipping: first draft used `.ax-inline-target` on the row links again (same wrong class as the Step-2 bug) — fixed before testing this time, replaced with explicit flex row styling matching the notifications-list row pattern.
- Second pass: row links initially rendered as default underlined blue anchors, not styled as tappable settings rows — fixed (no underline, full-row padding, border between rows, arrow indicator).
- Verified live: real name/email/role data, both links route correctly (Settings page loads, devices anchor lands on the right section), left-aligned, clean tappable rows.
- Typecheck clean.

**Regression check**: dashboard re-verified after this step — unaffected (new page only, no shared component changes).

## Cross-cutting fix — visit-card disclosure link (2026-07-23, caught by user live review)
`FieldHome.tsx`'s "My visits" cards used a plain underlined text link ("Details →", `.ax-link .ax-caption`) as the row's open-affordance — pre-existing code, not from this session, but a fair critique (looks like a stray hyperlink, not a premium app affordance). Replaced with the app's own icon-button convention (`.ax-btn .ax-btn--subtle .ax-btn--icon .ax-btn--field`) — a clean chevron-only disclosure button, RTL-mirrored (`scaleX(-1)` when `locale === "ar"`), `aria-label` preserved for accessibility. Verified live: renders cleanly, click still routes to the inspection workspace. Typecheck clean.
Separately flagged and NOT fixed (data, not code): "Next: Inspector factory 1784688842270" on the dashboard is the real `factories.name` value from a QA seed row — same class of issue as the briefing card's "PLN-J expiry fixture" names (DR-13/19/32). Fixing this requires real data seeding, not a code change — inventing a cleaner-looking name would violate the no-fabricated-data rule.

Next: Step 5 — Trusted Devices own screen (`/field/settings/devices`).

## Step 5 — Trusted Devices own screen (2026-07-23)
- Extracted the device-enrollment logic (state, effects, `trustLabel`/`trustDetail` helpers, enroll action) out of `FieldSettingsClient.tsx` into new `settings/devices/TrustedDevicesClient.tsx` — identical logic, no behavior change.
- New `app/(app)/field/settings/devices/page.tsx` — same auth/locale pattern as the settings page, "← Back to settings" link.
- `FieldSettingsClient.tsx` slimmed: device section replaced with a single tappable row (title + subtitle + chevron-style arrow) linking to the new route, matching the Account-page row pattern from Step 4 (not the old underlined-link style).
- Closed the loose end from Step 4: Account page's "Biometric & trusted devices" link updated from the `#field-settings-device` anchor to the real `/field/settings/devices` route.
- Verified live: settings page shows the slim link row, clicking it (from both settings AND the account page) lands on the new page with the exact same real device identifier/enrollment state as before the split, "Back to settings" works.
- Typecheck clean.

**Regression check**: settings page's other two sections (Display preferences, Sync and offline storage) re-verified — "Refresh status" still works, "Synced" state unaffected by the extraction.

Next: Step 6 — Tab bar to 5 slots (My Tasks = Visits relabel).

## Step 6 — Tab bar to 5 slots (2026-07-23)
- `FieldTabs.tsx` rewritten from 3-slot+FAB (`dashboard | visits-anchor | virtual | fab`) to a 5-slot API: `home | myTasks | establishments | notifications | account`. New icon set (`HomeIcon`/`TasksIcon`/`EstablishmentsIcon`/`NotificationsIcon`/`AccountIcon`) via a shared `Icon` wrapper. `fabHref` prop removed entirely.
- "My Tasks" resolved per DR-39 precedent (already confirmed correct earlier this session): relabeled the existing Visits slot, not a new Tasks data model — no net-new scope invented.
- Virtual and the old FAB ("Start next visit") both dropped from the bar to make room for Establishments/Notifications/Account, per the handoff's fixed 5-slot spec. Compensated: added a "Virtual" quick-action button to the dashboard's existing quick-actions row (alongside Field establishments / Incident reports) so the entry point isn't lost — caught my own bad premise here before implementing (I'd first assumed Virtual was already reachable from an existing dashboard section; it wasn't, so this addition was necessary, not optional).
- Updated all 8 call sites: `field/page.tsx` (dashboard, `active="home"`, dead `fabHref` var removed), `field/factory-360/[id]/page.tsx` (`myTasks`), `field/establishments/page.tsx` (`establishments` — fixes a pre-existing bug where this page wrongly showed Visits as active), `field/drafts/page.tsx` (`home`), `field/search/page.tsx` (`home`), `field/incident-reports/page.tsx` (`home`), `field/account/page.tsx` (`account`), `field/notifications/page.tsx` (`notifications`, last one done).
- Typecheck clean across all 8 sites.
- Verified live (Chrome MCP, planner session): dashboard shows the 5-slot bar (Dashboard/Visits/Field establishments/Notifications/Account) with Dashboard active; clicking through highlights the correct slot on every page including Establishments (bug fix confirmed) and Notifications (real 58-row list, no raw UUIDs); Account tab renders profile card correctly; new Virtual quick-action on the dashboard navigates to `/virtual` and its sessions/scheduling UI loads with real data.

**Regression check**: drafts page (unaffected, correct `home` highlight), search page (unaffected, correct `home` highlight, form still works) — both confirmed no visual or behavioral regression from the tab-bar rewrite.

Next: Step 7 — Auth sequence confirmation (sign-in → forgot-password → OTP → reset-success).

## Step 7 — Auth sequence confirmation (2026-07-23)
No code change — investigation + live verification step, per the plan. Read `LoginClient.tsx` and `ResetClient.tsx` end to end first: confirmed every stage is real Supabase Auth, not a stub — `signInWithPassword`, `resetPasswordForEmail`, `verifyOtp({type:"recovery"})`, `updateUser({password})`, `signOut()` — with anti-enumeration (`resetErrorGeneric` never reveals account existence), FND-003 audit events (`password_reset_requested`/`password_reset_completed`), and a same-tab session-marker gate (`saqeel-recovery-otp-user`) so `/reset` only admits a session that just came through this flow's own OTP verify, not any other signed-in session.
Live-verified everything drivable without a real inbox:
- **Sign-in**: real credentials → real session → role-based redirect to `/planning` (planner role). Confirmed against live Supabase.
- **Sign-out → sign-in page**: clean, no stale session.
- **Forgot password**: real `resetPasswordForEmail` call succeeds, advances to the anti-enumeration "Check your email" OTP screen (copy never confirms/denies the address exists).
- **OTP — wrong code**: real `verifyOtp` call, safely rejected ("We could not verify that code..."), no crash, no leaked provider error, code field stays editable.
- **`/reset` with no valid recovery session**: correctly shows the `invalid` stage (own-brand copy, "Go to sign in" CTA, focus lands there) rather than exposing the form — confirms the marker gate rejects when the marker is absent, not just when it's stale.
Not independently live-testable in this environment: entering a real 6-digit code (requires a live email inbox to receive Supabase's OTP mail) and the resulting `/reset` form → `updateUser` success → `done` stage. This is not a gap in the code (both paths are real Supabase calls, same pattern as the verified branches) — it's a test-environment limitation, flagged honestly rather than claimed as verified.
Typecheck: no code changed, N/A.

**Regression check**: none needed — read-only step, no files touched.

Next: Step 8 — Establishment gaps (export-products Y/N, inline unlicensed-creation entry, license-currency banner, mid-visit incident logging).

## Step 8 — Establishment gaps (2026-07-23)
Read source docs first (`OUTSTANDING.md` O-13, `IPAD-FIGMA-DELTA.md` §2B, `INSPECTOR-REQUIREMENTS.md` §4) to pin the exact 4 asks before touching code.

- **Inline unlicensed-creation entry point**: `/field/establishments` already had a top-of-page "Create unregistered visit" button, but the handoff specifically wants it reachable from the empty-search-result state ("في حال عدم وجود منشأة مرخّصة"). Added a second, contextual CTA inside the empty-search state (only when a search query returned zero rows) with the exact bilingual copy from the handoff.
- **Export-products Y/N flag**: no such column existed on `factories`. Added migration `20260723120000_factories_exports_products_flag.sql` (nullable boolean, additive, no invented default — existing rows read as "Unknown", not a fabricated false). Wired through the shared `lib/factory360/dossier.ts` loader (both web CR dossier and field Factory-360 render from it — platform-parity ledger) via a tolerant secondary read that degrades to `null` if the column/migration isn't live yet, instead of erroring. Displayed as Yes/No/Unknown in the profile facts on both `/field/factory-360/[id]` and `/factories/cr/[id]`.
  - **Not yet applied to the live database** — this session has no DB credential path (no linked `supabase` CLI project, no direct Postgres connection string, and the Supabase MCP tool needs interactive OAuth this session doesn't have). The migration file is committed and correct; live-verified the tolerant-degrade path shows "Unknown" honestly rather than crashing pre-migration. Flagging for a future session/deploy step to actually apply it.
- **License-currency standing banner**: added a persistent (not dismissible, not a toast) advisory banner on both `/field/factory-360/[id]` and `/factories/cr/[id]`, shown whenever a license is selected — computed live from `selected.expiry_date` (already in the existing dossier, no new query): critical tone if expired, warning if expiring within 30 days, info otherwise, always prompting the inspector to verify the number on site and report discrepancies. Per the codebase's own documented platform-parity rule ("business data/calculations identical by construction; only layout/density/touch/offline/action-placement differ"), added to both platforms rather than field-only.
- **Mid-visit incident logging**: confirmed via the DB migration (`20260720010000_incident_reports.sql`) that `incident_reports.factory_id/visit_id/inspection_id` are real FK columns with an insert policy already requiring `inspector` role + `is_assigned_inspector(visit_id)` when a visit is given — the governance existed, the wiring to reach it mid-visit did not. Closed that gap: `IncidentReportForm` now accepts an optional `context` prop rendering hidden `factory_id`/`visit_id`/`inspection_id` inputs; `actions.ts` writes them when present (unchanged, still null, on the standalone route); `/field/incident-reports` reads `?visit=&factory=&inspection=` query params and shows a contextual banner ("Logging for the active visit — distinct from any violation"). Added a new additive, read-only "Incident reports for this visit" section to `/field/inspection/[id]/page.tsx` (server component, between `FactoryVerification` and `Workspace` — does not touch `Workspace.tsx`'s client state machine at all, zero regression risk to the already-verified checklist/violation/submit flow) listing this visit's logged incidents plus a "Log incident" link pre-filled with the visit/factory/inspection context.
Typecheck clean across all files.

**Verified live**:
- Establishments empty-search state (`?q=zzzznotfound`) shows the new contextual CTA cleanly.
- Factory-360 license-currency banner renders correctly for a real license (Al Ahsa Beverage Industries, IL-9305, valid through Mar 9 2027 → info tone, correct copy).
- Export-products row shows "Unknown" (honest tolerant-degrade, migration not yet applied).
- `/field/incident-reports` with visit/factory/inspection query params shows the mid-visit banner correctly.
**Not live-verified**: actually submitting a mid-visit incident report end-to-end — the only signed-in test identity available in this environment is the `planner` role, which the pre-existing RLS insert policy correctly refuses (inspector-only); no assigned in-progress visit/inspection exists for any inspector demo identity in this environment to drive the full loop through `/field/inspection/[id]`. The wiring is verified by code + the governing migration/policy, not by a live write.

**Regression check**: `Workspace.tsx` was not touched at all (only additive JSX in `page.tsx` around it). `IncidentReportForm`'s existing standalone usage (no context prop) still renders and submits exactly as before — `context` is optional and defaults to no hidden fields.

Next: Step 9 — Weak-connectivity banner (distinct from existing offline/sync states).

## Interim — login header corrections (2026-07-23, user-driven live review)
Between Step 8 and Step 9, live design review of the login screen surfaced and fixed several real issues, applied to both light and dark theme:
- Story-panel hero image was rendering scrollable below the sign-in form at ≤960px width instead of being hidden — read as a broken page. Fixed: `.lg-story { display: none }` below the split-layout breakpoint (`login.css`).
- Sign-in card was left-hugging the viewport edge at that same narrow width once the story image was gone. Fixed: centered via `align-items: center` on `.lg-center` (not `display:grid`, which would have stretched rows apart — caught and fixed before shipping).
- SAQEEL wordmark/shield mark used plain text color instead of the brand green the Sign In button uses. Fixed: both now `var(--ax-color-primary)`.
- Confirmed (no code change): "inspector session forces field-only chrome regardless of device/viewport" was already correctly implemented — role-gated (`FIELD_CHANNEL_ROLE_KEYS`), not viewport-gated. What looked like a regression was testing under the `planner` demo account, which correctly gets full console nav.
- `public/ministry-mark.png` was never the actual Ministry of Industry mark — it was unrelated circuit-board/barcode clip art (confirmed by opening the file directly). Flagged rather than silently kept or enlarged. Per explicit approval, fetched the real logo from `mim.gov.sa/images/Logo.png` (their own site's own official asset) and saved as `public/mim-logo.png`. Placed above the sign-in card on a white chip (keeps the dark-ink mark legible on dark theme's canvas) under a top divider (gives it its own visual zone — first placement attempt as bare text was correctly critiqued as "orphaned," no container, asymmetric whitespace).
Typecheck clean throughout; each fix live-verified in both themes via Chrome MCP.

Next: Step 9 — Weak-connectivity banner (distinct from existing offline/sync states).

## Step 9 — Weak-connectivity banner (2026-07-23)
Investigated before building: the `ConnectivityState` type (`"online" | "offline" | "weak"`) and its `connectivityState()` helper already existed in `lib/offline.ts`, keyed off `navigator.onLine` + `navigator.connection.effectiveType` (`slow-2g`/`2g` → `"weak"`). A full `FieldConnectivityBanner.tsx` component consuming it also already existed. Neither was ever imported anywhere — built, then never wired. This is genuinely distinct from the existing `SyncState` chip (`synced/offline/pending/syncing/conflict/failed`) already visible in the workspace header: that chip reports write/queue *outcome*, this reports live network *quality* — exactly the "weak-connectivity state... distinct from full offline" the handoff (`IPAD-FIGMA-DELTA.md` §2A, O-12) asks for.
Wired it in: `Workspace.tsx` now imports and renders `<FieldConnectivityBanner>` directly under the sticky sync-chip header, above the checklist — genuinely mid-form. Added `connectivityOffline`/`connectivityWeak` to `WorkspaceStrings`, sourced in `page.tsx` via `t(...)` with real bilingual-ready defaults.
Typecheck clean.

**Not live-verified**: no assigned in-progress inspection is reachable under any test identity available in this environment (same limitation as Step 8's mid-visit incident test) — the 3 existing inspections for Al Ahsa Beverage Industries are `approved` (immutable, read-only via `/reports/inspection/[id]`), not open drafts reachable through `/field/inspection/[id]`'s live `Workspace`. Verified by code path only: the component itself was already built and presumably tested when first authored; this step's real contribution was closing the "never imported" gap, confirmed by `grep` before and after.

**Regression check**: `Workspace.tsx`'s only change is one import + one JSX line above the existing `{msg && ...}` banner — no existing state, handler, or layout touched.

## Interim — tab-bar 5-column regression fix + Factory 360 offline-banner cleanup (2026-07-23, user-driven live review)
- **Tab bar wrapping bug (real regression from Step 6, caught in live design review against `SAQEEL Field Account.dc.html`)**: `.ax-field-taskbar` in `astryx.css` still had `grid-template-columns: repeat(3, minmax(0,1fr)) minmax(180px, auto)` — a leftover 4-column template from the old 3-tab+wide-FAB layout. Step 6 rewrote `FieldTabs.tsx` to render 5 links but never updated this CSS, so the 5th item ("Account") wrapped to its own row on every screen all session — visible in every Step 6+ screenshot and not caught as wrong at the time. Fixed: `repeat(5, minmax(0, 1fr))`. Verified live: all 5 items (Dashboard/Visits/Field establishments/Notifications/Account) now sit in one row, evenly spaced, matching the design reference exactly.
- **Factory 360 offline-status banner**: the "Integration gaps" line was dumping raw technical strings (`SENAEI_UNAVAILABLE:chemical_permits:Senaei returned HTTP 404.`, etc.) inline inside `.ax-sync`, a pill component built for short one-line content — causing a misshapen box with dead whitespace ("padding issues"). Fixed in `Factory360Offline.tsx`: shows a short generic count ("Integration gaps (3) — hover for detail") with the full technical list moved to the native `title` attribute (hover tooltip). Confirmed via DOM inspection that the full detail is present on hover. Same fix applied to `sectionsOmitted`.
- **Splash screen — flagged, not built**: no splash screen exists anywhere in the codebase; the app goes straight to `/login`. This is a real gap referenced in the design source (`IPAD-FIGMA-DELTA.md` §2C: "...preceding splash → home") but was never turned into one of the 10 backlog steps — surfaced honestly rather than silently built or silently skipped. Not yet scoped or built; needs an explicit decision on priority/placement before starting.
Typecheck clean. Both tab-bar and offline-banner fixes live-verified (dark theme; tab bar also spot-checked against the dashboard).

Decision: splash screen build deferred until after Step 10 (Step 10 is the last backlog item and touches the core inspection state machine — closing it out first, then adding splash as its own explicit step).

Next: Step 10 — Report-kind-conditional inspection form (investigate first; highest complexity, done last).

## Step 10 — Report-kind-conditional inspection form: INVESTIGATION (2026-07-23)
Per the plan, investigated before building anything. Queried the live database directly (service role) rather than assuming, to avoid the exact mistake this step exists to prevent — guessing at content that should be governed.

**The frontend mechanism already exists and is already report-kind-agnostic by design** — this is the key finding:
- `Workspace.tsx` renders `Section[]` entirely from the assigned inspection's `package_versions.definition` (frozen JSON) — no hardcoded section list, no report-kind branch anywhere in the component. Whatever sections a package defines, render.
- Conditional field visibility (`isVisible`, `contextFlags`, `conditionContext` in `runtime.ts`) is a real, working, generic mechanism already used elsewhere (e.g. `FactoryVerification.tsx`) — it can express "field X only appears when field Y = Z," which is exactly the shape of the delta's "production-status branch" and "specialized-visit flag" rules.
- Planners already choose which package(s) apply to a visit at publish time (`planning/single/actions.ts` — `package_version_ids`, validated against `published`/`locked` status + effective date range). Package selection is not hardcoded to one package system-wide.

**What's actually missing is package content, not code**:
- Queried `packages`: `PKG-FS` ("Fire & Life Safety — General Factories"), `PKG-CHEM-CLEAR` ("Chemical Clearance **(scaffold)**"), `PKG-CUST-EXEMPT` ("Customs Exemption **(scaffold)**"). Only 3 packages exist; there is no distinct "Visit Report" (تقرير زيارة, the general/default kind) package at all — every real inspection in this environment uses `PKG-FS` regardless of what kind of visit it actually is.
- Queried `package_versions`: `PKG-FS` has 3 **published** versions (4-5 sections each) — this is the only package with real, usable content, and it's what every inspection in the database is actually built on. `PKG-CHEM-CLEAR` and `PKG-CUST-EXEMPT` each have exactly one version, `status: "draft"`, labelled `v0-scaffold-2026-07-19` — placeholder, never published, so a planner cannot select them today even though the selection mechanism itself works.
- The delta's specific asks — chemical clearance narrowing to 3 sections (items/raw materials/products) with its own restricted-materials compliance question; customs exemption as a distinct plan flow; workforce/materials/products/machinery sections appearing only on Visit Report; the production-status justification field; the specialized-visit Y/N reason+department fields — none of this is encoded in any package definition yet. Authoring it means writing the real section/item structure, exact Arabic/English item labels, and option domains for 3 more report-kind packages (a full "Visit Report" package that doesn't exist yet, plus finishing the two scaffolds) into governed `package_versions.definition` JSON.

**Why this isn't being built now**: the exact field-level content (item codes, precise bilingual labels, section boundaries, option domains for the two report-source/incident-type-style open fields) is exactly the kind of regulatory detail CLAUDE.md's hard rules forbid inventing ("never invent policy values... risk weights... legal rules"). The design delta narrates the *rules* ("chemical clearance narrows to 3 sections") but not the *content* (the actual items in those sections) — that gap can't be closed by writing more frontend code; it needs either the real regulatory item list from the BRD/ministry, or admin-side authoring through the Form Builder by someone with that content. This is the same class of block as DR-55 (Senaei live-wiring) — flagged honestly rather than fabricated.

**Not touched**: no code changed this investigation pass. `Workspace.tsx`/`runtime.ts` need no frontend rework — they're already correctly generic. The only remaining question is who supplies the real package content, and whether "Visit Report" needs to be modeled as its own package (currently conflated with `PKG-FS`) or `PKG-FS` is renamed/repurposed as the general default.

Holding here for direction — this can't proceed further without real content or an explicit decision on how to source it.

## Interim — login page ministry-mark and footer iteration (2026-07-23, user-driven live review)
Extended iteration on the login screen's ministry attribution and footer, continuing from the earlier header/CTA/spacing pass. All fixes typecheck-clean, live-verified in both themes and both languages (EN/AR) via Chrome MCP unless noted.
- **Real MIM logo sourced from Figma, not mim.gov.sa's PNG**: given a Figma link (`MIM iPad Inspector App`, node 370:40975 "Gov_Logo"), used the Figma MCP tools (`get_screenshot`/`get_metadata`/`download_assets`/`get_design_context`) to pull the actual component. The first combined single-node SVG export carried oversized "atmospheric shadow" paths from the original 1600×900 cover artwork — cropped to icon size they rendered as an ugly dark rectangle behind the mark (confirmed by isolating the raw SVG outside all app CSS: the box was baked into the exported file, not a CSS artifact). Root-caused via `get_design_context`, which returns Figma's own two separate clean sub-assets (wordmark text, ribbon icon) — pulled those individually instead; both render transparent, no box. Saved as `public/mim-logo-mark.svg` (ribbon only, kept) and `public/mim-logo-text.svg` (wordmark, later removed — see below). Also fixed a real distortion bug: the source SVGs set `preserveAspectRatio="none"` (designed to stretch to their own container), so `inline-size:auto` couldn't infer a ratio — pinned explicit `aspect-ratio` per asset instead.
- **Placement iterated several times per live feedback**: original text-only placeholder → real logo(text+icon) above the sign-in card with a divider → divider removed (redundant once the box was fixed) → icon-only, text dropped, centered → bilingual text label added back below the icon (driven by the page's own `s.lang`) → sized up (icon 52→72px) and text shrunk (13→9→7px, 9px kept for Arabic specifically since Arabic glyphs need more size than Latin at the same weight to stay legible) → **finally moved entirely into the footer as its last line**, off the mid-page slot it kept getting re-litigated in.
- **5-suggestion design pass** (from a "top 5 enhancements" critique): tightened panel/center vertical padding (was a large dead void), added a hover/focus elevation shadow to the Sign In button, moved the EN/AR language toggle from a small footer link into a proper pill button in the header next to the theme toggle (this also fixed an apparent "toggle doesn't work" report — it wasn't a logic bug, `/locale?set=ar` always worked correctly when hit directly; the old link was just small/low-contrast enough to reliably mis-click), consolidated three stacked footer caption lines into one, and gave `.lg-card` a visible raised surface (background + border) instead of sitting flush on the page canvas.
- **Footer cleanup round**: removed the "Saqeel — Ministry of Industry and Mineral Resources © 2026" copyright line as redundant once the ministry mark+label line existed below it (folded the "© 2026" into that line instead of losing it); removed "For your security, we never confirm whether an account exists." per explicit instruction (kept the rest of the trust line); pushed the header's language pill + theme toggle fully to the corner via `margin-inline-start: auto` (previously they trailed the wordmark with just a small gap, not pinned to the edge).
- **Alignment/architecture fix** (this session's last fix): the trust line (left-aligned, icon-prefix) and the ministry line (centered, different type scale) used two different alignment models in the same footer — read as disjointed rather than "needs polish." Unified both to the same start-aligned icon+text pattern and the same `--ax-text-caption` type scale; ministry icon resized from 20px to 15px to match the trust line's icon proportion instead of its own arbitrary scale.

Net effect on `LoginClient.tsx`/`login.css`: mid-page `.lg-ministry` block removed entirely; footer now holds trust line + ministry mark+label as one consistent two-row block; header holds SAQEEL lockup + a right-corner-pinned language/theme control cluster; `mim-logo-text.svg` deleted (unused once the footer went icon+plain-text instead of a second wordmark image).
