# P2-EVID-001 — Wave 1 Team Summary (BATCH-PHASE2-EVIDENCE-001)

Status: **A, B and C all complete. 24 frames captured across the 3 SAFE
Tier-1 screens (8 capture profiles each); SCR-WEB-200 and SCR-WEB-500
remain held exactly as Codex directed. See "C — final result" below.**

## C — final result (after Codex's auth resolution)

Codex verified fresh `playwright/.auth/{planner,inspector,reviewer,admin}.json`
storage states on 2026-07-18 and explicitly authorized capture
(`20260718T201500Z-codex-P2-EVID-001.C-AUTH_RESOLUTION-001`), preserving the
holds on `SCR-WEB-200`/`SCR-WEB-500`. Independently re-verified all 4
storage states had a not-yet-expired JWT before touching anything, then
resumed.

**24 frames captured**, 8 capture profiles (A-H: en/ar × light/dark ×
1440x1024/1024x768/1920x1080) × 3 screens (`SCR-ADM-001` as `admin`,
`SCR-WEB-130` and `SCR-WEB-210` as `planner`). A real visit ID for
`SCR-WEB-210` was sourced via a direct, read-only PostgREST `GET` against
the `visits` table — bypassing the held `/visits` list page entirely, so
no mutating code path was ever invoked.

Two real problems were found and fixed mid-run, not glossed over:
1. **Host/cookie-domain mismatch.** The dev server's session cookie is
   scoped to `127.0.0.1`; my first attempt navigated to `localhost` and
   every request silently redirected to `/login`. Fixed once identified.
2. **Theme toggle didn't apply.** Setting `localStorage["saqeel-theme"]`
   via `page.evaluate()` *after* a navigation didn't reliably take effect
   before the app's synchronous theme-init script ran on the next page —
   light/dark screenshot pairs came back byte-identical. Fixed by using
   `context.addInitScript()` (guaranteed to run before any page script),
   then **verified on every single capture** via
   `document.documentElement.getAttribute("data-theme")` that the observed
   theme actually matched the intended profile — recorded per-row in the
   manifest's `data_theme_observed` column, not just assumed.

3 stray files from the pre-fix single-profile test were removed so the
evidence root only contains the 24 authoritative frames.

Output: `P2-EVID-001_TIER1_CAPTURE_MANIFEST.csv` — 24 `CAPTURED` rows with
path + sha256 + observed theme, plus the 2 held screens recorded as
`BLOCKED` with their existing reason, for a complete 5-screen disposition.

## What remains

