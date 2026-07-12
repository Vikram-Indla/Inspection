# Saqeel MVP1 — Claude Design Workspace

This directory is the design-execution layer for ChatGPT, Codex, Claude Design, and Fable. It improves the existing MVP1 user experience without rediscovering the product or rebuilding its functional core.

## Read order

1. Repository `AGENTS.md` or `CLAUDE.md`.
2. `product-contract/00_START_HERE.md` and the current gate/state files.
3. `CURRENT_UI_BASELINE.md`.
4. `authority/SOURCE_AUTHORITY.md` and `authority/DESIGN_DECISIONS.md`.
5. `prompts/00_MASTER_DESIGN_CONSTITUTION.md`.
6. `prompts/01_CODE_AND_RUNTIME_DISCOVERY.md`.
7. `prompts/02_SAQEEL_FOUNDATIONS_AND_COMPONENTS.md`.
8. One journey prompt and any linked system prompts.
9. The acceptance and verification files before declaring a design ready.

## Operating rule

The product contract and current code are authoritative for behavior. This workspace is authoritative only for the design task and its acceptance evidence. It must not change RBAC, state transitions, audit, offline conflict semantics, version immutability, provider status, or the 478-row MVP1 scope.

## Coverage target

- 38 governed screens.
- 20 storyboards.
- 14 journey branches: P00–P12 with P06A and P06B treated separately.
- 12 engines.
- 493 acceptance-ledger records.
- Desktop web, field/iPad, virtual, and operations experiences.

The existing row-level mapping is not duplicated here: `FABLE_UNDERSTANDING_TRACEABILITY.csv` maps all 493 governed records to process, storyboard, screen, state, behavior, acceptance, error, evidence, and source IDs; `FABLE_ACCEPTANCE_UNDERSTANDING.csv` defines the corresponding UI result, backend result, failure recovery, proof, and regression guard. Both are mandatory inputs to every journey audit.

## Required output from Claude Design

Claude Design produces code-ready high-fidelity design specifications, component decisions, state variants, interaction notes, and traceability. It does not edit application code in this phase. Fable implements only after the relevant design acceptance rows are signed off.

## Important truth labels

- `/operations/live` currently shows projected route movement, not real GPS telemetry.
- The virtual room has live OTP/state/audit behavior but no integrated video provider.
- Public map tiles are external dependencies and require unavailable/offline states.
- Demo access is non-production scaffolding and must be gated or removed before release.

## Completion

Run the four verification prompts. A screenshot is evidence of appearance only; it is not proof of behavior, data integrity, authorization, audit, offline recovery, or provider integration.
