# Correction batch — the four verifier deltas

All four implemented in the English responsive Web master. iPad remained source; Web master is
destination.

## 1 · `EvidenceAttachment` rejection variants — `318:138`

Was `Empty · Uploaded · ViewOnly`. Now **six**, adding the three rejection states from the
governed `SCR-IPAD-640` state list:

| Variant | Copy | Tone |
|---|---|---|
| `State=TooLarge` | *File too large* — "The file exceeds the 2 MB limit. Nothing was attached." | critical |
| `State=Corrupt` | *File could not be read* — "The file is corrupt or unreadable. Nothing was attached." | critical |
| `State=PermissionDenied` | *Permission denied* — "Access to files or the camera has not been granted on this device." | major |

The 2 MB limit is the source's own constraint. Each rejection states **that nothing was
attached** — a rejection that leaves the user unsure whether the file landed is the actual
failure mode.

## 2 · `MicButton` permission-denied — `318:125`

Was `Idle · Recording · Disabled`. Now **four**, with `State=PermissionDenied` distinct from
`Disabled`.

They are different causes with different remedies: **Disabled** means the control is off for this
context; **PermissionDenied** means the browser withheld microphone access and the user must
grant it. Collapsing them tells the inspector nothing about what to do.

## 3 · `ValidationGate` — `369:284`, five variants

Every string is the shipped copy from `app/(app)/field/inspection/[id]`:

| Variant | Shipped string | Tone |
|---|---|---|
| `Gate=DeletionReason` | "A deletion reason is mandatory" | critical · Blocked |
| `Gate=DeselectionReason` | "A deselection reason is mandatory" | critical · Blocked |
| `Gate=FindingNarrative` | "A finding narrative is required for every mapped violation" | critical · Blocked |
| `Gate=EvidenceMissing` | "Evidence required before submit: {min} minimum" | warning · Incomplete |
| `Gate=HumanDecision` | "Advisory only · human decides" | info · Advisory |

Blocking, incomplete and advisory are **three different tones with three different badges and
text labels** — never colour alone. The three blocking gates carry a `Field State=Error` with the
mandatory input; `EvidenceMissing` carries no input because the minimum is governed per item by
`evidence_rule`; `HumanDecision` carries *Reject proposal* / *Accept and record*, because the
point of that gate is that a human records the outcome.

## 4 · The four proof frames — now field-complete

Each was **1 title + 2 generic inputs + 1 button** against tables of 13–18 columns. Rebuilt from
the actual shipped columns:

| Frame | Report | Route | Jira | Shipped columns | Entered fields now shown |
|---|---|---|---|--:|--:|
| `336:45771` | Summons Notice | `/field/summons-notices` | INSP-558 | 18 | 10 |
| `336:45779` | Sample Collection | `/field/sample-collection-reports` | INSP-573 | 16 | 8 |
| `336:45787` | Destruction | `/field/destruction-reports` | INSP-578 | 13 | 5 |
| `336:45795` | Facility | `/field/facility-reports` | INSP-583 | 15 | 7 |

Each field is labelled `Human label · column_name`, so the frame reads against the table.

**The remaining columns are not missing — they are system-written**, and the frames say so in a
provenance block: `id · factory_id · visit_id · inspection_id · created_by · created_at ·
signed_at`. That is the honest reconciliation: entered fields are drawn, server-written fields
are named and excluded from the form.

Section `336:45770` renamed from "proof, batch2" to **"field-complete against the shipped
tables"**.

## Two defects found in shared components during validation

Neither was in the new work — both are pre-existing library components that now propagate into
it, so both were fixed at source:

| Defect | Node | Fix |
|---|---|---|
| `Field State=Error` bullet `▪` renders at **8px**, below the ramp | `171:25` | → `t-caption` 11.5 |
| `FileUpload` hint and label are **HUG width**, so the hint overflows its parent below ~480 | `175:19` | → `FILL`, centred, wraps |

**Regression-checked** across every consumer — `ValidationGate`, `EvidenceAttachment`, `Dialog`,
`ChecklistQuestion`: **0 clipped, 0 crunched, 0 off-ramp** at 560 / 480 / 360.

## Validation

| Item | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Summons Notice `336:45771` | 0/0 | 0/0 | 0/0 | 0/0 |
| Sample Collection `336:45779` | 0/0 | 0/0 | 0/0 | 0/0 |
| Destruction `336:45787` | 0/0 | 0/0 | 0/0 | 0/0 |
| Facility `336:45795` | 0/0 | 0/0 | 0/0 | 0/0 |

*clipped / crunched.* 0 off-ramp sizes, 0 unbound fills on all four.

Components measured at 560 / 480 / 360 — `EvidenceAttachment` (6 variants), `MicButton` (4),
`ValidationGate` (5): **all 0 defects after the two source fixes.**
