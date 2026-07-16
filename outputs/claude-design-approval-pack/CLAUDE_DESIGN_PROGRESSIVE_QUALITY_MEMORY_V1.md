# Claude Design Progressive Quality Memory V1

## Purpose and authority

This is the durable operating memory for every new or corrective Claude Design prompt in this programme. It records failures observed across the previous progressive design packages and the non-negotiable controls that prevent their recurrence. It is an approval-pack working artifact, not a product-contract change and never authorizes implementation.

Every prompt must require a `QUALITY_MEMORY_ACK_CD-XXX.md` that lists every control below with `PASS`, `BLOCKED`, or `NOT_APPLICABLE`, the evidence filename, and an honest reason. A package is not reviewable if that acknowledgement is absent.

## The progressive quality ratchet

### 1. Runtime truth before visual invention

- Inspect the exact route, components, server actions, RPCs, schemas, notifications, guards, translations, and tests before designing.
- Make a truth ledger with three columns: **proven live**, **derived but not proven**, and **unavailable / decision required**. Do not collapse those categories.
- A visual claim must name its backing source. Where the source is absent, use the exact token `HANDOFF_BLOCKED_<TOPIC>`; never invent an integration, policy, owner, date, support route, audit outcome, delivery confirmation, RLS result, device result, or recovery behaviour.
- Do not block an interaction that current code actually supports. Conversely, do not make sequential writes appear atomic: show the truthful partial-success/recovery state.
- “Provider pending” means no fabricated video, recording, call controls, connection quality, or device-test result. “Notifications queued” never means delivered.

### 2. Twenty-concept design exploration is compulsory

- Before the high-fidelity build, create twenty genuinely different decision architectures. Differences must concern information hierarchy, task sequence, attention management, recovery model, or spatial composition — never a palette change, card reorder, or label substitution.
- Render twenty legible low-fidelity thumbnails and document them in `CONCEPT_LAB_CD-XXX.md`, with one-line objective, signature decision, accessibility/reduced-motion implication, and reject/shortlist reason for every concept.
- Select three materially different architectures and execute all three at equal high fidelity before selecting a direction. Retain all three desktop frames and explain the decision in `CONCEPT_DECISION_CD-XXX.md`.
- The selected direction must improve the user’s primary decision, not merely decorate the existing screen. Every progressive/correction prompt repeats this exploration rather than inheriting a weak composition.

### 3. Visual proof has to prove the interface

- The first 1440px-wide desktop viewport must contain the primary decision zone and its active guard/action. Do not spend the frame on a large shell, filters, switches, or empty header while the task itself is below the fold.
- Use compact, high-signal hierarchy. Avoid generic card walls, oversized control bands, decorative dashboards, empty video stages, and colour as the only status signal.
- Produce true rendered source frames, not cropped or renamed previews. A file named `1440` is at least 1440 pixels wide. Record measured PNG width and height for every proof frame.
- Required evidence includes desktop 1440, tablet 1024, narrow 412 where relevant, EN and AR RTL, dark and light, keyboard/focus, long-text/wrap, and all required state rows. RTL must be a real reversed-layout proof, not translated English in an LTR frame.
- Any map, timeline, animation, chart, or visual stage needs a same-data list/text equivalent and a reduced-motion state.

### 4. State, interaction, and recovery discipline

- Map each required state to a distinct screenshot and cite its runtime guard. Include populated, loading, empty, validation, unauthorized, read-only, stale, degraded, offline, and recovery whenever the screen matrix requires them.
- Every visible action must state: trigger, precondition, authority/RLS, server action or RPC, canonical transition, audit/timeline effect, notification effect, success, failure, and partial-success recovery.
- Use explicit disabled reasons, never a silently dead control. Respect 48×48px interactive targets, keyboard order, visible focus, role/status semantics, contrast, and no-colour-only communication.
- Raw diagnostic/provider details remain diagnostic-only. User-facing errors are neutral, actionable, and preserve entered inputs where possible. Never invent “contact support” destinations.

### 5. Deliverable and archive integrity

- A delivery ZIP has exactly one top-level root: `outputs/cd-XXX-rN/`. It contains no old CD roots, `uploads/`, `screens/`, duplicate artefacts, parent directories, or stale revisions.
- All HTML/CSS/JS/SVG/image references resolve inside that root. The preflight records every reference and its resolved path; an assertion is not evidence.
- The preflight records the exact archive listing, SHA-256 for the A/B/C desktop frames, actual PNG dimensions, frame-to-state mapping, revision grep result, and control-size measurements. It must say `PACKAGE_PREFLIGHT_PASS` only when every check passes; otherwise it must say `PACKAGE_PREFLIGHT_FAIL` and the package must not be submitted as complete.
- Revision names, handoff paths, manifests, screenshots, and prose must all use the same `rN`. Never carry stale R1 paths into R2 or later.

### 6. Handoff boundary

- Include exact implementation inventory, component map, UI-to-runtime wiring map, acceptance checklist, research/provenance, and implementation prompt. Unsupported legs remain explicit handoff blocks.
- Every future implementation prompt begins: `DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT` and declares `implementation_authorized: false`.
- A design package can be visually strong and still be blocked. Never imply that a design approval implements code or clears a provider/policy decision.

## Lessons already learned and now enforced

1. Archive contamination and misleading preflight claims are release blockers.
2. A screenshot filename is not evidence; measured pixel dimensions are.
3. A polished header is not a golden screen if the decision zone is missing from the first viewport.
4. Concept variety must alter the task model, not card order or colour.
5. Stale revisions, unresolved local references, and omitted helper assets make a package non-portable.
6. Design must neither invent unavailable provider/device/audit semantics nor suppress code-backed actions.
7. Claims involving sequential state, timeline, and notification writes must visibly account for partial completion.
8. Arabic/RTL, narrow layout, focus, long content, and reduced motion are first-class evidence — not a final cosmetic pass.
9. The frozen shared shell applies only where the screen-family authority says it does; do not force a Web/Admin shell onto a constrained Virtual or iPad context.
10. Every new or progressive prompt must execute this whole ratchet, including the twenty-concept lab.
