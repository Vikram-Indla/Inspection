# RTL / Dark Mode / Responsive Results — Saqeel V5.1

## Done and verified: 18 real, authenticated screenshots
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
| 17 | dashboard-1280 | ops | 1280×900 | Intermediate desktop breakpoint |
| 18 | dashboard-1024-tablet | ops | 1024×900 | Compact-desktop/tablet breakpoint |
| 16 | **report-print-preview** | ops | 1000×1400, print media emulated | The official inspection report, real submitted data, `page.emulateMedia({media:"print"})`. Re-captured after the Wave 8 follow-up (5-layer content-model grouping) — confirms live: grayscale-safe palette regardless of the session's on-screen theme, bilingual Ministry header, glyph+word compliance status (a green "مطابق" chip with a checkmark, not a color-only signal), Riyadh-formatted dates throughout, the 5 layer headings (Identity and outcome / Findings and compliance / Violations and corrective actions / Evidence, versions and decisions / Acknowledgement and signatures), and a signature block at the foot of the document. |
| 16a | **report-screen-layers** | ops | 1000×1400, screen (light) | Same live submitted inspection, on-screen (not print) view — confirms the 5 layer headings render correctly on-screen too, not only in print media, and that no chapter content/logic changed. |

## What this confirms, live, not by construction
- Dark-theme primary is genuinely green in the running app (screenshot 13), not just in `tokens.css` source.
- The Riyadh date service renders correctly in Arabic in the real UI (screenshots 02, 05: "٢٠ يوليو ٢٠٢٦, ١٣:٢٠ (الرياض)" / "20 Jul 2026, 13:20 (Riyadh)"-equivalent text) and in the official report (screenshot 16).
- Admin compact density, iPad field density, and the FND-011 glyph+word status system (never color-only) are all visibly correct in real rendered pages, including print.
- RTL layout (Arabic is the default locale) renders correctly across every captured route — no mirrored-incorrectly or broken-layout artifacts observed across these 18 pages.
- The report/print CSS conformance fixes (Wave 8) are confirmed correct against a real submitted inspection, not just read from source.
- Desktop breakpoints from 1440 down to 320 (1440/1280/1024/320) all reflow without visible breakage.

## A note on two capture attempts that failed with a server error, not an app bug
The print-preview capture initially returned a blank white page, and a follow-up debug run showed `Cannot find module './vendor-chunks/@supabase.js'` — a Next.js dev-server webpack module-cache corruption under rapid concurrent route compilation (the same class of transient issue hit twice earlier in this branch's work, always on this one long-running dev-server process). `next build` (a full, fresh production compile) passed cleanly immediately before and after both incidents. Restarting the dev server and re-running the capture produced the correct, complete result shown above (screenshot 16) — confirmed dev-server-only, not a regression in this branch's code.

## Still not done
- No manual visual review of these 18 screenshots against a formal checklist beyond the spot-checks noted above — a full independent visual-acceptance pass (per the sponsor's stated sequence: ChatGPT Work 25+ screen audit) is still the next step, not something this session substitutes for.
- Real-device iPad testing (physical Split View, Apple Pencil hardware) — a viewport-sized browser screenshot proves layout/reflow correctness, not real touch/pencil hardware interaction; no device lab was available in this environment.
