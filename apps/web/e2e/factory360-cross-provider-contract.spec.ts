import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");

/** Small CSV reader for governed ledgers: quoted commas are evidence, not separators. */
function csv(file: string): Record<string, string>[] {
  const lines = read(file).trimEnd().split("\n");
  const parse = (line: string) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') { cell += char; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { cells.push(cell); cell = ""; }
      else cell += char;
    }
    cells.push(cell);
    return cells;
  };
  const header = parse(lines[0]);
  return lines.slice(1).map(line => Object.fromEntries(parse(line).map((value, index) => [header[index], value])));
}

test.describe("TASK-FACTORY-360-CROSS-PROVIDER-CONTRACT-014 static contract", () => {
  const contractRoot = "product-contract/factory-360";

  test("maps every one of the 438 documented Inspection API fields exactly once with an allowed disposition", () => {
    const mappings = csv(`${contractRoot}/FACTORY_360_API_FIELD_MAPPING_LEDGER.csv`);
    const allowedDispositions = new Set([
      "CANONICAL_FIELD", "SOURCE_METADATA", "RAW_SNAPSHOT_ONLY", "TRANSIENT_REQUEST_ONLY",
      "SENSITIVE_RESTRICTED", "DUPLICATE_EXTERNAL_FIELD", "NOT_USED_WITH_REASON", "CONTRACT_UNVERIFIED",
    ]);
    expect(mappings).toHaveLength(438);
    expect(new Set(mappings.map(row => row.mapping_id)).size).toBe(438);
    expect(mappings.every(row => /^F360-XPC-MAP-\d{4}$/.test(row.mapping_id))).toBeTruthy();
    expect(mappings.every(row => /^INSP-API-\d{3}$/.test(row.endpoint_id))).toBeTruthy();
    expect(new Set(mappings.map(row => row.endpoint_id))).toEqual(new Set(Array.from({ length: 11 }, (_, index) => `INSP-API-${String(index + 1).padStart(3, "0")}`)));
    for (const row of mappings) {
      expect(row.external_field_path, row.mapping_id).not.toBe("");
      expect(allowedDispositions.has(row.disposition), `${row.mapping_id} disposition`).toBeTruthy();
      expect(row.status).toBe("STRUCTURALLY_DOCUMENTED");
      expect(row.web_consumer).toBe("Shared Factory 360 server projection or not consumed");
      expect(row.ipad_consumer).toBe("Same shared server projection; no provider client");
    }
  });

  test("preserves source precedence and one shared server-side dossier contract for Web and iPad", () => {
    const precedence = csv(`${contractRoot}/FACTORY_360_SOURCE_PRECEDENCE_MATRIX.csv`);
    const consumers = csv(`${contractRoot}/FACTORY_360_WEB_IPAD_CONSUMPTION_MATRIX.csv`);
    expect(precedence).toHaveLength(5);
    expect(precedence.find(row => row.field_group.startsWith("Commercial Registration"))?.reconciliation_rule).toContain("Never overwrite");
    expect(precedence.find(row => row.field_group === "Risk")?.source).toBe("Inspection Platform");
    expect(precedence.find(row => row.field_group === "Compliance/reports/violations/penalties")?.reconciliation_rule).toContain("Never overwrite immutable report");
    for (const consumer of consumers) expect(consumer.provider_client_allowed).toBe("no");
    expect(consumers.find(row => row.consumer === "Web Factory 360")?.projection).toBe("shared Factory 360 dossier loader");
    expect(consumers.find(row => row.consumer === "iPad shared dossier")?.projection).toBe("shared Factory 360 dossier loader");
    expect(consumers.find(row => row.consumer === "Offline snapshot")?.offline_rule).toContain("never raw provider payload or credentials");
  });

  test("keeps external submission structurally typed, governed, and separate from the platform offline outbox", () => {
    const submissionLedger = csv(`${contractRoot}/FACTORY_360_EXTERNAL_SUBMISSION_CONTRACT.csv`);
    const submission = read("apps/web/src/lib/integrations/senaei/adapters/inspection-submission.ts");
    const offline = read("apps/web/src/lib/offline.ts");
    expect(submissionLedger).toHaveLength(1);
    expect(submissionLedger[0]).toMatchObject({ endpoint_id: "INSP-API-011", method: "POST", content_type: "multipart/form-data", forwarding: "BLOCKED_TRIGGER_DECISION" });
    expect(submission).toContain("submission.governanceRef.trim()");
    expect(submission).toContain("submission.formData instanceof FormData");
    expect(submission).toContain('bodyKind: "multipart_form_data"');
    expect(submission).toContain('submission.formData.has("inspection_type")');
    expect(submission).toContain('submission.formData.has("is_distrupted")');
    expect(offline).toContain('kind: "submit"');
    expect(offline).toContain("idempotency_key: string");
    expect(offline).toContain('from("submission_versions").insert');
    expect(offline).not.toContain("submitInspection(");
  });

  test("fails Industry Shared closed for all eleven endpoints until a verified contract exists", () => {
    const endpointLedger = csv(`${contractRoot}/industry-shared/INDUSTRY_SHARED_ENDPOINT_CONTRACT_LEDGER.csv`);
    const unavailable = csv(`${contractRoot}/FACTORY_360_ERROR_AND_UNAVAILABLE_CONTRACT.csv`);
    const client = read("apps/web/src/lib/integrations/industry-shared/client.ts");
    const endpoints = read("apps/web/src/lib/integrations/industry-shared/endpoints.ts");
    expect(endpointLedger).toHaveLength(11);
    expect(endpointLedger.every(row => row.implementation_status === "BLOCKED_EXTERNAL_FAIL_CLOSED")).toBeTruthy();
    expect(endpointLedger.every(row => row.error_contract === "INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED")).toBeTruthy();
    expect(endpointLedger.every(row => row.auth_contract === "UNVERIFIED" && row.request_fields === "UNVERIFIED" && row.response_fields === "UNVERIFIED")).toBeTruthy();
    expect(unavailable.find(row => row.provider_family === "Industry Shared")).toMatchObject({ canonical_code: "INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED", retry: "no" });
    expect(client).toContain('import "server-only"');
    expect(client).not.toContain("fetch(");
    expect(client).toContain('contract.state !== "DISCOVERY_REQUIRED"');
    expect((endpoints.match(/state: "DISCOVERY_REQUIRED"/g) ?? []).length).toBe(1);
    expect((endpoints.match(/authContract: null/g) ?? []).length).toBe(1);
    expect((endpoints.match(/requestContract: null/g) ?? []).length).toBe(1);
    expect((endpoints.match(/responseContract: null/g) ?? []).length).toBe(1);
  });
});
