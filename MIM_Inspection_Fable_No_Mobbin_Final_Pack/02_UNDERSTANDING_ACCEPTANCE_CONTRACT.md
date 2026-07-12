# Understanding Acceptance Contract

Fable's Understanding Report is reviewed by Claude and the human owner.

## Required domains

The report must correctly cover:

- Business scope and operating model
- Functional journeys and storyboards
- Admin control plane
- Web planning and management
- Operations command centre
- iPad field execution
- Virtual inspection
- Backend engines and APIs
- Data model and versioning
- Workflow and audit
- Evidence, media and storage
- GIS, GPS and geofence
- OTP and identity
- Notifications and SLA
- Video/media server
- Digital acknowledgement/signature
- External integrations
- Offline and conflict handling
- RBAC and security
- Performance and reliability
- Accessibility, Arabic and RTL
- Acceptance criteria and evidence

## PASS conditions

PASS requires:

1. Every current mandatory requirement domain is represented.
2. Every approved journey is represented.
3. Every storyboard is represented.
4. Every required screen family is represented.
5. All five channels are represented.
6. Admin is understood as governed configuration, versioning and maker-checker—not generic CRUD.
7. iPad is understood as offline-first field execution—not a compressed web portal.
8. Web covers planning, visit management, review and Factory 360.
9. Operations covers live status, maps, telemetry, alerts, exceptions and drilldown.
10. Virtual covers appointment, identity verification, session execution and shared inspection behavior.
11. All backend and integration dependencies are represented.
12. Acceptance criteria are explained as input, UI result, system result, failure path and proof.
13. No current artifact is overridden by a historical one.
14. No business or technical rule is invented.
15. Every unresolved matter is explicitly listed.
16. Traceability has no unexplained gaps.

## Result

The reviewer records exactly one:

- `PASS`
- `PASS_WITH_NAMED_QUESTIONS`
- `FAIL_RETURN_FOR_CORRECTION`

Fable may receive the design-loop prompt only after PASS or explicitly approved PASS_WITH_NAMED_QUESTIONS.
