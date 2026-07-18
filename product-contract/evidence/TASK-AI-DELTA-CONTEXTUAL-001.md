# TASK-AI-DELTA-CONTEXTUAL-001 — journey evidence

Date: 2026-07-18
Branch: `codex/ai-delta-implementation`

## Delivered in-context journeys

| Persona | User journey | Runtime result |
|---|---|---|
| Planner | Sign in → Bulk planning → AI planning summary | PASS: panel and guarded generation action visible in the planning workflow |
| Inspector | Sign in → My assignments → My daily inspection briefing | PASS: RLS-scoped briefing panel and guarded generation action visible beside assigned visits |
| Planner / Factory user | Sign in → Factories → Factory 360 → Health & risk | PASS: persisted risk/health explanation action visible beside the source score history |

Runtime command: `PLAYWRIGHT_PORT=4314 npx playwright test ai-user-journey.spec.ts --project=e2e --no-deps`

Result: **3 passed**.

The browser journeys deliberately stop before the Generate action. Generation
creates an append-only `ai_suggestions` record in the shared authenticated
store, so invoking it as a regression probe would mutate shared evidence. The
static contract suite separately proves provider fail-closed behavior, RLS
source re-reads, evidence references, and human disposition paths.

## Additional checks

- TypeScript: PASS
- Focused AI/OCR static contracts: 10 passed
- Production build: PASS

## Remaining scope

The full source-backed queue is held in
`product-contract/mvp2/AI_DELTA_IMPLEMENTATION_CHARTER.md`. This evidence does
not claim completion for recommendation, prediction, classification or action
surfaces that lack a source-authorized confidence/disposition contract.
