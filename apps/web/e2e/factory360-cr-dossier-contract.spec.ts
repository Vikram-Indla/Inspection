import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { calculateApprovedCompliance } from "../src/lib/factory360/compliance";
import { FACTORY360_AR_FALLBACK } from "../src/lib/factory360/arabic";

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");
const PAGE = "src/app/(app)/factories/cr/[id]/page.tsx";
// The CR-centred projection (queries + derivation) was extracted into the shared
// dossier loader so Web and iPad render one projection. Query/select/derivation
// assertions therefore check page + loader combined; rendering assertions stay
// on the page.
const LOADER = "src/lib/factory360/dossier.ts";

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
    const page = read(PAGE);
    const src = page + read(LOADER);
    const list = read("src/app/(app)/factories/page.tsx");
    const legacy = read("src/app/(app)/factories/[id]/page.tsx");
    expect(src).toContain('from("commercial_registrations")');
    expect(src).toContain('from("industrial_licenses")');
    expect(src).toContain('from("plant_addresses")');
    expect(page).toContain('aria-current={row.id === selected?.id ? "page" : undefined}');
    expect(list).toContain('dossier_href: commercialRegistrationId ? `/factories/cr/${commercialRegistrationId}` : `/factories/${row.id}`');
    expect(list).toContain("Array.isArray(mappedIndustrialLicense)");
    expect(list).toContain('`/factories/${row.id}`');
    expect(legacy).toContain('from("industrial_licenses")');
    expect(legacy).toContain('redirect(`/factories/cr/${normalizedLicense.commercial_registration_id}?license=${normalizedLicense.id}`)');
    expect(legacy).toContain('compat !== "legacy"');
  });

  test("is a read-only dossier with independent industrial, government, document and media reads", () => {
    const page = read(PAGE);
    const src = page + read(LOADER);
    for (const table of ["plant_production_line_items", "factory_government_records", "factory_documents", "factory_media_assets"]) {
      expect(src).toContain(`from("${table}")`);
    }
    expect(page).not.toMatch(/\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
    expect(page).not.toMatch(/<form|contentEditable|AddDocumentForm|AddProductForm/);
    expect(page).toContain("This source section is degraded; other sections remain available.");
  });

  test("lists inspection reports, not visit history, and calculates only approved frozen submissions", () => {
    const page = read(PAGE);
    const src = page + read(LOADER);
    expect(src).toContain('from("inspections")');
    expect(src).toContain("submission_versions!inner");
    expect(src).toContain("filter(report => !!latestSubmission(report))");
    expect(src).toContain('report.status === "approved"');
    expect(src).toContain("latestSubmission(report)");
    expect(src).toContain("calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition)");
    expect(page).toContain('href={`/reports/inspection/${report.id}`}');
    expect(page).not.toContain('href={`/visits/${');
    expect(page).toContain("Returned or rejected inspections remain visible below but never affect this rate.");
    expect(src).toContain("violations(id, mapping_version, violation_codes(code, title, level, corrective_action, grace_period_days))");
    expect(src).toContain('reports.filter(report => report.status === "approved")');
    expect(page).toContain("Approved inspection violations & corrective actions");
  });

  test("enforces exact granular permissions before risk, documents, download, export and create inspection", () => {
    const page = read(PAGE);
    const permissions = read("src/lib/factory360/permissions.ts");
    for (const key of [
      "view_factory_360", "view_factory_documents", "download_factory_documents",
      "view_risk_details", "export_factory", "create_inspection",
    ]) expect(permissions).toContain(`"${key}"`);
    expect(permissions).toContain("p_permission_key: permission");
    expect(page).toContain('permissions["view_risk_details"]');
    expect(page).toContain('permissions["download_factory_documents"]');
    expect(page).toContain('permissions["export_factory"]');
    expect(page).toContain('permissions["create_inspection"]');
    expect(page).toContain('surface="factory_risk_explanation"');
    expect(page).toContain("saved Risk Engine facts");
  });

  test("uses a responsive internal three-column layout and RTL-safe identity semantics", () => {
    const page = read(PAGE);
    const css = read("src/app/(app)/factories/cr/[id]/factory360.module.css");
    const list = read("src/app/(app)/factories/FactoryList.tsx");
    const listCss = read("src/app/(app)/factories/factory-list.module.css");
    expect(css).toContain("grid-template-columns: 224px minmax(0, 1fr) 296px");
    expect(css).toContain("@media (max-width: 1439px)");
    expect(css).toContain("@media (max-width: 959px)");
    expect(css).toContain(".panel { min-inline-size: 0;");
    expect(css).toContain("border-inline-start-width");
    expect(list).toContain("styles.cards");
    expect(listCss).toContain("@media (max-width: 799px)");
    expect(listCss).toContain("@media (max-width: 389px)");
    expect(page).toContain("<bdi>");
    expect(page).toContain('lang="ar" dir="rtl"');
    expect(page).toContain('lang="en" dir="ltr"');
    expect(page).toContain('className="sq-field"');
    expect(page).toContain('className="sq-select"');
    expect(page).toContain('data-factory360-layout="cr-license-dossier"');
    expect(page).not.toContain("<main");
  });

  test("keeps the saved-risk advisory responsive and exposes truthful provider states", () => {
    const page = read(PAGE);
    const panel = read("src/components/ContextualAiPanel.tsx");
    const action = read("src/lib/ai/contextual-actions.ts");
    expect(page).toContain("geminiProviderState()");
    expect(page).toContain("providerState={aiProviderState}");
    expect(panel).toContain('className="panel-header row"');
    expect(panel).toContain('className="panel-body stack"');
    expect(panel).toContain("btn btn-primary btn-touch btn-block");
    expect(panel).toContain('className="alert alert-warning"');
    expect(panel).toContain('className="alert alert-critical"');
    expect(panel).toContain('aria-live="polite"');
    expect(panel).not.toContain("style={{");
    expect(action).toContain("generateContextual(surface, serverContext, locale)");
  });

  test("provides Modern Standard Arabic fallback copy for every registry and CR dossier string", () => {
    const sources = [
      read(PAGE),
      read("src/app/(app)/factories/page.tsx"),
    ].join("\n");
    const keys = [...sources.matchAll(/t\("([^"]+)",\s*"[^"]*"\)/g)]
      .map(match => match[1]);
    const missing = [...new Set(keys)]
      .filter(key => !FACTORY360_AR_FALLBACK[key]);
    expect(missing).toEqual([]);

    const i18n = read("src/lib/i18n.ts");
    expect(i18n).toContain("...FACTORY360_AR_FALLBACK");
    expect(i18n.indexOf("...FACTORY360_AR_FALLBACK"))
      .toBeLessThan(i18n.lastIndexOf("...dict"));
  });

  test("shows the complete license-selector contract and a business-event-only timeline without invented date windows", () => {
    const page = read(PAGE);
    const loader = read(LOADER);
    const legacy = read("src/app/(app)/factories/[id]/page.tsx");
    for (const field of ["license_type", "stage", "status", "risk_band"]) expect(page + loader).toContain(field);
    expect(page).toContain('t("f360.timeline.heading", "Business-event timeline")');
    expect(page).toContain("Operational visits are intentionally excluded.");
    expect(page).toContain("reports.flatMap");
    expect(page).toContain("government.flatMap");
    expect(page).toContain("penalties.flatMap");
    expect(page).not.toContain("daysToExpiry");
    expect(page).not.toContain("Date.now()");
    expect(legacy).not.toContain("expiringSoon");
    expect(legacy).not.toContain("90 * 86400000");
  });

  test("keeps official media separate from inspection evidence and never invents a freshness SLA", () => {
    const page = read(PAGE);
    const src = page + read(LOADER);
    for (const category of ["official_factory_image", "factory_profile_image", "inspection_evidence", "arrival_evidence", "violation_evidence"]) expect(src).toContain(`"${category}"`);
    expect(src).toContain("evidence_id, inspection_id, violation_id");
    expect(page).toContain('href={`/evidence-ocr?evidence=${asset.evidence_id}`}');
    expect(page).toContain('href={`/reports/inspection/${asset.inspection_id}`}');
    expect(page).toContain("Inspection evidence remains linked to its inspection report and is never merged into this gallery.");
    expect(page).toContain("no unapproved staleness threshold is inferred");
    expect(page).toContain('t("f360.source.empty", "available — no records")');
    expect(page).not.toMatch(/Date\.now\(\).*source_synced_at|source_synced_at\s*</);
  });

  test("filters ungoverned government workflow states and carries selected context into actions", () => {
    const page = read(PAGE);
    const src = page + read(LOADER);
    expect(src).toContain('["pending", "returned", "rejected", "draft"].includes(row.status)');
    expect(page).toContain('href={`/factories/${factoryId}?compat=legacy#location`}');
    expect(page).toContain("&cr=${cr.id}&license=${selected?.id");
    expect(page).toContain("&returnTo=${encodeURIComponent(");
    expect(page).toContain('t("f360.compliance.notAvailable", "Not Available")');
  });

  test("captures submission-time factory facts and compares only an approved observed snapshot", () => {
    const page = read(PAGE);
    const src = page + read(LOADER);
    const migration = read("../../supabase/migrations/20260720010000_factory360_v2_foundation.sql");
    expect(migration).toContain("capture_inspection_factory_snapshot");
    expect(migration).toContain("trg_capture_inspection_factory_snapshot");
    expect(src).toContain('sb.from("inspection_factory_snapshots")');
    expect(src).toContain('report.status === "approved"');
    expect(page).toContain("Official vs latest approved observed snapshot");
    expect(page).toContain("does not overwrite current source truth");
  });
});