- `SCR-WEB-200`, `SCR-WEB-500`: still held pending a separate change-control
  decision on the mutation-tolerance question (unchanged from Codex's ruling).
- The 8 partial-evidence and 25 no-evidence screens from manifest A remain
  for a future wave (W2 onward per `PHASE2_FULL_38_CAPTURE_WAVES_20260718.md`).
- `reviewer` persona's fresh state was verified valid but not exercised this
  wave (none of the 3 SAFE screens required it).

## A — 38-screen reuse/gap manifest

Output: `P2-EVID-001_ALL38_REUSE_AND_GAP_MANIFEST.csv`. All 38 governed
screens present (verified against `screen_route_catalogue.csv`, no
missing/invented IDs). 5 reuse-candidate (the Tier-1 five), 8 partial,
25 none. Cross-referenced against an already-existing, much larger
`PHASE2_FULL_38_CAPTURE_MATRIX_20260718.csv` (5,274 rows, see below).

## B — Tier-1 preflight

Output: `P2-EVID-001_TIER1_PREFLIGHT.md`. Verdict: **SCR-ADM-001,
SCR-WEB-130, SCR-WEB-210 are SAFE_TO_VISIT_READ_ONLY** (pure reads, no
mutating RPC on page load). **SCR-WEB-200 and SCR-WEB-500 are BLOCKED** —
both call an unconditional mutating RPC on page load
(`expire_lapsed_visits`, `expire_stale_geo_override_requests`; real
`UPDATE`/`INSERT`), which this batch's own `prohibited_actions` forbids
regardless of the existing e2e suite's tolerance for that same mutation.

## C — why capture was paused, not attempted

While preparing to execute C for the 3 SAFE screens (script written, not
yet run — see below), I found that **another actor had already produced
live capture output in this same window**, discovered via new files in
`design/claude-design-mvp1/operationalization/phase2/`:

- `PHASE2-WAVE1-PREFLIGHT-20260718T195039Z.md` / `.csv`
- `PHASE2_FULL_38_CAPTURE_MATRIX_20260718.csv` (5,274 rows)
- `PHASE2_FULL_38_CAPTURE_WAVES_20260718.md`
- `CLAUDE_DESIGN_WAVE1_EVIDENCE_INTAKE_20260718.yaml` / `_PROMPT_20260718.md`

That actor's own preflight document states it was **generated and executed
from `/Users/vikramindla/Documents/GitHub/Inspection`** — the retired,
non-canonical checkout per `CURRENT_STATE.md`'s 2026-07-18 relocation note
— and says explicitly: "this file does not by itself become canonical
authority" and "Codex must reconcile/copy this unique artifact to the
canonical checkout." Its local dev server ran at `127.0.0.1:3127`, not
this session's `127.0.0.1:4314`.

That actor already:
- **Captured 5 real frames** against the same live remote Supabase
  backend: `SCR-ADM-001` (as Inspector — revealing that an authenticated
  non-admin can currently load `/admin`, a real RBAC finding), `SCR-WEB-130`
  ×2 (Planner + Inspector), and — **`SCR-WEB-200` ×2** (Planner, EN light
  1440×1024 and AR/dark 1024×768).
- **Triggered `HTTP 429` from the identity/auth service** after repeated
  session-refresh attempts on expired personas, and stopped rather than
  continuing — `SCR-WEB-210` and `SCR-WEB-500` remain uncaptured by them
  too.

### The material conflict

That actor captured `SCR-WEB-200` live. **This wave's own B preflight
(above) marked `SCR-WEB-200` BLOCKED** for the same reason their own
`PHASE2_FULL_38_CAPTURE_WAVES_20260718.md` control rule 2 warns against
("Never ... overwrite a shared record merely to create visual evidence") —
`/visits` calls `expire_lapsed_visits` unconditionally on load, a real
`UPDATE`+`INSERT`. Two independent preflights reached different
dispositions for the identical route. This is not something I should
silently resolve by picking a side — it needs Codex/sponsor adjudication:
either the mutation is judged in-tolerance for this shared project (matching
the existing e2e suite's own accepted practice) and both wave's status
should say so explicitly, or the other actor's 2 `SCR-WEB-200` frames need
to be flagged/quarantined as taken under a rule this wave doesn't accept.

### Why I did not also attempt live capture this cycle

1. **Rate-limit risk.** The identity service already returned `HTTP 429`
   to the other actor within the last ~9 minutes. Running my own
   session-refresh/navigation cycle against the same shared auth backend
   right now risks compounding that throttle or triggering account-level
   friction, for no benefit — the safe frames I'd capture (`SCR-ADM-001`,
   `SCR-WEB-130`) are ones the other actor already has non-conflicting
   captures for.
2. **Non-duplication.** Producing a second, separately-numbered set of
   the same 2-3 safe frames from a different dev-server port would
   fragment evidence rather than consolidate it, and the other actor's
   artifact already asks Codex to reconcile it into the canonical location
   — a second uncoordinated attempt would make that reconciliation harder,
   not easier.
3. **The one screen I'd add nothing new on is the disputed one.** The only
   Tier-1 screen the other wave did NOT already attempt that I preflighted
   as SAFE is `SCR-WEB-210` — and it wasn't reached before their 429, so it
   remains genuinely uncaptured. I did not attempt it either this cycle,
   preferring to resolve the coordination/rate-limit situation first rather
   than run a third, still-uncoordinated capture effort in parallel.
4. My storage states (`playwright/.auth/*.json` in the canonical repo) are
   themselves stale — `access_token` expired, `expires_at` in the past —
   consistent with the other actor's finding that these personas need
   refresh. A refresh attempt right now would be exactly the kind of
   identity-service call most likely to compound their existing 429.

## Recommended next action

1. Codex resolves the `SCR-WEB-200` mutation-tolerance question (decision,
   not a code change) — applies to both this wave's B verdict and the other
   actor's 2 already-captured frames.
2. Codex reconciles the other actor's artifacts from
   `/Users/vikramindla/Documents/GitHub/Inspection` into this canonical
   repository (per that actor's own request), so there is one evidence
   trail, not two.
3. Once the identity-service rate window has clearly cleared (no fixed
   time known from here — recommend Codex confirm before the next attempt),
   refresh Planner/Inspector persona states one at a time (not in a burst)
   and capture the outstanding safe combination: `SCR-WEB-210`, plus the
   remaining profiles (B-H) for the 3 SAFE screens.
4. `SCR-WEB-500` remains BLOCKED regardless of persona/rate-limit status
   (its own mutating RPC, independent of the `SCR-WEB-200` question).

## What this wave did NOT do

- Did not run any browser session, did not attempt any login/refresh, did
  not take any screenshot.
- Did not mutate any product data, workflow status, acceptance, gate, or
  release state.
- Did not resolve the `SCR-WEB-200` disagreement or reconcile the other
  actor's non-canonical artifacts — both explicitly left for Codex.
- A throwaway capture script was written to `/private/tmp/.../scratchpad/`
  (this session's scratchpad, not part of the repo) while preparing C, then
  never executed once the conflict was found; it touches nothing in this
  repository.
