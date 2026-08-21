import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// CD-004 / SCR-ADM-001 / client correction C-01.
// Migrated 2026-08-21 to the SAQEEL page/feature/section split: the governed
// contract now spans the thin route, the feature query, the section screen and
// the bilingual copy namespace. The behaviours asserted are unchanged.
const webRoot = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(webRoot, rel), "utf8");
const page = read("src/app/(app)/admin/page.tsx");
const queries = read("src/features/admin-home/queries.ts");
const screen = read("src/components/sections/admin-home/admin-home-screen.tsx");
const enCopy = read("src/i18n/locales/en/admin-home.json");
const arCopy = read("src/i18n/locales/ar/admin-home.json");
const shell = read("src/lib/shell-navigation.ts");

test.describe("CD-004 work-first admin landing", () => {
  test("removes duplicated navigation and the superseded evidence spine", () => {
    expect(page).not.toContain("Configuration evidence spine");
    expect(page).not.toContain("linkOnly");
    expect(page).not.toContain("Available families:");
    expect(page).not.toContain("buildShellNavigation");
    expect(page).not.toContain('href="/admin/regulations"');
    expect(page).not.toContain('href="/admin/packages"');
    expect(shell).toContain('href: "/admin/regulations"');
  });

  test("uses the canonical governed approval source with server-side maker exclusion", () => {
    expect(queries).toContain('from("compliance_configuration_requests")');
    expect(queries).toContain('.in("status", ["pending_review", "partially_approved", "approved"])');
    expect(queries).toContain('.neq("owner_id", user.id)');
    expect(queries).toContain('.order("submitted_at", { ascending: true })');
    expect(queries).toContain(".limit(8)");
    expect(screen).toContain("?from=approval-queue");
  });

  test("derives request areas only from current governed components", () => {
    expect(queries).toContain('from("compliance_request_components")');
    expect(screen).toContain("component.revision_number === row.current_revision");
    expect(screen).toContain("componentsError");
    expect(screen).not.toMatch(/title.*includes|request_type.*area/i);
  });

  test("shows only completed configuration changes from the immutable audit source", () => {
    expect(queries).toContain('from("audit_events")');
    expect(queries).toContain('.eq("object_type", "compliance_configuration_request")');
    expect(queries).toContain('.eq("action", "CCR_PUBLISHED")');
    expect(queries).not.toContain("CCR_COMPONENT_APPROVE");
    expect(screen).toContain("{row.action}");
    expect(screen).toContain('<bdi dir="ltr">');
  });

  test("fails closed when role or independent sources cannot be verified", () => {
    expect(queries).toContain("roleRead.error");
    expect(queries).toContain("requestRead.error");
    expect(queries).toContain("componentRead.error");
    expect(queries).toContain("auditRead.error");
    expect(enCopy).toContain("The request list could not be loaded. Requests may exist that are not shown.");
    expect(enCopy).toContain("The Activity Log could not be loaded. Changes may exist that are not shown.");
    expect(enCopy).toContain("Recent changes are not available.");
  });

  test("ships complete EN and AR work-panel copy", () => {
    expect(enCopy).toContain("Control Panel");
    expect(arCopy).toContain("لوحة التحكم");
    expect(enCopy).toContain("Waiting on you");
    expect(arCopy).toContain("بانتظار إجراء منك");
    expect(enCopy).toContain("Recent configuration changes");
    expect(arCopy).toContain("آخر تغييرات التهيئة");
    expect(enCopy).toContain("No requests are waiting on your approval");
    expect(arCopy).toContain("لا توجد طلبات بانتظار اعتمادك");
    expect(enCopy).toContain("No changes returned for this scope");
    expect(arCopy).toContain("لم تُعَد أي تغييرات لهذا النطاق");
    expect(enCopy).toContain("Not configured");
    expect(arCopy).toContain("غير مُهيّأ");
  });

  test("keeps successful sibling data visible during partial failures", () => {
    expect(enCopy).toContain("We could not read some request details, but the requests below are still shown.");
    expect(screen).toContain("data.requests.length === 0");
    expect(screen).toContain("data.audit.length === 0");
  });

  test("renders the governed work tables through the design-system DataTable", () => {
    expect(screen).toContain('from "@/components/saqeel/data-table/data-table"');
    expect(screen).toContain("<DataTable");
    expect(screen).not.toContain("<table");
    expect(screen).not.toContain("<td");
  });
});
