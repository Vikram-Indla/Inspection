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
    const queries = read("src/features/admin-senai-data/queries.ts");
    const sources = read("src/components/sections/admin-senai-data/senai-sources.tsx");
    const reconcile = read("src/components/sections/admin-senai-data/senai-reconcile.tsx");
    const endpoints = read("src/components/sections/admin-senai-data/senai-endpoints.tsx");
    const copy = read("src/i18n/locales/en/admin-senai-data.json");

    for (const source of [
      "connectionsRead",
      "runsRead",
      "callsRead",
      "reconciliationRead",
    ]) {
      expect(queries).toContain(`${source}.error`);
    }
    expect(queries).not.toContain("schemaUnavailable");
    expect(sources).toContain("data.runsFailed");
    expect(sources).toContain("strings.unavailable");
    expect(reconcile).toContain("data.runsFailed");
    expect(reconcile).toContain("data.connectionsFailed");
    expect(reconcile).toContain("row.outcome");
    expect(endpoints).toContain("verificationUnavailableShort");
    expect(copy).toContain("This is data that's not available, not a checked, empty divergence set.");
  });

  test("keeps narrow-screen overflow safe without introducing colours", () => {
    const css = read("src/components/sections/admin-senai-data/senai-data.module.css");
    const table = read("src/components/saqeel/data-table/data-table.module.css");

    expect(css).toContain("min-inline-size: 0");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(/);
    expect(table).toContain("overflow-x: auto");
  });
});
