import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

/**
 * PKT-PLANNING-CLOSURE-P0-001
 * LEASE-PLANNING-CLOSURE-QA-001
 *
 * Independent production-Planning closure suite. Runtime execution is
 * deliberately fail-closed until the orchestrator supplies:
 *   - the exact landed SHA,
 *   - the BA PLN-J01..J20 trace,
 *   - accepted Design / Backend / Web receipts,
 *   - an authorized test-target seed manifest.
 *
 * No required row is skipped. Missing authority, fixture state, persona or
 * evidence is a hard failure, never a synthetic PASS.
 */

const EVIDENCE_DIR = evidenceDirectory("PLANNING_CLOSURE_P0");
const RUN_SHA = process.env.PLANNING_CLOSURE_SHA ?? "";
const RUNTIME_AUTHORIZED = process.env.PLANNING_CLOSURE_RUNTIME_AUTHORIZED === "1";
const SEED_MANIFEST_PATH = process.env.PLANNING_CLOSURE_SEED_MANIFEST ?? "";
const AUTHORITY_RECEIPT_PATH = process.env.PLANNING_CLOSURE_AUTHORITY_RECEIPT ?? "";
const EXACT_720_HOURS_MS = 720 * 60 * 60 * 1000;

type FixtureRef = {
  id: string;
  route?: string;
  expectedScope?: string;
  referenceTime?: string;
  windowStart?: string;
  windowEnd?: string;
};

type SeedManifest = {
  runId: string;
  exactSha: string;
  testTarget: string;
  serverClockT0: string;
  fixtures: Record<string, FixtureRef>;
};

type AuthorityReceipt = {
  packetId: string;
  exactSha: string;
  baTrace: string;
  designReceipt: string;
  backendReceipt: string;
  webReceipt: string;
  r05: "BLOCKED" | "APPROVED";
  r06: "BLOCKED" | "APPROVED";
  cutoffBoundary: "INCLUSIVE" | "EXCLUSIVE";
  journeyMap: Record<ClosureCriterion, `PLN-J${string}`>;
};

type ClosureCriterion =
  | "workspace" | "method_continuity" | "single_draft" | "single_publish"
  | "r05_boundary" | "bulk_targeting" | "bulk_receipt" | "bulk_continuation"
  | "cancellation" | "reschedule" | "non_window_correction" | "r06_boundary"
  | "targeting_archive" | "parent_child_archive" | "draft_isolation"
  | "expiry_acknowledgement" | "expiry_execution_start" | "expiry_window_end"
  | "offline_conflict" | "cross_cutting";

const CLOSURE_CRITERIA: ClosureCriterion[] = [
  "workspace", "method_continuity", "single_draft", "single_publish",
  "r05_boundary", "bulk_targeting", "bulk_receipt", "bulk_continuation",
  "cancellation", "reschedule", "non_window_correction", "r06_boundary",
  "targeting_archive", "parent_child_archive", "draft_isolation",
  "expiry_acknowledgement", "expiry_execution_start", "expiry_window_end",
  "offline_conflict", "cross_cutting",
];

type BrowserEvidence = {
  journey: string;
  persona: string;
  route: string;
  state: string;
  expected: string;
  observed: string;
  exactSha: string;
  screenshot?: string;
  consoleErrors: string[];
  failedRequests: string[];
  createdAt: string;
};

