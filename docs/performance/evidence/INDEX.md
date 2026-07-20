# Performance evidence index

## Git-backed machine-readable evidence

- `results/baseline.json` and `route-results-baseline.csv` — mandated programme baseline of record (unchanged).
- `results/baseline-kimi-pass.json` — 145-run same-harness pre-Pass-3 evidence retained from Line A.
- `results/final.json`, `route-results.csv`, `runs-final.jsonl` — Pass-4 desktop production run, 90/90, zero failed.
- `results/ipad-portrait.json` + CSV/JSONL — `/field`, 810×1080 touch viewport, 10/10.
- `results/ipad-landscape.json` + CSV/JSONL — `/field`, 1080×810 touch viewport, 10/10.
- `results/throttled-slow-4g.json` + CSV/JSONL — portrait touch viewport, CDP 150 ms / 1.6 Mbps down / 750 Kbps up, 10/10.
- `_dashboard-requests.json`, `_operations-requests.json`, `_factories-requests.json`, `_planning-requests.json`, `_reviews-requests.json`, `_ai_suggestions-requests.json` — sanitized first-cold-cycle request evidence; origins removed.
- `inspection-p0-register.md`, `inspection-before-after-results.md`, `inspection-regression-results.md`, `inspection-agent-handover.md`, `inspection-performance-postmortem.md`.

Auth storage under `apps/web/e2e/perf/.auth` and local runner output are excluded from Git. No cookie, environment file, credential, HAR or raw payload is committed.

## External binary evidence

Existing before/after screenshots and traces remain at the approved documentation root indexed by the prior pass. Pass 4 commits no binary evidence and makes no new visual-proof claim beyond machine-measured responsive geometry.
