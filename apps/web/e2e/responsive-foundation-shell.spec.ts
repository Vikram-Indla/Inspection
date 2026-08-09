import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { buildShellNavigation } from "../src/lib/shell-navigation";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const hrefs = (role: string) => buildShellNavigation([role]).flatMap(group => group.items.map(item => item.href));

test.describe("PKT-RESPONSIVE-FOUNDATION-SHELL-001", () => {
  test("Planner, Inspector and Administrator capability profiles receive the canonical business navigation", () => {
    const canonical = ["/dashboard", "/operations", "/factories", "/planning", "/execution", "/reviews", "/analytics"];
    for (const role of ["planner", "inspector", "security_admin"]) {
      expect(hrefs(role)).toEqual(expect.arrayContaining(canonical));
      expect(hrefs(role).some(href => href.startsWith("/admin/"))).toBe(true);
      expect(hrefs(role)).toEqual(hrefs("admin"));
    }
  });

  test("field and admin routes share the parent AppShell with no second navigation shell", () => {
    const parent = read("src/app/(app)/layout.tsx");
    const field = read("src/app/(app)/field/layout.tsx");
    const shell = read("src/components/Shell.tsx");
    expect(parent).toContain("return <AppShell>{children}</AppShell>");
    expect(parent).not.toContain("isFieldPath");
    expect(field).not.toContain("FieldShellDrawer");
    expect(field).not.toContain("<FieldNav");
    expect(shell).not.toContain("AdminShellClient");
  });

  test("Administration blocks Planner and Inspector before configuration data loads", () => {
    const layout = read("src/app/(app)/admin/layout.tsx");
    const boundary = read("src/components/AdminRouteBoundary.tsx");
    expect(layout).not.toMatch(/"planner"|"inspector"/);
    expect(layout).toContain("<AdminRouteBoundary");
    expect(boundary).toContain("allowedRoles.some(role => roles.has(role))");
    expect(boundary).toContain("You do not have access to this destination");
    expect(boundary).toContain("access is refused here, at the boundary");
    expect(boundary.indexOf("allowedRoles.some")).toBeLessThan(boundary.indexOf("<Shell"));
  });

  test("the shared shell keeps Arabic, RTL, theme and responsive controls", () => {
    const shell = read("src/components/ShellClient.tsx");
    expect(shell).toContain('dir={locale === "ar" ? "rtl" : "ltr"}');
    expect(shell).toContain("<ThemeToggle");
    expect(shell).toContain("(max-width: 1024px), (pointer: coarse)");
    expect(shell).toContain("aria-controls=\"saqeel-primary-nav\"");
  });
});
