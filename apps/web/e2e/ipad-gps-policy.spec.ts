import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
