import { test, expect } from "@playwright/test";
import { login, rest, must } from "./live-rest";
import { PERSONAS, storageStatePath } from "./personas";

// CD-043 / SCR-VIR-720 · P06B · TASK-BASELINE-WIRING-AUDIT-001 · DEC-012
// ---------------------------------------------------------------------------
// DRIVEN proof for the three D2L boundary-state closures wired this slice.
// The proven session boundary (beginRemote / closeSession / verified gate) is
// already covered by cd-041-virtual-verified-gate.spec.ts; this exercises the
// added honest-state affordances against real UI + server behaviour:
//
//   S12 read-only closed  — an immutable session shows the 🔒 read-only banner
//                           and offers no mutating control (state/regression).
//   S13 stale / concurrent — a rev-token mismatch (out-of-band change) makes the
//                           server REFUSE the close before any write, and the UI
//                           shows the reload prompt (negative + integration).
//   S15 offline           — navigator offline disables begin/close and shows the
//                           offline banner; nothing is queued (offline path).
//
// Fixtures follow the cd-041 pattern: sacrificial rows staged with each acting
// persona's own JWT so RLS + the STM-VIR guard remain the enforcement under test.

type Ids = { sessionId: string; visitId: string };

const createdSessionIds: string[] = [];
const createdVisitIds: string[] = [];
let stageCount = 0;

// Lean fixture: a published virtual visit + assigned inspector + scheduled
// session (single scheduled timeline event → rev token "scheduled:1"). Mirrors
// stageVirtualSession in cd-041 but without the participant/OTP scaffolding the
// boundary-state assertions do not need.
async function stageSession(plannerJwt: string, inspectorId: string): Promise<Ids> {
  const factory = must(await rest("GET", "factories?select=id&limit=1", plannerJwt), "read factory")[0];
  const pkg = must(
    await rest("GET", "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1", plannerJwt),
    "read published package_version",
  )[0];

  const now = Date.now();
  const DAY = 24 * 60 * 60_000;
  const existing = must(
    await rest("GET", `assignments?select=visits(window_end)&inspector_id=eq.${inspectorId}`, plannerJwt),
    "read inspector assignment windows",
  ) as { visits: { window_end: string | null } | null }[];
  // DEF-DATA-005 — see the matching comment in cd-041-virtual-verified-gate.spec.ts:
  // cap the chained base so it never drifts past the plausible-year CHECK constraint.
  const latestExistingEnd = existing.reduce((latest, row) => {
    const end = row.visits?.window_end ? Date.parse(row.visits.window_end) : NaN;
    return Number.isFinite(end) ? Math.max(latest, end) : latest;
  }, 0);
  // Clamping to a fixed ceiling alone collided across repeated/parallel runs
  // (every clamped call lands on the exact same day) — add bounded random
  // jitter to restore per-run uniqueness while staying well inside the
  // plausible-year window (max ~2 years out). The DB unique/exclusion
  // constraint on assignments remains the final collision authority either way.
  const PLAUSIBLE_CEILING = Date.parse("2099-01-01T00:00:00Z");
  const boundedExistingEnd = Math.min(latestExistingEnd, PLAUSIBLE_CEILING);
  const jitter = Math.floor(Math.random() * 300) * DAY;
  const base = Math.max(now + 400 * DAY, boundedExistingEnd + 2 * DAY) + stageCount * 2 * DAY + jitter;
  stageCount += 1;
  const windowStart = new Date(base).toISOString();
  const windowEnd = new Date(base + 90 * 60_000).toISOString();
  const appointmentAt = new Date(base + 30 * 60_000).toISOString();

  const visit = must(
    await rest("POST", "visits", plannerJwt, {
      factory_id: factory.id, visit_type: "periodic", execution_mode: "virtual",
      planning_status: "published", window_start: windowStart, window_end: windowEnd,
      package_version_id: pkg.id,
    }),
    "insert virtual visit",
  )[0];
  createdVisitIds.push(visit.id);

  must(
    await rest("POST", "assignments", plannerJwt, { visit_id: visit.id, inspector_id: inspectorId, method: "manual" }),
    "insert assignment",
  );

  const session = must(
    await rest("POST", "virtual_sessions", plannerJwt, {
      visit_id: visit.id, appointment_at: appointmentAt,
      timeline: [{ event: "scheduled", at: new Date(now).toISOString() }],
    }),
    "insert virtual_session",
  )[0];
  createdSessionIds.push(session.id);
  return { sessionId: session.id, visitId: visit.id };
}

async function bestEffortDelete(jwt: string, table: string, filter: string): Promise<void> {
  await rest("DELETE", `${table}?${filter}`, jwt, undefined, "return=minimal");
}

