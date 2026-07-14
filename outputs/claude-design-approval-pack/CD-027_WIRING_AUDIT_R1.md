# CD-027_WIRING_AUDIT_R1.md
**CD-027 / SCR-WEB-210 / P03 — Visit Detail (`/visits/:id`) — independent wiring audit**

- Sponsor approval: **Vikram Indla, 2026-07-14** (recorded here per DEC-012; authorizes Track 1 implementation).
- Baseline reverify: current `HEAD 8af0185` (branch `feat/cd-026-visit-management`); `9360fc9` present in history. `setup/Inspection` not used. Working tree dirty — preserved.
- Method: 14 legs of `WIRING_MAP_CD-027.csv` checked path-by-path against live sources: `page.tsx`, `ActionBar.tsx`, `Attachments.tsx`, `NotesEditor.tsx`, `actions.ts`, `loading.tsx`.

## Leg-by-leg verdict

| leg | claim | local truth | verdict |
|----|-------|-------------|---------|
| 1 Open detail | RLS scope; not-found vs error distinct; query-fail neutral | `page.tsx:29` `.maybeSingle()`; `!v`→not-found (`:42`), `vErr`→**raw `vErr.message`** (`:39`) | PASS action / **ERRORMAP: raw error text leaked** |
| 2 Linked reads | degraded chapter when a join fails; base intact | single embedded query (`:21-29`) — a failing embed errors the whole page; **no per-chapter degradation** | PARTIAL — S33-degraded not implemented (Track 2) |
| 3 Audit read | order desc limit 30; limit disclosed; no-audit state | `:34-37` exact `.limit(30)`; empty state discloses "or you don't have audit-read access" (`:203`); **numeric cap not shown to user** | PASS (minor: cap not disclosed) |
| 4 Return | reason mandatory + published; notify queued | `returnVisit` `:43` reason check, `.eq(planning_status,published)`, notify best-effort | PASS action / **copy overclaims "inspector notified"** |
| 5 Republish | returned guard; same ID; notify queued | `republishVisit` `:56` `.eq(returned)`; notify fire-and-forget (result ignored) | PASS / **copy overclaims "inspector notified"** |
| 6 Cancel | reason + published/new; no assignment-release claim | `cancelVisit` `:69` guardPublishedNew, row-count check; no release | PASS / ASSIGNMENT_RELEASE (blocked) + **copy overclaim** |
| 7 Reschedule | end>start + published/new | `rescheduleVisit` `:91` NaN + end<=start + guard + row-count | PASS / **copy overclaim** |
| 8 Change type | reference values + pre-start + published/new | `updateVisitType` `:179` VISIT_TYPES + guardPreStart + guardPublishedNew | PASS |
| 9 Reassign | current assignment + pre-start; notify NEW; prev-notify not proven | `reassignVisit` `:201` guardPreStart, updates assignment, notifies **new only** | PASS new / **copy "both parties notified" is FALSE — only new inspector written** (NOTIFY_PREV blocked) |
| 10 Expiry | system trigger; no manual control | no manual expire control in UI; expired shown view-only | PASS |
| 11 Notes | RLS; input preserved on fail | `updateVisitNotes` `:159` row-count→"RLS denied"; `NotesEditor` uncontrolled textarea keeps input | PASS |
| 12 Attachment upload | storage THEN insert; orphan not contracted | `uploadVisitAttachment` `:117` upload→insert; **insert-fail orphans object**; raw `error.message` | PASS action / **ORPHAN blocked + ERRORMAP leak** |
| 13 Download/remove | signed URL; soft-delete; failure neutral | `page.tsx:65` signed 1h; `removeVisitAttachment` `:140` soft-delete; **`Attachments.tsx:75` shows raw `urlError`** | PASS / **ERRORMAP: raw signed-URL error leaked** |
| 14 Op/journey/insp/review read | read-only; no mutation from detail | journey/inspection/review rendered read-only; no writes | PASS |

## Findings that Track 1 fixes (approved, prompt §3)
- **F1 — notification copy overclaim** (legs 4/5/6/7): "inspector notified" implies delivery; write only queues a row. → replace with "notification queued".
- **F2 — false claim** (leg 9): "both parties notified" — previous inspector is never written. → "new inspector notification queued". Previous-inspector notify stays `HANDOFF_BLOCKED_NOTIFY_PREV`.
- **F3 — scattered action states**: build available / disabled-with-why / unavailable zones (ActionBar UPDATE).
- **F4 — no dual-state ribbon**: five domains rendered as loose lozenges/sections; build `DualStateRibbon`.

## Findings deferred (Track 2 — blocked, NOT touched here)
- **ERRORMAP** (legs 1/12/13): raw Supabase `.message` surfaced (`page.tsx:39`, `Attachments.tsx:75`, `actions.ts` upload). Sanitized neutral mapping = `HANDOFF_BLOCKED_ERRORMAP` → `actions.ts` error paths PRESERVE.
- **DEGRADED** (leg 2): per-chapter join degradation not implemented; whole-page error today.
- **ORPHAN** (leg 12), **ASSIGNMENT_RELEASE** (leg 6), **ATOMIC**, **MAP** (S34): unchanged.

## Track 2 remediation — closed 2026-07-14 (sponsor-authorized)
| leg | action | result |
|----|--------|--------|
| **ERRORMAP** (1/12/13) | new `neutral.ts` `mapError()`; applied to every `page.tsx`/`actions.ts` raw `.message` return + signed-URL error | **CLOSED** — no provider/SQL/table text reaches the user; RLS/not-found/conflict get specific-but-neutral copy, rest collapses to "nothing was modified" |
| **ORPHAN** (12) | `uploadVisitAttachment`: on insert failure, `storage.remove([path])` compensating cleanup before neutral error | **CLOSED** — no orphaned object survives a failed registration |
| **NOTIFY_PREV** (9) | `reassignVisit`: capture prev `inspector_id` before update, best-effort notify via existing REF-014 `assignment` event + `inapp` channel (`released:true`) | **CLOSED** — no new notification policy invented |

## Still blocked (NOT closed — would breach a hard rule)
| leg | why it stays blocked |
|----|----------------------|
| **MAP** (S34) | closing needs a map provider + geofence values — "Never invent a map/provider/geofence." Journey list remains authoritative. |
| **ASSIGNMENT_RELEASE** (6) | whether cancel releases the assignment (and to what state value) is an open product/state-machine decision — cannot self-approve; would risk inventing an assignment state. |
| **ATOMIC** | making the notify write transactional with the primary write would change the accepted "primary commits, notify best-effort" contract — "no accepted behavior may be weakened." Needs its own change-control + RPC migration. |

## Deviation from PRESERVE default
`actions.ts` is PRESERVE, but prompt §3 explicitly authorizes replacing the two overclaim strings. Only user-facing success strings change (F1/F2); **no guard, transition, RLS filter, write, audit, or notification behavior is altered.** All error strings (ERRORMAP) untouched.
