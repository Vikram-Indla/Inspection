import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 4B — Journey/Cancellation/Location UI
// wiring with legacy fallback. Source-contract assertions only: no browser,
// no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

const startupPath = "apps/web/src/app/(app)/field/[visitId]/Startup.tsx";
const fieldPagePath = "apps/web/src/app/(app)/field/[visitId]/page.tsx";
const fieldActionsPath = "apps/web/src/app/(app)/field/[visitId]/actions.ts";
const workspacePath = "apps/web/src/app/(app)/field/inspection/[id]/Workspace.tsx";
const workspacePagePath = "apps/web/src/app/(app)/field/inspection/[id]/page.tsx";
const opsPagePath = "apps/web/src/app/(app)/operations/page.tsx";
const opsActionsPath = "apps/web/src/app/(app)/operations/actions.ts";
const opsQueuePath = "apps/web/src/app/(app)/operations/CancellationQueue.tsx";
const decisionLogPath = "product-contract/execution/EXECUTION_DECISION_LOG.md";

test.describe("TASK-EXECUTION-MODULE-001 Phase 4B journey/cancellation/location UI", () => {
  test("field page probes the journey schema and passes cancellation/correction state to Startup", () => {
    const page = read(fieldPagePath);
    // Tolerant probe — pre-migration the probe fails and Startup keeps the
    // exact legacy flow (D-015).
    expect(page).toContain('from("cancellation_requests")');
    expect(page).toContain("journeySchemaAvailable");
    expect(page).toContain('from("visit_location_corrections")');
    expect(page).toContain("initialCancellation");
    expect(page).toContain("initialCorrections");
  });

  test("field actions wrap the Phase 4A journey RPCs with neutral codes", () => {
    const actions = read(fieldActionsPath);
    expect(actions).toContain("startJourneyAction");
    expect(actions).toContain("confirmArrivalAction");
    expect(actions).toContain("requestActiveCancellationAction");
    expect(actions).toContain("correctVisitLocationAction");
    expect(actions).toContain("supabaseServer");
    expect(actions).toContain("@/lib/execution");
    // Provider text never reaches the client — neutral codes only.
    expect(actions).toContain("JOURNEY_DEVICE_MISSING");
    expect(actions).toContain("CANCEL_IDEMPOTENCY_REQUIRED");
    expect(actions).toContain("LOCATION_REASON_REQUIRED");
  });

  test("Startup starts the journey via the RPC with a clearly marked legacy fallback", () => {
    const startup = read(startupPath);
    expect(startup).toContain("startJourneyAction");
    expect(startup).toContain("journeySchemaAvailable");
    // Multi-click protection: the busy guard stays on the journey button.
    expect(startup).toContain("disabled={!cached || !!journeyId || busy || !!preparationGated || cancelApproved}");
    // Overdue-inside-window: warning shown, journey proceeds.
    expect(startup).toContain("journeyOverdueWarning");
    expect(startup).toContain("r.journey.overdue");
    // The RPC path comes first; the ONLY remaining direct journey_sessions
    // INSERT lives after the legacy-fallback marker (ETA/prestart updates are
    // not inserts and remain allowed on both paths).
    const rpcIdx = startup.indexOf("startJourneyAction({");
    const legacyIdx = startup.indexOf("LEGACY FALLBACK");
    const insertIdx = startup.indexOf('.from("journey_sessions")\n      .insert({');
    expect(rpcIdx).toBeGreaterThan(-1);
    expect(legacyIdx).toBeGreaterThan(rpcIdx);
    expect(insertIdx).toBeGreaterThan(legacyIdx);
    expect(startup.indexOf('.from("journey_sessions")\n      .insert({', insertIdx + 1)).toBe(-1);
  });

  test("Startup confirms arrival server-side; outside stays a notice with retry/override/correction", () => {
    const startup = read(startupPath);
    expect(startup).toContain("confirmArrivalAction");
    expect(startup).toContain('r.result?.result === "inside"');
    // Accuracy token maps to the existing accuracy-wait copy.
    expect(startup).toContain('"ARRIVAL_ACCURACY"');
    // Outside: the immutable outside observation keeps the override anchor.
    expect(startup).toContain("confirm_arrival_outside");
    expect(startup).toContain("setPendingOverride");
  });

  test("Startup carries the location-correction panel and side-by-side display (§13)", () => {
    const startup = read(startupPath);
    expect(startup).toContain("correctVisitLocationAction");
    expect(startup).toContain("correctionAffordance");
    expect(startup).toContain("location-correction-panel");
    expect(startup).toContain("location-correction-display");
    // Original AND corrected coordinates stay visible.
    expect(startup).toContain("correctionOriginalLabel");
    expect(startup).toContain("correctionCorrectedLabel");
    // Corrections are read back from the append-only table.
    const page = read(fieldPagePath);
    expect(page).toContain("visit_location_corrections");
  });

  test("Startup splits cancellation: pre-start flag flow vs active-session request (§12)", () => {
    const startup = read(startupPath);
    expect(startup).toContain("requestActiveCancellationAction");
    expect(startup).toContain("activeCancellationPhase");
    expect(startup).toContain("submitActiveCancellation");
    // Idempotency key persisted in component state; comment mandatory for other.
    expect(startup).toContain("cancelIdemRef.current = crypto.randomUUID()");
    expect(startup).toContain('cancelReason === "other" && !cancelComment.trim()');
    // Pending / approved / rejected copies.
    expect(startup).toContain("cancelPendingActive");
    expect(startup).toContain("cancelApprovedCopy");
    expect(startup).toContain("cancelRejectedCopy");
    // The pre-start request_visit_cancellation flow is preserved.
    expect(startup).toContain("requestVisitCancellation");
    expect(startup).toContain("submitCancellation");
  });

  test("Workspace requests cancellation from the exit dialog and locks only on approval", () => {
    const workspace = read(workspacePath);
    expect(workspace).toContain("requestActiveCancellationAction");
    expect(workspace).toContain("requestCancellation");
    // Non-blocking while pending; read-only lock on approval (D-016).
    expect(workspace).toContain("cancelPending");
    expect(workspace).toContain("cancelApproved");
    expect(workspace).toContain("disabled={cancelApproved}");
    const page = read(workspacePagePath);
    expect(page).toContain("journeySchemaAvailable");
    expect(page).toContain("cancellation");
    expect(page).toContain("cancelReasons");
  });

  test("Operations Center decides cancellations through the RPC-backed queue", () => {
    expect(exists(opsQueuePath)).toBeTruthy();
    const page = [
      "apps/web/src/features/operations/queries.ts",
      "apps/web/src/features/operations/sources/execution.ts",
      "apps/web/src/app/(app)/operations/sections/queues-section.tsx",
    ].map(read).join("\n");
    expect(page).toContain("CancellationQueue");
    expect(page).toContain("cancellationQueueRows");
    expect(page).toContain('from("cancellation_requests")');
    const actions = read(opsActionsPath);
    expect(actions).toContain("decideActiveCancellation");
    expect(actions).toContain("decideActiveCancellationRpc");
    // Self-decide and already-decided tokens map to neutral copy.
    expect(actions).toContain("CANCEL_SELF_DECIDE");
    expect(actions).toContain("CANCEL_ALREADY_DECIDED");
    const queue = read(opsQueuePath);
    // Terminal-approval confirmation step + mandatory rejection reason.
    expect(queue).toContain("confirmTitle");
    expect(queue).toContain("confirmBody");
    expect(queue).toContain("rejectReason");
  });

  test("new copy carries no banned plain-language-remediation phrases", () => {
    // Mirrors the banned list in e2e/terminology-regression.spec.ts.
    const banned = [
      "CR dossier",
      "Factory dossier",
      "factory registry",
      "plan register",
      "penalty lineage",
      "Evidence readiness & SLA-risk fingerprint",
      "scan-first queue",
      "contract-unverified",
      "RLS-scoped",
      "server-side projection",
      "read model",
    ];
    // This migration owns the execution surfaces. Operations terminology is
    // certified in its independent vertical and is intentionally not rewritten
    // from the execution worktree.
    for (const file of [startupPath, fieldPagePath, fieldActionsPath, workspacePath, workspacePagePath]) {
      const content = read(file);
      for (const phrase of banned) {
        expect(content.includes(phrase), `${file} contains banned phrase "${phrase}"`).toBe(false);
      }
      expect(/dossier/i.test(content), `${file} contains bare "dossier"`).toBe(false);
    }
  });

  test("decision log records D-015 and D-016", () => {
    const log = read(decisionLogPath);
    expect(log).toContain("D-015");
    expect(log).toContain("D-016");
  });
});
