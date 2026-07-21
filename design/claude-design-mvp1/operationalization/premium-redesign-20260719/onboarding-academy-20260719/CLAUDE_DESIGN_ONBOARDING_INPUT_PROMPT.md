# CLAUDE_DESIGN_ONBOARDING_INPUT_PROMPT — Input for CD-PREM-02

**Document ID:** OBM-CDIN-20260719-001
**Consumer:** Claude Design, package `CD-PREM-02` (onboarding, Persona Academy, real-character/video/material system, in-product help), per `MASTER_UIUX_OPERATIONALIZATION_PLAN.md` §10.
**Precondition:** `CD-PREM-01` provisional chassis contract published; five-screen sponsor gate includes the "Onboarding and secure access" screen.

---

You are Claude Design executing CD-PREM-02 for the Saqeel/MIM Inspection Platform. Read, in order: repository `AGENTS.md`; `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`, `execution/CURRENT_SLICE.yaml`; `design/claude-design-mvp1/00_START_HERE.md` and its authority chain; then this onboarding pack: `ONBOARDING_MODULE_PRD.md`, `PERSONA_ACADEMY_CONTENT_MATRIX.csv`, `FOUR_HOUR_PLATFORM_STORYLINE.md`, `VIDEO_SERIES_BIBLE.md`, `VIDEO_SCRIPTS_AND_STORYBOARDS.md`, `CASTING_LOCATION_PPE_AND_RIGHTS_BRIEF.md`, `ONBOARDING_ROUTE_AND_SOURCE_TRACEABILITY.csv`, `ONBOARDING_ACCEPTANCE_CRITERIA.csv`.

## Your task

Produce code-ready design specifications (no application code) for:

1. **Side-panel "Learn the platform" destination** — entry placement, persona list presentation (13 launch personas; 3 HELD personas shown as held, not hidden silently), and the rule that selection opens learning content and never changes authorization (OB-AC-001/002).
2. **Persona learning space template** — one template serving all personas: chapter player (with poster fallback state as the default until media exists), "your day" storyline layout, can-see/cannot-do card, journey map with next/previous handoff, task-demonstration list deep-linking to live routes, downloadable materials, progress/revisit controls (progress persistence is PROPOSAL — design it, flag the storage decision for change control).
3. **Media player component states** — loading, poster-fallback, playing, captions on/off AR/EN, transcript panel, audio-description toggle, reduced-motion alternative, error/unavailable. No audible autoplay state may exist.
4. **Contextual micro-guide pattern** — first-use surfacing, revisit entry, never-blocking behavior (REC-021), route+state binding badge (REC-022).
5. **Demonstration mode navigation** — chapter rail for the 4h/30m/10m storylines with truth-label chips rendered per chapter.

## Hard constraints (inherit, do not re-litigate)

- No role switching, impersonation, or new roles; Minister label maps to the `leadership` boundary pending sponsor naming.
- Every screen: EN/LTR light + AR/RTL dark at equal fidelity; true RTL; IBM Plex Sans Arabic; frozen input geometry untouched; 44–48px desktop / 52px field targets.
- Truth labels are design elements: provider-pending, projected-not-live, AI-briefing-not-enabled, map-lens-unavailable must have designed states, not absence.
- At least one negative state per screen family (held persona, media unavailable, no permission, offline).
- Do not invent metrics, targets, providers, policy values, or persona permissions; the traceability CSV is your only route/persona authority.
- Stop the handoff of any screen whose route or runtime truth is missing (design 00_START_HERE ratchet rule).

## Required outputs

Per the design workspace standard: high-fidelity spec per surface, component decisions, state variants, interaction notes, EN/AR light/dark evidence, and a traceability table mapping every designed element to matrix item IDs and OB-AC rows. Verdict vocabulary: `READY_FOR_SPONSOR_REVIEW` / `RETURNED_WITH_FINDINGS` / `BLOCKED_BY_NAMED_AUTHORITY`.

## Open inputs you must NOT resolve yourself

OV-01 (13-role enum mapping), OV-02 (operational-state enum completion), Committee/Enforcement/Integration role bindings, Minister display naming, Vision-2030/emblem brand authority, learning-analytics targets, progress-persistence storage. Each is listed as an open verification item or pending sponsor decision in `CHATGPT_TASK_01_HANDOFF.yaml` (repo-truth checks routed to the master-controller Codex — not a dependency on Kimi Task 2, which is an independent workstream); design around them with explicit held states.
