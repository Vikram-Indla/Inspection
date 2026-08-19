# 2026-08-17 · T-129 — the approved language becomes the system

`task: T-129` · `status: done` · `duration: ~5h`
`rules applied: WEB-000 … WEB-014 (and rewrote WEB-002, WEB-009, WEB-014)`

---

## Goal

Adopt the manager-approved reference as SAQEEL's visual language: retarget the
token sheet, self-host its typeface, rewrite the rules that described the old
language, and delete the experimental parallel system.

## What changed

| File | Action |
| --- | --- |
| `app/saqeel.css` | palette, type scale, radii, elevation, fonts, RTL tracking retargeted |
| `app/layout.tsx` | Inter self-hosted beside Plex; PWA theme colour |
| `src/fonts/inter/*` | 2 woff2 subsets vendored from `@fontsource-variable/inter` |
| `components/sections/admin-planning-expiry/*` (7 files) | created — expiry ported onto SAQEEL primitives |
| `app/(app)/admin/planning/expiry/{page,loading,error}.tsx` | repointed |
| `app/(app)/dashboard/page.tsx` | reverted to the SAQEEL composition |
| `components/experimental/**` (30 files) | **deleted** |
| `apps/web/experimental/*` → `design/linear/*` | design source moved to authority |
| `scripts/check-typography.mjs` | experimental exemption removed |
| `rules/WEB-002`, `WEB-009`, `WEB-014`, `CLAUDE.md`, `README.md` | rewritten to the new language |
| `e2e/design-foundation-contract`, `e2e/ipad-pwa-shell-contract` | 6 assertions re-pointed |

## The decision that made this cheap

**The whole language was replaced by editing one file.** Because 254 files
consume `var(--sqx-*)` and none holds a literal, retargeting the primitives
re-skinned **28 already-migrated routes without one of them being edited**.
`/operations` was verified rendering the new language having never been opened.

That is now written into WEB-002 §1, CLAUDE.md rule 7 and README rule 7 as the
*reason* the no-literals rule exists — it had been justified as tidiness, and it
is actually what makes the system survive a change of art direction.

**SAQEEL is the system; the language is `design/linear/`.** The two are now
separate in the rules, because the language has been replaced once (IRP →
reference) without the system changing at all.

## Decisions

1. **Status is derived and measured, not taken.** The reference calls its green
   and red *"supporting accents, not status colours"* — guidance for a marketing
   site that cannot govern a platform where severity is legally meaningful.
   `success`/`error`/`info` are its accents verbatim; **`warning` and `major`
   were derived** because acid lime cannot be warning — it *is* the primary
   action, so a warning pill would be indistinguishable from a CTA.
2. **The light theme needs its own graphic stop.** Warning and info at full
   strength are 2.25:1 and 2.41:1 on white, under WCAG 1.4.11's 3:1 for a dot or
   bar. `main` is the dark-theme fill, `dark` the light-theme fill. Recorded in
   WEB-002 §7 so it is not "tidied up" later.
3. **Brand 600–950 are neutral, not lime.** `--sqx-text-link` and
   `--sqx-text-accent` point at brand-600, and a text role must resolve to
   something readable. Lime is 1.23:1 on white and no darkened lime stays lime.
4. **`bold` is an alias of `semibold`.** The reference caps at 590 and forbids
   700+, so the token resolves rather than being deleted — 254 consumers.
5. **Arabic tracking is zeroed at the token layer**, in `:root:dir(rtl)`, not by
   a `[dir="rtl"]` override in component CSS (WEB-002 §6 forbids that shape).
6. **`/dashboard` reverted to the SAQEEL composition rather than being ported.**
   Its 32 components were already well-migrated and now render the new language
   for free. Porting would have duplicated them.
7. **`/admin/planning/expiry` was ported, not reverted** — its SAQEEL path never
   existed (`ExpiryAdmin.tsx` is legacy), so reverting would have thrown away the
   structural work: h1, the i18n namespace, the Riyadh date fix, the editor out
   of the table cell.

