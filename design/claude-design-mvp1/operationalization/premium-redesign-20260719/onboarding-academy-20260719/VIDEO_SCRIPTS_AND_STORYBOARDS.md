# VIDEO_SCRIPTS_AND_STORYBOARDS — Draft Scripts & Board Outlines

**Document ID:** OBM-SCRIPTS-20260719-001
**Status:** CONTROLLED PROPOSAL — draft scripts (EN; AR translation required and gated on native review). All items `MEDIA_DEP`. Screen frames must be captured from the real product at a named commit on fixture data.

Format per item: shot board (frame → visual → narration EN draft → truth source). AR script column is produced by the localization workflow (`/admin/localization` register) and reviewed under the open native-Arabic gate — AR text is deliberately NOT drafted here to avoid unreviewed Arabic entering the repo.

---

## 1. S1 persona chapters (13) — board pattern + 3 fully drafted examples

**Pattern (20–45s, real character):** F1 environment establishing (2–4s) → F2 character to camera, name-free role intro (6–10s) → F3 over-shoulder real screen (8–15s) → F4 handoff line ("my work goes to …") (4–6s) → F5 poster end-card with persona name + "Learn my day" (3s).

### CH-PA-INS — Inspector (film: factory exterior + iPad)
| Frame | Visual | Narration (EN draft) | Truth source |
|---|---|---|---|
| F1 | Industrial-city gate, morning; inspector in hard hat + hi-vis walks in | "Every inspection starts before the gate." | setting per storyboard reference pp.6/17–18 |
| F2 | Inspector to camera, iPad in hand | "I'm a field inspector. My day is planned, packaged and provable." | PA-INS scope |
| F3 | Real `/field` workspace over shoulder: assigned visits, pre-start lock | "I see exactly what's assigned, what's blocked, and what's next." | RTE-013; pre-start lock truth |
| F4 | Geofenced arrival card | "I can't start until I've truly arrived — and everything I capture survives offline." | geofence + offline outbox truth |
| F5 | Poster end-card | — | — |

### CH-PA-REV — Reviewer (office)
F1 review office → F2 "I decide what stands and what returns." → F3 real `/reviews/:id`: one-open-review, return with sections → "When I return work, I say exactly which sections — the rest stays locked." (RTE-025; returned_sections truth) → F4 "Approved versions become immutable record." → F5 end-card.

### CH-PA-LEAD — Minister / Leadership (government office)
F1 ministry corridor → F2 "I need the national picture — and I need to trust it." → F3 real `/dashboard`: KPIs with freshness, drilldown, an explicit unavailable tile in frame → "Every number shows its definition and source. When data isn't governed yet, it says so." (RTE-045 truth) → F4 "No black boxes." → F5 end-card. *Note: chapter label "Minister" pending `SPONSOR_DECISION`; runtime boundary is `leadership`.*

Remaining 10 chapters (PA-ADM-COMP/FORM/WF/RISK/GIS/SEC, PA-PLN, PA-OPS, PA-AUD, PA-FREP) follow the pattern; their F3 routes come from the content matrix rows.

---

## 2. S3 task demonstrations — script skeletons (route-bound)

Each TASK: cold open on the route (state named on a chip) → 3–6 steps → outcome state → "what happens after" line. Mandatory footer: route, persona, product commit, release tag.

Anchor set (full list in content matrix):
- TASK-PLN-01 Publish a bulk plan (`/planning/bulk` → `/planning/bulk/review`; draft→validated→published)
- TASK-PLN-02 Create an immediate visit (`/planning/immediate`; urgency reasons incl. Other+notes)
- TASK-INS-01 Prepare for a visit (`/field`, `/factories/:id`)
- TASK-INS-02 Arrive with geofence; request override honestly (one attempt; Operations decides)
- TASK-INS-03 Capture evidence offline and watch it sync (outbox states)
- TASK-INS-04 Submit and understand immutability (negative demo included)
- TASK-INS-05 Handle a returned review (edit only returned sections; resubmit)
- TASK-VIR-01 Run a virtual session (OTP verify, timeline, provider-pending room, close)
- TASK-REV-01 Start and decide a review (race message if already started; return with sections)
- TASK-AUD-01 Replay an inspection in the flight recorder (`/admin/audit`)
- TASK-OPS-01 Monitor live operations (projected-movement label spoken)
- TASK-LEAD-01 Read the dashboard: definition, freshness, drilldown, unavailable states
- TASK-ADM-01 Localization workflow (`/admin/localization`)

