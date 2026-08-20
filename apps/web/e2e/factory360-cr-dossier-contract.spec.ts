import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { calculateApprovedCompliance } from "../src/lib/factory360/compliance";

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");

// T-168 rebuilt this route on SAQEEL: the 410-line page.tsx became a thin route
// composing the cr-dossier feature module (queries + view over the unchanged
// governed loader) and the factory360-cr section components, with copy in the
// factoriesCr i18n namespace. These assertions are about the route's contract —
// read-only, exact permissions, CR->license->plant hierarchy, approved-only
// compliance, business-event timeline, media separation, no invented SLA — not
// which file holds them, so they check the combined surface.
const PAGE = "src/app/(app)/factories/cr/[id]/page.tsx";
const LOADER = "src/lib/factory360/dossier.ts";
const QUERIES = "src/features/factories/cr-dossier/queries.ts";
const VIEW = "src/features/factories/cr-dossier/view.ts";
const EN = "src/i18n/locales/en/factories-cr.json";
const AR = "src/i18n/locales/ar/factories-cr.json";
const COMPONENT_DIR = "src/components/sections/factories/factory360-cr";

const readTree = (dir: string): string[] =>
  fs.readdirSync(path.join(webRoot, dir), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory()
      ? readTree(path.join(dir, entry.name))
      : entry.name.endsWith(".tsx")
        ? [read(path.join(dir, entry.name))]
        : []);

const components = () => readTree(COMPONENT_DIR).join("\n");
const surface = () => [PAGE, LOADER, QUERIES, VIEW].map(read).join("\n") + "\n" + components();
const copy = () => read(EN);

