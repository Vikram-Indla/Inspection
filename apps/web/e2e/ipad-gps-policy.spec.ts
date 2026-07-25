import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PERSONAS, storageStatePath } from "./personas";
import { login, must, rest } from "./live-rest";

// TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003
// DEC-002 is intentionally configuration-driven. These assertions prevent a
// later refactor from replacing governed policy with a second hidden default.
const app = (...parts: string[]) => join(process.cwd(), ...parts);

test.describe("TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003", () => {
  test("uses the sponsor-approved GPS and geofence defaults from GIS configuration", () => {
    const seed = readFileSync(app("../../supabase/migrations/0001_foundation.sql"), "utf8");
    const startup = readFileSync(app("src/app/(app)/field/[visitId]/Startup.tsx"), "utf8");
    const fieldPage = readFileSync(app("src/app/(app)/field/[visitId]/page.tsx"), "utf8");
    const gisPage = readFileSync(app("src/app/(app)/admin/gis/page.tsx"), "utf8");

    expect(seed).toContain('"gps_accuracy_checkin_max_m":25');
    expect(seed).toContain('"arrival_detection_radius_m":200');
    expect(seed).toContain('"geofence_default_radius_m":150');
    expect(seed).toContain('"telemetry_interval_s":30');
    expect(seed).toContain('"off_route_m":500,"sustain_s":120');
    expect(seed).toContain('"telemetry_days":90,"checkin":"permanent"');

    expect(fieldPage).toContain('select("engine, settings").in("engine", ["gis", "otp", "field"])');
    expect(startup).toContain("const maxAcc = gis.gps_accuracy_checkin_max_m ?? 25;");
    expect(startup).toContain("visit.factories.geofence_radius_m ?? gis.geofence_default_radius_m ?? 150");
    expect(startup).toContain("const telemetryS = gis.telemetry_interval_s ?? 30;");
    expect(gisPage).toContain('sb.from("engine_settings").select("settings, version_label").eq("engine", "gis")');
  });

  test("fails closed for poor GPS and stops telemetry when the journey ends", () => {
    const startup = readFileSync(app("src/app/(app)/field/[visitId]/Startup.tsx"), "utf8");
    const fieldPage = readFileSync(app("src/app/(app)/field/[visitId]/page.tsx"), "utf8");

    expect(startup).toContain("if (acc > maxAcc)");
    expect(startup).toContain("if (!journeyId || checkedIn || !navigator.geolocation) return;");
    expect(startup).toContain("}, [journeyId, checkedIn]);");
    expect(fieldPage).toContain("actual coordinates");
  });

  test("governs an outside-fence request through Operations approval and never self-approves", () => {
    const enumMigration = readFileSync(app("../../supabase/migrations/20260716161604_add_geo_override_evidence_link.sql"), "utf8");
    const migration = readFileSync(app("../../supabase/migrations/20260716161605_ipad_geo_override_approval_workflow.sql"), "utf8");
    const startup = readFileSync(app("src/app/(app)/field/[visitId]/Startup.tsx"), "utf8");
    const offline = readFileSync(app("src/lib/offline.ts"), "utf8");
    const operations = readFileSync(app("src/app/(app)/operations/actions.ts"), "utf8");
    const operationsPage = readFileSync(app("src/app/(app)/operations/page.tsx"), "utf8");

    expect(enumMigration).toContain("alter type evidence_link add value if not exists 'geo_override'");
    expect(migration).toContain("create table if not exists geo_override_requests");
    expect(migration).toContain("alter table geo_override_requests enable row level security");
    expect(migration).toContain("requested_by = (select auth.uid()) or has_role('ops')");
    expect(migration).toContain("create or replace function request_geo_override");
    expect(migration).toContain("checkin_event_id");
    expect(migration).toContain("Photo evidence must sync before an override request can be created");
    expect(migration).toContain("Required override photo evidence is unavailable");
    expect(migration).toContain("now() + interval '30 minutes'");
    expect(migration).toContain("create or replace function decide_geo_override");
    expect(migration).toContain("An inspector may never approve or reject their own override request");
    expect(migration).toContain("status = 'expired'");
    expect(migration).toContain("create or replace function expire_stale_geo_override_requests");
    expect(migration).toContain("update visits set operational_state = 'arrived'");

    expect(startup).toContain('kind: "geo_checkin"');
    expect(startup).toContain('kind: "geo_override_request"');
    expect(startup).not.toContain("confirmGpsOverride");
    expect(startup).toContain("overrideState !== \"none\"");
    expect(offline).toContain('op.kind === "geo_override_request"');
    expect(offline).toContain('op.kind === "geo_checkin"');
    expect(offline).toContain('sb.rpc("request_geo_override"');
    expect(operations).toContain('sb.rpc("decide_geo_override"');
    expect(operationsPage).toContain('createSignedUrl(evidence.storage_path!, 600)');
  });
});