## Four defects found by measuring, none by a gate

1. **White on acid lime = 1.1:1.** Repointing brand to a *light* colour broke
   every token assuming "brand fill is dark, so ink is white". Selected segments
   were invisible in light mode. Fixed by inking with `--sqx-grey-1000`
   (16.15:1). Light theme went 2 failures → 0 across 90 elements.
2. **Chromatic link text on dark.** `--sqx-text-link`, `-accent`,
   `--sqx-action-tertiary-text` and `--sqx-segment-label` pointed at brand-200
   (pale lime) in the dark block only — so "How is this calculated?" rendered
   lime, breaking the rule written in the same session. Neutralised to grey-300
   (14.26:1). **The light block was already correct, which is why it survived:
   a theme-asymmetric token is invisible unless both themes are measured.**
3. **`design-foundation-contract` pinned the IRP hexes** to guard INSP-702
   (disabled text ≥4.5:1). Re-pointed — but only after **proving the requirement
   still holds** under the new ramp (5.77 light; 4.72 / 5.52 / 6.13 dark) rather
   than just updating the expected values to whatever shipped.
4. **`ipad-pwa-shell-contract` pinned the PWA dark theme colour**, which must
   track `--sqx-surface-canvas`. Found only because the tally read 407 where
   baseline was 408 — "the suite looks green" would have missed it.

## A measurement that was wrong, recorded so nobody repeats it

The contrast scanner reported the selected segment at **1.3:1** in dark and it
was a **false positive**. The lime pill is painted by a **sibling `<span>`**
that slides behind the segment, so walking the *ancestor* chain for a
non-transparent background finds the graphite root and misses the pill entirely.
Checking `::before`/`::after` found nothing either — it is a real element.

**An ancestor walk is not a background test when a design uses a sliding
indicator.** Confirm by querying for the painted colour, not by walking up.

## Numbers

```
tokens retargeted        128 raw values in one file
files re-skinned         254 consumers, 0 edited
routes re-skinned        28 migrated routes, 0 edited
experimental deleted     30 files
Inter                    as-declared 356.27 ≡ Inter 356.27 (Plex 346.16)
status families          5, all AA on tint in both themes, min pairwise dE 30
light-theme failures     2 → 0 across 90 elements
```

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 104 below baseline
- [x] `npm run gates:typography` — PASSED, 115 below baseline, **with the
      experimental exemption deleted**, so expiry now meets the real law
- [x] `npm run check:design-system-v5` — 76, unchanged
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — the exact baseline**
- [x] Rendered and measured: `/operations` (untouched, new language), `/dashboard`
      both themes, the admin access-refusal state
- [ ] axe, 320px, 200% zoom, browser e2e — **owed**

## Retirement

`components/experimental/**` deleted — 30 files, zero importers, verified by
grep across `src/` and `e2e/`. The typography-gate exemption went with it, which
was the condition attached when it was granted in T-127.

`apps/web/experimental/` was **copied** to `design/linear/`; deleting the
original was blocked by the sandbox and is in the handover commands.

## Parked

- `ExpiryAdmin.tsx` (222 lines) now has zero importers and is genuinely dead —
  the trial is over, so the control arm can be retired properly next task.
- `/dashboard` still has **no `h1`** — `Shell` receives `title=""`. Pre-existing,
  and fixing it means touching the shared shell.
- `--sqx-rim-light` and the CTA gradient tokens still exist and are now against
  the language (WEB-009 §11 sets the gradient budget to zero). They resolve, so
  nothing breaks; a sweep should remove their consumers.

## Proposed commit

```
feat(design): adopt the approved language across the system
```

## Next

T-130: reconcile components whose *shape* is not token-expressed (control
density, pill geometry, remaining shadow usage). Then the ~80 legacy routes,
straight onto the system.