---

## 3. Inspector learning journey — full storyboard (S2+S3 composite, 8 stages)

| Stage | Board beats | Routes/states | Truth labels |
|---|---|---|---|
| 1 Assignment & preparation | Workspace scan → assigned visit card → Factory 360 context | `/field`, `/factories/:id` | provenance rows; unavailable map/boundary rows shown honestly |
| 2 Route & geofence truth | Route preview labeled projected → drive montage → arrival radius | `/field/:visitId` | `PROVIDER_DEP` Google Routes unavailable; projected ≠ GPS |
| 3 Physical inspection | Arrival card → question flow → valid next action | `/field/:visitId`, `/field/inspection/:id` | — |
| 4 Virtual inspection | OTP verify → timeline → provider-pending room → close | `/virtual/:id` | video `PROVIDER_DEP`; S15 offline = disabled, nothing queued |
| 5 Evidence | Photo/comment at arrival → linked capture → custody chip | field routes | REC-042/043 framing is `IMPROVEMENT`, narrate current behavior only |
| 6 Offline/sync/conflict | Airplane-mode capture → outbox queued → reconnect → replay → conflict surfaced | field routes | never silently overwritten; stale-replay guard |
| 7 Submission | Pre-submit check → submit → immutable chip → negative edit attempt fails | `/field/inspection/:id` | immutability |
| 8 Return & correction | Return notice → returned sections highlighted → scoped v2 → resubmit → approved | `/reviews/:id` → field | golden journey close |

## 4. Minister/Leadership onboarding chapter — full storyboard

| Beat | Visual | Narration point | Truth |
|---|---|---|---|
| B1 | Dashboard opens | national picture, governed scope | RTE-045 |
| B2 | Metric drilldown | definition, numerator/denominator, lineage | REC-026 direction; current drilldowns as implemented |
| B3 | Freshness chips | when data was true | implemented freshness surfaces |
| B4 | Unavailable tiles | "not governed yet" honesty | explicit unavailable states list |
| B5 | Map/list | list is the working equivalent today; synchronized map is proposed | `PROVIDER_DEP` + `IMPROVEMENT` |
| B6 | AI composer area | `AI briefing not enabled`; what governed AI will require (citations, uncertainty, cannot-answer, human action separation) | `PROVIDER_DEP` + `SPONSOR_DECISION`; never a fabricated answer on screen |
| B7 | Close | "You decide; the platform proves." | — |

## 5. S4 explainers — one-line premises

EXPL-01 The spine (six phases, one loop) · EXPL-02 Immutable versions (why you cannot edit history) · EXPL-03 One open review (why decisions do not collide) · EXPL-04 The offline outbox (nothing is lost, nothing is silently overwritten) · EXPL-05 Geofence & override (arrival is proven; exceptions are governed) · EXPL-06 Provenance & freshness (every number has a source and a time) · EXPL-07 Honest unavailability (why some tiles say not available) · EXPL-08 Arabic-first by design (RTL, bilingual records).

## 6. Storyboard production notes

- All boards reference the KSA storyboard pack (20 pages) for setting/composition inspiration only — pattern research, never direct copy (design policy).
- Frames containing screens are placeholders until capture against a named commit; boards ship to Claude Design with empty screen frames plus the route/state annotation.
- Every board carries the item ID and truth-class strip so a reviewer can reject an untrue frame at board stage, before money is spent.
