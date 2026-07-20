# RTL / Dark Mode / Responsive Results — Saqeel V5.1

## Done and verified: 15 real, authenticated screenshots
Captured with `apps/web/scripts/capture-v5-evidence.mjs` — a standalone Playwright script (not a test; no CI wiring) that logs into a real running dev server as the actual seeded e2e personas (`apps/web/e2e/personas.ts`: `admin@mim.gov.sa`, `ops@mim.gov.sa`, `planner@mim.gov.sa`, `inspector@mim.gov.sa`, `reviewer@mim.gov.sa`) and navigates to real routes. Every screenshot is the actual running application with real data from the seeded database, not a mock or the reference HTML. Stored under `INSPECTION_DOCS_ROOT` per this repo's documentation-storage policy (screenshots are never committed to git):

`/Users/vikramindla/Desktop/Inspection Documentation/05_UI_UX_AND_STORYBOARDS/saqeel-v5-implementation-evidence-2026-07-20/`

| # | File | Persona | Viewport | What it shows |
|---|---|---|---|---|
| 01 | shell-desktop-admin-light | admin | 1440×900 | `/admin` — desktop shell, light theme |
| 02 | admin-violations | admin | 1440×900 | Compact admin density (Wave 7), Riyadh-formatted "read at" timestamp, FND-011 glyph+word severity/status (not color-only) |
| 03 | admin-regulations | admin | 1440×900 | |
| 04 | admin-packages | admin | 1440×900 | |
| 05 | dashboard-light | ops | 1440×900 | Green primary/active-nav (not blue), Riyadh-formatted "source updated" timestamp — both confirmed live |
| 06 | operations | ops | 1440×900 | |
| 07 | visits-workload | ops | 1440×900 | The Riyadh-aware week-bucket fix (Wave 6), live |
| 08 | planning-home | planner | 1440×900 | |
| 09 | planning-bulk | planner | 1440×900 | |
| 10 | reviews-queue | reviewer | 1440×900 | |
| 11 | field-home-ipad-landscape | inspector | 1194×834 (iPad landscape) | Field/iPad density, green active nav, red-accent expired-visit cards |
| 12 | field-home-ipad-portrait | inspector | 834×1194 (iPad portrait) | Same route, portrait reflow |
| 13 | **dashboard-dark** | ops | 1440×900 | **Dark theme, confirmed live: primary is mineral green (`#64C2A1`), not blue** — the single most-repeated defect across every prior ChatGPT critique round, now visually confirmed fixed in the running app, not just in token source. |
| 14 | **dashboard-arabic-rtl** | ops | 1440×900 | Arabic/RTL — the app's actual default locale (confirmed: sessions default to Arabic per `e2e/auth.setup.ts`'s own comment); every other screenshot in this set is *also* genuinely Arabic/RTL by that same default, not just this one. |
| 15 | dashboard-320px | ops | 320×900 | 400%-zoom-equivalent narrow viewport reflow |

Not captured: a print-preview screenshot (script attempts to find a submitted report reachable from the reviewer persona's `/reviews` queue and gracefully skips if none is reachable in the seeded data within that persona's scope — none was found this run) and true responsive breakpoints between 1440 and 320 (1280/1024/tablet) — the script only hits the two ends of that range.

## What this confirms, live, not by construction
- Dark-theme primary is genuinely green in the running app (screenshot 13), not just in `tokens.css` source.
- The Riyadh date service renders correctly in Arabic in the real UI (screenshots 02, 05: "٢٠ يوليو ٢٠٢٦, ١٣:٢٠ (الرياض)" / "20 Jul 2026, 13:20 (Riyadh)"-equivalent text).
- Admin compact density, iPad field density, and the FND-011 glyph+word status system (never color-only) are all visibly correct in real rendered pages.
- RTL layout (Arabic is the default locale) renders correctly across every captured route — no mirrored-incorrectly or broken-layout artifacts observed in these 15 pages.

## Still not done
- No screenshot evidence for 1280/1024/tablet intermediate breakpoints.
- No print-preview screenshot (no submitted report was reachable from the one persona/scope tried).
- No manual visual review of these 15 screenshots against a checklist beyond the spot-checks noted above — a full independent visual-acceptance pass (per the sponsor's stated sequence: ChatGPT Work 25+ screen audit) is still the next step, not something this session substitutes for.
