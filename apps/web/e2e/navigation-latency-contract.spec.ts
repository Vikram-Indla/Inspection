import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) =>
  readFileSync(resolve(__dirname, `../${path}`), "utf8");

test.describe("Shared navigation latency contract", () => {
  test("primary business and Admin navigation permit Next route prefetch", () => {
    const businessShell = source("src/components/ShellClient.tsx");
    const businessNavItem = businessShell.slice(
      businessShell.indexOf("function renderNavItem"),
      businessShell.indexOf("function renderNavGroup"),
    );
    const adminShell = source("src/components/admin/AdminShellClient.tsx");

    expect(businessNavItem).not.toContain("prefetch={false}");
    expect(adminShell).not.toContain("prefetch={false}");
  });

  test("Admin navigation acknowledges clicks and recovers failed transitions", () => {
    const adminShell = source("src/components/admin/AdminShellClient.tsx");

    expect(adminShell).toContain("onClickCapture={handleNavigationCapture}");
    expect(adminShell).toContain("aria-busy={pendingHref");
    expect(adminShell).toContain("setPendingHref(null), 10_000");
    expect(adminShell).toContain("styles.routeProgress");
  });

  test("shell region reads are cached across route requests and invalidatable", () => {
    const persona = source("src/lib/persona.ts");

    expect(persona).toContain('["shell-regions"]');
    expect(persona).toContain("revalidate: ROLE_CACHE_SECONDS");
    expect(persona).toContain("export async function invalidateShellRegions()");
    expect(persona).toContain("revalidateTag(SHELL_REGION_TAG)");
  });
});
