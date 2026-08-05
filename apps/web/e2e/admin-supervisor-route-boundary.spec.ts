// INSP-727 / INSP-38 — Supervisor must not reach /admin/* except the
// compliance-approvals, compliance-requests, audit and
// enforcement-recommendations subroutes it legitimately needs (Product Owner
// ruling). Static-source-content contract, matching the existing convention
// for this route-boundary family (see admin-access-route-aware.spec.ts): each
// admin subroute's AdminRouteBoundary allowedRoles list is asserted directly
// from source rather than driven through a live login, since the boundary
// itself is a pure function of that literal array.
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const repoRoot = path.resolve(__dirname, "..");
const adminRoot = path.join(repoRoot, "src/app/(app)/admin");
const read = (relPath: string) => fs.readFileSync(path.join(adminRoot, relPath), "utf8");

// Subroutes with no override — they inherit the parent /admin/layout.tsx
// boundary (admin + supervisor), which is correct: Supervisor's own
// dashboard ("Waiting on you") links directly into these.
const INHERITED_SUPERVISOR_ROUTES = ["audit", "enforcement-recommendations"];

// Subroutes with their own explicit override permitting Supervisor —
// Supervisor's compliance-approval workflow depends on these.
const EXPLICIT_SUPERVISOR_ROUTES = ["compliance-approvals", "compliance-requests"];

// Every other subroute must deny Supervisor. Admin must always be allowed.
const SUPERVISOR_DENIED_ROUTES = [
  "access",
  "bulk-violations",
  "delegation",
  "devices",
  "gis",
  "integrations",
  "items",
  "localization",
  "notifications",
  "operations",
  "packages",
  "planning",
  "regulations",
  "risk",
  "security-access",
  "templates",
  "violations",
  "workflows",
];

function allowedRolesOf(source: string): string[] {
  const match = source.match(/allowedRoles=\{\[([^\]]*)\]\}/);
  if (!match) throw new Error("no allowedRoles array found in AdminRouteBoundary usage");
  return match[1].split(",").map(role => role.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

test.describe("INSP-727 Supervisor admin route boundary", () => {
  test("parent /admin boundary still allows admin and supervisor (compliance-approvals/audit/enforcement-recommendations depend on this)", () => {
    const layout = read("layout.tsx");
    const match = layout.match(/const ADMINISTRATOR_CAPABILITY_ROLES = \[([^\]]*)\]/);
    expect(match, "ADMINISTRATOR_CAPABILITY_ROLES const not found").toBeTruthy();
    const roles = match![1].split(",").map(role => role.trim().replace(/^"|"$/g, "")).filter(Boolean);
    expect(roles).toContain("admin");
    expect(roles).toContain("supervisor");
    expect(roles).not.toContain("planner");
    expect(roles).not.toContain("inspector");
    expect(layout).toContain("AdminRouteBoundary allowedRoles={ADMINISTRATOR_CAPABILITY_ROLES}");
  });

  for (const route of INHERITED_SUPERVISOR_ROUTES) {
    test(`/admin/${route} has no route-level override — relies on parent admin+supervisor boundary`, () => {
      const layoutPath = path.join(adminRoot, route, "layout.tsx");
      expect(fs.existsSync(layoutPath), `${route} must not add its own layout.tsx that could narrow below the parent`).toBe(false);
    });
  }

  for (const route of EXPLICIT_SUPERVISOR_ROUTES) {
    test(`/admin/${route} explicitly allows admin and supervisor`, () => {
      const roles = allowedRolesOf(read(`${route}/layout.tsx`));
      expect(roles).toContain("admin");
      expect(roles).toContain("supervisor");
      expect(roles).not.toContain("planner");
      expect(roles).not.toContain("inspector");
    });
  }

  for (const route of SUPERVISOR_DENIED_ROUTES) {
    test(`/admin/${route} denies supervisor, allows admin`, () => {
      const layoutPath = path.join(adminRoot, route, "layout.tsx");
      expect(fs.existsSync(layoutPath), `${route} must have its own layout.tsx narrowing below the parent's admin+supervisor default`).toBe(true);
      const roles = allowedRolesOf(read(`${route}/layout.tsx`));
      expect(roles).toContain("admin");
      expect(roles).not.toContain("supervisor");
      expect(roles).not.toContain("planner");
      expect(roles).not.toContain("inspector");
    });
  }

  test("compliance-requests/new stays admin-only (creation is narrower than the review/decide surface)", () => {
    const roles = allowedRolesOf(read("compliance-requests/new/layout.tsx"));
    expect(roles).toEqual(["admin"]);
  });

  test("Planner and Inspector remain unaffected: no admin subroute grants either role", () => {
    const allLayouts = fs.readdirSync(adminRoot, { recursive: true } as { recursive: true })
      .filter((entry): entry is string => typeof entry === "string" && entry.endsWith("layout.tsx"))
      .map(entry => fs.readFileSync(path.join(adminRoot, entry), "utf8"));
    for (const source of allLayouts) {
      expect(source).not.toMatch(/allowedRoles=\{\[[^\]]*"planner"[^\]]*\]\}/);
      expect(source).not.toMatch(/allowedRoles=\{\[[^\]]*"inspector"[^\]]*\]\}/);
    }
  });
});
