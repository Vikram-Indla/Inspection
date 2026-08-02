# Batch 15 — `ChecklistQuestion` re-specified against the governed response model

I had been holding this as "a data-model decision I shouldn't take alone". That was wrong: the
model is **fully specified in the repository**, so it is evidence, not a judgement call.

## The governed contract

`supabase/migrations/20260716210000_m09_relationship_contract_hardening.sql:273-330` validates
`inspection_items.response_model` on every insert and update:

```
response_model            object                     (M09-019)
  .responses              array of string tokens     (M09-019) — every element must be a string
  .scoring_enabled        boolean, optional          (M09-024)
  .score_excluded_on      text[] — when scoring is disabled, EVERY response must be excluded
evidence_rule             object, optional           (M09-005)
  .on                     required, non-empty
  .type                   photo | video | document | comment   — closed set
  .min                    positive whole number
  .mandatory              boolean
```

Real seeded values:

```json
{"responses":["compliant","non_compliant","na"],
 "mapping":{"non_compliant":{"result":"Non-Compliant","violation":"V-FS-09","action_form":"corrective_blocking"}}}

{"responses":["value_date"],
 "conditional":{"visible_when":"fire_pump_present=yes","mandatory_when_visible":true}}
```

## What the audit got right, and what it missed

The capability audit said the repo component `saqeel/inspection/ChecklistQuestion.tsx` is
**the wrong model** because it hardcodes `"compliant" | "violation" | "na"` — correct, and that
is why no screen ever adopted it.

My Figma component already treated **options as content**, so it was directionally right. But it
was still missing four things the governed model requires:

| Missing | Now |
|---|---|
| `responses:["value_date"]` — a date value, not a choice | **`State=DateValue`** — the option chips are replaced by a date input |
| `mapping` → result / violation / action_form | `mapping` leg on every variant |
| `conditional.visible_when` | `conditional` leg on every variant |
| `evidence_rule` type · min · mandatory | `evidence-rule` leg on every variant |

The three new legs are present on all five variants and **hidden by default** — they render only
when the item's model carries them, which matches the schema where each is optional.

## Node

`317:137`, now **5 variants**: `Unanswered · Answered · Attached · ReadOnly · DateValue`.
Description records the full contract so the next person does not have to re-derive it.

Added as a fifth value on the **existing single axis**, deliberately — a second axis would have
doubled the set to eight and changed the property signature of every live instance.

## Regression check

Four host frames instance this component, including **`SCR-FLD-630`** — the canonical frame owned
by the other workstream. All four: **0 clipped, 0 crunched**, at their own widths.

Extending a shared component without touching another workstream's frames was the constraint,
and it held.

## What is still not resolvable from the repo

`scoring_enabled` / `score_weight` / `score_excluded_on` are validated but **no seeded item
carries a weight**, so the component renders no score leg. That remains a genuine gap — recorded,
not invented.
