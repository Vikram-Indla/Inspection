import { test, expect } from "@playwright/test";
import { login, rest, must } from "./live-rest";
import { PERSONAS } from "./personas";

// CD-042 / SCR-VIR-710 · CD42-R1-06 — audit-READ display seam (vs_audit_trail).
// ---------------------------------------------------------------------------
// Proves the data contract the accepted design will bind to: a session-scoped,
// RBAC-014-gated, read-only view of the virtual audit trail — WITHOUT widening
// audit_events table access (inspector has no audit_read grant) and WITHOUT
// creating any audit event. REST-only; fixtures staged with the planner's JWT.

const createdSessionIds: string[] = [];
const createdVisitIds: string[] = [];

async function stageSessionWithParticipant(plannerJwt: string): Promise<{ sessionId: string; participantId: string }> {
  const factory = must(await rest("GET", "factories?select=id&limit=1", plannerJwt), "read factory")[0];
  const pkg = must(
    await rest("GET", "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1", plannerJwt),
    "read published package_version",
  )[0];
  const base = new Date(Date.now() + 600 * 24 * 60 * 60_000).toISOString();
  const end = new Date(Date.now() + 600 * 24 * 60 * 60_000 + 90 * 60_000).toISOString();

  const visit = must(
    await rest("POST", "visits", plannerJwt, {
      factory_id: factory.id, visit_type: "periodic", execution_mode: "virtual",
      planning_status: "published", window_start: base, window_end: end, package_version_id: pkg.id,
    }),
    "insert virtual visit",
  )[0];
  createdVisitIds.push(visit.id);

  const session = must(
    await rest("POST", "virtual_sessions", plannerJwt, { visit_id: visit.id, appointment_at: base, timeline: [] }),
    "insert virtual_session",
  )[0];
  createdSessionIds.push(session.id);

  const parts = must(
    await rest("POST", "virtual_participants", plannerJwt, [
      { session_id: session.id, display_name: "Seam Test Rep", role: "factory_rep" },
    ]),
    "insert participant",
  );
  return { sessionId: session.id, participantId: (parts as { id: string }[])[0].id };
}

test.describe.serial("CD-042 audit-read seam (vs_audit_trail · CD42-R1-06)", () => {
  let plannerJwt = "";
  let sessionId = "";
  let participantId = "";

  test.beforeAll(async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    plannerJwt = planner.jwt;
    const ids = await stageSessionWithParticipant(plannerJwt);
    sessionId = ids.sessionId; participantId = ids.participantId;
  });

  test.afterAll(async () => {
    if (!plannerJwt) return;
    const s = createdSessionIds.join(",");
    if (s) {
      await rest("DELETE", `virtual_participants?session_id=in.(${s})`, plannerJwt, undefined, "return=minimal");
      await rest("DELETE", `virtual_sessions?id=in.(${s})`, plannerJwt, undefined, "return=minimal");
    }
    const v = createdVisitIds.join(",");
    if (v) await rest("DELETE", `visits?id=in.(${v})`, plannerJwt, undefined, "return=minimal");
  });

  test("the seam returns this session's real audit events to an authorized caller", async () => {
    // Generate one real audit row through the live OTP RPC (planner is authorised).
    const sent = await rest("POST", "rpc/vp_request_otp", plannerJwt, { p_participant: participantId });
    expect(sent.error).toBeNull();
    expect((sent.data as { status: string }).status).toBe("sent");

    const trail = await rest("POST", "rpc/vs_audit_trail", plannerJwt, { p_session: sessionId });
    expect(trail.error).toBeNull();
    const rows = trail.data as { action: string; object_type: string; object_id: string }[];
    expect(Array.isArray(rows)).toBeTruthy();
    // Contains the OTP_SENT event, scoped to our participant.
    expect(rows.some(r => r.action === "OTP_SENT" && r.object_id === participantId)).toBeTruthy();
    // Scope guard: never returns rows outside this session's objects.
    expect(rows.every(r => r.object_type === "virtual_participants" || r.object_type === "virtual_sessions")).toBeTruthy();
  });

  test("an unassigned, non-staff caller cannot read the trail (RBAC-014)", async () => {
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const res = await rest("POST", "rpc/vs_audit_trail", inspector.jwt, { p_session: sessionId });
    expect(res.error).toBeTruthy();
    expect(res.error ?? "").toMatch(/RBAC-014|not authorized/i);
  });
});
