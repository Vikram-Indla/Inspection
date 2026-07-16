import { test, expect } from "@playwright/test";
import { login, rest, must } from "./live-rest";
import { PERSONAS } from "./personas";

// CD-042 / SCR-VIR-710 · RBAC-014 — vp_otp_status caller authorization.
// ---------------------------------------------------------------------------
// Migration 20260715180000 gives vp_otp_status the same caller-relationship gate
// that 0023 gave vp_request_otp/vp_verify_otp. This proves it live: a caller who
// is neither staff-with-session-visibility nor the assigned inspector cannot read
// a participant's OTP status. REST-only (the function is a security-definer RPC);
// fixtures are staged with the planner's own JWT so RLS stays the enforcement.

const createdSessionIds: string[] = [];
const createdVisitIds: string[] = [];

// Stage a virtual session with NO assignment, so the inspector persona is a
// genuine non-participant (role 'inspector' is not in the staff allowlist and it
// is not the assigned inspector of this visit).
async function stageUnassignedSession(plannerJwt: string): Promise<string> {
  const factory = must(await rest("GET", "factories?select=id&limit=1", plannerJwt), "read factory")[0];
  const pkg = must(
    await rest("GET", "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1", plannerJwt),
    "read published package_version",
  )[0];
  const base = new Date(Date.now() + 500 * 24 * 60 * 60_000).toISOString();
  const end = new Date(Date.now() + 500 * 24 * 60 * 60_000 + 90 * 60_000).toISOString();

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
      { session_id: session.id, display_name: "Authz Test Rep", role: "factory_rep" },
    ]),
    "insert participant",
  );
  return (parts as { id: string }[])[0].id;
}

test.describe.serial("CD-042 vp_otp_status authorization (RBAC-014)", () => {
  let plannerJwt = "";
  let participantId = "";

  test.beforeAll(async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    plannerJwt = planner.jwt;
    participantId = await stageUnassignedSession(plannerJwt);
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

  test("an unassigned, non-staff caller is denied (RBAC-014)", async () => {
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    // inspector role is not in the staff allowlist and it is not assigned to this
    // visit → the security-definer function must refuse, not leak status.
    const res = await rest("POST", "rpc/vp_otp_status", inspector.jwt, { p_participant: participantId });
    expect(res.error).toBeTruthy();
    expect(res.error ?? "").toMatch(/RBAC-014|not authorized/i);
  });

  test("an authorized staff caller (planner) still reads status", async () => {
    const res = await rest("POST", "rpc/vp_otp_status", plannerJwt, { p_participant: participantId });
    expect(res.error).toBeNull();
    expect((res.data as { status: string }).status).toBe("ok");
    expect((res.data as { verified: boolean }).verified).toBe(false);
  });
});
