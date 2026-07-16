# MIM Inspection Platform

This repository contains the Inspection Platform application source, database migrations, tests, configuration, and the minimum machine-readable governance needed for safe development.

## Documentation Location

Business requirements, BRDs, storyboards, training material, screenshots, evidence packages, and historical documentation are maintained outside this repository at:

`/Users/vikramindla/Desktop/Inspection Documentation`

Set `INSPECTION_DOCS_ROOT` to override that location for another workstation:

```sh
INSPECTION_DOCS_ROOT="/path/to/Inspection Documentation"
```

The default path is local to Vikram's workstation. Other contributors must request access to the authoritative documentation store and configure their own `INSPECTION_DOCS_ROOT`; do not recommit copied binary documentation.

Start with `AGENTS.md`, `product-contract/00_START_HERE.md`, and `docs/README.md`. Operational product-contract files, Claude continuity files, and design authority records intentionally remain in Git.
