import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { buildShellNavigation, SHELL_NAVIGATION } from "../src/lib/shell-navigation";

// TASK-WEB-COMPLIANCE-SHARED-SHELL-001
// CMP-REQ-SHELL-001..003 · SCR-SHARED-SHELL-001
const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("Prompt 01 shared shell source contract", () => {
  test("exact section and business information architecture is stable", () => {
    expect(SHELL_NAVIGATION.map(group => [group.id, group.labelEn, group.labelAr])).toEqual([
      ["overview", "Overview", "نظرة عامة"],
      ["operations", "Operations", "العمليات"],
      ["compliance", "Compliance", "الامتثال"],
      ["administration", "Administration", "الإدارة"],
    ]);
    const business = buildShellNavigation(["planner"]).flatMap(group => group.items).filter(item => item.visibility === "business");
    expect(business.map(item => item.labelEn)).toEqual([
      "Dashboard", "Operations Center", "Factory 360", "Planning", "Visits", "Tasks",
      "Execution", "Review & Approval", "Virtual Inspections", "Cases", "Committee & Signatures",
      "External Portal",
      "Inspection Rules", "Awaiting Approval", "Violations & Penalties",
    ]);
    expect(business.filter(item => item.parentId === "inspection").map(item => item.labelEn)).toEqual(["Execution", "Review & Approval"]);
  });

  test("Administration remains discoverable while unauthorized configuration options stay absent", () => {
    expect(buildShellNavigation(["reviewer"]).flatMap(group => group.items))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "admin-home", href: "/admin", enabled: true }),
      ]));
    const securityItems = buildShellNavigation(["security_admin"])
      .flatMap(group => group.items)
      .map(item => item.labelEn);
    expect(securityItems).toContain("Users");
    expect(securityItems).toContain("Roles");
    expect(securityItems).not.toContain("Risk Settings");
    expect(securityItems).not.toContain("Inspection Forms");
  });

  test("topbar contains global search, scopes, theme, notifications, AI and account without sample truth", () => {
    const shell = read("src/components/ShellClient.tsx");
    const server = read("src/components/Shell.tsx");
    const persona = read("src/lib/persona.ts");
    expect(shell).toContain('type="search" role="combobox"');
    expect(shell).toContain("routeScope.date");
    expect(shell).toContain("routeScope.region");
    expect(shell).toContain("<ThemeToggle");
    expect(shell).toContain("<NotificationBell");
    expect(shell).toContain('href="/ai/suggestions"');
    expect(shell).toContain("ax-shell-account__trigger");
    expect(server).toContain("getShellRegions()");
    expect(persona).toContain('sb.from("factories").select("region")');
    expect(shell).not.toMatch(/\b(?:85%|92%|98%|1,250)\b/);
    expect(shell).not.toContain("<svg id=\"ksa-boundaries\"");
  });

  test("global result search is authenticated and RLS-scoped with no bypass client", () => {
    const route = read("src/app/api/shell/search/route.ts");
    const search = read("src/lib/shell-search.ts");
    expect(route).toContain("supabaseServer()");
    expect(route).toContain("getVerifiedUser(sb)");
    expect(route).toContain("performShellSearch(sb, q)");
    expect(search).toContain("callers pass their own RLS-scoped Supabase client, never elevated");
    expect(search).toContain("SECURITY INVOKER");
    expect(search).toContain('sb.rpc("shell_global_search"');
    expect(search).toContain('sb.from("factories")');
    expect(search).toContain('sb.from("visits")');
    expect(search).toContain('sb.from("inspections")');
    expect(`${route}\n${search}`).not.toMatch(/service[_-]?role/i);
    expect(`${route}\n${search}`).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  test("existing route guards and unavailable states remain authoritative", () => {
    const boundary = read("src/components/AdminRouteBoundary.tsx");
    const dashboard = read("src/app/(app)/dashboard/page.tsx");
    const ai = read("src/app/(app)/ai/suggestions/page.tsx");
    expect(boundary).toContain("allowedRoles.some(role => roles.has(role))");
    expect(boundary).toContain("No configuration data has been loaded");
    expect(dashboard).toContain("mayViewDashboard");
    expect(ai).toContain("FEATURE_AI_DOCKETS");
    expect(ai).toContain("fail-closed");
  });
});
