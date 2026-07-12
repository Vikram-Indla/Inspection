# Fable Understanding Gate Prompt

Do not design screens yet.

Read the complete MIM Inspection project from:

- `/Users/vikramindla/Documents/GitHub/Inspection`
- `/Users/vikramindla/Documents/GitHub/Inspection/MIM_Inspection_MVP1_Historical_Archives_v3`
- `/Users/vikramindla/Documents/GitHub/Inspection/MIM_Inspection_Meta_Astryx_Fable_Pack`

Authority order:
1. current reconciled repository documentation;
2. historical archive only for completeness/provenance;
3. Meta-Astryx pack only for design direction.

Mobbin is explicitly out of scope. Do not use Mobbin MCP or any Mobbin reference.

Your task is to prove that you understand the complete project before design begins.

Produce one structured Understanding Report containing:

1. Product purpose, business outcomes and MVP1 boundaries.
2. Complete inspection lifecycle from configuration through planning, execution, review and operations.
3. Every persona, permission and data-scope rule.
4. All channels: Admin, Web, Operations, iPad and Virtual.
5. Every module and how modules depend on each other.
6. Core domain objects and version relationships.
7. Every approved user journey and storyboard.
8. Frontend requirements for each channel.
9. Backend engines, APIs, data, workflow, audit and versioning requirements.
10. Integration requirements, including GIS/maps, GPS/geofence, media/evidence storage, video/media server, OTP/identity, notifications/SLA, digital acknowledgement/signature and external data sources.
11. Offline package, autosave, outbox, retry, idempotency and conflict behavior.
12. Security, RBAC, immutable records, audit and evidence rules.
13. Performance, availability, accessibility, Arabic/RTL, responsive and degraded-service requirements.
14. Every acceptance-criteria family and what its input, visible result, system result, failure result and proof must be.
15. Full traceability:
   Requirement → Journey → Storyboard → Screen → State → Action → Acceptance criterion.
16. Contradictions, missing values, unresolved decisions and provider-dependent matters.

For each statement, cite the exact source file and section or stable ID.

Do not invent providers, thresholds, SLAs, legal rules, workflow, fields or permissions.

End with:
- source files read;
- requirement count;
- journey count;
- storyboard count;
- screen count;
- acceptance count;
- unresolved questions;
- confidence by domain;
- a signed declaration: `READY_FOR_REVIEW`, not `APPROVED`.

Stop after the report. Do not start Astryx or any screen design.
