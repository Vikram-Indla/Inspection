import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./golden-journey.spec.ts", import.meta.url), "utf8");
const inspectorLogin = source.slice(
  source.indexOf("async function journeyInspectorPage"),
  source.indexOf("test.beforeAll"),
);
const fieldPage = readFileSync(new URL("../src/app/(app)/field/[visitId]/page.tsx", import.meta.url), "utf8");
const startup = readFileSync(new URL("../src/app/(app)/field/[visitId]/Startup.tsx", import.meta.url), "utf8");
const inspectionPage = readFileSync(new URL("../src/app/(app)/field/inspection/[id]/page.tsx", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../src/app/(app)/field/inspection/[id]/Workspace.tsx", import.meta.url), "utf8");
const ocrCapture = readFileSync(new URL("../src/components/field/OcrEvidenceCapture.tsx", import.meta.url), "utf8");
const signatureHelper = readFileSync(new URL("./sign-helper.ts", import.meta.url), "utf8");
const negativeSubmit = source.slice(source.indexOf("// NEG: submit"), source.indexOf("// 1x1 PNG"));
const blockerResolution = source.slice(source.indexOf("// Blocking action form"), source.indexOf("// Server truth: v1"));
const reviewerJourney = source.slice(source.indexOf('test("P3 reviewer'), source.indexOf('test("P5 reviewer'));
const finalReviewerJourney = source.slice(source.indexOf('test("P5 reviewer'));

test("golden P1 resolves controlled Inspector candidates without stale fixture credentials", () => {
  assert.match(source, /const controlledCredentials = \[goldenInspectorPersona\(\)/);
  assert.match(source, /email: PERSONAS\.inspector\.email/);
  assert.match(source, /controlledCredentials\.map/);
  assert.match(source, /selectLeasedControlledInspector/);
  assert.doesNotMatch(source, /9b4d2c98-c284-49c1-81ee-d418efc23c31/);
  assert.doesNotMatch(source, /g10-inspector-1784679710389@mim\.gov\.sa/);
});

test("golden P1 fails closed unless the reserved controlled Inspector is governed and available", () => {
  assert.match(source, /rpc\/acquire_nonproduction_golden_inspector_lease/);
  assert.match(source, /p_candidate_ids: controlledInspectorCandidates\.map/);
  assert.match(source, /p_window_start: visitWindowStart/);
  assert.match(source, /p_window_end: visitWindowEnd/);
  assert.match(source, /rpc\/list_available_supervision_inspectors/);
  assert.match(source, /authoritativeInspectorIds/);
  assert.match(source, /reserved Inspector must remain authoritatively available/);
  assert.match(source, /selectAvailableControlledInspector/);
  assert.match(source, /option:not\(\[value=""\]\)/);
  assert.match(source, /Planner selector must expose an eligible Inspector/);
  assert.match(source, /Planner selector must expose a controlled Inspector/);
  assert.match(source, /\.toContain\(inspectorUserId\)/);
  assert.match(source, /await inspectorSelect\.selectOption\(proposedInspectorUserId\)/);
});

test("golden P2 Inspector login uses the governed structural form helpers", () => {
  assert.match(source, /identifierField,/);
  assert.match(source, /passwordField,/);
  assert.match(inspectorLogin, /identifierField\(page\)\.fill\(inspectorCreds\.email\)/);
  assert.match(inspectorLogin, /passwordField\(page\)\.fill\(inspectorCreds\.password\)/);
  assert.doesNotMatch(inspectorLogin, /locator\(["']#email["']\)/);
  assert.doesNotMatch(inspectorLogin, /locator\(["']#pw["']\)/);
});

test("golden P2 requires the shared Dashboard landing and useful content before field navigation", () => {
  assert.match(inspectorLogin, /url\.pathname === "\/dashboard"/);
  assert.match(inspectorLogin, /#role-dashboard-summary/);
  assert.match(inspectorLogin, /not\.toContainText\("ERR-AUTH"/);
  assert.match(inspectorLogin, /P2_LOGIN_STEP_TIMEOUT/);
  assert.doesNotMatch(inspectorLogin, /pathname\.startsWith\("\/field"\)/);
  assert.match(source, /P2 Inspector opens the governed field journey/);
  assert.match(source, /page\.goto\("\/field"\)/);
});

test("golden P1 uses only configured controlled candidates through the guarded lease", () => {
  const personas = readFileSync(new URL("./personas.ts", import.meta.url), "utf8");
  assert.match(personas, /SAQEEL_TEST_MULTI_ROLE_EMAIL", "golden alternate inspector"/);
  assert.match(personas, /primaryCohortPassword\("golden alternate inspector"\)/);
  assert.doesNotMatch(personas, /GOLDEN_INSPECTOR_(?:LEASE|SLOT|WINDOW)/);
  assert.match(source, /serviceFixtureRest\("POST", "rpc\/acquire_nonproduction_golden_inspector_lease"/);
  assert.match(source, /serviceFixtureRest\("POST", "rpc\/release_nonproduction_golden_inspector_lease"/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
});

function allocate(targets, existing, proposedStart) {
  const targetIds = new Set(targets.map(row => row.id));
  if (targetIds.size !== targets.length) throw new Error("duplicate visits");
  const ordered = [...targets].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  const occupied = existing.filter(row => !targetIds.has(row.id)).map(row => ({ start: row.start, end: row.end }));
  const result = [];
  let cursor = proposedStart - 60_000;
  for (const target of ordered) {
    const duration = target.end - target.start;
    if (!(duration > 0)) throw new Error("unsafe duration");
    let attempts = 0;
    while (true) {
      const end = cursor;
      const start = end - duration;
      const collisions = occupied.filter(slot => slot.start < end && slot.end > start);
      if (!collisions.length) {
        result.push({ id: target.id, start, end, duration });
        occupied.push({ start, end });
        cursor = start - 60_000;
        break;
      }
      cursor = Math.min(...collisions.map(slot => slot.start)) - 60_000;
      if (++attempts > existing.length + targets.length) throw new Error("no safe slot");
    }
  }
  return result;
}

test("golden rollover deterministically allocates unique duration-preserving slots", () => {
  const minute = 60_000;
  const targets = [
    { id: "b", start: 20 * minute, end: 50 * minute },
    { id: "a", start: 10 * minute, end: 70 * minute },
  ];
  const first = allocate(targets, [], 200 * minute);
  const second = allocate([...targets].reverse(), [], 200 * minute);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map(slot => slot.id), ["a", "b"]);
  assert.deepEqual(first.map(slot => slot.duration), [60 * minute, 30 * minute]);
  assert.ok(first[0].start >= first[1].end + minute);
});

test("golden rollover skips existing retired collisions and fails closed on ambiguity", () => {
  const minute = 60_000;
  const slots = allocate(
    [{ id: "target", start: 0, end: 60 * minute }],
    [{ id: "retired", start: 100 * minute, end: 180 * minute }],
    200 * minute,
  );
  assert.equal(slots[0].end, 99 * minute);
  assert.throws(() => allocate([
    { id: "duplicate", start: 0, end: minute },
    { id: "duplicate", start: minute, end: 2 * minute },
  ], [], 200 * minute), /duplicate visits/);
  assert.throws(() => allocate([{ id: "invalid", start: minute, end: minute }], [], 200 * minute), /unsafe duration/);
});

test("golden rollover source sorts stably, preserves duration and refuses unprovable slots", () => {
  assert.match(source, /left\.start\.getTime\(\) - right\.start\.getTime\(\) \|\| left\.row\.visit_id\.localeCompare\(right\.row\.visit_id\)/);
  assert.match(source, /const duration = target\.end\.getTime\(\) - target\.start\.getTime\(\)/);
  assert.match(source, /occupied\.push\(\{ start, end \}\)/);
  assert.match(source, /attempts > existing\.length \+ targets\.length/);
  assert.match(source, /cannot prove a collision-free retirement window/);
});

test("golden P1 resolves the controlled Inspector persona without inventing lease-scoped env vars", () => {
  const personas = readFileSync(new URL("./personas.ts", import.meta.url), "utf8");
  assert.match(personas, /SAQEEL_TEST_MULTI_ROLE_EMAIL", "golden alternate inspector"/);
  assert.match(personas, /primaryCohortPassword\("golden alternate inspector"\)/);
  assert.doesNotMatch(personas, /GOLDEN_INSPECTOR_(?:LEASE|SLOT|WINDOW)/);
  // NB: unlike an earlier assumption, main's golden-journey.spec.ts did NOT
  // retire the lease-based selection path — it kept it as one of two
  // candidate-resolution strategies alongside the newer multi-candidate
  // approach (see "golden rollover is candidate-scoped..." below), so
  // acquire/verify_nonproduction_golden_inspector_lease legitimately still
  // appear in source for the leased path.
});

test("golden rollover is candidate-scoped and refuses non-harness assignments", () => {
  assert.match(source, /async function retireOverlappingGoldenAssignments\([\s\S]*controlledInspectorId: string/);
  assert.match(source, /inspector_id=eq\.\$\{controlledInspectorId\}/);
  assert.match(source, /visits\.factories\.factory_code=like\.R3-QA-CERT-\*/);
  assert.match(source, /startsWith\("R3-QA-CERT-"\)/);
  assert.match(source, /refusing to reschedule a non-golden assignment/);
  assert.match(source, /for \(const candidate of controlledInspectorCandidates\)/);
  assert.match(source, /candidate\.userId/);
  assert.doesNotMatch(source, /retireOverlappingGoldenAssignments\(planner\.jwt, inspectorUserId/);
});

test("golden fresh window is current, minute-aligned and identical across cleanup and Planning UI", () => {
  const journeyGuard = readFileSync(new URL("../../../supabase/migrations/20260721140000_execution_journey_cancellation.sql", import.meta.url), "utf8");
  const immediateGuard = readFileSync(new URL("../../../supabase/migrations/20260729022000_immediate_supervision_lifecycle.sql", import.meta.url), "utf8");
  assert.match(journeyGuard, /now\(\) < v_visit\.window_start or now\(\) > v_visit\.window_end/);
  assert.match(immediateGuard, /p_window_start < clock_timestamp\(\) - interval '15 minutes'/);
  assert.match(source, /startDate\.setUTCSeconds\(0, 0\)/);
  assert.match(source, /startDate\.setUTCMinutes\(startDate\.getUTCMinutes\(\) - 1\)/);
  assert.match(source, /startDate\.getTime\(\) \+ 90 \* 60_000/);
  assert.match(source, /p_window_start: visitWindowStart/);
  assert.match(source, /p_window_end: visitWindowEnd/);
  assert.match(source, /fill\(visitWindowStartInput\)/);
  assert.match(source, /fill\(visitWindowEndInput\)/);
  const fillWizard = source.slice(source.indexOf("async function fillWizard"), source.indexOf('test("NEG: publish'));
  assert.doesNotMatch(fillWizard, /Date\.now\(\) - 36e5/);
});

test("golden fresh window rejects invalid time and remains losslessly datetime-local", () => {
  assert.match(source, /Number\.isFinite\(now\.getTime\(\)\)/);
  assert.match(source, /startInput: start\.slice\(0, 16\)/);
  assert.match(source, /endInput: end\.slice\(0, 16\)/);
  assert.match(source, /const freshWindow = freshGoldenWindow\(\)/);
});

test("golden fixture copies governed GIS authority and fails closed without a valid source", () => {
  assert.match(source, /function acceptedSeedGeofenceRadius\(\)/);
  assert.match(source, /"supabase", "migrations", "0001_foundation\.sql"/);
  assert.match(source, /accepted GIS seed must provide version provenance/);
  assert.match(source, /async function governedFixtureGeofenceRadius\(plannerJwt: string\)/);
  assert.match(source, /engine_settings\?engine=eq\.gis&select=settings,version_label&limit=1/);
  assert.match(source, /settings\?\.geofence_default_radius_m/);
  assert.match(source, /Number\.isFinite\(liveRadius\)/);
  assert.match(source, /liveRadius > 0/);
  assert.match(source, /Number\.isInteger\(liveRadius\)/);
  assert.match(source, /must provide version provenance/);
  assert.match(source, /return acceptedSeedGeofenceRadius\(\)/);
  assert.match(source, /geofence_radius_m: fixtureGeofenceRadius/);
  assert.doesNotMatch(source, /geofence_radius_m:\s*150/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("golden P2 recovery accepts only the exact owned active FS-101 journey", () => {
  assert.match(source, /GOLDEN_RECOVERY_VISIT_ID/);
  assert.match(source, /recovery visit must resolve to exactly one governed row/);
  assert.match(source, /startsWith\("R3-QA-CERT-"\)/);
  assert.match(source, /checkpoint === "on_the_way\/on_journey"/);
  assert.match(source, /checkpoint === "arrived\/arrived"/);
  assert.match(source, /not at the same approved P2 checkpoint/);
  assert.match(source, /not assigned only to the controlled Inspector/);
  assert.match(source, /no single controlled journey/);
  assert.match(source, /PKG-UAT-GOLDEN-FS101/);
  assert.match(source, /includes\("FS-101"\)/);
  assert.match(source, /test\.skip\(!!RECOVERY_VISIT_ID/);
  assert.doesNotMatch(source, /RECOVERY_VISIT_ID[\s\S]{0,500}reschedule_published_visits_atomic/);
});

test("golden P2 recovery resumes after governed check-in without replaying transition buttons", () => {
  assert.match(source, /"submitted_v1" \| "reviewing_v1" \| "returned_v1" \| "submitted_v2" \| "reviewing_v2" \| "approved_v2" \| null/);
  assert.match(source, /if \(recoveryCheckpoint !== "after_checkin"\)/);
  assert.match(source, /if \(recoveryCheckpoint === "after_checkin"\)/);
  assert.match(source, /name: "Arrival evidence", exact: true, level: 5/);
  assert.match(source, /hasText: "inside fence"/);
});

test("golden P2 recovery resumes only an exact started inspection checkpoint", () => {
  assert.match(source, /\["executing\/completed", "submitted\/completed", "under_review\/completed"\]\.includes\(checkpoint\)/);
  assert.match(source, /inspections\?visit_id=eq\.\$\{RECOVERY_VISIT_ID\}/);
  assert.match(source, /inspectorSession\.jwt\), "read recovery inspection"/);
  assert.match(source, /inspections\.length !== 1/);
  assert.match(source, /inspections\[0\]\.status === "in_progress"/);
  assert.match(source, /!inspections\[0\]\.started_at/);
  assert.match(source, /inspectionId = inspections\[0\]\.id/);
  assert.match(source, /if \(recoveryCheckpoint === "inspection_started"\)/);
  assert.match(source, /page\.goto\(`\/field\/inspection\/\$\{inspectionId\}`\)/);
});

test("golden P2 recovery resumes an exact server-confirmed submitted v1 checkpoint", () => {
  assert.match(source, /"submitted_v1"/);
  assert.match(source, /submission_versions\(version_number\)/);
  assert.match(source, /status === "submitted" && versionNumbers\.join\(","\) === "1"/);
  assert.match(source, /"submitted", "under_review"\]\.includes\(row\.operational_state\)/);
  assert.match(source, /"submitted\/completed"/);
  assert.match(source, /verify resumed submission v1/);
  assert.match(source, /if \(recoveryCheckpoint === "submitted_v1"\)/);
  assert.match(source, /getByRole\("heading", \{ name: "Submitted — final submitted version\.", exact: true, level: 2 \}\)/);
});

test("golden journey resumes only exact open-review or returned-v1 governed state", () => {
  assert.match(source, /"under_review"\]\.includes\(row\.operational_state\)/);
  assert.match(source, /reviews\(decision,returned_sections,decided_at\)/);
  assert.match(source, /reviews\.filter\(review => !review\.decided_at\)\.length === 1/);
  assert.match(source, /decidedReturns\.length !== 1/);
  assert.match(source, /returned_sections\?\.length !== 1/);
  assert.match(source, /verify resumed return v1/);
  assert.match(source, /recoveryCheckpoint !== "reviewing_v1"/);
});

test("golden journey resumes only exact submitted, open-review or approved v2 state", () => {
  assert.match(source, /versionNumbers\.join\(","\) === "1,2"/);
  assert.match(source, /recoveryCheckpoint = "submitted_v2"/);
  assert.match(source, /recoveryCheckpoint = "reviewing_v2"/);
  assert.match(source, /recoveryCheckpoint = "approved_v2"/);
  assert.match(source, /verify resumed submission v2/);
  assert.match(source, /name: "Prior decision: 1", exact: true/);
  assert.match(source, /recoveryCheckpoint !== "reviewing_v2"/);
  assert.doesNotMatch(source, /locator\("\.sq-banner--warning"\)/);
});

test("golden P2 scopes arrival evidence through the approved accessible surface", () => {
  assert.match(fieldPage, /arrivalEvidenceHeading: t\("field\.start\.arrivalEvidenceHeading", "Arrival evidence"\)/);
  assert.match(fieldPage, /arrivalComment: t\("field\.start\.arrivalComment", "Arrival comment"\)/);
  assert.match(fieldPage, /arrivalSave: t\("field\.start\.arrivalSave", "Save arrival evidence"\)/);
  assert.match(startup, /<h5>\{strings\.arrivalEvidenceHeading\}<\/h5>/);
  assert.match(startup, /<textarea[^>]+value=\{arrivalComment\}/);
  assert.match(source, /getByRole\("heading", \{ name: "Arrival evidence", exact: true, level: 5 \}\)/);
  assert.match(source, /arrivalSurface\.getByLabel\("Arrival comment"\)/);
  assert.match(source, /arrivalSurface\.getByRole\("button", \{ name: "Save arrival evidence" \}\)/);
  assert.doesNotMatch(source, /Arrival evidence \\(M04-045\\)/);
});

test("arrived recovery projects only an Inspector-scoped immutable arrival event", () => {
  assert.match(fieldPage, /from\("journey_sessions"\)/);
  assert.match(fieldPage, /\.eq\("inspector_id", user\.id\)/);
  assert.match(fieldPage, /from\("geo_events"\)/);
  assert.match(fieldPage, /\.eq\("journey_id", initialJourneyRow\.id\)/);
  assert.match(fieldPage, /\.eq\("kind", "arrival"\)/);
  assert.match(fieldPage, /initialJourneyRow\?\.status === "arrived" && arrivalRows\?\.\[0\]\?\.id/);
  assert.match(fieldPage, /initialJourney=\{initialJourney\}/);
  assert.match(startup, /initialJourney\?\.status === "arrived"/);
  assert.match(startup, /initialJourney\?\.arrivalEventId/);
  assert.doesNotMatch(fieldPage, /service[_A-Z]*role/i);
});

test("golden P2 proves semantic negative-submit refusal without forcing mutation", () => {
  assert.match(inspectionPage, /notReady: t\("field\.ws\.notReady", "\{n\} blocking issue\(s\) — submission will be refused"\)/);
  assert.match(workspace, /aria-disabled=\{blockCount > 0/);
  assert.match(source, /getByText\(\/\^\\d\+ blocking issue\\\(s\\\) — submission will be refused\$\//);
  assert.match(source, /negative submit must expose a positive governed blocker count/);
  assert.match(source, /toBeGreaterThan\(0\)/);
  assert.match(source, /getByRole\("button", \{ name: "Review & submit — final version" \}\)\)\.toHaveAttribute\("aria-disabled", "true"\)/);
  assert.doesNotMatch(negativeSubmit, /\.click\(\{ force: true \}\)/);
  assert.doesNotMatch(negativeSubmit, /\.sq-banner|Blockers:/);
});

test("golden P2 does not impose fresh unanswered state on an owned recovery record", () => {
  assert.match(source, /if \(!RECOVERY_VISIT_ID\) \{\s*\/\/ NEG: submit on a newly created inspection/);
  assert.match(negativeSubmit, /governed recovery record may already contain answers/);
  assert.doesNotMatch(negativeSubmit, /else\s*\{[\s\S]*aria-disabled/);
});

test("golden P2 answers unique governed questions through semantic controls", () => {
  assert.match(workspace, /\{code\} · \{it\.title\}/);
  assert.match(workspace, /aria-pressed=\{val\?\.value === r\}/);
  assert.match(source, /getByRole\("navigation", \{ name: "Inspection sections" \}\)/);
  assert.match(source, /hasText: \/\^\[A-Z\]\{2\}-\\d\+ ·\//);
  assert.match(source, /governed question \$\{code\} must render exactly once/);
  assert.match(source, /must expose one named response/);
  assert.match(source, /toHaveAttribute\("aria-pressed", "true"\)/);
  assert.match(source, /filter\(code => code === "FS-101"\)/);
  assert.doesNotMatch(source, /\.ipad-q/);
  assert.doesNotMatch(source, /toHaveClass\(\/is-answered\//);
});

test("golden P2 completes the approved OCR review modal before continuing", () => {
  assert.match(ocrCapture, /title: "Attach evidence · OCR scan"/);
  assert.match(ocrCapture, /scan: "2 · OCR scan \(optional · advisory\)"/);
  assert.match(ocrCapture, /stored: "Ready to attach as evidence"/);
  assert.match(ocrCapture, /attach: "Attach evidence"/);
  assert.match(ocrCapture, /onClick=\{onAttach\}/);
  assert.match(workspace, /onAttach=\{attachOcrShot\}/);
  assert.match(workspace, /enqueueEvidence\(current\.item, current\.b64, current\.mime, current\.fname, current\.replaceId, "photo"\)/);
  assert.match(source, /name: "Attach evidence · OCR scan", exact: true/);
  assert.match(source, /toContainText\("Ready to attach as evidence"\)/);
  assert.match(source, /getByRole\("button", \{ name: "Attach evidence", exact: true \}\)/);
  assert.match(source, /expect\(ocrDialog\)\.toBeHidden\(\)/);
  assert.match(source, /expect\(q\)\.toContainText\("1\/1 evidence"\)/);
  assert.doesNotMatch(source, /ocrDialog\.(?:press|evaluate)|ocrOverlay/);
});

test("golden P2 reuses exact governed FS-101 evidence or uploads once by its current accessible name", () => {
  assert.match(source, /getByText\(\/\^\\d\+\\\/\\d\+ evidence\$\//);
  assert.match(source, /FS-101 must expose one unambiguous governed evidence count/);
  assert.match(source, /attachedEvidence < requiredEvidence/);
  assert.match(source, /getByLabel\("📷 Mandatory photo", \{ exact: true \}\)/);
  assert.match(source, /missing FS-101 evidence requires exactly one governed photo control/);
  assert.match(source, /FS-101 governed evidence control must remain a file upload/);
  assert.match(source, /FS-101 governed evidence control must accept photo evidence/);
  assert.doesNotMatch(source, /getByLabel\("Mandatory photo", \{ exact: true \}\)/);
  assert.match(source, /getByLabel\("Replace", \{ exact: true \}\)/);
  assert.match(source, /replacement must not be used to satisfy missing evidence/);
  assert.match(source, /existing FS-101 evidence must satisfy the governed minimum/);
  assert.doesNotMatch(source, /q\.locator\(['"]input\[type=["']file["']\]\)/);
  assert.doesNotMatch(source, /getByLabel\("Replace"[^\n]+setInputFiles/);
});

test("golden P2 resolves required finding blockers through unique accessible fields", () => {
  assert.match(blockerResolution, /\["Owner name\*", "Owner role\*", "Required correction\*"\]/);
  assert.match(blockerResolution, /required action field \$\{name\} must render exactly once/);
  assert.match(blockerResolution, /name: "Due at\*", exact: true/);
  assert.match(blockerResolution, /governed action-form due date must be preconfigured/);
  assert.match(blockerResolution, /name: "Finding narrative\*", exact: true/);
  assert.match(blockerResolution, /required finding narrative must render exactly once/);
  assert.doesNotMatch(blockerResolution, /governedDueAt\.fill/);
  assert.doesNotMatch(blockerResolution, /\.sq-panel input|\.panel input/);
});

test("golden P2 submits only after zero blockers and the approved final review", () => {
  assert.match(blockerResolution, /All blocking validations pass — ready to submit/);
  assert.match(blockerResolution, /toHaveCount\(0\)/);
  assert.match(blockerResolution, /toHaveAttribute\("aria-disabled", "false"/);
  assert.match(blockerResolution, /name: "Final review", exact: true/);
  assert.match(blockerResolution, /name: "Confirm and submit", exact: true/);
  assert.match(blockerResolution, /expect\(confirmSubmit\)\.toBeEnabled\(\)/);
  assert.match(blockerResolution, /await confirmSubmit\.click\(\)/);
  assert.match(blockerResolution, /await signAndConfirm\(page\)/);
  assert.doesNotMatch(blockerResolution, /click\(\{ force: true \}\)/);
});

test("golden P2 waits for persisted finding and drives the unique signature surface", () => {
  assert.match(blockerResolution, /getByTestId\("finding-status-FS-101"\)/);
  assert.match(blockerResolution, /finding must persist before final review is requested/);
  assert.match(blockerResolution, /toHaveText\("Finding saved"/);
  assert.match(signatureHelper, /getByRole\("dialog", \{ name: "Factory representative acknowledgement", exact: true \}\)/);
  assert.match(signatureHelper, /getByLabel\("Factory representative acknowledgement", \{ exact: true \}\)/);
  assert.match(signatureHelper, /getByPlaceholder\("Full name as recorded on site", \{ exact: true \}\)/);
  assert.match(signatureHelper, /getByRole\("button", \{ name: "Confirm & submit", exact: true \}\)/);
  assert.doesNotMatch(signatureHelper, /getByRole\("dialog"\);|locator\("canvas"\)|\/full name\/i|\/confirm & submit\/i/);
});

test("golden P3-P5 uses current two-stage review decisions and receipt routes", () => {
  assert.match(reviewerJourney, /name: "Review confirmation", exact: true/);
  assert.match(reviewerJourney, /name: "Review decision before recording", exact: true/);
  assert.match(reviewerJourney, /name: "Confirm return", exact: true/);
  assert.match(reviewerJourney, /url\.pathname === `\/reviews\/\$\{inspectionId\}` && url\.searchParams\.get\("decision"\) === "return"/);
  assert.match(source, /name: "Resubmit — version 2", exact: true/);
  assert.match(source, /getByText\(`Returned — correction scope: \$\{scopeSectionKey\}\.`, \{ exact: true \}\)/);
  assert.match(source, /name: "Open correction mode", exact: true/);
  assert.doesNotMatch(source, /getByText\(\/Not in return scope — locked read-only\//);
  assert.match(finalReviewerJourney, /name: "Confirm approve", exact: true/);
  assert.match(finalReviewerJourney, /url\.pathname === `\/reviews\/\$\{inspectionId\}` && url\.searchParams\.get\("decision"\) === "approve"/);
  assert.doesNotMatch(reviewerJourney, /waitForURL\(\/\\\/reviews\$\//);
  assert.doesNotMatch(source, /\.sq-banner--immutable|\.sq-sync/);
});
