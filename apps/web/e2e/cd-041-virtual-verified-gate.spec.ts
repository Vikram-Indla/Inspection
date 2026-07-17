import { test, expect } from "@playwright/test";
import { login, rest, must } from "./live-rest";
import { PERSONAS, storageStatePath } from "./personas";

// CD-041 / SCR-VIR-700 · M05-009/010/015..020 · STM-VIR-002 · RBAC-014 · FND-003
// ---------------------------------------------------------------------------
// DRIVEN verification-gate proof (closes WIRING_AUDIT_CD-041 WA-05). The
// source-level contract lives in cd-041-virtual-backend.spec.ts; this exercises
// the real UI + server transitions against sacrificial live fixtures so the gate
// is proven by behaviour, not by grep. Fixtures are staged with each acting
// persona's own JWT, so RLS and the STM-VIR trigger remain the enforcement under
// test (mirrors e2e/live-rest.ts usage in the golden journey).
//
// Coverage per .claude/rules/tests.md:
//   success      — OTP verify advances the session; Begin becomes ready.
//   negative     — before verification, Begin is blocked ("no bypass").
//   integration  — Begin creates the inspection and redirects to /field.
//   permission   — an out-of-write-scope persona cannot force the verified transition (RBAC-014).
//   state/regr   — a closed session is immutable and cannot move backward (STM-VIR forward-only).

type Ids = { sessionId: string; visitId: string; repId: string };

// Sacrificial rows staged this run, for afterAll teardown.
const createdSessionIds: string[] = [];
const createdVisitIds: string[] = [];
let stageCount = 0;

async function stageVirtualSession(
  plannerJwt: string,
  inspectorId: string,
  opts: { appointmentOffsetMin: number },
): Promise<Ids> {
  // Reference rows the seed guarantees exist (0003 / 0011): any factory, the
  // latest published package version. Read them rather than inventing IDs.
  const factory = must(
    await rest("GET", "factories?select=id&limit=1", plannerJwt),
    "read factory",
  )[0];
  const pkg = must(
    await rest(
      "GET",
      "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1",
      plannerJwt,
    ),
    "read published package_version",
  )[0];

  const now = Date.now();
  const DAY = 24 * 60 * 60_000;
  // Far-future, non-overlapping window. Prior runs can leave orphan
  // assignments that RLS will not let a planner delete, so clock jitter alone
  // is not a proof of uniqueness (two runs inside the same jitter bucket can
  // collide). Read the inspector's existing assignment windows and place this
  // fixture strictly after the latest one; the database exclusion remains the
  // final authority.
  const existing = must(
    await rest("GET", `assignments?select=visits(window_start,window_end)&inspector_id=eq.${inspectorId}`, plannerJwt),
    "read inspector assignment windows",
  ) as { visits: { window_end: string | null } | null }[];
  // DEF-DATA-005 — visits.window_start/end now has a plausible-year CHECK
  // constraint (2020-2100). Chaining unboundedly off latestExistingEnd let
  // this drift far past 2100 across many historical runs (that drift is
  // exactly the corruption DEF-DATA-005 exists to catch — a live probe found
  // 503 such rows already in this shared project). Cap the chained base so
  // fresh fixtures always land inside the plausible window while still
  // avoiding same-run collisions.
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
  const minimumBase = now + 400 * DAY;
  const base = Math.max(minimumBase, boundedExistingEnd + 2 * DAY) + stageCount * 2 * DAY + jitter;
  stageCount += 1;
  const windowStart = new Date(base).toISOString();
  const windowEnd = new Date(base + 90 * 60_000).toISOString();
  const appointmentAt = new Date(base + opts.appointmentOffsetMin * 60_000).toISOString();

  const visit = must(
    await rest("POST", "visits", plannerJwt, {
      factory_id: factory.id,
      visit_type: "periodic",
      execution_mode: "virtual",
      planning_status: "published",
      window_start: windowStart,
      window_end: windowEnd,
      package_version_id: pkg.id,
    }),
    "insert virtual visit",
  )[0];
  createdVisitIds.push(visit.id); // track early so a partial-failure orphan is still cleaned

  // Assign the inspector persona so it is authorised to operate the room
  // (OTP RPCs + vs_write + begin all accept the assigned inspector).
  must(
    await rest("POST", "assignments", plannerJwt, {
      visit_id: visit.id,
      inspector_id: inspectorId,
      method: "manual",
    }),
    "insert assignment",
  );

  const session = must(
    await rest("POST", "virtual_sessions", plannerJwt, {
      visit_id: visit.id,
      appointment_at: appointmentAt,
      timeline: [{ event: "scheduled", at: new Date(now).toISOString() }],
    }),
    "insert virtual_session",
  )[0];

  const participants = must(
    await rest("POST", "virtual_participants", plannerJwt, [
      { session_id: session.id, display_name: "Gate Test Rep", role: "factory_rep" },
      { session_id: session.id, display_name: "Gate Test Inspector", role: "inspector" },
    ]),
    "insert participants",
  );
  const rep = (participants as { id: string; role: string }[]).find(p => p.role === "factory_rep")!;

  createdSessionIds.push(session.id);
  return { sessionId: session.id, visitId: visit.id, repId: rep.id };
}

// PostgREST in.() list; skip the call entirely when empty. Teardown is
// best-effort: session + participant rows ARE deletable by planner (vs_write /
// vp_rw are `for all`); visits/assignments/inspections have no DELETE policy, so
// those calls no-op under RLS — tolerated, never failed on. Each run stages
// fresh UUIDs, so any residue never collides with a later run.
async function bestEffortDelete(jwt: string, table: string, filter: string): Promise<void> {
  await rest("DELETE", `${table}?${filter}`, jwt, undefined, "return=minimal");
}

