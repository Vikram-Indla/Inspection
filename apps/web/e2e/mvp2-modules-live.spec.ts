import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Live module journeys against staging. Each route consumes its real RLS-scoped
// MVP2 tables and must render (heading + banner + a hard state), flag ON.
// TASK-MVP2 M2-04/06/08/09/10/12. Requires FEATURE_* flags on in the server env.
test.use({ storageState: storageStatePath("admin") });
test.describe.configure({ timeout: 120_000 });

const ROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: "/admin/risk/models",     heading: /Risk model workbench/i },
  { path: "/cases",                 heading: /Cases/i },
  { path: "/portal",                heading: /External portal/i },
  { path: "/operations/exceptions", heading: /Exception board/i },
  { path: "/committee",             heading: /Committee & signatures/i },
  { path: "/admin/gis/spatial",     heading: /Spatial canvas/i },
  { path: "/ai/suggestions",        heading: /Assistive AI dockets/i },
];

for (const r of ROUTES) {
  test(`module route renders live: ${r.path}`, async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto(r.path);
    // Heading proves the flag is ON and the server component read its tables
    // without crashing (RLS-scoped). Not the flag-off NotYetBoundary.
    await expect(page.getByRole("heading", { name: r.heading }).first()).toBeVisible();
    await expect(page.getByText(/Not available yet/i)).toHaveCount(0);
    // A hard state is always present (banner, panel or empty state) — never a blank page.
    await expect(page.locator(".sq-banner, .sq-state, .alert, .panel").first()).toBeVisible();
    // No horizontal overflow at desktop width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBeFalsy();
  });
}

// Governed WRITE journey — the validation rule always refuses a bad weights
// sum before any write. Whether the valid draft then persists depends on the
// signed-in identity holding a risk-capability grant in the live role model:
// with the grant the draft persists; without it RLS refuses and NOTHING is
// persisted. Both outcomes are asserted honestly; silent loss is a failure.
test("M2-04 governed write: invalid weights refused; valid draft persists or is RLS-refused unchanged", async ({ page }, testInfo) => {
  await page.goto("/locale?set=en");
  await page.goto("/admin/risk/models");
  const label = `e2e-${Date.now()}`;
  await page.locator("#risk-model-version-label").fill(label);
  await page.locator("#risk-factor-0").fill("a");
  await page.locator("#risk-weight-0").fill("0.5");
  await page.locator("#risk-draft-low").fill("39");
  await page.locator("#risk-draft-medium").fill("69");
  await expect(page.getByRole("status").filter({ hasText: /sum to 1\.00/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Create draft/i })).toBeDisabled();

  await page.locator("#risk-weight-0").fill("1");
  await expect(page.getByRole("status").filter({ hasText: /Canonical structure valid/i })).toBeVisible();
  await page.getByRole("button", { name: /Create draft/i }).click();
  const outcome = await Promise.race([
    page.getByText(/draft created/i).waitFor().then(() => "persisted" as const),
    page.getByRole("alert").filter({ hasText: /row-level security|could not be saved|scope required/i }).first()
      .waitFor().then(() => "refused" as const),
  ]);
  testInfo.annotations.push({ type: "live-outcome", description: `risk draft ${outcome}` });
  await page.reload();
  if (outcome === "persisted") await expect(page.getByText(label)).toBeVisible();
  else await expect(page.getByText(label)).toHaveCount(0);
});

test("M2-06 governed write: GIS layer persists or is RLS-refused unchanged (live gis scope)", async ({ page }, testInfo) => {
  const key = `e2e-layer-${Date.now()}`;
  await page.goto("/locale?set=en");
  await page.goto("/admin/gis/spatial");
  await page.locator('input[name="layer_key"]').fill(key);
  await page.locator('input[name="label"]').fill(key);
  await page.getByRole("button", { name: /Create layer/i }).click();
  const outcome = await Promise.race([
    page.getByText(/layer created/i).waitFor().then(() => "persisted" as const),
    page.getByRole("alert").filter({ hasText: /row-level security|could not be saved|scope required/i }).first()
      .waitFor().then(() => "refused" as const),
  ]);
  testInfo.annotations.push({ type: "live-outcome", description: `gis layer ${outcome}` });
  await page.reload();
  if (outcome === "persisted") await expect(page.getByText(key)).toBeVisible();
  else await expect(page.getByText(key)).toHaveCount(0);
});

