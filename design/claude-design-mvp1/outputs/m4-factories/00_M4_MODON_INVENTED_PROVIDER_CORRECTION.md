# M4 Factories/Factory 360 — invented-provider blocker record (read-only design finding)

Status: `BLOCKER_RECORDED` (per Codex ACK on `CLAUDE-M4-DESIGN-INVENTORY-001`)
Scope: CR-410..CR-429, WA-DES-026, WA-DES-027, WA-M4-AC-001..006
No Claude Design write performed. This is the exact correction record, for a future `CLAUDE-M4-DESIGN-CORRECTION-001` packet to apply once the sponsor decision below is made.

## Exact defect

`SAQEEL Factory 360.dc.html` (WA-DES-027, sha `680c838cde826e24d1ad53ac4438a4de06379e0cf07605d30ad3d1d1a2392d77`) names **"MODON"** as a live, versioned, currently-syncing external data provider in three places:
1. Header badge: `source MODON · recorded 2026-07-20`
2. Right-rail "Source status & freshness" panel: `Source system MODON`, `Recorded sync 2026-07-20 08:41`
3. Industrial-information table: three rows each tagged `MODON · v6`

`SAQEEL Factories.dc.html` (WA-DES-026) has the same conceptual field left broken instead of fabricated: `Factory identity records sync from the national source ().` — empty parens.

## Why this is a real blocker, not a style note

Checked against the canonical repository this session:
- `product-contract/seeding-discovery/EXTERNAL_SOURCE_CONTRACT_REGISTER.csv:5` — MODON: **"NO CONTRACT EXISTS — the only repository hit for the string 'MODON' is a single unrelated aesthetic reference... not an integration."**
- `product-contract/seeding-discovery/ADAPTER_REPLACEMENT_PLAN.md:31,67-69` — **"Not found anywhere in the codebase as a data provider... If a future task needs MODON, that is an open decision requiring: (a) an actual accepted contract document, (b) explicit sponsor/product authorization to add a new external domain, (c) a new INTEGRATIONS mindmap node and product-contract requirement IDs."**
- Real code (`apps/web/src/app/(app)/factories/[id]/page.tsx`) uses a generic `source` / `source_synced_at` data column — never a hardcoded provider name. The design invented a specific, named, versioned external system the platform has no contract, adapter, or requirement for.

This is exactly the class of defect `AGENTS.md` forbids: *"Never invent policy values, providers, thresholds, SLAs, legal rules, risk weights, geofence values, retention, or Arabic scope."*

## Exact correction — not blocked on a future sponsor decision

**Corrected disposition**: this correction is not gated on a future sponsor MODON-scope ruling. No accepted MODON provider contract exists today (`EXTERNAL_SOURCE_CONTRACT_REGISTER.csv:5` — "NO CONTRACT EXISTS"), so the canonical no-invention rule already requires the neutral fix now, independent of whatever the sponsor decides later. The only real gate is the **Codex-issued Claude Design write lease** for project `5e8154ad-...` — a scheduling/authorization step, not an open business decision.

Replace every MODON reference in WA-DES-027 with the real generic pattern already implemented in code — `{f.source}` / `synced {f.source_synced_at}` — and where `source` is null/unset, render an honest `Source not configured` state, never a specific vendor name the platform doesn't integrate with. Fix WA-DES-026's blank `national source ()` placeholder to the same generic `{source}` pattern, never inventing a name to fill the parens. Exact prompt text: `02_M4_MODON_NEUTRAL_CORRECTION_PROMPT.md`.

If MODON (or any other named provider) is later separately approved for MVP1 with (a) an accepted contract document, (b) explicit sponsor authorization, and (c) a product-contract requirement ID, that would be a **new, distinct** design change introducing a real integration — not a reason to delay or withhold this neutral correction now.

## Disposition

No design or code change made. This record is the exact, ready-to-apply correction, blocked only on the Codex design-write lease. No acceptance row advances past `not_started`/`BASELINED_NOT_IMPLEMENTED` as a result of recording it.
