import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.describe("TASK-G11-REMEDIATION-PERFORMANCE-001 Pass 4 contracts", () => {
  test("K-001 persistent shell is owned by the authenticated route layout", () => {
    const layout = read("src/app/(app)/layout.tsx");
    const shell = read("src/components/Shell.tsx");
    const client = read("src/components/ShellClient.tsx");
    expect(layout).toContain("<AppShell>{children}</AppShell>");
    expect(shell).toContain("export async function AppShell");
    expect(shell).toContain("export default function Shell");
    expect(client).toContain("usePathname");
    expect(client).toContain("setPendingHref(null)");
    expect(existsSync(join(process.cwd(), "src/app/dashboard"))).toBe(false);
    expect(existsSync(join(process.cwd(), "src/app/(app)/dashboard/page.tsx"))).toBe(true);
  });

  test("K-002 lets the authenticated layout infer dynamic rendering", () => {
    const dashboard = read("src/app/(app)/dashboard/page.tsx");
    const field = read("src/app/(app)/field/page.tsx");
    expect(dashboard).not.toContain('export const dynamic = "force-dynamic"');
    expect(field).not.toContain('export const dynamic = "force-dynamic"');
    expect(read("src/app/(app)/layout.tsx")).toContain("AppShell");
  });

  test("K-004 role cache is user-keyed, short-lived and invalidatable", () => {
    const persona = read("src/lib/persona.ts");
    expect(persona).toContain("unstable_cache");
    expect(persona).toContain('["user-roles", userId]');
    expect(persona).toContain("ROLE_CACHE_SECONDS = 30");
    expect(persona).toContain("invalidateUserRoles");
    expect(persona).toContain("revalidateTag(roleTag(userId))");
  });

  test("K-003 dashboard streams view-specific, date-bounded sources", () => {
    const dashboard = read("src/app/(app)/dashboard/page.tsx");
    const snapshot = read("src/features/dashboard/snapshot.ts");
    expect(dashboard).toContain("<Suspense");
    expect(snapshot).toContain("strategic ? loadResponses(sb, bounds)");
    expect(snapshot).toContain('!strategic || persona === "supervisor" ? loadGeoEvents(sb, bounds)');
    expect(snapshot).toContain("boundIso");
    expect(snapshot).toContain("bounded: strategic");
  });

  test("K-015/K-016 scope workspace catalogues and batch signed URLs", () => {
    const workspace = read("src/app/(app)/field/inspection/[id]/page.tsx");
    expect(workspace).toContain('.in("code", packageCodes)');
    expect(workspace).toContain("referencedViolationCodes");
    expect(workspace).toContain('.in("id", runtimeViolationIds)');
    expect(workspace).toContain("createSignedUrls");
    expect(workspace).not.toContain("createSignedUrl(e.storage_path!");
  });

  test("K-011 search consolidates through an RLS-invoker RPC with trigrams", () => {
    const route = read("src/app/api/shell/search/route.ts");
    const search = read("src/lib/shell-search.ts");
    const migration = read("../../supabase/migrations/20260721120000_perf_tier_c_global_search.sql");
    expect(route).toContain("performShellSearch(sb, q)");
    expect(search).toContain('sb.rpc("shell_global_search"');
    expect(migration).toContain("security invoker");
    expect(migration).toContain("create index concurrently");
    expect(migration).toContain("gin_trgm_ops");
    expect(migration).toContain("dashboard_grouped_metrics");
    expect(migration).toContain("grant execute");
  });
});
