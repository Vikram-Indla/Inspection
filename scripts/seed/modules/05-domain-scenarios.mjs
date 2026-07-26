import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { buildAccountPlan } from "../lib/accounts.mjs";
import { APPROVED_TARGET_REF, projectRefFromUrl, REFUSAL } from "../lib/preflight.mjs";
import { safeJson } from "../lib/redact.mjs";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const seedBatchId = process.env.SEED_BATCH_ID;
const anchor = new Date(process.env.SEED_ANCHOR_DATE);
if (projectRefFromUrl(url) !== APPROVED_TARGET_REF || !anonKey || !seedBatchId || Number.isNaN(anchor.valueOf())) {
  throw new Error(`${REFUSAL}: domain seed configuration is incomplete`);
}
const descriptor = Number(process.env.SEED_CREDENTIALS_FD);
if (!Number.isInteger(descriptor) || descriptor < 3) {
  throw new Error(`${REFUSAL}: SEED_CREDENTIALS_FD must reference an operator-owned descriptor`);
}
const credentials = JSON.parse(readFileSync(descriptor, "utf8"));
if ("service_role_key" in credentials) {
  throw new Error(`${REFUSAL}: domain seeding must not receive a service-role credential`);
}
const accounts = buildAccountPlan(seedBatchId);
const byRole = role => accounts.filter(account => account.role_key === role);

