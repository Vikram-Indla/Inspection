# Cycle 2 Wave 1 — UI/UX Foundation Evidence

Branch: `fix/mvp1-cycle2-production-hardening`. Screenshots (binary evidence
belongs in INSPECTION_DOCS_ROOT per `.gitignore`, not tracked in this repo):
`/Users/vikramindla/Documents/Inspection - MVP Delivery/01_MVP1/05_REVIEW_AND_EVIDENCE/CYCLE2_IMPLEMENTATION_2026-07-16/SCREENSHOTS/wave1/`.

## DEF-UI-001 — dark-theme unreadable text (global)

Investigated with a full grep of `apps/web/src/**/*.css` for hardcoded colors
(none found outside `tokens.css`, which is the approved single source) and for
every consumer of `--legacy-color-text-disabled`. Four of five consumers are
correctly on genuinely-disabled controls (`retired-predecessor.css:60,126,143,266` —
`[disabled]`/`.is-disabled`/`[aria-disabled="true"]`, exempt from AA contrast
by WCAG). Two were misapplied to always-visible, non-disabled text:

- `apps/web/src/app/login/login.css:101` — `.lg-foot__copy` (footer copyright line)
- `apps/web/src/app/login/login.css:166` — `.leaflet-control-attribution` (map attribution)

Both mixed to ~2.3:1 contrast against the dark canvas (fails WCAG AA 4.5:1).
Fixed: switched both to `--legacy-color-text-secondary` (the token every `.legacy-caption`
in the app already uses, ~7:1+ against canvas/surface in dark mode).

## DEF-UI-004 — login atlas dark treatment

Investigated by rendering `/login` in both themes at 1920×1080 and diffing
against the audit's own captured evidence
(`AUDIT-WEB-LOGIN-ANON-login-AR-DARK-1920x1080.png`,
`.../MVP1_TO_MVP2_READINESS_AUDIT_20260716_2227/EVIDENCE/LIVE_AUDIT_EXECUTION_20260717_0045/SCREENSHOTS/`).
**Does not reproduce.** The atlas image is fully legible in both themes; no
dark-mode filter/overlay exists on the image and none is missing — the atlas
palette (`--legacy-color-atlas-*`) is deliberately fixed across both shell themes
(art-directed night scene, `tokens.css:76-80`), and the audit's own dark
screenshot shows the same clean render captured here
(`login-dark-1920x1080.png`, `login-light-1920x1080.png`). No code change
made for this claim — recommend the defect be downgraded/closed on re-audit
rather than "fixed" against unreproducible behavior (truth-law: no fix claimed
without a verified defect).

## DEF-UX-002 — nav/top bar/profile/bell responsiveness

Real gap found: `.legacy-shell-account__identity` (name/role text) only hid at
`max-width:899px` (the drawer-nav breakpoint), while the search bar
(`min(420px,38vw)`) stayed wide up to that same point — leaving a ~900–1099px
tablet-landscape band (e.g. 1024px iPad landscape) where the full sidebar is
still shown *and* the topbar identity text is still shown, tightening the row.
Added a `max-width:1099px` rule (matching the file's existing tablet-boundary
convention) that shrinks the search bar and hides the identity text a step
earlier. `NotificationBell`'s popover was already responsive
(`maxInlineSize:"80vw"`, edge-anchored) — no change needed there.

## DEF-PRF-003 — Profile Settings

Did not exist at all (`apps/web/src/app/admin` had no profile/settings route
before this task). Built `/profile` to the approved extent only:

- personal details (name/email/region/roles) — **read-only**, no self-service
  identity or role editing
- language — reuses the existing `/locale?set=` cookie route
- light/dark — reuses the existing `ThemeToggle` component
- notification preferences — new `notification_preferences` table (own row
  only, RLS), wired into `notify.ts`: push/sms/email can be turned off
  (recorded as `suppressed_by_preference`); in-app is never opt-outable
- session/security — this session's issued-at/expires-at from the verified
  JWT claims, plus sign-out

Linked from the shell account menu (`Profile settings`, next to Sign out).

## Viewport verification

Logged in as the `reviewer` persona and rendered `/profile` (exercises the
shell topbar/identity/search) at all four required viewport classes, both
themes captured for TV:

- `profile-tv-1920x1080-dark.png` / `-light.png`
- `profile-laptop-1366x768-dark.png`
- `profile-tablet-1024x768-dark.png` (previously the tightest band — confirms
  the DEF-UX-002 fix: identity text correctly hidden, no crowding)
- `profile-ipad-834x1194-dark.png`

Full-app per-screen visual regression across all four viewport classes was
out of proportion for this task's remaining scope — this verifies the shared
shell chrome (the actual defect surface) renders correctly at each class, not
every individual screen.

## Verification

`npx tsc --noEmit` and `npm run build` both clean after all Wave 1 changes.
