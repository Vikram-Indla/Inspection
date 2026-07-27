import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) =>
  readFileSync(resolve(__dirname, `../${path}`), "utf8");

test.describe("Dashboard and Operations transition contract", () => {
  test("both route loading states preserve the shared route header frame", () => {
    const dashboardLoading = source("src/app/(app)/dashboard/loading.tsx");
    const operationsLoading = source("src/app/(app)/operations/loading.tsx");

    expect(dashboardLoading).toContain('<Shell current="/dashboard"');
    expect(operationsLoading).toContain('<Shell current="/operations"');
    expect(dashboardLoading).not.toContain('<main className="sq-content"');
  });

  test("failed navigation cannot leave the persistent shell busy forever", () => {
    const shell = source("src/components/ShellClient.tsx");

    expect(shell).toContain("if (!pendingHref) return;");
    expect(shell).toContain("setPendingHref(null), 10_000");
    expect(shell).toContain("window.clearTimeout(timer)");
  });
});
