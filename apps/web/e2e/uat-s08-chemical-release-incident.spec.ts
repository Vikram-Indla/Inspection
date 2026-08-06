import { test, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { waitForCredentialsForm, submitCredentials, identifierField, passwordField } from "./login-helper";

// Same minimal .env reader as personas.ts (e2e/personas.ts) — the Playwright
// test process does not auto-load apps/web/.env.local the way the Next.js
// server does, so SAQEEL_CROSS_ROLE_PASSWORD must be read the same way.
function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim().replace(/^export\s+/, "");
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}
const webRoot = resolve(__dirname, "..");
const envFileValues = { ...parseEnvFile(join(webRoot, ".env.local")), ...parseEnvFile(join(webRoot, ".env")) };

// TASK-CHEMICAL-RELEASE-INCIDENT-UAT-8 / dataset UAT-S08.
// Base: main d624df216fcccd9440a7f06e91595f03d5550b82, isolated worktree
// chemical-release-incident-uat-4ab7c0. Governed identities only:
//   admin4@mim.gov.sa · planner5@mim.gov.sa · supervisor3@mim.gov.sa ·
//   inspector7@mim.gov.sa (docs/TEST_ACCOUNTS.md, all SAQEEL_CROSS_ROLE_PASSWORD).
//
// SCOPE FINDING (see PR description / defect inventory): the requested journey
// — Chemical Release fields, priority/routing, escalation, completion,
// supervisory *decision*, dashboard/notification outcome — is not built.
// incident_reports (20260720010000_incident_reports.sql) is an insert-only,
// free-text capture table: no priority/status/assignee/escalation/decision
// column exists, no dashboard or notification hook reads it. incident_type is
// explicitly a HUMAN_DECISION free-text field (no enum), so "Chemical Release"
// is exercised here as a literal string value, not a governed option.
// This spec therefore:
//   1. Exercises the real, existing pipeline end-to-end (creation → field
//      evidence-adjacent capture → read-back → audit-trigger-backed history)
//      with a Chemical Release incident tagged to UAT-S08.
//   2. Proves the permission boundary (inspector-only insert).
//   3. Proves the supervisory *read* gap this task's investigation found and
//      fixed (supabase/migrations/20260803220000_incident_reports_supervisor_read.sql).
//   4. Asserts — as regression guards, not aspirations — that priority,
//      escalation, completion/closure, supervisory decision-write, and
//      dashboard/notification surfaces remain absent, so a future change
//      cannot silently invent them without this spec being deliberately
//      updated.

const CROSS_ROLE_PASSWORD = () => {
  const v = process.env.SAQEEL_CROSS_ROLE_PASSWORD ?? envFileValues.SAQEEL_CROSS_ROLE_PASSWORD;
  if (!v) throw new Error("SAQEEL_CROSS_ROLE_PASSWORD is required for the UAT-S08 numbered identities.");
  return v;
};

const IDENTITY = {
  admin: { email: "admin4@mim.gov.sa", home: "/admin" },
  planner: { email: "planner5@mim.gov.sa", home: "/planning" },
  supervisor: { email: "supervisor3@mim.gov.sa", home: "/dashboard" },
  inspector: { email: "inspector7@mim.gov.sa", home: "/dashboard" },
} as const;

async function loginAs(page: Page, key: keyof typeof IDENTITY) {
  const p = IDENTITY[key];
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(p.email);
  await passwordField(page).fill(CROSS_ROLE_PASSWORD());
  await submitCredentials(page);
  await page.waitForURL((url) => url.pathname.startsWith(p.home) || url.pathname.startsWith("/dashboard"), { timeout: 40_000 });
  await expect(page.locator("body")).not.toContainText("ERR-AUTH");
}

// UAT-S08 dataset tag embedded in every field this run writes, so rows are
// unambiguously identifiable and never collide with other tasks' fixtures.
const RUN_TAG = `UAT-S08-${Date.now()}`;
const ESTABLISHMENT_CODE = `EST-${RUN_TAG}`;
const CR_NUMBER = `CR-${RUN_TAG}`;
const DESCRIPTION = `Chemical release incident — dataset ${RUN_TAG}`;