// TASK-M3-FIELD-EXPIRY-A2 — packet 12 (CLAUDE-M3-A2-FIELD-LEASE-007).
// The Field visit page must never mutate geo_override_requests on read: the
// database decision guard (decide_geo_override) is the sole race-safe expiry
// authority. A past-due pending row is relabeled "expired" in memory only,
// for display; its stored status and every terminal row's history are never
// rewritten by a page view.
test.describe("TASK-M3-FIELD-EXPIRY-A2 no-mutation-on-read", () => {
  const fieldPage = readFileSync(app("src/app/(app)/field/[visitId]/page.tsx"), "utf8");
  const migration = readFileSync(app("../../supabase/migrations/20260716161605_ipad_geo_override_approval_workflow.sql"), "utf8");

  test("the Field visit GET issues zero write RPCs and only relabels a past-due pending row in memory", () => {
    // No server-side write call of any kind remains in this route.
    expect(fieldPage).not.toContain('sb.rpc("expire_stale_geo_override_requests")');
    expect(fieldPage.match(/\.rpc\(/g)).toBeNull();
    expect(fieldPage.match(/\.insert\(/g)).toBeNull();
    expect(fieldPage.match(/\.update\(/g)).toBeNull();
    expect(fieldPage.match(/\.upsert\(/g)).toBeNull();
    expect(fieldPage.match(/\.delete\(/g)).toBeNull();

    expect(fieldPage).toContain('const { data: overrideRows } = await sb.from("geo_override_requests")');
    expect(fieldPage).toContain('.select("id, status, expires_at, decision_event_id")');
    expect(fieldPage).toContain('.eq("visit_id", visitId)');
    expect(fieldPage).toContain('.order("requested_at", { ascending: false })');
    expect(fieldPage).toContain(".limit(1);");
    expect(fieldPage).toContain("const rawOverride = overrideRows?.[0] ?? null;");

    // Numeric comparison, not lexicographic string ordering: Date.parse into
    // epoch milliseconds, guarded by Number.isFinite so an invalid/missing
    // expires_at can never satisfy the relabel condition.
    expect(fieldPage).toContain("const fieldOverrideExpiresAtMs = rawOverride?.expires_at ? Date.parse(rawOverride.expires_at) : NaN;");
    expect(fieldPage).toContain('const initialOverride = rawOverride && rawOverride.status === "pending"');
    expect(fieldPage).toContain("&& Number.isFinite(fieldOverrideExpiresAtMs) && fieldOverrideExpiresAtMs <= Date.now()");
    expect(fieldPage).toContain('? { ...rawOverride, status: "expired" as const }');
    expect(fieldPage).toContain(": rawOverride;");

    // Terminal-status/invalid-data preservation is structural, not incidental:
    // the relabel predicate requires status === "pending" (every other status
    // — approved/rejected/cancelled/already-expired — fails the condition on
    // its first clause, before the timestamp is ever examined), and the
    // ternary's else-branch returns rawOverride completely unchanged, not a
    // copy or a partial object.
    const predicateStart = fieldPage.indexOf('const initialOverride = rawOverride && rawOverride.status === "pending"');
    const predicateEnd = fieldPage.indexOf(": rawOverride;", predicateStart) + ": rawOverride;".length;
    const predicateBlock = fieldPage.slice(predicateStart, predicateEnd);
    expect(predicateBlock).toContain('rawOverride.status === "pending"');
    expect(predicateBlock.trim().endsWith(": rawOverride;")).toBe(true);

    // The unfiltered query (no .eq("status", ...) clause) is what lets a
    // caller see approved/rejected/cancelled/expired history unchanged —
    // proves the relabel path can only ever add a display-only "expired"
    // value, never remove or replace a stored terminal status.
    const queryStart = fieldPage.indexOf('await sb.from("geo_override_requests")');
    const queryBlock = fieldPage.slice(queryStart, queryStart + 260);
    expect(queryBlock).not.toContain(".eq(\"status\"");
  });

  test("the atomic decision guard remains the only Field-side expiry race authority", () => {
    expect(migration).toContain("create or replace function decide_geo_override");
    expect(migration).toContain("if now() >= v_request.expires_at");
    expect(migration).toContain("set status = 'expired', decided_at = now()");
    expect(migration).toContain("An inspector may never approve or reject their own override request");
  });
});

// Dynamic-route/DB-state proof — packet 12 §6, cases 2 and 5. A Playwright
// browser-side request listener cannot observe a Next.js server component's
// own Supabase calls (they never cross the browser's network layer), so it
// cannot prove "zero server-side writes" — only the static proof above can.
// What real-browser evidence CAN prove: reading the same geo_override_requests
// row (via the existing `live-rest` authenticated-REST helper, `ops` persona,
// read-only — no seed, no mutation) before and after two real page renders,
// asserting id/status/expires_at/decision_event_id are byte-identical.
// This requires (a) FIELD_TEST_VISIT_ID pointing at a visit with an existing
// geo_override_requests row — no such fixture exists in this repository today
// (confirmed: no seed migration or script inserts into geo_override_requests
// anywhere), and (b) the `inspector` persona's UI login to render the page,
// which independently reproduces the pre-existing, unrelated HTTP 400 auth
// boundary recorded in this repository's evidence. Skips explicitly rather
// than substituting a different route or claiming a pass.
test.describe("TASK-M3-FIELD-EXPIRY-A2 dynamic route + DB-state proof", () => {
  const visitId = process.env.FIELD_TEST_VISIT_ID;
  test.skip(
    !visitId,
    "external evidence blocker: no FIELD_TEST_VISIT_ID fixture visit with an existing geo_override_requests row is available in this environment, and no seed-data lease is held by this task — dynamic-route/DB-state proof cannot run. Unresolved P1, not a pass.",
  );
  test.use({ storageState: storageStatePath("inspector") });

  test("two /field/<visitId> renders leave the geo_override_requests row's stored fields unchanged", async ({ page }) => {
    const ops = await login(PERSONAS.ops.email, PERSONAS.ops.password);
    const readRow = async () => must(
      await rest(
        "GET",
        `geo_override_requests?select=id,status,expires_at,decision_event_id&visit_id=eq.${visitId}&order=requested_at.desc&limit=1`,
        ops.jwt,
      ),
      "read geo_override_requests",
    ) as Array<{ id: string; status: string; expires_at: string; decision_event_id: string | null }>;

    const before = await readRow();
    // A missing/invalid FIELD_TEST_VISIT_ID must fail loudly here, not
    // silently pass by comparing undefined to undefined below.
    expect(before).toHaveLength(1);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await page.goto(`/field/${visitId}`);
      expect(response?.status()).toBe(200);
    }

    const after = await readRow();
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(before[0].id);
    expect(after[0].status).toBe(before[0].status);
    expect(after[0].expires_at).toBe(before[0].expires_at);
    expect(after[0].decision_event_id).toBe(before[0].decision_event_id);
  });
});
