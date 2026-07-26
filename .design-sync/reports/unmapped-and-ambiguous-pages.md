# Unmapped and Ambiguous Pages

> **SUPERSEDED 2026-07-24.** This file describes an early single-pilot-page
> state of this session (97 count, 1 mapped, 96 unmapped) that no longer
> reflects reality. Current authoritative state: `reports/unmapped-designs.md`
> (98 pages total; 46 `high`, 7 `medium`, 1 `low` confidence, 44 correctly
> out-of-scope/non-screen). Kept here only as a historical record of this
> session's progression — do not cite this file's counts as current.

Of 97 inventoried pages, exactly **1** received full mapping this session:
`SAQEEL PWA-Field Login` → `apps/web/src/app/login/field/` (status:
`verified`, see `design-map.yaml`).

The remaining **96 pages are `UNMAPPED`** — not guessed, not silently
assumed absent. No-content-read means no mapping claim is made either way.
This is a scope boundary of this session (single-pilot-page mandate), not a
finding that those pages lack implementations — several almost certainly
have live counterparts (e.g. `SAQEEL Admin *` pages likely map to the
existing admin control-plane vertical referenced in prior session memory).

Explicitly flagged ambiguous/duplicate items requiring sponsor input before
any future mapping pass:

- `SAQEEL Admin Lookups.dc.html` vs `SAQEEL Admin Lookups copy.dc.html` — near-duplicate name, unclear which (if either) is canonical.
- `SAQEEL Login.dc.html` vs `SAQEEL PWA-Field Login.dc.html` — both are login-family pages in the same project; confirmed distinct surfaces (web console vs. field/PWA) by reading both, but a future automated mapper must not conflate them by name-similarity alone.
- Planning/architecture pages (`SAQEEL Planning*`, `SAQEEL PWA-Inspector Architecture`, `*Journey Mindmap`, `*Golden Journey`) are presumptively `intentionally design-only` by name pattern — not confirmed by content read, so marked `unconfirmed`, not `intentionally design-only`, in the registry.

No page in this project was found to be inaccessible, permission-blocked, or
failed on read — the 97/98 discrepancy (see design-inventory-summary.md) is
a counting-method question, not an access failure.