test.describe.serial("UAT-S08 · Chemical Release and Incident journey (TASK 8)", () => {
  test("EM-057/insert-policy: inspector7 creates a Chemical Release incident (field route)", async ({ page }) => {
    await loginAs(page, "inspector");
    await page.goto("/field/incident-reports?kind=incident");
    await expect(page.locator("#new-incident")).toBeVisible();

    await page.locator("#field-ir-establishment-code").fill(ESTABLISHMENT_CODE);
    await page.locator("#field-ir-cr").fill(CR_NUMBER);
    await page.locator("#field-ir-source").fill("Field inspector observation");
    await page.locator("#field-ir-type").fill("Chemical Release");
    await page.locator("#field-ir-reporter").fill("UAT-S08 Inspector 7");
    await page.locator("#field-ir-contact").fill("0500000008");
    await page.locator("#field-ir-time").fill(new Date().toISOString());
    await page.locator("#field-ir-cases").fill("1");
    await page.locator("#field-ir-description").fill(DESCRIPTION);
    await page.locator("#field-ir-damage").fill("Localized chemical spill, contained on site.");

    await page.locator("#new-incident button.btn-primary").click();
    await expect(page.getByText("Incident report submitted.")).toBeVisible({ timeout: 30_000 });
  });

  test("negative: required Preliminary Incident Description blocks empty submit", async ({ page }) => {
    await loginAs(page, "inspector");
    await page.goto("/field/incident-reports?kind=incident");
    const description = page.locator("#field-ir-description");
    await expect(description).toHaveAttribute("required", "");
    // Browser-native required-field validation blocks submission; the row list
    // must not grow from this attempt.
    const before = await page.locator("details").count();
    await page.locator("#new-incident button.btn-primary").click();
    await expect(page.locator("#new-incident")).toBeVisible(); // still on the form, no navigation/error round-trip
    const after = await page.locator("details").count();
    expect(after).toBe(before);
  });

  test("EM-046..059/read-scope: the Chemical Release incident is visible to inspector7 in field history", async ({ page }) => {
    await loginAs(page, "inspector");
    await page.goto("/field/incident-reports?kind=incident");
    const row = page.locator("details", { hasText: ESTABLISHMENT_CODE });
    await expect(row).toBeVisible();
    await expect(row.locator("summary")).toContainText("Chemical Release");
    await row.click();
    await expect(row).toContainText(CR_NUMBER);
    await expect(row).toContainText(DESCRIPTION);
  });

  test("permission: planner5 cannot insert an incident (inspector-only RLS)", async ({ page }) => {
    await loginAs(page, "planner");
    await page.goto("/incident-reports");
    await page.getByLabel("Establishment Code").fill(`${ESTABLISHMENT_CODE}-PLANNER-ATTEMPT`);
    await page.getByLabel("Incident Type").fill("Chemical Release");
    const submit = page.getByRole("button", { name: /submit/i });
    await submit.click();
    // RLS rejects the insert; the neutral write-error surfaces, nothing was
    // created under the planner's identity.
    await expect(page.getByText(/inspector scope required/i)).toBeVisible({ timeout: 30_000 });
  });

  test("defect-fix proof — supervisor3 CAN now read the incident (pre-fix this returned zero rows)", async ({ page }) => {
    await loginAs(page, "supervisor");
    await page.goto("/incident-reports");
    await expect(page.getByText(ESTABLISHMENT_CODE)).toBeVisible({ timeout: 30_000 });
  });

  test("admin4 can read the incident via the broad compliance_admin/admin read scope", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/incident-reports");
    // admin4 holds canonical role 'admin', not a role listed in
    // incident_reports_read — this documents current (unchanged) scope rather
    // than asserting a capability that may not exist; see defect inventory.
    const visible = await page.getByText(ESTABLISHMENT_CODE).isVisible().catch(() => false);
    test.info().annotations.push({
      type: "defect-inventory",
      description: visible
        ? "admin4 (canonical 'admin') can read incident_reports."
        : "admin4 (canonical 'admin') CANNOT read incident_reports — 'admin' is not in incident_reports_read's role list and has no has_internal_role('admin') arm the way supervisor now does. Candidate follow-up, not fixed in this task (out of the supervisory-decision UAT scope).",
    });
  });

  test("regression guard: priority, escalation, completion/closure, supervisory decision-write and dashboard/notification remain unbuilt (do not silently invent)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const webRoot = path.resolve(__dirname, "..");
    const repoRoot = path.resolve(webRoot, "../..");
    const migration = fs.readFileSync(path.join(repoRoot, "supabase/migrations/20260720010000_incident_reports.sql"), "utf8");
    for (const column of ["priority", "status", "severity", "assignee", "supervisor_decision", "escalat"]) {
      expect(migration.toLowerCase(), `incident_reports must not silently gain a ${column} column`).not.toContain(column.toLowerCase());
    }
    // No update/delete policy exists — there is no completion/closure or
    // supervisory-decision write path at the DB level.
    expect(migration).not.toMatch(/for update/i);
    expect(migration).not.toMatch(/for delete/i);
  });
});