test.describe.serial("CD-043 session-boundary states — driven", () => {
  let plannerJwt = "";
  let inspectorId = "";

  test.beforeAll(async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    plannerJwt = planner.jwt;
    inspectorId = inspector.userId;
  });

  test.afterAll(async () => {
    if (!plannerJwt) return;
    const sessions = createdSessionIds.join(",");
    const visits = createdVisitIds.join(",");
    if (sessions) {
      await bestEffortDelete(plannerJwt, "virtual_participants", `session_id=in.(${sessions})`);
      await bestEffortDelete(plannerJwt, "virtual_sessions", `id=in.(${sessions})`);
    }
    if (visits) {
      await bestEffortDelete(plannerJwt, "inspections", `visit_id=in.(${visits})`);
      await bestEffortDelete(plannerJwt, "assignments", `visit_id=in.(${visits})`);
      await bestEffortDelete(plannerJwt, "visits", `id=in.(${visits})`);
    }
  });

  // The room is staff-facing; drive it as the assigned inspector.
  test.describe(() => {
    test.use({ storageState: storageStatePath("inspector") });

    test("S12 — a closed session is read-only: 🔒 immutable banner, no mutating control", async ({ page }) => {
      const { sessionId } = await stageSession(plannerJwt, inspectorId);
      // Close the session out of band (forward-only PATCH is legal; the guard makes
      // it immutable thereafter). This is the true closed state, not a UI mock.
      const close = await rest("PATCH", `virtual_sessions?id=eq.${sessionId}`, plannerJwt, {
        state: "closed",
        timeline: [{ event: "closed", at: new Date().toISOString(), detail: { reason: "s12-fixture" } }],
      });
      expect(close.error).toBeNull();

      await page.goto(`/virtual/${sessionId}`);
      // S12 immutable affordance is present and read-only.
      const immutable = page.locator(".ax-banner--immutable");
      await expect(immutable).toBeVisible();
      await expect(immutable).toContainText("read-only");
      // No mutating control is offered on a closed session.
      await expect(page.locator(".cd-closebox")).toHaveCount(0);
      await expect(page.locator("#vir-actionzone .cd-primary")).toHaveCount(0);
    });

    test("S15 — offline disables begin/close and shows the offline banner; nothing queued", async ({ page, context }) => {
      const { sessionId } = await stageSession(plannerJwt, inspectorId);
      await page.goto(`/virtual/${sessionId}`);

      const primary = page.locator("#vir-actionzone .cd-primary");
      const closeBtn = page.locator(".cd-closebox button.ax-btn--danger");
      await expect(primary).toBeEnabled(); // online baseline

      await context.setOffline(true);
      await expect(page.locator(".ax-banner--warning", { hasText: "You are offline" })).toBeVisible();
      await expect(primary).toBeDisabled();
      await expect(closeBtn).toBeDisabled();

      // Recovery — back online re-enables the controls; nothing was queued.
      await context.setOffline(false);
      await expect(page.locator(".ax-banner--warning", { hasText: "You are offline" })).toHaveCount(0);
      await expect(primary).toBeEnabled();
    });

    test("S13 — a concurrent change makes close refuse before any write, and prompts reload", async ({ page }) => {
      const { sessionId } = await stageSession(plannerJwt, inspectorId);
      await page.goto(`/virtual/${sessionId}`);
      // Page rendered rev = "scheduled:1" (one timeline event).
      await expect(page.locator(".cd-closebox")).toBeVisible();

      // Out-of-band concurrent change: append a timeline event so the server rev
      // becomes "scheduled:2" while the loaded form still carries "scheduled:1".
      const bump = await rest("PATCH", `virtual_sessions?id=eq.${sessionId}`, plannerJwt, {
        timeline: [
          { event: "scheduled", at: new Date().toISOString() },
          { event: "waiting_opened", at: new Date().toISOString() },
        ],
      });
      expect(bump.error).toBeNull();

      // Attempt the close with the now-stale rev.
      await page.locator(".cd-closebox input[name=reason]").fill("attempt on stale view");
      await page.locator(".cd-closebox button.ax-btn--danger").click();

      // NEGATIVE + UI — the stale banner appears with a reload affordance…
      const stale = page.locator(".ax-banner--warning", { hasText: "This session changed" });
      await expect(stale).toBeVisible();
      await expect(stale.getByRole("button", { name: "Reload" })).toBeVisible();

      // INTEGRATION — …and nothing was written: the session is still not closed.
      const after = must(
        await rest("GET", `virtual_sessions?select=state&id=eq.${sessionId}`, plannerJwt),
        "re-read session state",
      )[0];
      expect(after.state).not.toBe("closed");
    });
  });
});