test.describe("TASK-FACTORY-360-COMPLETE-010 CR-centred dossier contract", () => {
  test("reproduces the approved-snapshot compliance formula and excludes non-scored answers", () => {
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
    expect(calculateApprovedCompliance({ answers: {} }, { item_snapshot: {} }).status).toBe("not_available");
  });

  test("uses the governed CR -> license -> plant hierarchy and keeps legacy links compatible", () => {
    const src = surface();
    const list = read("src/app/(app)/factories/page.tsx");
    const legacy = read("src/app/(app)/factories/[id]/page.tsx");
    expect(src).toContain('from("commercial_registrations")');
    expect(src).toContain('from("industrial_licenses")');
    expect(src).toContain('from("plant_addresses")');
    expect(components()).toContain('aria-current={row.id === selected?.id ? "page" : undefined}');
    expect(list).toContain('dossier_href: commercialRegistrationId ? `/factories/cr/${commercialRegistrationId}` : `/factories/${row.id}`');
    expect(list).toContain("industrial_licenses?.[0]?.commercial_registration_id");
    expect(list).toContain('`/factories/${row.id}`');
    expect(legacy).toContain('from("industrial_licenses")');
    expect(legacy).toContain('redirect(`/factories/cr/${normalizedLicense.commercial_registration_id}?license=${normalizedLicense.id}`)');
    expect(legacy).toContain('compat !== "legacy"');
  });

  test("is a read-only dossier with independent industrial, government, document and media reads", () => {
    const src = surface();
    for (const table of ["plant_production_line_items", "factory_government_records", "factory_documents", "factory_media_assets"]) {
      expect(src).toContain(`from("${table}")`);
    }
    expect(src).not.toMatch(/\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
    expect(src).not.toMatch(/contentEditable|AddDocumentForm|AddProductForm|<form[^>]+method="post"|<form[^>]+action=\{/);
    expect(copy()).toContain("This source section is degraded; other sections remain available.");
  });

  test("lists inspection reports, not visit history, and calculates only approved frozen submissions", () => {
    const src = surface();
    expect(src).toContain('from("inspections")');
    expect(src).toContain("submission_versions!inner");
    expect(src).toContain('report.status === "approved"');
    expect(src).toContain("latestSubmission(report)");
    expect(src).toContain("calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition)");
    expect(components()).toContain("/reports/inspection/");
    expect(components()).not.toContain("/visits/${");
    expect(copy()).toContain("Returned or rejected inspections stay visible below, but they never affect this rate.");
    expect(src).toContain("violations(id, mapping_version, violation_codes(code, title, level, corrective_action, grace_period_days))");
    expect(copy()).toContain("Approved inspection violations and corrective actions");
  });

  test("enforces exact granular permissions before risk, documents, download, export and create inspection", () => {
    const src = surface();
    const permissions = read("src/lib/factory360/permissions.ts");
    for (const key of [
      "view_factory_360", "view_factory_documents", "download_factory_documents",
      "view_risk_details", "export_factory", "create_inspection",
    ]) expect(permissions).toContain(`"${key}"`);
    expect(permissions).toContain("p_permission_key: permission");
    expect(src).toContain('permissions["view_risk_details"]');
    expect(src).toContain('permissions["download_factory_documents"]');
    expect(src).toContain('permissions["export_factory"]');
    expect(src).toContain('permissions["create_inspection"]');
    expect(src).toContain('surface="factory_risk_explanation"');
    expect(copy()).toContain("saved Risk Engine facts");
  });

  test("uses a responsive two-column workspace and RTL-safe identity semantics", () => {
    const cmp = components();
    const list = read("src/app/(app)/factories/FactoryList.tsx");
    const listCss = read("src/app/(app)/factories/factory-list.module.css");
    expect(cmp).toContain('columns="two"');
    expect(cmp).toContain('dir="rtl"');
    expect(cmp).toContain('dir="ltr"');
    expect(list).toContain("styles.cards");
    expect(listCss).toContain("@media (max-width: 799px)");
    expect(listCss).toContain("@media (max-width: 389px)");
    expect(cmp).not.toContain("<main");
  });

  test("keeps the saved-risk advisory responsive and exposes truthful provider states", () => {
    const src = surface();
    const panel = read("src/components/ContextualAiPanel.tsx");
    const action = read("src/lib/ai/contextual-actions.ts");
    expect(src).toContain("geminiProviderState()");
    expect(src).toContain("providerState={aiProviderState}");
    expect(panel).toContain('aria-live="polite"');
    expect(action).toContain("generateContextual(surface, serverContext, locale)");
  });

  test("provides Modern Standard Arabic copy for every CR dossier string (en/ar parity)", () => {
    const en = JSON.parse(read(EN)) as Record<string, unknown>;
    const ar = JSON.parse(read(AR)) as Record<string, unknown>;
    const keyset = (value: unknown, prefix = ""): string[] =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.entries(value as Record<string, unknown>).flatMap(([key, inner]) => keyset(inner, `${prefix}${key}.`))
        : [prefix];
    expect(keyset(ar)).toEqual(keyset(en));
    expect(read(AR)).toMatch(/[؀-ۿ]/);
  });

  test("shows the complete license-selector contract and a business-event-only timeline without invented date windows", () => {
    const src = surface();
    const legacy = read("src/app/(app)/factories/[id]/page.tsx");
    for (const field of ["license_type", "stage", "status", "risk_band"]) expect(src).toContain(field);
    expect(copy()).toContain("Business-event timeline");
    expect(src).toContain('sb.rpc("factory_timeline"');
    expect(src).toContain('sb.from("visits")');
    expect(src).not.toContain("daysToExpiry");
    expect(src).not.toContain("Date.now()");
    expect(legacy).not.toContain("expiringSoon");
    expect(legacy).not.toContain("90 * 86400000");
  });

  test("keeps official media separate from inspection evidence and never invents a freshness SLA", () => {
    const src = surface();
    for (const category of ["official_factory_image", "factory_profile_image", "inspection_evidence", "arrival_evidence", "violation_evidence"]) expect(src).toContain(`"${category}"`);
    expect(src).toContain("evidence_id, inspection_id, violation_id");
    expect(components()).toContain("/evidence-ocr?evidence=${asset.evidence_id}");
    expect(components()).toContain("/reports/inspection/${asset.inspection_id}");
    expect(copy()).toContain("Inspection evidence remains linked to its inspection report and is never merged into this gallery.");
    expect(copy()).toContain("no unapproved staleness threshold is inferred");
    expect(surface()).not.toMatch(/Date\.now\(\).*source_synced_at|source_synced_at\s*</);
  });

  test("filters ungoverned government workflow states and carries selected context into actions", () => {
    const src = surface();
    expect(src).toContain('["pending", "returned", "rejected", "draft"].includes(row.status)');
    expect(components()).toContain("/factories/${factoryId}?compat=legacy#location");
    expect(components()).toContain('cr=${encodeURIComponent(cr.cr_number)}&license=${encodeURIComponent(selected?.license_number ?? "")}');
    expect(components()).toContain("&source=factory360");
    expect(copy()).toContain("Not available");
  });

  test("captures submission-time factory facts and compares only an approved observed snapshot", () => {
    const src = surface();
    const migration = read("../../supabase/migrations/20260720010000_factory360_v2_foundation.sql");
    expect(migration).toContain("capture_inspection_factory_snapshot");
    expect(migration).toContain("trg_capture_inspection_factory_snapshot");
    expect(src).toContain('sb.from("inspection_factory_snapshots")');
    expect(src).toContain('report.status === "approved"');
    expect(copy()).toContain("Official vs latest approved observed snapshot");
    expect(copy()).toContain("It does not change the current official record.");
  });
});