function uuid(label) {
  const bytes = createHash("sha256").update(`${seedBatchId}:${label}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function plusDays(days, hour = 9) {
  const value = new Date(anchor);
  value.setUTCDate(value.getUTCDate() + days);
  value.setUTCHours(hour, 0, 0, 0);
  return value.toISOString();
}
async function login(account) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: credentials.account_passwords[account.alias] }),
  });
  if (!response.ok) throw new Error(`Login failed for ${account.alias}: HTTP ${response.status}`);
  return (await response.json()).access_token;
}
async function request(path, jwt, { method = "GET", body, prefer } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = (await response.text()).replaceAll(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED_JWT]");
    throw new Error(`${method} ${path} failed: HTTP ${response.status} ${detail.slice(0, 800)}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const rpc = (name, jwt, body) => request(`/rest/v1/rpc/${name}`, jwt, { method: "POST", body });

const planner = byRole("planner")[0];
const inspectors = byRole("inspector");
const reviewers = byRole("reviewer");
const representatives = byRole("factory_rep");
const plannerJwt = await login(planner);
const inspectorJwts = await Promise.all(inspectors.map(login));
const reviewerJwts = await Promise.all(reviewers.map(login));
const representativeJwts = await Promise.all(representatives.map(login));

const packageVersionId = "4fc1f6ef-851b-420b-a240-9121753a2ffa";
const factoryCoordinates = [
  [24.7136, 46.6753], [26.4207, 50.0888], [21.4858, 39.1925],
  [25.3830, 49.5860], [24.0889, 38.0637], [28.3835, 36.5662],
];
const factories = Array.from({ length: 6 }, (_, index) => ({
  id: uuid(`factory:${index + 1}`),
  factory_code: `DEMO-${String(index + 1).padStart(3, "0")}`,
  name: `Demo Industrial Facility ${String(index + 1).padStart(2, "0")} — منشأة صناعية تجريبية ${String(index + 1).padStart(2, "0")}`,
  cr_number: `DEMO-CR-${String(index + 1).padStart(4, "0")}`,
  license_number: `DEMO-LIC-${String(index + 1).padStart(4, "0")}`,
  region: ["Riyadh", "Eastern", "Makkah", "Eastern", "Madinah", "Tabuk"][index],
  city: ["Riyadh", "Dammam", "Jeddah", "Al Ahsa", "Yanbu", "Tabuk"][index],
  activity_class: "synthetic_demo_manufacturing",
  official_lat: factoryCoordinates[index][0],
  official_lng: factoryCoordinates[index][1],
  source: `demo_seed:${seedBatchId}`,
  source_synced_at: anchor.toISOString(),
  is_temporary: false,
}));

for (const factory of factories) {
  const found = await request(
    `/rest/v1/factories?select=id,factory_code,source&id=eq.${factory.id}`,
    plannerJwt,
  );
  if (found.length) {
    if (found[0].factory_code !== factory.factory_code || found[0].source !== factory.source) {
      throw new Error(`Unowned factory collision: ${factory.id}`);
    }
    continue;
  }
  await request("/rest/v1/factories", plannerJwt, {
    method: "POST",
    body: factory,
    prefer: "return=minimal",
  });
}

async function ensureVisit({ index, mode, factory, inspector, dayOffset = index }) {
  const marker = `[${seedBatchId}:visit:${mode}:${index + 1}]`;
  const existing = await request(
    `/rest/v1/visits?select=id,execution_mode,package_version_id&notes=eq.${encodeURIComponent(marker)}`,
    plannerJwt,
  );
  if (existing.length) return existing[0].id;
  const result = await rpc("publish_single_visit", plannerJwt, {
    p_factory_id: factory.id,
    p_package_version_id: packageVersionId,
    p_inspector_id: inspector.id,
    p_visit_type: mode === "virtual" ? "follow_up" : "periodic",
    p_execution_mode: mode,
    p_window_start: plusDays(1 + dayOffset, 6),
    p_window_end: plusDays(1 + dayOffset, 15),
    p_license_number: factory.license_number,
    p_location_confirmed: true,
    p_planner_lat: factory.official_lat,
    p_planner_lng: factory.official_lng,
    p_notes: marker,
    p_resume_plan_id: null,
  });
  return typeof result === "string" ? result : result.visit_id ?? result.id;
}

const physicalVisits = [];
const virtualVisits = [];
for (let index = 0; index < 3; index += 1) {
  physicalVisits.push(await ensureVisit({
    index, mode: "physical", factory: factories[index], inspector: inspectors[index],
  }));
  virtualVisits.push(await ensureVisit({
    index, dayOffset: index + 4, mode: "virtual",
    factory: factories[index + 3], inspector: inspectors[index],
  }));
}

const itemIds = {
  "FS-101": "b0000000-0000-4000-8000-000000000101",
  "FS-102": "b0000000-0000-4000-8000-000000000102",
  "FS-107": "b0000000-0000-4000-8000-000000000107",
  "EG-201": "b0000000-0000-4000-8000-000000000201",
  "HZ-310": "b0000000-0000-4000-8000-000000000310",
};
const decisions = [
  { decision: "approve", reason: null, sections: null },
  { decision: "return", reason: "Correct the fire-protection evidence / يرجى تصحيح دليل الحماية من الحريق", sections: ["s1"] },
  { decision: "reject", reason: "Material safety controls require a new governed visit / تتطلب ضوابط السلامة زيارة جديدة", sections: null },
];
const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const contentHash = createHash("sha256").update(tinyPng).digest("hex");
const runtime = [];

for (let index = 0; index < 3; index += 1) {
  const visitId = virtualVisits[index];
  const scenarioDay = 5 + index;
  const inspectorJwt = inspectorJwts[index];
  const reviewerJwt = reviewerJwts[index];
  const representativeJwt = representativeJwts[index];

  const sessions = await request(
    `/rest/v1/virtual_sessions?select=id&visit_id=eq.${visitId}`,
    inspectorJwt,
  );
  let sessionId;
  let repParticipantId;
  if (!sessions.length) {
    const scheduled = await rpc("schedule_virtual_session", plannerJwt, {
      p_visit: visitId,
      p_appointment_at: plusDays(scenarioDay, 8),
      p_factory_rep_user: representatives[index].id,
      p_rep_display_name: `Demo Factory Representative ${index + 1} — ممثل المصنع التجريبي ${index + 1}`,
    });
    sessionId = scheduled.session_id;
    repParticipantId = scheduled.factory_rep_participant_id;
  } else {
    sessionId = sessions[0].id;
    const participants = await request(
      `/rest/v1/virtual_participants?select=id&session_id=eq.${sessionId}&user_id=eq.${representatives[index].id}`,
      representativeJwt,
    );
    repParticipantId = participants[0].id;
  }

  const assignment = await request(
    `/rest/v1/assignments?select=status&visit_id=eq.${visitId}&inspector_id=eq.${inspectors[index].id}`,
    inspectorJwt,
  );
  if (assignment[0].status === "assigned") {
    await rpc("accept_prepare_assignment", inspectorJwt, { p_visit: visitId });
  }
  const preparations = await request(
    `/rest/v1/visit_preparations?select=confirmed_ready_at&visit_id=eq.${visitId}`,
    inspectorJwt,
  );
  if (!preparations.length) {
    await rpc("save_visit_preparation", inspectorJwt, {
      p_visit: visitId,
      p_execution_date: plusDays(scenarioDay).slice(0, 10),
      p_confirmed_mode: "virtual",
      p_package_version_id: packageVersionId,
      p_form_config: {},
    });
  }
  if (!preparations[0]?.confirmed_ready_at) {
    await rpc("confirm_visit_ready", inspectorJwt, { p_visit: visitId });
  }

  const otp = await rpc("vp_request_otp", inspectorJwt, { p_participant: repParticipantId });
  if (otp.status === "sent" && otp.dev_code) {
    await rpc("vp_verify_otp", inspectorJwt, { p_participant: repParticipantId, p_code: otp.dev_code });
  }
  const session = await request(`/rest/v1/virtual_sessions?select=state&id=eq.${sessionId}`, inspectorJwt);
  if (!["verified", "in_progress", "closed"].includes(session[0].state)) {
    await rpc("vs_mark_session_verified", inspectorJwt, {
      p_session: sessionId,
      p_participant: repParticipantId,
    });
  }

  const visit = await request(`/rest/v1/visits?select=operational_state&id=eq.${visitId}`, inspectorJwt);
  if (visit[0].operational_state === "prepared") {
    await rpc("set_operational_state", inspectorJwt, { p_visit: visitId, p_next: "executing" });
  }
  const inspections = await request(
    `/rest/v1/inspections?select=id,status&id=not.is.null&visit_id=eq.${visitId}`,
    inspectorJwt,
  );
  const inspectionId = inspections[0].id;
  if (inspections[0].status !== "in_progress") {
    const existingSubmission = await request(
      `/rest/v1/submission_versions?select=id&inspection_id=eq.${inspectionId}&order=version_number.desc&limit=1`,
      inspectorJwt,
    );
    const existingReview = await request(
      `/rest/v1/reviews?select=id,decision&inspection_id=eq.${inspectionId}&order=decided_at.desc.nullslast&limit=1`,
      inspectorJwt,
    );
    runtime.push({
      scenario: index + 1,
      factory_id: factories[index + 3].id,
      visit_id: visitId,
      session_id: sessionId,
      inspection_id: inspectionId,
      submission_version_id: existingSubmission[0]?.id,
      review_id: existingReview[0]?.id,
      outcome: existingReview[0]?.decision ?? inspections[0].status,
      reused: true,
    });
    continue;
  }

  const responseRows = Object.entries(itemIds).map(([code, itemId], responseIndex) => ({
    id: uuid(`response:${index + 1}:${code}`),
    inspection_id: inspectionId,
    item_id: itemId,
    response: code === "FS-101"
      ? { value: "non_compliant", note: "Expired service tag — بطاقة الصيانة منتهية" }
      : code === "FS-107"
        ? { value_date: plusDays(-7).slice(0, 10), note: "Weekly log sampled — تمت مراجعة السجل الأسبوعي" }
        : { value: "compliant", note: `Synthetic governed response ${responseIndex + 1}` },
    is_complete: true,
    updated_at: anchor.toISOString(),
  }));
  await request("/rest/v1/checklist_responses?on_conflict=inspection_id,item_id", inspectorJwt, {
    method: "POST",
    body: responseRows,
    prefer: "resolution=merge-duplicates,return=minimal",
  });

  const evidenceId = uuid(`evidence:${index + 1}:FS-101`);
  const storagePath = `${seedBatchId}/${inspectionId}/fs-101-demo.png`;
  const upload = await fetch(`${url}/storage/v1/object/evidence/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${inspectorJwt}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: tinyPng,
  });
  if (!upload.ok && upload.status !== 409) {
    throw new Error(`Evidence upload failed: HTTP ${upload.status}`);
  }
  await request("/rest/v1/evidence?on_conflict=id", inspectorJwt, {
    method: "POST",
    body: {
      id: evidenceId,
      inspection_id: inspectionId,
      evidence_type: "photo",
      linked_type: "item",
      linked_id: itemIds["FS-101"],
      storage_path: `evidence/${storagePath}`,
      captured_at: plusDays(scenarioDay, 10),
      content_sha256: contentHash,
      captured_by: inspectors[index].id,
      synced_at: plusDays(scenarioDay, 10),
      evidence_note: "Synthetic evidence for expired extinguisher service tag / دليل تجريبي",
    },
    prefer: "resolution=ignore-duplicates,return=minimal",
  });
  const findingId = uuid(`finding:${index + 1}`);
  const violationId = uuid(`violation:${index + 1}`);
  await request("/rest/v1/findings?on_conflict=id", inspectorJwt, {
    method: "POST",
    body: {
      id: findingId,
      inspection_id: inspectionId,
      item_id: itemIds["FS-101"],
      severity: "L2",
      description: "Synthetic finding: extinguisher service tag expired / ملاحظة تجريبية: بطاقة صيانة الطفاية منتهية",
    },
    prefer: "resolution=ignore-duplicates,return=minimal",
  });
  await request("/rest/v1/violations?on_conflict=id", inspectorJwt, {
    method: "POST",
    body: {
      id: violationId,
      inspection_id: inspectionId,
      violation_code_id: "d0000000-0000-4000-8000-000000000009",
      finding_id: findingId,
      mapping_version: "v3",
      triggered_by_response: uuid(`response:${index + 1}:FS-101`),
    },
    prefer: "resolution=ignore-duplicates,return=minimal",
  });
  await request("/rest/v1/action_forms?on_conflict=id", inspectorJwt, {
    method: "POST",
    body: {
      id: uuid(`action:${index + 1}`),
      inspection_id: inspectionId,
      violation_id: violationId,
      form_type: "corrective",
      owner_name: `Demo Safety Owner ${index + 1} — مسؤول السلامة التجريبي ${index + 1}`,
      owner_role: "Factory safety representative / ممثل سلامة المصنع",
      due_at: plusDays(scenarioDay + 14, 12),
      required_correction: "Renew and document extinguisher servicing / تجديد وتوثيق صيانة الطفايات",
      status: "open",
      is_blocking: true,
    },
    prefer: "resolution=ignore-duplicates,return=minimal",
  });

  const sections = {
    factory_verification: { representative: representatives[index].alias, location_confirmed: true },
    s1: { "FS-101": responseRows[0].response, "FS-102": responseRows[1].response, "FS-107": responseRows[2].response },
    s2: { "EG-201": responseRows[3].response },
    s3: { "HZ-310": responseRows[4].response },
  };
  const submitted = await rpc("submit_inspection", inspectorJwt, {
    p_inspection: inspectionId,
    p_snapshot: {
      seed_batch_id: seedBatchId,
      package_version_id: packageVersionId,
      sections,
      section_items: {
        factory_verification: [],
        s1: [itemIds["FS-101"], itemIds["FS-102"], itemIds["FS-107"]],
        s2: [itemIds["EG-201"]],
        s3: [itemIds["HZ-310"]],
      },
      evidence_required: [itemIds["FS-101"]],
      evidence: [{ id: evidenceId, sha256: contentHash, linked_item: itemIds["FS-101"] }],
    },
    p_idempotency_key: `${seedBatchId}:submit:${index + 1}:v1`,
    p_acknowledgement: {
      status: "acknowledged",
      representative: representatives[index].alias,
      acknowledged_at: plusDays(scenarioDay, 11),
      synthetic_demo: true,
    },
  });
  let review = await request(
    `/rest/v1/reviews?select=id,status,decision&submission_version_id=eq.${submitted.submission_version_id}`,
    reviewerJwt,
  );
  let reviewId = review[0]?.id;
  if (!reviewId) {
    reviewId = await rpc("start_review", reviewerJwt, {
      p_inspection: inspectionId,
      p_submission_version: submitted.submission_version_id,
    });
  }
  review = await request(`/rest/v1/reviews?select=status,decision&id=eq.${reviewId}`, reviewerJwt);
  if (review[0].status === "under_review") {
    await rpc("decide_review", reviewerJwt, {
      p_review: reviewId,
      p_decision: decisions[index].decision,
      p_reason: decisions[index].reason,
      p_returned_sections: decisions[index].sections,
    });
  }
  runtime.push({
    scenario: index + 1,
    factory_id: factories[index + 3].id,
    visit_id: visitId,
    session_id: sessionId,
    inspection_id: inspectionId,
    submission_version_id: submitted.submission_version_id,
    review_id: reviewId,
    outcome: decisions[index].decision,
  });
}

process.stdout.write(safeJson({
  mode: "domain-scenarios",
  factories_reconciled: factories.length,
  physical_visits: physicalVisits,
  virtual_scenarios: runtime,
  service_role_present: false,
}));
