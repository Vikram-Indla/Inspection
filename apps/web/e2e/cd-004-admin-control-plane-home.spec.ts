import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// CD-004 / SCR-ADM-001 / client correction C-01.
const webRoot = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(webRoot, "src/app/(app)/admin/page.tsx"), "utf8");
const css = fs.readFileSync(path.join(webRoot, "src/app/(app)/admin/admin-home.module.css"), "utf8");
const shell = fs.readFileSync(path.join(webRoot, "src/lib/shell-navigation.ts"), "utf8");

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
    expect(page).toContain('from("compliance_configuration_requests")');
    expect(page).toContain('.in("status", ["pending_review", "partially_approved", "approved"])');
    expect(page).toContain('.neq("owner_id", user.id)');
    expect(page).toContain('.order("submitted_at", { ascending: true })');
    expect(page).toContain(".limit(8)");
    expect(page).toContain("?from=approval-queue");
  });

  test("derives request areas only from current governed components", () => {
    expect(page).toContain('from("compliance_request_components")');
    expect(page).toContain("component.revision_number === row.current_revision");
    expect(page).toContain("componentRead.error");
    expect(page).not.toMatch(/title.*includes|request_type.*area/i);
  });

  test("shows only completed configuration changes from the immutable audit source", () => {
    expect(page).toContain('from("audit_events")');
    expect(page).toContain('.eq("object_type", "compliance_configuration_request")');
    expect(page).toContain('.eq("action", "CCR_PUBLISHED")');
    expect(page).not.toContain("CCR_COMPONENT_APPROVE");
    expect(page).toContain("{row.action}");
    expect(page).toContain('<bdi dir="ltr">');
  });

  test("fails closed when role or independent sources cannot be verified", () => {
    expect(page).toContain("roleRead.error");
    expect(page).toContain("requestRead.error");
    expect(page).toContain("componentRead.error");
    expect(page).toContain("auditRead.error");
    expect(page).toContain("so we can't say if it's empty");
    expect(page).toContain("Recent changes are not available.");
  });

  test("ships complete EN and AR work-panel copy", () => {
    expect(page).toContain('"Control Panel", "لوحة التحكم"');
    expect(page).toContain('"Waiting on you", "بانتظار إجراء منك"');
    expect(page).toContain('"Recent configuration changes", "آخر تغييرات التهيئة"');
    expect(page).toContain('"No requests are waiting on your approval", "لا توجد طلبات بانتظار اعتمادك"');
    expect(page).toContain('"No changes returned for this scope", "لم تُعَد أي تغييرات لهذا النطاق"');
    expect(page).toContain('"Not configured", "غير مُهيّأ"');
  });

  test("keeps successful sibling data visible during partial failures", () => {
    expect(page).toContain("We could not read some request details, but the requests below are still shown.");
    expect(page).toContain("!requestRead.error && requests.length > 0");
    expect(page).toContain("auditRows.length === 0");
  });

  test("uses an intentional mobile table-to-card mode and logical properties", () => {
    expect(css).toContain("@media (max-width: 48rem)");
    expect(css).toContain(".workTable tbody");
    expect(css).toContain("display: block");
    expect(css).toContain("min-inline-size");
    expect(css).toContain("margin-block");
    expect(css).not.toContain("margin-left");
    expect(css).not.toContain("margin-right");
  });
});
