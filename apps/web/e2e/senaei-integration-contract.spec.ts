import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");
const root = "src/lib/integrations/senaei";

test.describe("Factory 360 typed Senaei integration contract", () => {
  test("uses one server-only, explicit and fail-closed environment contract", () => {
    const client = read(`${root}/client.ts`);
    const contract = read(`${root}/contract.ts`);
    expect(client).toContain('import "server-only"');
    for (const key of ["SENAEI_BASE_URL", "SENAEI_ALLOWED_HOST_SUFFIX", "SENAEI_AUTH_MODE", "SENAEI_PUBLIC_ENDPOINT_AUTH_MODE", "SENAEI_API_KEY", "SENAEI_BEARER_TOKEN"]) expect(client).toContain(key);
    expect(client).not.toMatch(/console\.(?:log|error|warn)/);
    expect(client).toContain('baseUrl.protocol !== "https:"');
    expect(client).toContain("const API_ROOT = SENAEI_API_ROOT");
    expect(contract).toContain('export const SENAEI_API_ROOT = "/api/inspection"');
  });

  test("bounds network behavior and retries GET only", () => {
    const client = read(`${root}/client.ts`);
    expect(client).toContain("config.maxJsonBytes");
    expect(client).toContain("controller.abort()");
    expect(client).toContain('method === "GET" ? config.getRetryCount + 1 : 1');
    expect(client).toContain('cache: "no-store"');
  });

  test("models all result states and the exact missing-contract response", () => {
    const types = read(`${root}/types.ts`);
    const errors = read(`${root}/errors.ts`);
    for (const state of ["available", "degraded", "not_configured", "failed"]) expect(types).toContain(`status: "${state}"`);
    expect(errors).toContain('"SENAEI_API_CONTRACT_NOT_SUPPLIED"');
    expect(errors).toContain("The Senaei API contract for ${domain} has not been supplied.");
  });

  test("uses documented reads and gates the contradictory production-line method", () => {
    const task = read(`${root}/adapters/task-detail.ts`);
    const production = read(`${root}/adapters/production-line.ts`);
    const regulations = read(`${root}/adapters/regulations.ts`);
    expect(task).toContain("/api/inspection/tasks/${segment(taskId)}");
    expect(regulations).toContain('"/api/inspection/regulations"');
    expect(production).toContain('client.productionLineMode !== "get_query"');
    expect(production).toContain('method: "GET"');
    expect(production).not.toContain('method: "POST"');
  });

  test("isolates wire misspellings and declares unsupported domains", () => {
    const types = read(`${root}/types.ts`);
    const schemas = read(`${root}/schemas.ts`);
    const factory360 = read(`${root}/adapters/factory360.ts`);
    for (const field of ["is_distrupted", "distrubtion_reason", "other_distrubtion_reason", "is_exmpted"]) expect(types).toContain(field);
    for (const canonical of ["isDisrupted", "disruptionReason", "otherDisruptionReason", "isExempted"]) expect(schemas).toContain(canonical);
    for (const domain of ["incentives", "factory document retrieval", "risk history", "violations and penalties"]) expect(factory360).toContain(`"${domain}"`);
    expect(factory360).toContain("listChemicalPermitsByPlant");
    expect(factory360).toContain("/chemical-permits");
  });

  test("covers every remaining documented endpoint with explicit methods", () => {
    const auth = read(`${root}/adapters/auth.ts`);
    const profile = read(`${root}/adapters/profile.ts`);
    const tasks = read(`${root}/adapters/tasks.ts`);
    const submission = read(`${root}/adapters/inspection-submission.ts`);
    for (const endpoint of ["login", "logout", "forgot-password", "reset-password"]) expect(auth).toContain(`/api/inspection/${endpoint}`);
    expect((auth.match(/method: "POST"/g) ?? []).length).toBe(4);
    expect(profile).toContain('"/api/inspection/profile"');
    expect(tasks).toContain('"/api/inspection/tasks"');
    expect(submission).toContain('endpoint: "/api/inspection/tasks/submit-inspection/{task}"');
    expect(submission).toContain('method: "POST"');
    expect(submission).not.toContain('method: "GET"');
  });

  test("public auth and multipart submission fail closed without guessing", () => {
    const auth = read(`${root}/adapters/auth.ts`);
    const client = read(`${root}/client.ts`);
    const submission = read(`${root}/adapters/inspection-submission.ts`);
    expect(auth).toContain("SENAEI_PUBLIC_AUTH_MODE_UNCONFIRMED");
    expect(auth).toContain("client.publicEndpointAuthMode");
    expect(client).not.toContain("const credential = authMode");
    expect(client).toContain("if (!config.bearerToken) return configurationMissing");
    expect(client).toContain('method === "GET" ? config.getRetryCount + 1 : 1');
    expect(client).toContain('options.body instanceof FormData');
    expect(client).toContain("Multipart content type must be generated with its FormData boundary.");
    expect(submission).toContain("submission.governanceRef.trim()");
    expect(submission).toContain('"inspection_type"');
    expect(submission).toContain('"is_distrupted"');
  });

  test("builds the documented multipart structure but does not forward external submission", () => {
    const submission = read(`${root}/adapters/inspection-submission.ts`);
    const types = read(`${root}/types.ts`);
    for (const field of ["factory_front_image[]", "distrubtion_report[]", "used_fuel_type[]", "checklist_items[${item.externalId}]", "[response_attachments][]", "selected_products[${index}][id]", "products_images[]", "selected_tools[${index}][is_passed]", "tools_images[]", "selected_raw_materials[${index}][is_in_factory]"]) expect(submission).toContain(field);
    expect(submission).toContain("payloadChecksum");
    expect(submission).toContain("createBlockedSubmissionOutbox");
    expect(submission).toContain('"BLOCKED_TRIGGER_DECISION"');
    expect(submission).not.toContain("client.requestJson(");
    expect(types).toContain('deliveryStatus: "BLOCKED_TRIGGER_DECISION"');
  });
});
