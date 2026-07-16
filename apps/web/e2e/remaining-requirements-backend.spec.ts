import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test.describe("TASK-G11 remaining-requirements backend contracts", () => {
  test("M02-039 has a real visit map route with factory and authorized inspector positions", () => {
    const page = read("src/app/visits/map/page.tsx");
    const map = read("src/app/visits/map/VisitMap.tsx");
    expect(page).toContain('from("geo_events")');
    expect(page).toContain("official_lat");
    expect(map).toContain("latest inspector position");
    expect(map).toContain("/visits/${v.id}");
  });

  test("M04 field journey captures device, provider ETA, override and arrival evidence", () => {
    const startup = read("src/app/field/[visitId]/Startup.tsx");
    const route = read("src/app/api/routing/eta/route.ts");
    const offline = read("src/lib/offline.ts");
    expect(startup).toContain("device_info: capturedDevice");
    expect(startup).toContain('fetch("/api/routing/eta"');
    expect(startup).toContain('kind: "override"');
    expect(startup).toContain('linked_type: "arrival"');
    expect(startup).not.toContain("demo coordinates substituted");
    expect(route).toContain("GOOGLE_MAPS_ROUTES_API_KEY");
    expect(route).toContain("TRAFFIC_AWARE");
    expect(offline).toContain("row.evidence_note = op.evidence_note");
  });

  test("M07 schema is source-owned, role-scoped and risk history is reproducible", () => {
    const migration = read("../../supabase/migrations/20260716210000_remaining_requirements_backend.sql");
    const dossier = read("src/app/factories/[id]/page.tsx");
    expect(migration).toContain("license_issue_date date");
    expect(migration).toContain("cr_owner_details text");
    expect(migration).toContain("create table if not exists factory_risk_snapshots");
    expect(migration).toContain("create or replace function recalculate_factory_risk");
    expect(migration).toContain("Risk driver % must be between 0 and 100");
    expect(migration).toContain("create policy fdocs_read");
    expect(dossier).toContain("FactorySpatialMap");
    expect(dossier).toContain("canSeeSensitiveHistory");
    expect(dossier).toContain("Source registry synced");
    expect(dossier).toContain("Penalty issued");
  });
});