function readJson<T>(path: string, label: string): T {
  expect(path, `${label} path must be supplied`).not.toBe("");
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function runtimeGate(): { seeds: SeedManifest; authority: AuthorityReceipt } {
  expect(RUNTIME_AUTHORIZED, "explicit Backend test-target handoff is required").toBe(true);
  expect(RUN_SHA, "PLANNING_CLOSURE_SHA is required").toMatch(/^[0-9a-f]{40}$/);
  const seeds = readJson<SeedManifest>(SEED_MANIFEST_PATH, "seed manifest");
  const authority = readJson<AuthorityReceipt>(AUTHORITY_RECEIPT_PATH, "authority receipt");
  expect(seeds.exactSha, "seed manifest must match runtime SHA").toBe(RUN_SHA);
  expect(authority.exactSha, "authority receipt must match runtime SHA").toBe(RUN_SHA);
  expect(authority.packetId).toBe("PKT-PLANNING-CLOSURE-P0-001");
  for (const value of [
    authority.baTrace,
    authority.designReceipt,
    authority.backendReceipt,
    authority.webReceipt,
  ]) expect(value, "all independent authority receipts are mandatory").not.toBe("");
  const mapped = CLOSURE_CRITERIA.map((criterion) => authority.journeyMap?.[criterion]);
  expect(mapped, "BA receipt must map every neutral closure criterion").toHaveLength(20);
  for (const id of mapped) expect(id).toMatch(/^PLN-J(?:0[1-9]|1[0-9]|20)$/);
  expect(new Set(mapped).size, "BA journey mapping must be one-to-one").toBe(20);
  expect(Number.isFinite(Date.parse(seeds.serverClockT0))).toBe(true);
  return { seeds, authority };
}

function journey(authority: AuthorityReceipt, criterion: ClosureCriterion): string {
  const id = authority.journeyMap[criterion];
  expect(id, `BA mapping missing for ${criterion}`).toMatch(/^PLN-J(?:0[1-9]|1[0-9]|20)$/);
  return id;
}

function fixture(seeds: SeedManifest, key: string): FixtureRef {
  const value = seeds.fixtures[key];
  expect(value, `seed manifest fixture ${key} is required`).toBeTruthy();
  expect(value.id, `${key} requires a stable id`).not.toBe("");
  return value;
}

function evidenceName(
  testInfo: TestInfo,
  journey: string,
  persona: string,
  state: string,
): string {
  const safe = `${RUN_SHA.slice(0, 8)}__${journey}__${persona}__${state}__${testInfo.project.name}`
    .replace(/[^a-zA-Z0-9_-]+/g, "-");
  return join(EVIDENCE_DIR, `${safe}.png`);
}

async function observe(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? "failed"}`);
  });
  return { consoleErrors, failedRequests };
}

async function capture(
  page: Page,
  testInfo: TestInfo,
  details: Omit<BrowserEvidence, "exactSha" | "createdAt" | "consoleErrors" | "failedRequests">,
  telemetry: Awaited<ReturnType<typeof observe>>,
) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  const screenshot = evidenceName(testInfo, details.journey, details.persona, details.state);
  await page.screenshot({ path: screenshot, fullPage: true });
  const row: BrowserEvidence = {
    ...details,
    exactSha: RUN_SHA,
    screenshot,
    consoleErrors: telemetry.consoleErrors,
    failedRequests: telemetry.failedRequests,
    createdAt: new Date().toISOString(),
  };
  const json = JSON.stringify(row);
  const hash = createHash("sha256").update(readFileSync(screenshot)).digest("hex");
  writeFileSync(`${screenshot}.json`, `${json.slice(0, -1)},"screenshotSha256":"${hash}"}\n`);
}

async function assertShellTruth(page: Page, locale: "en" | "ar") {
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", locale);
  await expect(html).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
  const direction = await html.evaluate((element) => getComputedStyle(element).direction);
  expect(direction).toBe(locale === "ar" ? "rtl" : "ltr");
}

async function assertNoHorizontalPageOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function gotoState(page: Page, route: string, locale: "en" | "ar" = "en") {
  await page.goto(`/locale?set=${locale}`);
  await page.goto(route);
  await expect(page.locator("main")).toBeVisible();
  await assertShellTruth(page, locale);
}

async function clickAndReload(page: Page, buttonName: RegExp, persisted: RegExp) {
  await page.getByRole("button", { name: buttonName }).click();
  await expect(page.getByText(persisted)).toBeVisible();
  await page.reload();
  await expect(page.getByText(persisted)).toBeVisible();
}

async function assertExact720Facts(page: Page, expected: "Eligible" | "Ineligible") {
  const panel = page.getByTestId("planning-720-eligibility");
  await expect(panel).toBeVisible();
  await expect(panel.getByText(expected, { exact: true })).toBeVisible();
  await expect(panel).toContainText("720");
  await expect(panel).toContainText(/reference|مرجع/i);
  await expect(panel).toContainText(/evaluated|تقييم/i);
  await expect(panel).toContainText(/UTC|Asia\/Riyadh|\+03:00/);
  await expect(panel).toContainText(/rule|version|قاعدة|إصدار/i);
}

async function openFixture(page: Page, ref: FixtureRef) {
  await gotoState(page, ref.route ?? `/visits/${ref.id}`);
  await expect(page.getByText(ref.id, { exact: false })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  runtimeGate();
});

test.describe("closure criteria — workspace, methods, single and immediate boundary", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("workspace preserves scoped filters and truthful empty/degraded states", async ({ page }, testInfo) => {
    const { seeds, authority } = runtimeGate();
    const telemetry = await observe(page);
    await gotoState(page, fixture(seeds, "workspace_populated").route ?? "/planning");
    await expect(page.getByTestId("planning-visit-table")).toBeVisible();
    await page.getByRole("textbox", { name: /search/i }).fill("PLN-CLOSURE");
    await page.getByRole("textbox", { name: /search/i }).press("Enter");
    const filteredUrl = page.url();
    await page.reload();
    expect(page.url()).toBe(filteredUrl);
    await expect(page.getByText(/scoped|نطاق/i)).toBeVisible();
    await capture(page, testInfo, {
      journey: journey(authority, "workspace"), persona: "planner", route: "/planning", state: "scoped-filter-reload",
      expected: "RLS-scoped results and URL-held continuity",
      observed: "Scoped label and filter survived reload",
    }, telemetry);
    expect(telemetry.consoleErrors).toEqual([]);
  });

  test("method changes preserve compatible draft and warn before incompatible loss", async ({ page }) => {
    const { seeds } = runtimeGate();
    await gotoState(page, fixture(seeds, "targeting_draft_compatible").route ?? "/planning");
    await page.getByRole("button", { name: /single/i }).click();
    await page.getByRole("button", { name: /bulk/i }).click();
    await expect(page.getByTestId("targeting-draft-reference")).toContainText(
      fixture(seeds, "targeting_draft_compatible").id,
    );
    await page.getByRole("button", { name: /immediate/i }).click();
    await expect(page.getByRole("alert")).toContainText(/preserve|discard|احتفاظ|استبعاد/i);
  });

  test("single registered visit draft is a distinct persisted aggregate", async ({ page }) => {
    const { seeds } = runtimeGate();
    await openFixture(page, fixture(seeds, "single_visit_draft"));
    await expect(page.getByText(/Visit draft|مسودة زيارة/i)).toBeVisible();
    await expect(page.getByText(/Targeting draft|مسودة استهداف/i)).toHaveCount(0);
    await expect(page.getByTestId("package-snapshot")).toBeVisible();
    await expect(page.getByTestId("inspector-recommendation-evidence")).toBeVisible();
    await page.reload();
    await expect(page.getByText(fixture(seeds, "single_visit_draft").id, { exact: false })).toBeVisible();
  });

  test("single publish revalidates conflict and exposes immutable atomic receipt", async ({ page }) => {
    const { seeds } = runtimeGate();
    await openFixture(page, fixture(seeds, "single_publish_ready"));
    await page.getByRole("button", { name: /review/i }).click();
    await expect(page.getByTestId("frozen-package")).toContainText(/immutable|frozen|غير قابل|مجمّد/i);
    await clickAndReload(page, /publish/i, /committed|published|تم النشر|مُثبت/i);
    const receipt = page.getByTestId("planning-atomic-receipt");
    await expect(receipt).toContainText(/correlation|ارتباط/i);
    await expect(receipt).toContainText(/audit|تدقيق/i);
  });

  test("R05 unregistered Factory remains blocked and non-interactive", async ({ page }, testInfo) => {
    const { authority } = runtimeGate();
    expect(authority.r05).toBe("BLOCKED");
    const telemetry = await observe(page);
    await gotoState(page, "/planning/immediate");
    const alert = page.getByRole("alert");
    await expect(alert).toContainText(/decision pending|قرار.*معلق/i);
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /dispatch|publish|create/i })).toHaveCount(0);
    await capture(page, testInfo, {
      journey: journey(authority, "r05_boundary"), persona: "planner", route: "/planning/immediate", state: "R05-blocked",
      expected: "Read-only decision boundary; no unregistered workflow",
      observed: "Pending-decision alert and no mutation controls",
    }, telemetry);
  });
});

test.describe("closure criteria — bulk targeting, receipt and >500 continuation", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("criteria freeze carries authoritative total, cursor, source and freshness", async ({ page }) => {
    const { seeds } = runtimeGate();
    await gotoState(page, fixture(seeds, "bulk_targeting_draft").route ?? "/planning/bulk");
    const summary = page.getByTestId("bulk-source-summary");
    await expect(summary).toContainText(/matching|مطابق/i);
    await expect(summary).toContainText(/loaded|محمّل/i);
    await expect(summary).toContainText(/cursor|مؤشر/i);
    await expect(summary).toContainText(/fresh|snapshot|حداثة|لقطة/i);
    await clickAndReload(page, /save.*draft|حفظ.*مسودة/i, /Targeting draft|مسودة استهداف/i);
  });

  test("per-factory validation and receipt keep committed/failed/retry/conflict/unknown distinct", async ({ page }) => {
    const { seeds } = runtimeGate();
    await gotoState(page, fixture(seeds, "bulk_mixed_review").route ?? "/planning/bulk/review");
    const ledger = page.getByTestId("bulk-validation-ledger");
    for (const label of [/committed/i, /validation/i, /retry/i, /conflict/i, /unknown/i]) {
      await expect(ledger.getByText(label)).toBeVisible();
    }
    await expect(page.getByText(/unknown.*(?:not|neither).*success|unreconciled/i)).toBeVisible();
  });

  test("frozen 501/1001 sets are never truncated and resume without duplication", async ({ page }, testInfo) => {
    const { seeds, authority } = runtimeGate();
    const ref = fixture(seeds, "bulk_1001_interrupted");
    const telemetry = await observe(page);
    await gotoState(page, ref.route ?? "/planning/bulk/review");
    const receipt = page.getByTestId("planning-atomic-receipt");
    await expect(receipt).toContainText("1001");
    await expect(receipt).toContainText(/processed|remaining|معالج|متبق/i);
    await page.getByRole("button", { name: /resume|استئناف/i }).click();
    await expect(receipt).toContainText(/1001.*1001|complete|مكتمل/i);
    const totals = await receipt.getByTestId("outcome-total").allTextContents();
    const sum = totals.map((value) => Number(value.replace(/[^\d]/g, ""))).reduce((a, b) => a + b, 0);
    expect(sum).toBe(1001);
    await expect(receipt).toContainText(/duplicate.*0|0.*duplicate/i);
    await capture(page, testInfo, {
      journey: journey(authority, "bulk_continuation"), persona: "planner", route: page.url(), state: "1001-resumed",
      expected: "No 500-row truncation; deterministic resume; exactly-once outcomes",
      observed: "Outcome sum 1001 and duplicate count 0",
    }, telemetry);
  });
});

test.describe("closure criteria — 720 hours, corrections and reassignment exclusion", () => {
  test.use({ storageState: storageStatePath("planner") });

  for (const boundary of [
    { key: "cancel_720_plus_1ms", relation: "plus" as const },
    { key: "cancel_720_exact", relation: "exact" as const },
    { key: "cancel_720_minus_1ms", relation: "minus" as const },
  ]) {
    test(`cancellation ${boundary.key} uses exact 720-hour server boundary`, async ({ page }) => {
      const { seeds, authority } = runtimeGate();
      const ref = fixture(seeds, boundary.key);
      const t0 = Date.parse(seeds.serverClockT0);
      const start = Date.parse(ref.windowStart ?? "");
      expect(Number.isFinite(start)).toBe(true);
      const expectedDelta = boundary.key.endsWith("plus_1ms")
        ? EXACT_720_HOURS_MS + 1
        : boundary.key.endsWith("minus_1ms") ? EXACT_720_HOURS_MS - 1 : EXACT_720_HOURS_MS;
      expect(start - t0).toBe(expectedDelta);
      await openFixture(page, ref);
      const expected = boundary.relation === "plus"
        ? "Eligible"
        : boundary.relation === "minus"
          ? "Ineligible"
          : authority.cutoffBoundary === "INCLUSIVE" ? "Eligible" : "Ineligible";
      await assertExact720Facts(page, expected);
      const cancel = page.getByRole("button", { name: /cancel visit|إلغاء الزيارة/i });
      if (expected === "Eligible") await expect(cancel).toBeEnabled();
      else await expect(cancel).toHaveCount(0);
    });
  }

  test("cancellation note is optional and governed reason still persists", async ({ page }) => {
    const { seeds } = runtimeGate();
    await openFixture(page, fixture(seeds, "cancel_optional_note"));
    await page.getByLabel(/reason|سبب/i).selectOption({ index: 1 });
    const note = page.getByLabel(/note|comment|ملاحظة|تعليق/i);
    await expect(note).not.toHaveAttribute("required", "");
    await page.getByRole("button", { name: /confirm cancel|تأكيد الإلغاء/i }).click();
    await expect(page.getByRole("status")).toContainText(/cancelled|ألغيت/i);
    await page.reload();
    await expect(page.getByText(/cancelled|ملغاة/i)).toBeVisible();
  });

  test("window-changing reschedule applies cutoff and conflicts atomically", async ({ page }) => {
    const { seeds } = runtimeGate();
    await openFixture(page, fixture(seeds, "reschedule_720_exact_conflict"));
    await assertExact720Facts(page, "Eligible");
    await expect(page.getByTestId("reschedule-old-window")).toBeVisible();
    await expect(page.getByTestId("reschedule-proposed-window")).toBeVisible();
    await page.getByRole("button", { name: /confirm reschedule|تأكيد إعادة الجدولة/i }).click();
    await expect(page.getByRole("alert")).toContainText(/conflict|تعارض/i);
    await page.reload();
    await expect(page.getByTestId("reschedule-old-window")).toContainText(
      fixture(seeds, "reschedule_720_exact_conflict").windowStart ?? "",
    );
  });

  test("non-window correction is excluded from 720-hour gate", async ({ page }) => {
    const { seeds } = runtimeGate();
    await openFixture(page, fixture(seeds, "correction_inside_720"));
    await expect(page.getByTestId("planning-720-eligibility")).toContainText(/not applicable|غير منطبق/i);
    await page.getByLabel(/notes|ملاحظات/i).fill("governed non-window correction");
    await clickAndReload(page, /save correction|حفظ التصحيح/i, /governed non-window correction/);
  });

  test("R06 reassignment is absent in UI and denied at authority boundary", async ({ page }, testInfo) => {
    const { seeds, authority } = runtimeGate();
    expect(authority.r06).toBe("BLOCKED");
    const telemetry = await observe(page);
    await openFixture(page, fixture(seeds, "reassignment_exclusion"));
    await expect(page.getByRole("alert")).toContainText(/decision pending|قرار.*معلق/i);
    await expect(page.getByRole("button", { name: /reassign|إعادة تعيين/i })).toHaveCount(0);
    await capture(page, testInfo, {
      journey: journey(authority, "r06_boundary"), persona: "planner", route: page.url(), state: "R06-blocked",
      expected: "No reassignment action; explicit pending-decision state",
      observed: "Pending alert present and action absent",
    }, telemetry);
  });
});

test.describe("closure criteria — archive provenance and draft isolation", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("targeting draft archive retains identity and never becomes Cancelled", async ({ page }) => {
    const { seeds } = runtimeGate();
    const ref = fixture(seeds, "archive_targeting_draft");
    await gotoState(page, ref.route ?? "/planning");
    await page.getByText(ref.id, { exact: false }).click();
    await page.getByRole("button", { name: /archive|أرشفة/i }).click();
    await expect(page.getByRole("dialog")).toContainText(ref.id);
    await page.getByRole("button", { name: /confirm archive|تأكيد الأرشفة/i }).click();
    await page.goto("/planning?lifecycle=active");
    await expect(page.getByText(ref.id, { exact: false })).toHaveCount(0);
    await page.goto("/planning?lifecycle=archived");
    await expect(page.getByText(ref.id, { exact: false })).toBeVisible();
    await expect(page.getByText(/Cancelled|ملغاة/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /restore|استعادة/i })).toHaveCount(0);
  });

  test("parent/child archive preserves both provenance identities without cancellation", async ({ page }, testInfo) => {
    const { seeds, authority } = runtimeGate();
    const parent = fixture(seeds, "archive_visit_draft_parent");
    const child = fixture(seeds, "archive_visit_draft_child");
    const telemetry = await observe(page);
    await openFixture(page, parent);
    await page.getByRole("button", { name: /archive|أرشفة/i }).click();
    await page.getByRole("button", { name: /confirm archive|تأكيد الأرشفة/i }).click();
    await page.goto(`/visits/${child.id}`);
    await expect(page.getByText(/Archived|مؤرشف/i)).toBeVisible();
    await expect(page.getByText(/Cancelled|ملغاة/i)).toHaveCount(0);
    await expect(page.getByText(parent.id, { exact: false })).toBeVisible();
    await capture(page, testInfo, {
      journey: journey(authority, "parent_child_archive"), persona: "planner", route: page.url(), state: "child-archive-provenance",
      expected: "Child archived with parent provenance; never Cancelled",
      observed: "Archived label and parent identity present; Cancelled absent",
    }, telemetry);
  });

  test("targeting and visit drafts remain distinct list/audit aggregates", async ({ page }) => {
    const { seeds } = runtimeGate();
    const targeting = fixture(seeds, "distinct_targeting_draft");
    const visit = fixture(seeds, "distinct_visit_draft");
    await gotoState(page, "/planning?lifecycle=draft");
    const tRow = page.getByTestId(`planning-row-${targeting.id}`);
    const vRow = page.getByTestId(`planning-row-${visit.id}`);
    await expect(tRow).toContainText(/Targeting draft|مسودة استهداف/i);
    await expect(vRow).toContainText(/Visit draft|مسودة زيارة/i);
    await expect(tRow).not.toContainText(visit.id);
    await expect(vRow).not.toContainText(targeting.id);
  });
});

test.describe("closure criteria — expiry, races, outbox and conflicts", () => {
  test.use({ storageState: storageStatePath("planner") });

  for (const expiry of [
    "expiry_no_acknowledgement",
    "expiry_no_execution_start",
    "expiry_not_completed_window_end",
  ]) {
    test(`${expiry} exposes rule/version and exactly-once result`, async ({ page }) => {
      const { seeds } = runtimeGate();
      await openFixture(page, fixture(seeds, expiry));
      const expiryPanel = page.getByTestId("planning-expiry-result");
      await expect(expiryPanel).toContainText(/rule|قاعدة/i);
      await expect(expiryPanel).toContainText(/version|إصدار/i);
      await expect(expiryPanel).toContainText(/evaluated|تقييم/i);
      await expect(expiryPanel).toContainText(/lifecycle.*1|1.*lifecycle|دورة.*1/i);
      await expect(expiryPanel).toContainText(/notification.*1|1.*notification|إشعار.*1/i);
    });
  }

  test("no_execution_date is honestly dormant under NOT NULL window authority", async ({ page }) => {
    const { seeds } = runtimeGate();
    await openFixture(page, fixture(seeds, "expiry_no_execution_date_dormant"));
    await expect(page.getByTestId("planning-expiry-result")).toContainText(/dormant|not applicable|خامل|غير منطبق/i);
    await expect(page.getByText(/Expired|منتهية/i)).toHaveCount(0);
  });

  test("offline operation queues, replays idempotently and reconciles", async ({ page, context }) => {
    const { seeds } = runtimeGate();
    await openFixture(page, fixture(seeds, "offline_outbox"));
    await context.setOffline(true);
    await page.getByRole("button", { name: /save|acknowledge|حفظ|إقرار/i }).click();
    const outbox = page.getByTestId("planning-outbox");
    await expect(outbox).toContainText(/queued|قيد الانتظار/i);
    await context.setOffline(false);
    await page.getByRole("button", { name: /sync|retry|مزامنة|إعادة المحاولة/i }).click();
    await expect(outbox).toContainText(/reconciled|settled|تمت التسوية/i);
    await expect(outbox).toContainText(/duplicate.*0|0.*duplicate/i);
    await page.reload();
    await expect(outbox).toContainText(/reconciled|settled|تمت التسوية/i);
  });
});

test.describe("closure criterion — RBAC/RLS, seeded/degraded truth, EN/AR and viewports", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("cross-scope planner receives neutral denial with no foreign facts", async ({ page }, testInfo) => {
    const { authority } = runtimeGate();
    const telemetry = await observe(page);
    await page.goto("/locale?set=en");
    await page.goto("/planning?fixture=cross-scope");
    await expect(page.getByRole("alert")).toContainText(/not found|outside your scope|غير موجود|خارج نطاقك/i);
    await expect(page.locator("[data-sensitive-foreign-record]")).toHaveCount(0);
    await capture(page, testInfo, {
      journey: journey(authority, "cross_cutting"), persona: "cross-scope-planner", route: page.url(), state: "RLS-denial",
      expected: "Neutral denial and zero foreign-record leakage",
      observed: "Neutral alert with no sensitive foreign record nodes",
    }, telemetry);
  });

  test("external seeded and Senaei degraded states disclose provenance and freshness", async ({ page }) => {
    const { seeds } = runtimeGate();
    await gotoState(page, fixture(seeds, "senaei_seeded").route ?? "/planning");
    await expect(page.getByTestId("provider-state")).toContainText(/seeded|simulated|بذور|محاكاة/i);
    await expect(page.getByTestId("provider-state")).toContainText(/source|مصدر/i);
    await gotoState(page, fixture(seeds, "senaei_unavailable").route ?? "/planning");
    await expect(page.getByTestId("provider-state")).toContainText(/unavailable|غير متاح/i);
    await expect(page.getByTestId("provider-state")).not.toContainText(/live|مباشر/i);
  });

  for (const locale of ["en", "ar"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`${locale}/${theme} Planning shell and route state retain language direction`, async ({ page }, testInfo) => {
        const { authority } = runtimeGate();
        const telemetry = await observe(page);
        await page.goto(`/locale?set=${locale}`);
        await page.goto("/planning");
        await page.evaluate((value) => {
          localStorage.setItem("saqeel-theme", value);
          document.documentElement.setAttribute("data-theme", value);
        }, theme);
        await page.reload();
        await assertShellTruth(page, locale);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await capture(page, testInfo, {
          journey: journey(authority, "cross_cutting"), persona: "planner", route: "/planning",
          state: `${locale}-${theme}-direction`,
          expected: "Approved localized title, shell direction and persisted theme",
          observed: `${locale}/${theme} persisted with computed ${locale === "ar" ? "rtl" : "ltr"}`,
        }, telemetry);
        expect(telemetry.consoleErrors).toEqual([]);
      });
    }
  }

  for (const viewport of [
    { width: 1440, height: 1024 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    test(`responsive ${viewport.width}x${viewport.height} has no page overflow or hidden status text`, async ({ page }) => {
      runtimeGate();
      await page.setViewportSize(viewport);
      await gotoState(page, "/planning", viewport.width <= 768 ? "ar" : "en");
      await assertNoHorizontalPageOverflow(page);
      const statuses = page.locator(".badge");
      expect(await statuses.count()).toBeGreaterThan(0);
      for (let i = 0; i < await statuses.count(); i++) {
        expect((await statuses.nth(i).innerText()).trim()).not.toBe("");
      }
    });
  }
});
