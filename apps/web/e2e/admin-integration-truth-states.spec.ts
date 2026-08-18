import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");

test.describe("Admin integration truthful partial-data presentation", () => {
  test("keeps endpoint, event and export reads independent", () => {
    const queries = read("src/features/admin-integrations/queries.ts");
    const screen = read("src/components/sections/admin-integrations/integrations-screen.tsx");
    const registry = read("src/components/sections/admin-integrations/integration-registry.tsx");
    const copy = read("src/i18n/locales/en/admin-integrations.json");

    for (const source of ["endpointsRead", "eventsRead", "exportsRead"]) {
      expect(queries).toContain(`${source}.error`);
    }
    for (const flag of ["endpointsFailed", "eventsFailed", "exportsFailed"]) {
      expect(queries).toContain(flag);
      expect(screen).toContain(flag);
    }
    expect(copy).toContain("not available, not an empty");
    expect(copy).not.toContain("14 controlled rows");
    expect(registry).toContain('row.status === "configured"');
    expect(registry).toContain("formatDateTime(row.updated_at");
  });

  test("keeps factory registry, run, batch, row and reconciliation failures separate", () => {
    const page = read("src/app/(app)/admin/integrations/factory-data/page.tsx");

    for (const source of [
      "factoriesRead",
      "runsRead",
      "batchesRead",
      "rowsRead",
      "reconciliationRead",
      "representativesRead",
    ]) {
      expect(page).toContain(`${source}.error`);
    }
    expect(page).not.toContain("schemaUnavailable");
    expect(page).toContain("No batch provenance recorded");
    expect(page).toContain('<bdi dir="ltr">{run.status}</bdi>');
    expect(page).toContain("<time dateTime={run.created_at}>");
  });

  test("does not convert failed SENAI reads into zero or empty source truth", () => {
    const page = read("src/app/(app)/admin/integrations/senai-data/page.tsx");

    for (const source of [
      "connectionsRead",
      "runsRead",
      "callsRead",
      "reconciliationRead",
    ]) {
      expect(page).toContain(`${source}.error`);
    }
    expect(page).not.toContain("schemaUnavailable");
    expect(page).toContain('runsRead.error ? t("admin.senai.unavailable"');
    expect(page).toContain('t("admin.senai.endpoints.verificationUnavailableShort"');
    expect(page).toContain("This is data that's not available, not a checked, empty divergence set.");
    expect(page).toContain('<bdi dir="ltr">{row.outcome}</bdi>');
  });

  test("contains narrow-screen overflow guards without introducing colours", () => {
    const css = read("src/app/(app)/admin/integrations/senai-data/senai-data.module.css");

    expect(css).toContain("min-width: 0");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("@media (max-width: 480px)");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(/);
  });
});
