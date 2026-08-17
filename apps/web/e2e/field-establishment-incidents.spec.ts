import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const readWeb = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");
const readRepo = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");

const ESTABLISHMENTS = "src/app/(app)/field/establishments/page.tsx";
const INCIDENT_PAGE = "src/app/(app)/field/incident-reports/page.tsx";
const INCIDENT_ACTION = "src/app/(app)/field/incident-reports/actions.ts";
const INCIDENT_FORM = "src/app/(app)/field/incident-reports/IncidentReportForm.tsx";
const INCIDENT_MIGRATION = "supabase/migrations/20260720010000_incident_reports.sql";

const incidentTextColumns = [
  "establishment_code",
  "commercial_registration_number",
  "report_source",
  "reporter_name",
  "reporter_contact_number",
  "report_time",
  "number_of_cases",
  "resulting_damage",
  "incident_type",
  "preliminary_incident_description",
];

test.describe("PLAN v7 item 7 field establishments + incident logging", () => {
  test("the field establishment browser uses real master data and field-safe dossier links", () => {
    const src = readWeb(ESTABLISHMENTS);
    expect(src).toContain('from("factories")');
    expect(src).toContain("industrial_licenses(id, commercial_registration_id, license_number, plant_number)");
    expect(src).toContain("/field/factory-360/");
    expect(src).toContain('href="/field/establishments/unregistered"');
    expect(src).toContain('is_temporary", status === "unlicensed"');
    expect(src).not.toContain('href="/factories');
  });

  test("unregistered creation delegates to the real atomic record-plus-visit workflow", () => {
    const action = readWeb("src/app/(app)/field/establishments/unregistered/actions.ts");
    const rpc = readRepo("supabase/migrations/0027_cd023_immediate_visit_atomic.sql");
    expect(action).toContain('.rpc("create_immediate_visit"');
    expect(action).toContain('p_actor_mode: "inspector"');
    expect(action).toContain('redirect(`/field/${result.visit_id}`)');
    expect(rpc).toContain("insert into factories");
    expect(rpc).toContain("'immediate_manual', true");
    expect(rpc).toContain("insert into visits");
    expect(rpc).toContain("insert into assignments");
  });

  test("field incident reads and writes exactly the existing table columns", () => {
    const migration = readRepo(INCIDENT_MIGRATION);
    const page = readWeb(INCIDENT_PAGE);
    const action = readWeb(INCIDENT_ACTION);
    const form = readWeb(INCIDENT_FORM);
    expect(page).toContain('from("incident_reports")');
    expect(action).toContain('from("incident_reports").insert({');
    for (const column of incidentTextColumns) {
      expect(migration, column).toContain(column);
      expect(page, column).toContain(column);
      expect(action, column).toContain(`${column}:`);
      expect(form, column).toContain(`name="${column}"`);
    }
    for (const column of ["factory_id", "visit_id", "inspection_id", "created_by", "created_at"]) {
      expect(migration, column).toContain(column);
      expect(page, column).toContain(column);
    }
  });

  test("field-only routing reaches the new surface while the web route remains separate", () => {
    const layout = readWeb("src/app/(app)/layout.tsx");
    const fieldLayout = readWeb("src/app/(app)/field/layout.tsx");
    const home = readWeb("src/components/sections/field-home/field-home-unavailable.tsx");
    const inspection = readWeb("src/app/(app)/field/inspection/[id]/page.tsx");
    expect(layout).toContain("<AppShell>{children}</AppShell>");
    expect(fieldLayout).toContain('roleKeys.includes("inspector")');
    expect(home).toContain('href="/field/establishments"');
    expect(inspection).toContain("`/field/incident-reports?visit=");
    expect(fs.existsSync(path.join(webRoot, "src/app/(app)/incident-reports/page.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(webRoot, INCIDENT_PAGE))).toBe(true);
  });

  test("export-products ownership is held for authority instead of invented", () => {
    const deltas = readWeb("DELTAS-field.md");
    expect(deltas).toContain("export-products ownership");
    expect(deltas).toContain("inspection_factory_checks");
    expect(deltas).toContain("no field or migration was added");
  });
});
