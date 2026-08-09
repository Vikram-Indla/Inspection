import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) =>
  readFileSync(resolve(__dirname, `../${path}`), "utf8");

// AdminShellClient.tsx was retired when the admin shell merged into the
// shared shell: admin nav items render through the same renderNavItem /
// renderNavGroup pair in ShellClient.tsx, and the click-acknowledgement /
// stuck-transition recovery lives on the shared shell root.
test.describe("Shared navigation latency contract", () => {
  test("primary business and Admin navigation permit Next route prefetch", () => {
    const shell = source("src/components/ShellClient.tsx");
    const navItem = shell.slice(
      shell.indexOf("function renderNavItem"),
      shell.indexOf("function renderNavGroup"),
    );
    const navGroup = shell.slice(
      shell.indexOf("function renderNavGroup"),
      shell.indexOf("sq-route-progress"),
    );

    expect(navItem).not.toContain("prefetch={false}");
    expect(navGroup).not.toContain("prefetch={false}");
  });

  test("shared shell (Admin included) acknowledges clicks and recovers failed transitions", () => {
    const shell = source("src/components/ShellClient.tsx");

    expect(shell).toContain("onClickCapture={handleShellNavigation}");
    expect(shell).toContain("aria-busy={pendingHref");
    expect(shell).toContain("setPendingHref(null), 10_000");
    expect(shell).toContain("sq-route-progress");
  });

  test("shell region reads are cached across route requests and invalidatable", () => {
    const persona = source("src/lib/persona.ts");

    expect(persona).toContain('["shell-regions"]');
    expect(persona).toContain("revalidate: ROLE_CACHE_SECONDS");
    expect(persona).toContain("export async function invalidateShellRegions()");
    expect(persona).toContain("revalidateTag(SHELL_REGION_TAG)");
  });
});