test.describe.serial("CD-041 verified-gate — driven", () => {
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
    // FK order: children first. Participants + sessions delete cleanly (the
    // STM-VIR guard is BEFORE UPDATE only, so a closed session still deletes).
    if (sessions) {
      await bestEffortDelete(plannerJwt, "virtual_participants", `session_id=in.(${sessions})`);
      await bestEffortDelete(plannerJwt, "virtual_sessions", `id=in.(${sessions})`);
    }
    // No DELETE policy backs these for a planner — attempted for completeness and
    // for when a service-role teardown key exists; they no-op otherwise.
    if (visits) {
      await bestEffortDelete(plannerJwt, "inspections", `visit_id=in.(${visits})`);
      await bestEffortDelete(plannerJwt, "assignments", `visit_id=in.(${visits})`);
      await bestEffortDelete(plannerJwt, "visits", `id=in.(${visits})`);
    }
  });

  // The room is staff-facing; drive it as the assigned inspector.
  test.describe(() => {
    test.use({ storageState: storageStatePath("inspector") });

    test("Begin is blocked until OTP verification, then rides the same submission flow (M05-015..020, no bypass)", async ({ page }) => {
      const { sessionId } = await stageVirtualSession(plannerJwt, inspectorId, { appointmentOffsetMin: 30 });

      await page.goto(`/virtual/${sessionId}`);
      const repRow = page.locator(".cd-plist .cd-prow", { hasText: "Gate Test Rep" });
      await expect(repRow).toBeVisible();

      // Advance scheduled -> joined so the gated Begin transition is the surfaced
      // action. Assert the server-authoritative signals (decision bar reads the
      // refreshed session.state); the participant-row lozenge is a client snapshot
      // and is intentionally not the signal under test.
      await repRow.getByRole("button", { name: "Mark joined" }).click();
      const decisionBar = page.locator(".cd-decisionbar");
      await expect(decisionBar).toContainText("joined");

      // NEGATIVE — verification gates execution; Begin is present but blocked (no bypass).
      const beginPrimary = page.locator("#vir-actionzone .cd-primary");
      await expect(page.locator(".cd-decisionbar.is-blocked")).toBeVisible();
      await expect(beginPrimary).toBeDisabled();
      await expect(page.locator("#vir-actionzone")).toContainText("Verify every required representative first");

      // SUCCESS — send OTP (DEV provider returns the code), verify it.
      await repRow.getByRole("button", { name: "Send OTP" }).click();
      const devLozenge = repRow.locator(".ax-lozenge--warning", { hasText: "DEV code:" });
      await expect(devLozenge).toBeVisible();
      const devCode = (await devLozenge.textContent())!.match(/\d{4,8}/)![0];
      await repRow.locator(".cd-otpfield input").fill(devCode);
      await repRow.getByRole("button", { name: "Verify" }).click();

      await expect(repRow.locator(".ax-lozenge--success", { hasText: "verified" })).toBeVisible();

      // POSTED — the server-authoritative gate opens only after the transition lands.
      await expect(page.locator(".cd-decisionbar.is-ready")).toBeVisible();
      await expect(beginPrimary).toBeEnabled();

      // INTEGRATION — begin creates the inspection and redirects into the shared field engine.
      await beginPrimary.click();
      await page.waitForURL(/\/field\/inspection\/[0-9a-f-]{36}/, { timeout: 20_000 });
      expect(page.url()).toMatch(/\/field\/inspection\//);
    });
  });

  test("an out-of-write-scope persona cannot force the verified transition (RBAC-014)", async () => {
    const { sessionId, repId } = await stageVirtualSession(plannerJwt, inspectorId, { appointmentOffsetMin: 45 });
    const reviewer = await login(PERSONAS.reviewer.email, PERSONAS.reviewer.password);
    // vs_mark_session_verified is security-invoker + RLS vs_write; the reviewer is
    // not planner/ops/assigned-inspector, so the FOR UPDATE read finds nothing and
    // the RPC refuses — no state change, no bypass.
    const res = await rest("POST", "rpc/vs_mark_session_verified", reviewer.jwt, {
      p_session: sessionId,
      p_participant: repId,
    });
    expect(res.error).toBeTruthy();

    // The session state is untouched.
    const after = must(
      await rest("GET", `virtual_sessions?select=state&id=eq.${sessionId}`, plannerJwt),
      "re-read session state",
    )[0];
    expect(after.state).toBe("scheduled");
  });

  test("a closed session is immutable and cannot move backward (STM-VIR forward-only)", async () => {
    const { sessionId } = await stageVirtualSession(plannerJwt, inspectorId, { appointmentOffsetMin: 60 });

    // Forward to closed is legal.
    const close = await rest(
      "PATCH",
      `virtual_sessions?id=eq.${sessionId}`,
      plannerJwt,
      {
        state: "closed",
        timeline: [{ event: "closed", at: new Date().toISOString(), detail: { reason: "gate-regression-fixture" } }],
      },
    );
    expect(close.error).toBeNull();

    // Any subsequent edit to a closed session is rejected by trg_guard_virtual.
    const reopen = await rest(
      "PATCH",
      `virtual_sessions?id=eq.${sessionId}`,
      plannerJwt,
      { state: "scheduled" },
    );
    expect(reopen.error).toBeTruthy();
    expect(reopen.error ?? "").toMatch(/immutable|backward|STM-VIR/i);
  });
});
