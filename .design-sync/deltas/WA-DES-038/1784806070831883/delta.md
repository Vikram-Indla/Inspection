# Design-vs-Code Delta — SAQEEL Profile (pilot)

1. **Design reference:** `SAQEEL Profile.dc.html`, project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`, etag `1784806070831883`, governed design ID `WA-DES-038` (`product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv`).
2. **Mapped application route:** `/profile` → `apps/web/src/app/(app)/profile/page.tsx` (single file, no children).
3. **Current application evidence:** Full source read this session (see below); not runtime-verified via browser this pass (out of the narrow connection-proof scope — would require Chrome/Playwright, a Step-outside-scope action).

## Exact visual differences
- Design renders full page chrome (sidebar, top header) inline in the mockup; code correctly delegates chrome to the shared `<Shell>` component instead of duplicating it — **not a defect**, this is exactly what `WEB_ADMIN_SHELL_AUTHORITY.md` requires ("production navigation uses real Shell... never prototype markup").
- Four content sections match 1:1 by heading and order: Personal details → Language & appearance → Notification preferences → Session & security. No section added/removed/reordered.
- Design's "Save preferences" + "Enable push on this device" sit as two buttons in a row; code implements them as two separate components (`NotificationPrefsForm`'s own save button, then `PushOptIn` below it as its own block) — same content, different micro-layout. Low visual impact.

## Exact behavioural differences
| Design | Code | Classification |
|---|---|---|
| Personal details are hardcoded fixture values (`Ibrahim Al-Qahtani`, `inspector@mim.gov.sa`, `Eastern`, `inspector`) | Real query: `profiles` table (`full_name, email, region, org_scope`) + `getUserRoles(user.id)` | **NO ACTION** — code is already correct; fixture was never meant to ship |
| Language toggle is a static button showing `العربية` | Real link toggling `locale` cookie via `/locale?set=en\|ar`, label flips to show the *other* language (correct UX pattern) | **NO ACTION** |
| Theme toggle uses local mock `this.state.theme`, resets on reload | Real `<ThemeToggle>` component, persisted to browser (matches design's own caption "Theme preference is saved to this browser") | **NO ACTION** — code already matches the *intent* of the design's caption; design's own interactive mock just doesn't persist because it's a static prototype |
| Notification prefs: 3 checkboxes, all hardcoded `checked`, one generic "Save preferences" button | Real `NotificationPrefsForm` bound to `notification_preferences` table (`push_enabled, sms_enabled, email_enabled`), real save/saving/saved states | **NO ACTION** |
| No push-permission states in design beyond a static "Enable push on this device" button | Code's `PushOptIn` implements 4 real states: enabling / enabled / unsupported / denied, each with real copy | **NO ACTION** — code covers real-world cases the static mockup can't represent |
| RTL directionality: design applies no explicit `dir="ltr"` wrapping to Latin-script values in table rows (email, dates, role keys) | Code wraps every Latin-script value in `<bdi dir="ltr">`, with an explicit comment describing this as a **correction** of a value/label-reordering bug seen in an earlier build, consistent with the same convention used elsewhere in the app | **DESIGN MUST CHANGE** — the mockup should be updated to reflect the `bdi/dir=ltr` pattern so it stops representing a known-bad RTL layout as canonical |
| Session dates are hardcoded (`2026-07-21 08:02` / `20:02`) | Real JWT claims (`iat`/`exp`) via `supabase.auth.getClaims()`, formatted per locale | **NO ACTION** |
| "Sign out" rendered as a `<button>` in design | Rendered as an `<a href="/signout">` in code — same visual treatment (`btn btn-ghost`), different semantic element | **NO ACTION** — anchor is arguably more correct (navigates), not a regression |

## Missing components
None. All four design sections have a corresponding, more-complete code implementation.

## Missing wiring
None found in this page. (Not exhaustively runtime-tested — see "Blocked/unverified" below.)

## Existing code not represented in the design
- `<bdi dir="ltr">` RTL-correction pattern (see table above).
- Real push-permission state machine (`enabling`/`enabled`/`unsupported`/`denied`) — design only shows the static "enable" button, no error/unsupported states.
- The `editNote` copy in code ("no self-service identity or role changes") is present in both design and code, near-verbatim — code is not inventing new policy text, just wiring it to real data.

## Design expectations not supported by code
None found — every design element has a real, working (per source-code read) counterpart.

## Files likely affected (if Option "DESIGN MUST CHANGE" is approved)
None in the application — only `SAQEEL Profile.dc.html` in the Claude Design project itself would change, to align its RTL row-value markup pattern with the shipped `bdi/dir=ltr` convention. **No application file is proposed for change.**

## Backend or API implications
None. `delta_class` in the governed map already records this page as `CURRENT_BACKEND_PRESERVED_NEW_FRONTEND` — confirmed consistent: code already uses real backend (`profiles`, `notification_preferences`, `roles` via RLS-scoped queries), nothing here proposes touching it.

## Recommended action per difference
All behavioural differences: **NO ACTION** (code is already correct and, in several cases, more complete than the static mockup). One item: **DESIGN MUST CHANGE** (RTL/`bdi` convention should be reflected in the Claude Design page so the design stops depicting a known-corrected bug as current).

## Blocked / not verified this pass
- No live browser/Playwright verification was run (out of this session's narrow connection-and-tracking scope) — the above is a static source-vs-source comparison, not a proven runtime match. Flagged, not silently assumed passing.
