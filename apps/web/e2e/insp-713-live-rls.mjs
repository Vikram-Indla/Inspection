import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = process.env.SAQEEL_CROSS_ROLE_PASSWORD;
const emails = {
  admin: process.env.SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL,
  inspector: process.env.SAQEEL_TEST_INSPECTOR_EMAIL,
  supervisor: process.env.SAQEEL_TEST_SUPERVISOR_EMAIL,
};
const marker = `uat-insp713-${Date.now()}`;

function fail(context, error) {
  throw new Error(`${context}: ${error?.message ?? String(error)}`);
}

async function login(role) {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: emails[role], password });
  if (error) fail(`login ${role}`, error);
  return { client, user: data.user };
}

const { client: admin } = await login("admin");
const { data: factories, error: factoryError } = await admin.from("factories").select("id").limit(1);
if (factoryError || !factories?.[0]) fail("factory", factoryError ?? new Error("none"));
const factoryId = factories[0].id;

const { data: requests, error: requestsError } = await admin
  .from("external_requests")
  .insert(["visit", "correction", "objection"].map((requestType) => ({
    factory_id: factoryId,
    request_type: requestType,
    subject: `${marker}-${requestType}`,
    status: "submitted",
  })))
  .select("id,request_type,status");
if (requestsError) fail("admin external requests", requestsError);
const byType = Object.fromEntries(requests.map((request) => [request.request_type, request]));

const { data: assessment, error: assessmentError } = await admin
  .from("self_assessments")
  .insert({ factory_id: factoryId, status: "submitted", answers: { uat_marker: marker } })
  .select("id,status")
  .single();
if (assessmentError) fail("admin self assessment", assessmentError);

const { data: evidence, error: evidenceError } = await admin
  .from("correction_evidence")
  .insert({ request_id: byType.correction.id, factory_id: factoryId, content_sha256: "a".repeat(64), media_type: "application/pdf" })
  .select("id")
  .single();
if (evidenceError) fail("admin correction evidence", evidenceError);

const { data: objection, error: objectionError } = await admin
  .from("objections")
  .insert({ request_id: byType.objection.id, factory_id: factoryId, grounds: marker, status: "filed" })
  .select("id,status")
  .single();
if (objectionError) fail("admin objection", objectionError);

const { client: inspector } = await login("inspector");
const denied = [];
const attempts = [
  ["external_requests", () => inspector.from("external_requests").insert({ factory_id: factoryId, request_type: "visit", subject: `${marker}-denied`, status: "submitted" })],
  ["self_assessments", () => inspector.from("self_assessments").insert({ factory_id: factoryId, status: "submitted", answers: { uat_marker: marker } })],
  ["correction_evidence", () => inspector.from("correction_evidence").insert({ request_id: byType.correction.id, factory_id: factoryId, content_sha256: "b".repeat(64), media_type: "application/pdf" })],
  ["objections", () => inspector.from("objections").insert({ request_id: byType.objection.id, factory_id: factoryId, grounds: `${marker}-denied`, status: "filed" })],
];
for (const [table, attempt] of attempts) {
  const { error } = await attempt();
  denied.push({ table, denied: Boolean(error), code: error?.code ?? null });
}
const { data: inspectorRows, error: inspectorReadError } = await inspector.from("external_requests").select("id").in("id", requests.map(({ id }) => id));
if (inspectorReadError) fail("inspector read", inspectorReadError);

const { client: supervisor, user: supervisorUser } = await login("supervisor");
const requestIds = requests.map(({ id }) => id);
const { data: supervisorRows, error: supervisorReadError } = await supervisor.from("external_requests").select("id").in("id", requestIds);
if (supervisorReadError) fail("supervisor read", supervisorReadError);

async function update(table, values, id, status) {
  const result = await supervisor.from(table).update(values).eq("id", id).eq("status", status).select("id,status").single();
  if (result.error) fail(`${table} ${status}`, result.error);
}
await update("external_requests", { status: "in_review" }, byType.visit.id, "submitted");
await update("external_requests", { status: "accepted", decided_by: supervisorUser.id, decision_reason: `${marker}-accepted` }, byType.visit.id, "in_review");
await update("self_assessments", { status: "accepted", reviewed_by: supervisorUser.id, reviewed_at: new Date().toISOString(), review_reason: `${marker}-accepted`, risk_signal_emitted: true }, assessment.id, "submitted");
await update("objections", { status: "under_review" }, objection.id, "filed");
await update("objections", { status: "upheld", decision_reason: `${marker}-upheld` }, objection.id, "under_review");

const { data: finalRequests, error: finalRequestsError } = await admin.from("external_requests").select("id,request_type,status,decision_reason").in("id", requestIds);
if (finalRequestsError) fail("request readback", finalRequestsError);
const { data: finalAssessment, error: finalAssessmentError } = await admin.from("self_assessments").select("id,status,review_reason,risk_signal_emitted").eq("id", assessment.id).single();
if (finalAssessmentError) fail("assessment readback", finalAssessmentError);

console.log(JSON.stringify({
  marker,
  factory_id: factoryId,
  ids: { requests: byType, self_assessment: assessment.id, correction_evidence: evidence.id, objection: objection.id },
  positive: { admin_create: true, supervisor_read_count: supervisorRows.length, supervisor_transitions: true, request_readback: finalRequests, self_assessment_readback: finalAssessment },
  negative: { inspector_insert_denials: denied, inspector_read_count: inspectorRows.length },
}, null, 2));
