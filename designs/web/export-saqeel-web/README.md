# SAQEEL Web — console surface

43 design pages for the console (business users). Self-contained: open any `.dc.html` directly in a browser, no build step.

## What is in here

- **Shell:** `SAQEEL Web Shell v5.dc.html` (WA-SHELL-r5 — the binding shell contract, reconciled to the repo) · `SAQEEL Web Shell.dc.html` (r4 predecessor, retained for comparison)
- **Identity:** `SAQEEL Brand Identity Proof.dc.html` (WA-BRAND-r1) · `export-wordmark-icons/`
- **Modules:** M1 Dashboard · M2 Visits · M3 Operations Center + Live · M4 Factories + Factory 360 · M6 Compliance Control Plane · Planning · Review & Approval · Cases · Committee · Enforcement · Tasks · Portal · Profile · Virtual · Executive Overview · AI Studio · Reports
- **Canonical status:** `SAQEEL Status Board.dc.html` + `status/saqeel-status.json`
- **Design system:** `saqeel/` — `styles.css` is the single entry; `tokens/` and `components.css` behind it
- **Rail generator:** `tools/r5-rail.js` — the source of the swept rail markup. Rail changes are made here and re-swept, never hand-edited per page.

## Not in here

- **SAQEEL Admin** — the 21 control-panel pages ship as a separate folder (`admin/`). Links to them appear as `admin/…` and will not resolve in this export alone.
- **SAQEEL PWA** — the 45 iPad inspector pages ship as a separate folder (`pwa/`).

## Notes

- One filename was normalised for this export: `SAQEEL Review & Approval` → `SAQEEL Review and Approval` (the `&` breaks tooling paths).
- `SAQEEL Login v2.dc.html` is the login authority, re-pulled from the live Claude Design project on 2026-07-26 (CC-SHELL-TABLET-001). It supersedes and replaces the earlier `SAQEEL Login.dc.html` and the interrupted `SAQEEL Login Web.dc.html` atlas port (O-30), both deleted. Asset paths were rewritten on vendoring: `../support.js` → `./support.js`, `../saqeel/styles.css` → `saqeel/styles.css`, `saqeel/atlas/*` → `assets/saudi-atlas/*`.
- Every page carries the WA-SHELL-r5 rail and WA-BRAND-r1 identity.
