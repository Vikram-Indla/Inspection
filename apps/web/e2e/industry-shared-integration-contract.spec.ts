import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");
const root = "src/lib/integrations/industry-shared";

test.describe("Industry Shared API v2 contract gate", () => {
  test("records every developer-supplied route once without inventing a method or auth contract", () => {
    const endpoints = read(`${root}/endpoints.ts`);
    const types = read(`${root}/types.ts`);
    for (const route of [
      "/shared/api/v2/license-info",
      "/shared/api/v2/license-info/products",
      "/shared/api/v2/license-info/preview",
      "/shared/api/v2/job-workforce-info",
      "/shared/api/v2/contact-list",
      "/shared/api/v2/plants",
      "/shared/api/v2/plant-with-labors",
      "/shared/api/v2/is-industrial-activity",
      "/shared/api/v2/get-industrial-activities",
      "/shared/api/v2/delegations",
      "/shared/api/v2/hrsd-labors",
    ]) expect(endpoints).toContain(route);
    expect((endpoints.match(/\/shared\/api\/v2\/hrsd-labors/g) ?? []).length).toBe(1);
    expect(types).toContain("readonly method: null");
    expect(types).toContain("readonly authContract: null");
    expect(types).toContain("readonly requestContract: null");
    expect(types).toContain("readonly responseContract: null");
  });

  test("is isolated from the existing Senaei provider and cannot make an inferred request", () => {
    const client = read(`${root}/client.ts`);
    const senaeiClient = read("src/lib/integrations/senaei/client.ts");
    expect(client).toContain('import "server-only"');
    expect(client).not.toContain("fetch(");
    expect(client).not.toMatch(/method:\s*["'](?:GET|POST|PUT|PATCH|DELETE)["']/);
    expect(client).not.toMatch(/bearer|api[_-]?key|cookie/i);
    expect(senaeiClient).toContain('const API_ROOT = "/api/inspection"');
    expect(senaeiClient).not.toContain("/shared/api/v2");
  });

  test("returns the exact fail-closed state for every unverified domain", () => {
    const errors = read(`${root}/errors.ts`);
    const adapter = read(`${root}/adapters/factory360.ts`);
    expect(errors).toContain('"INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED"');
    expect(errors).toContain("The Industry Shared API contract for ${domain} has not been supplied.");
    for (const domain of ["license master", "licensed product master", "job workforce", "operational contacts", "plant list", "industrial activity", "delegation", "HRSD workforce"]) {
      expect(adapter).toContain(domain);
    }
  });

  test("keeps sensitive domains distinct and privacy unclassified until evidence exists", () => {
    const endpoints = read(`${root}/endpoints.ts`);
    const adapter = read(`${root}/adapters/factory360.ts`);
    expect(endpoints).toContain('privacyClass: "UNKNOWN_UNTIL_CONTRACT_VERIFIED"');
    expect(adapter).toContain('contact_list: "permission-sensitive operational contacts"');
    expect(adapter).toContain('delegations: "authorized delegation history"');
    expect(adapter).toContain('hrsd_labors: "HRSD workforce information"');
  });
});
