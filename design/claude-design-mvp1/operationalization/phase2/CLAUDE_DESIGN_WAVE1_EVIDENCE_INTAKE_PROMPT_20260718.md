# Claude Design — Phase 2 Wave 1 evidence intake

Use this prompt in the existing **Saqeel Inspection Persona Coverage** Claude
Design project. Do not create a replacement project or a new design system.

## Prompt

Read the repository design authority beginning at
`design/claude-design-mvp1/00_START_HERE.md`, then read
`design/claude-design-mvp1/operationalization/phase2/CLAUDE_DESIGN_WAVE1_EVIDENCE_INTAKE_20260718.yaml`.

This is an evidence-intake pass, not a redesign pass. The tested runtime is
`setup/Inspection` at commit
`1422127c2e113105b67a297f95398e3e91674e38`. Keep the existing
`CD-030 R2 Clean Submission` design system and the approved light-first
government foundation. Preserve routes, roles, state transitions, audit,
provider truth, immutable boundaries, input geometry and all product-contract
behavior.

Update the five existing Tier-1 work areas exactly as named in the manifest:

1. Attach and label only the three artifacts whose `upload_readiness` begins
   `READY_`: one `SCR-ADM-001` image and two `SCR-WEB-130` images.
2. Do **not** upload, reproduce, or treat the two `SCR-WEB-200` images as
   design inputs. They are `QUARANTINED_UNSAFE_ROUTE_CAPTURE_NOT_A_DESIGN_INPUT`:
   `/visits` invokes `expire_lapsed_visits` on GET, which can update visits and
   insert notifications. It also exposes operational rows. Add a quarantine
   placeholder only, citing the exact canonical proof at
   `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/operationalization/phase2/P2-EVID-001_TIER1_PREFLIGHT.md`.
3. For every attached artifact, show the screen, route, persona, state,
   locale/direction, theme, browser viewport, actual PNG dimensions, tested
   commit and SHA-256. Label it `AS-IS APPEARANCE EVIDENCE ONLY`.
4. Add the manifest's finding questions beside the corresponding frame. Return
   observations and competing design hypotheses, but do not select or implement
   a redesign in this pass.
5. Add every item in `blocked_combinations` to its exact work area as
   `BLOCKED / SCREENSHOT REQUIRED`. Do not invent the missing persona, state,
   data, Arabic frame, route guard or provider behavior.
6. Treat the Inspector `/admin` image as evidence of current negative route
   truth, not as an approved unauthorized design and not as an Admin-persona
   frame.
7. Compare the Planner and Authorized Inspector immediate-visit frames only for
   information hierarchy, role comprehension, irreversible-action clarity,
   responsive behavior and truthful provider/audit wording.
8. For Visit Management, record only that two observational captures exist and
   are quarantined because the route mutates on GET and the frames contain
   operational rows. The 8873 px EN and 13579 px AR dimensions may be recorded
   as provenance, but do not inspect, reproduce, critique, or design from those
   images until an explicit approved exception exists.
9. Apply the same route-wide hold to `SCR-WEB-500`: `/operations` invokes
   `expire_stale_geo_override_requests` on GET and can update workflow status.
   Keep all personas, states and profiles blocked even if authentication later
   becomes available.

Return:

- an intake table containing the three clean current-state inputs, two
  quarantined observational records, and every blocked result;
- observations separated from hypotheses;
- P0 route/RBAC, privacy or truthfulness concerns;
- P1 hierarchy, density, RTL, responsive and accessibility concerns;
- the next exact screenshot needed for each unresolved work area;
- `EVIDENCE_INTAKE_COMPLETE_DESIGN_REVIEW_NOT_READY`.

Never self-approve, modify application code, change product state, or mark a
screen/design complete. This packet was authored in the retired Documents
checkout: mark its repository adoption as `RECONCILIATION_REQUIRED` until the
control agent copies it into `/Users/vikramindla/Developer/Inspection`.