test("M2-10 governed write: a case opens only for compliance scope; otherwise the refusal changes nothing", async ({ page }, testInfo) => {
  await page.goto("/locale?set=en");
  await page.goto("/cases");
  await page.getByRole("button", { name: /Open case/i }).click();
  const outcome = await Promise.race([
    page.getByText(/case opened/i).waitFor().then(() => "opened" as const),
    page.getByRole("alert").filter({ hasText: /could not be saved|scope required/i }).first()
      .waitFor().then(() => "refused" as const),
  ]);
  testInfo.annotations.push({ type: "live-outcome", description: `case ${outcome}` });
  if (outcome === "refused") {
    await expect(page.getByText(/Nothing was changed/i)).toBeVisible();
  }
});

test("M2-12 governed write: record a signature act, verification unavailable (PKI held)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/committee");
  await page.getByRole("button", { name: /Record signature act/i }).click();
  await expect(page.getByText(/recorded/i)).toBeVisible();
  await page.reload();
  // PKI/EBDA held → verification is 'unavailable', never fabricated 'verified'.
  await expect(page.getByText("unavailable").first()).toBeVisible();
});

test("M2-08 governed write: create an external request (live RLS admin intake)", async ({ page }, testInfo) => {
  const subject = `e2e-req-${Date.now()}`;
  await page.goto("/locale?set=en");
  await page.goto("/portal");
  const noFactory = page.getByText("No factory in scope.", { exact: true });
  if (await noFactory.count()) {
    testInfo.annotations.push({ type: "live-outcome", description: "no factory in scope — governed empty state" });
    await expect(noFactory).toBeVisible();
    return;
  }
  await page.locator('input[name="subject"]').fill(subject);
  await page.getByRole("button", { name: /Create internal intake/i }).click();
  await expect(page.getByText(/Request created/i)).toBeVisible();
});

test("M2-11 Gemini: generate an AI advisory suggestion, then human-dispose (live provider)", async ({ page }) => {
  const evidenceRef = `EV-AI-${Date.now()}`;
  await page.goto("/locale?set=en");
  await page.goto("/ai/suggestions");
  const generateForm = page.locator("form").filter({ has: page.locator('input[name="context"]') });
  const contextField = generateForm.locator('input[name="context"]');
  await contextField.waitFor();
  test.skip(
    await contextField.isDisabled(),
    "AI provider is fail-closed here (no GEMINI key in the server environment); the held-provider contract is covered by the manual-propose journey.",
  );
  await contextField.fill(`ctx-${Date.now()} two overdue factories`);
  await generateForm.locator('input[name="evidence_refs"]').fill(evidenceRef);
  await generateForm.getByRole("button", { name: /Generate/i }).click();
  // Gemini is live in the server env → a real advisory suggestion is created (proposed).
  await expect(generateForm.getByText(/^generated$/i)).toBeVisible({ timeout: 30_000 });
  await page.reload();
  // The exact evidence-cited row is proposed/configured and only a human may
  // dispose it; AI never mutates the decision state itself.
  const row = page.locator(".sq-surface, .panel").filter({ hasText: evidenceRef }).first();
  await expect(row).toBeVisible();
  await expect(row.locator(".sq-lozenge, .badge", { hasText: "proposed" })).toBeVisible();
  await expect(row.locator(".sq-lozenge, .badge", { hasText: "configured" })).toBeVisible();
  await row.locator('select[name="to"]').selectOption("rejected");
  await row.locator('input[name="reason"]').fill("Regression evidence item completed");
  await row.getByRole("button", { name: /Disposition|Applying/i }).click();
  await expect(row.getByText(/^disposed$/i)).toBeVisible();
});

test("M2-11 governed write: propose an advisory suggestion, then human-dispose it (live)", async ({ page }) => {
  const text = `e2e-ai-${Date.now()}`;
  const evidenceRef = `EV-MANUAL-${Date.now()}`;
  await page.goto("/locale?set=en");
  await page.goto("/ai/suggestions");
  // provider is fail-closed → any suggestion carries 'unavailable', human proposes advisory
  const proposeForm = page.locator("form").filter({ has: page.locator('input[name="text"]') });
  await proposeForm.locator('input[name="text"]').fill(text);
  await proposeForm.locator('input[name="evidence_refs"]').fill(evidenceRef);
  await proposeForm.getByRole("button", { name: /^Propose$/i }).click();
  await expect(proposeForm.getByText(/^proposed$/i)).toBeVisible();
  await page.reload();
  await expect(page.getByText(text)).toBeVisible();
  const row = page.locator(".sq-surface, .panel").filter({ hasText: text });
  await expect(row.getByText("unavailable")).toBeVisible(); // provider held, never auto-actioned
  // human disposition (reject) — mandatory reason
  await row.locator('select[name="to"]').selectOption("rejected");
  await row.locator('input[name="reason"]').fill("not applicable");
  await row.getByRole("button", { name: /Disposition|Applying/i }).click();
  await expect(page.getByText(/disposed/i).first()).toBeVisible();
});
