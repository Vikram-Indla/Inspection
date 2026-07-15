# ACCEPTANCE CHECKLIST — CD-012 → CD-019 (master)

Verdict per screen: READY_FOR_DESIGN_REVIEW. Grade not self-awarded.

## Contract coverage
- [x] 8 screens, 95 states total — every prompt-mandated state present per screen (see STATE_MATRIX); shared feedback states (empty/loading/unauthorized/offline/stale-or-degraded) on all.
- [x] Mandatory objects rendered per screen contract (library objects, canvas/inspector/replay, drivers/weights/thresholds/trace, layers/points/polygons/thresholds, event/recipient/channel/template/timer/escalation/provider, role/matrix/scope/simulator, search/filter/EN/AR/status/history/restore/export, search/filters/correlation/stream/diff/integrity).
- [ ] Fable 493/478 row filtering — HANDOFF_BLOCKED_FABLE_LEDGER (CSVs not readable); mapping deferred without design rework.

## Truth discipline (A5.2)
- [x] Three visible tiers everywhere; blocked inputs render as struck placeholders with seam ids, never numbers/guards.
- [x] CD-012/013 use only proposeWorkflowDraft / saveWorkflowDraft / approvePublishWorkflow; publish = draft→published; SoD + immutability as contract boundaries.
- [x] No invented delivery success (CD-016 outbox-only), no black-box score (CD-014 trace), no editable audit rows (CD-019), no map false-confidence (CD-015 provenance stack).
- [x] CD-016 carries HANDOFF_BLOCKED_ROUTE on the whole surface (no dedicated route exists).

## Ambition V2
- [x] Signature interactions: lifecycle/version lineage (012), scenario replay preview + invalid-edge guard (013), why-this-factory trace (014), location confidence stack (015), SLA timeline + provider truth (016), can-this-user-do-this explainer (017), context+drift cues (018), stream/timeline/diff over one audit identity (019).
- [x] Genericity test: inspection objects (factory, visit, version, evidence, clause, violation, audit event) structure every screen.
- [x] Three-hypothesis discipline recorded for CD-012 (R2 package); series decision matrices summarized in runtime-truth-ledger.md §Candidates.

## Arabic / RTL / themes / responsive
- [x] Full-document RTL with realistic Arabic; mixed-direction IDs/dates/codes kept LTR inline; dark+light without semantic change; 1440/1024/412 behavior in harness; captures in final/.

## Accessibility
- [x] Skip links, aria-current, aria-disabled on governance-blocked actions, aria-busy loading, no colour-alone status (glyph+text lozenges + tags), 44px command controls / ≥32px row actions, 16px body, reduced-motion inherits from Astryx tokens.

## Evidence & packaging
- [x] 24 native uncropped frames with in-frame DESIGN FIXTURE watermark; SHA-256 + dimensions in CAPTURE_MANIFEST.
- [x] Single root outputs/cd-012-019-master/; inventory + preflight included.
- [x] Non-executable handoff: design never wrote to the repository; implementation gated on Codex wiring audit + human-approved manifest (A10).
