import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("PKT-RESPONSIVE-DASHBOARD-OPERATIONS-002", () => {
  test("Operations preserves Inspector access without widening capability-only Administrator profiles", () => {
    for (const file of [
      "src/features/operations/queries.ts",
      "src/app/(app)/operations/live/page.tsx",
    ]) {
      const source = read(file);
      expect(source).toContain("BUSINESS_ROLE_KEYS.includes(role)");
      expect(source).not.toContain("FIELD_CHANNEL_ROLE_KEYS");
      expect(source.indexOf("if (!mayViewOperations)")).toBeLessThan(source.indexOf("await Promise.all(["));
    }
  });

  // /operations/live was rebuilt in T-070/T-071 and live.module.css deleted with
  // it. Its responsive and direction claims were re-pointed onto the CSS that
  // actually paints that route, and are asserted in
  // web-admin-m3-operations.spec.ts ("@media (max-width: 60rem)", logical
  // properties, no [dir="rtl"]). They are not duplicated here.
  test("Dashboard and Operations retain bounded responsive layouts for the mandated width continuum", () => {
    const dashboard = read("src/app/(app)/dashboard/dashboard.module.css");
    const operations = read("src/app/(app)/operations/operations.module.css");

    expect(dashboard).toContain("@media (max-width: 1080px)");
    expect(dashboard).toContain("@media (max-width: 640px)");
    expect(dashboard).toContain("@media (max-width: 360px)");
    expect(operations).toContain("@media (max-width: 1100px)");
    expect(operations).toContain("@media (max-width: 430px)");
    expect(operations).toContain("@media (max-width: 340px)");
    expect(`${dashboard}\n${operations}`).toContain("minmax(0, 1fr)");
  });

  test("Arabic, RTL, reduced motion and provider-degraded contracts remain explicit", () => {
    const dashboard = read("src/app/(app)/dashboard/DashboardView.tsx");
    const operations = read("src/features/operations/queries.ts");
    const live = read("src/components/operations/operations-live/operations-live.tsx");
    const styles = [
      read("src/app/(app)/dashboard/dashboard.module.css"),
      read("src/app/(app)/operations/operations.module.css"),
    ].join("\n");

    expect(dashboard).toContain("locale === \"ar\"");
    expect(operations).toContain("locale === \"ar\"");
    expect(live).toContain("locale: \"en\" | \"ar\"");
    expect(styles).toContain("[dir=\"rtl\"]");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(live).toContain("providerFailed");
  });

  test("Dashboard user-facing copy describes access scope without RLS or workbook jargon", () => {
    const dashboard = read("src/app/(app)/dashboard/DashboardView.tsx");
    const strategic = read("src/app/(app)/dashboard/StrategicBoard.tsx");
    const registry = read("src/lib/dashboard-kpi/registry.ts");
    const format = read("src/app/(app)/dashboard/dashboard-format.ts");
    const userFacingSources = `${dashboard}\n${strategic}\n${registry}`;

    expect(userFacingSources).not.toMatch(/RLS[- ](?:visible|scoped)|RLS scoped|dashboard\.xlsx/i);
    expect(userFacingSources).not.toContain("مقيّد حسب الصلاحيات");
    expect(userFacingSources).toContain("Scoped to your access");
    expect(userFacingSources).toContain("ضمن نطاق صلاحيتك");
    expect(userFacingSources).not.toContain('copy(locale, "Methodology", "المنهجية")');
    expect(userFacingSources).toContain('copy(locale, "How this is calculated", "طريقة الاحتساب")');
    expect(dashboard).not.toContain('copy(locale, "Governed boundary", "حد معتمد")');
    expect(dashboard).toContain('copy(locale, "Why this is unavailable", "سبب عدم التوفر")');
    expect(format).not.toContain('t(locale, "Governance blocked", "محجوب بالحوكمة")');
    expect(format).toContain('t(locale, "Needs cycle policy", "يتطلب سياسة الدورة")');
  });
});
