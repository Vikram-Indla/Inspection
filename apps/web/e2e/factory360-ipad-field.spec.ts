import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { calculateApprovedCompliance } from "../src/lib/factory360/compliance";

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");

const IPAD = "src/app/(app)/field/factory-360/[id]/page.tsx";
const WEB = "src/app/(app)/factories/cr/[id]/page.tsx";
const LOADER = "src/lib/factory360/dossier.ts";
const OFFLINE = "src/lib/factory360/offline-snapshot.ts";
const SNAP_ROUTE = "src/app/api/field/factory-360/snapshot/route.ts";
const RESOLVER = "src/app/(app)/field/factory-360/page.tsx";
const ISLAND = "src/app/(app)/field/factory-360/[id]/Factory360Offline.tsx";

// TASK-FACTORY-360-IPAD-011 — Web/iPad Factory 360 parity + non-regression
// contract. Static assertions that both platforms render from ONE shared
// projection and that the iPad offline store never touches the inspection
// outbox. Runs without a server or database.
test.describe("Factory 360 iPad parity + non-regression contract", () => {
  test("web and iPad both render from the single shared dossier loader (parity by construction)", () => {
    for (const page of [WEB, IPAD]) {
      const src = read(page);
      expect(src).toContain('from "@/lib/factory360/dossier"');
      expect(src).toContain("loadFactory360Dossier");
      expect(src).toContain("resolveFactory360Permissions");
    }
    // The heavy projection must NOT be re-implemented in the iPad page.
    const ipad = read(IPAD);
    expect(ipad).not.toContain('from("commercial_registrations")');
    expect(ipad).not.toContain('from("industrial_licenses")');
    expect(ipad).not.toContain("calculateApprovedCompliance");
  });

  test("the shared loader owns the CR -> license -> plant hierarchy and compliance calc", () => {
    const loader = read(LOADER);
    for (const table of ["commercial_registrations", "industrial_licenses", "plant_addresses", "plant_production_line_items", "factory_government_records", "inspection_factory_snapshots"]) {
      expect(loader).toContain(`from("${table}")`);
    }
    expect(loader).toContain("calculateApprovedCompliance");
    expect(loader).toContain("withSignedUrls");
  });

  test("reproduces the approved-snapshot compliance formula (identical to web)", () => {
    const result = calculateApprovedCompliance(
      { answers: { A: "yes", B: "no", NOTE: "text", NA: "na" } },
      { item_snapshot: {
        A: { score_weight: 1, response_model: { mapping: { yes: { result: "compliant" } } } },
        B: { score_weight: 1, response_model: { mapping: { no: { result: "non_compliant" } } } },
        NOTE: { score_weight: 0, response_model: { mapping: { text: { result: "compliant" } } } },
        NA: { score_weight: 1, score_excluded_on: ["na"], response_model: { mapping: { na: { result: "compliant" } } } },
      } },
    );
    expect(result).toEqual({ status: "available", passed: 1, answered: 2, rate: 50 });
  });

  test("iPad Factory 360 is read-only (no writes, no forms)", () => {
    const ipad = read(IPAD);
    expect(ipad).not.toMatch(/\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
    expect(ipad).not.toMatch(/<form|contentEditable/);
  });

  test("offline snapshot store is a SEPARATE IndexedDB, never the inspection outbox", () => {
    const offline = read(OFFLINE);
    expect(offline).toContain('"mim-field-f360-v1"');
    expect(offline).not.toContain("mim-field-v1");
    expect(offline).not.toContain("outbox");
  });

  test("offline snapshot projection is permission-filtered and never signs storage URLs", () => {
    const route = read(SNAP_ROUTE);
    expect(route).toContain("resolveFactory360Permissions");
    expect(route).toContain("withSignedUrls: false");
    expect(route).toContain('view_factory_360');
    expect(route).toContain("sectionsOmitted");
    expect(route).toContain("SENAEI_API_CONTRACT_NOT_SUPPLIED");
  });

  test("offline island retains prior snapshot on failed refresh and never claims live offline", () => {
    const island = read(ISLAND);
    // On a failed fetch it reads the cache; it must NOT put() (overwrite) in the catch branch.
    const catchBlock = island.slice(island.indexOf("} catch"));
    expect(catchBlock).not.toContain("factory360Offline.put");
    expect(island).toContain('setMode("cached")');
    expect(island).toContain('setMode("offline")');
  });

  test("field entry resolver maps every identifier to the canonical selected-license URL", () => {
    const resolver = read(RESOLVER);
    for (const key of ["factory", "license", "plant", "cr", "license_no", "cr_no"]) {
      expect(resolver).toContain(key);
    }
    expect(resolver).toContain("/field/factory-360/");
  });

  test("assigned work exposes a canonical Factory 360 detail entry carrying the selected license", () => {
    const tasks = read("src/app/(app)/field/my-tasks/page.tsx");
    expect(tasks).toContain("`/field/factory-360/${lic.commercial_registration_id}?license=${lic.id}`");
  });
});
