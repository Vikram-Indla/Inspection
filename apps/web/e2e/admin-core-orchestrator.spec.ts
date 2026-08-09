import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PERSONAS, storageStatePath, type PersonaKey } from "./personas";

// Seeded 20260727130000 migration titles are pinned separately below; the
// runtime headings are the sponsor-renamed plain-language titles that shipped
// with the admin revamp.
const MIGRATION_TITLES = [
  { headingEn: "Users & Roles", headingAr: "المستخدمون والأدوار" },
  { headingEn: "Lookup Management", headingAr: "إدارة القوائم المرجعية" },
  { headingEn: "Risk Configuration", headingAr: "تهيئة المخاطر" },
  { headingEn: "Survey Configuration", headingAr: "تهيئة النماذج" },
  { headingEn: "Integration Management", headingAr: "إدارة التكاملات" },
] as const;

const OWNED_DESTINATIONS = [
  {
    route: "/admin/access",
    designId: "frame-19-admin-users-roles",
    headingEn: "Users & roles",
    headingAr: "المستخدمون والأدوار",
  },
  {
    route: "/admin/localization",
    designId: "frame-20-admin-lookup-management",
    headingEn: "Reference Lists",
    headingAr: "القوائم المرجعية",
  },
  {
    route: "/admin/risk",
    designId: "frame-21-admin-risk-configuration",
    headingEn: "Risk Settings",
    headingAr: "إعدادات المخاطر",
  },
  {
    route: "/admin/packages",
    designId: "frame-22-admin-survey-configuration",
    headingEn: "Inspection Forms",
    headingAr: "نماذج التفتيش",
  },
  {
    route: "/admin/integrations",
    designId: "frame-24-admin-integration-management",
    headingEn: "System Connections",
    headingAr: "اتصالات النظام",
  },
] as const;

const PINNED_DESTINATIONS = [
  { label: "Users & roles", href: "/admin/access" },
  { label: "Lookup Management", href: "/admin/localization" },
  { label: "Risk Configuration", href: "/admin/risk" },
  { label: "Survey Configuration", href: "/admin/packages" },
  { label: "Notification Configuration", href: "/admin/notifications" },
  { label: "Integration Management", href: "/admin/integrations" },
] as const;

// Risk and integrations render governed empty/decision states when the caller
// sees no records; the drawer contract is exercised wherever rows exist.
const RECORD_SURFACES = [
  { route: "/admin/access", selector: "table tbody tr[aria-haspopup=dialog]" },
  { route: "/admin/localization", selector: "article[aria-haspopup=dialog]" },
  { route: "/admin/risk", selector: "article[aria-haspopup=dialog], table tbody tr[aria-haspopup=dialog]" },
  { route: "/admin/packages", selector: "table tbody tr[aria-haspopup=dialog]" },
  { route: "/admin/integrations", selector: "table tbody tr[aria-haspopup=dialog]" },
] as const;

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const ADMIN_TITLE_RESOURCE_MIGRATION = readFileSync(path.join(
  repoRoot,
  "supabase/migrations/20260727130000_admin_revamp_title_ar_strings.sql",
), "utf8");
const CANONICAL_APPROVAL_QUEUE = readFileSync(path.join(
  webRoot,
  "src/app/(app)/compliance/approvals/page.tsx",
), "utf8");
const ANALYTICS_PAGE = readFileSync(path.join(
  webRoot,
  "src/app/(app)/analytics/page.tsx",
), "utf8");
const OPERATIONS_PAGE = readFileSync(path.join(
  webRoot,
  "src/app/(app)/operations/page.tsx",
), "utf8");

test.use({ storageState: { cookies: [], origins: [] } });

test("RTL-I18N-P1-001 seeds exact final-cut Administration title resources", () => {
  const resourceKeys = [
    "admin.revamp.access.title",
    "admin.revamp.lookup.title",
    "admin.revamp.risk.title",
    "admin.revamp.survey.title",
    "admin.revamp.integration.title",
  ] as const;

  for (const [index, title] of MIGRATION_TITLES.entries()) {
    expect(ADMIN_TITLE_RESOURCE_MIGRATION).toContain(resourceKeys[index]);
    expect(ADMIN_TITLE_RESOURCE_MIGRATION).toContain(title.headingEn);
    expect(ADMIN_TITLE_RESOURCE_MIGRATION).toContain(title.headingAr);
  }
  expect(ADMIN_TITLE_RESOURCE_MIGRATION).toContain(
    "where public.ui_strings.status = 'draft'",
  );
});

test("RTL-I18N-P1-001 seeds every authoritative confirmed title match", () => {
  for (const [key, english, arabic] of [
    ["admin.complianceApprovalQueue.title", "Approval Queue", "قائمة الاعتماد"],
    ["admin.viol.title", "Violation Catalogue", "فهرس المخالفات"],
    ["admin.viol.penalty.title", "Penalty Mapping", "ربط العقوبات"],
    ["analytics.title", "Analytics", "التحليلات"],
  ] as const) {
    expect(ADMIN_TITLE_RESOURCE_MIGRATION).toContain(key);
    expect(ADMIN_TITLE_RESOURCE_MIGRATION).toContain(english);
    expect(ADMIN_TITLE_RESOURCE_MIGRATION).toContain(arabic);
  }
});

test("RTL-I18N-P1-001 canonical rewrite targets carry authoritative Arabic resources", () => {
  // The approval-queue copy moved from inline copy() fallbacks into governed
  // i18n resources (en/ar compliance.json); both languages must carry every
  // authoritative pair and the page component may hold no user-visible string.
  const EN_COMPLIANCE = readFileSync(path.join(webRoot, "src/i18n/locales/en/compliance.json"), "utf8");
  const AR_COMPLIANCE = readFileSync(path.join(webRoot, "src/i18n/locales/ar/compliance.json"), "utf8");
  for (const [english, arabic] of [
    ["Awaiting Approval", "بانتظار الاعتماد"],
    ["Decision", "القرار"],
    ["Approve configuration request", "اعتماد طلب التهيئة"],
    ["Return package", "إعادة الحزمة"],
    ["Reject package", "رفض الحزمة"],
    ["Open review", "فتح المراجعة"],
    ["Configuration requests awaiting decision", "طلبات تهيئة بانتظار القرار"],
    ["Object review incomplete, so no package decision is possible", "مراجعة العناصر غير مكتملة، فيتعذّر اتخاذ قرار على الحزمة"],
    ["Pending review", "بانتظار المراجعة"],
    ["Approved", "معتمد"],
    ["{done} of {total} decided", "{done} من {total} تم البتّ فيه"],
    ["Object review incomplete", "مراجعة العناصر غير مكتملة"],
  ] as const) {
    expect(EN_COMPLIANCE).toContain(english);
    expect(AR_COMPLIANCE).toContain(arabic);
  }
  expect(CANONICAL_APPROVAL_QUEUE).not.toContain("<h1>Approval Queue</h1>");
  expect(CANONICAL_APPROVAL_QUEUE).not.toMatch(/[؀-ۿ]/);
  expect(ANALYTICS_PAGE).toContain('<h1 id="analytics-title">{title}</h1>');
  const EN_OPERATIONS = readFileSync(path.join(webRoot, "src/i18n/locales/en/operations.json"), "utf8");
  const AR_OPERATIONS = readFileSync(path.join(webRoot, "src/i18n/locales/ar/operations.json"), "utf8");
  expect(EN_OPERATIONS).toContain("Deadline and resubmission alerts");
  expect(AR_OPERATIONS).toContain("تنبيهات المواعيد النهائية وإعادة التقديم");
});

// Real-login coverage lives in auth.setup.ts, which captured these storage
// states through the /login UI this run. Re-driving the credential form for
// every one of this file's eight sessions tripped Supabase's per-IP password
// grant throttle and failed spuriously, so sessions hydrate from the same
// captured state instead of re-earning it.
async function signIn(page: Page, personaKey: PersonaKey) {
  const persona = PERSONAS[personaKey];
  const state = JSON.parse(readFileSync(path.join(webRoot, storageStatePath(personaKey)), "utf8")) as {
    cookies: Parameters<ReturnType<Page["context"]>["addCookies"]>[0];
  };
  await page.context().addCookies(state.cookies);
  await page.goto("/locale?set=en");
  await page.goto(persona.home);
  const withoutLocale = (pathname: string) => pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  await page.waitForURL(url => {
    const pathname = withoutLocale(url.pathname);
    return pathname.startsWith(persona.home) || pathname.startsWith("/dashboard");
  }, { timeout: 40_000 });
}

test("the five admin-core destinations use their exact Revamp frames with real admin data", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await signIn(page, "admin");

  for (const destination of OWNED_DESTINATIONS) {
    const response = await page.goto(destination.route);
    expect(response?.status(), `${destination.route} response`).toBeLessThan(400);
    const frame = page.locator(
      `[data-saqeel-admin-destination="${destination.designId}"]`,
    );
    await expect(frame).toBeVisible();
    await expect(frame.getByRole("heading", {
      level: 1,
      name: destination.headingEn,
      exact: true,
    })).toBeVisible();
    await expect(
      frame.locator("table:visible, [role=alert]:visible, form:visible, section.panel:visible").first(),
    ).toBeVisible();
  }

  expect(consoleErrors).toEqual([]);
});

test("the Administration navigation keeps every pinned source destination reachable", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/access");

  const navigation = page.getByRole("navigation").first();
  await expect(navigation).toBeVisible();
  for (const destination of PINNED_DESTINATIONS) {
    const link = page.getByRole("link", { name: destination.label, exact: true }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href?.replace(/^\/(en|ar)(?=\/)/, "")).toBe(destination.href);
  }
});

test("real Administration rows open the governed record drawer with keyboard and restore focus", async ({ page }) => {
  await signIn(page, "admin");

  for (const surface of RECORD_SURFACES) {
    await page.goto(surface.route);
    await expect(page.locator("[data-saqeel-admin-destination]")).toBeVisible();
    const trigger = page.locator(surface.selector).locator("visible=true").first();
    if (await trigger.count() === 0) {
      await expect(page.locator("[data-admin-record-drawer]")).toHaveCount(0);
      continue;
    }
    await expect(trigger, `${surface.route} record trigger`).toBeVisible();

    await trigger.focus();
    await page.keyboard.press("Enter");
    const drawer = page.locator("[data-admin-record-drawer]");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("heading", { level: 3, name: "Record", exact: true })).toBeVisible();
    await expect(drawer.getByRole("heading", { level: 3, name: "Governance", exact: true })).toBeVisible();
    await expect(drawer.getByRole("heading", { level: 3, name: "Audit", exact: true })).toBeVisible();
    await expect(drawer.getByText("Edit through request", { exact: true })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "View activity log", exact: true })).toHaveAttribute("href", /\/admin\/audit\?/);
    await expect(
      drawer.locator("header").getByRole("button", { name: "Close", exact: true }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test("the governed record drawer respects Arabic RTL, dark theme and narrow reflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "admin");
  await page.evaluate(() => {
    localStorage.setItem("saqeel-theme", "dark");
    localStorage.setItem("saqeel-theme-mode", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.goto("/locale?set=ar");
  await page.goto("/admin/access");

  const trigger = page.locator("table tbody tr[aria-haspopup=dialog]").first();
  await trigger.focus();
  await page.keyboard.press("Space");

  const drawer = page.locator("[data-admin-record-drawer]");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { level: 3, name: "السجل", exact: true })).toBeVisible();
  await expect(drawer.getByRole("heading", { level: 3, name: "الحوكمة", exact: true })).toBeVisible();
  await expect(drawer.getByRole("heading", { level: 3, name: "التدقيق", exact: true })).toBeVisible();
  const box = await drawer.boundingBox();
  expect(box?.width ?? 999).toBeLessThanOrEqual(390);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

for (const { width, height } of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 412, height: 915 },
  { width: 390, height: 844 },
  { width: 320, height: 800 },
] as const) {
  test(`admin Revamp frame reflows at ${width}x${height} in EN/LTR and AR/RTL`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await signIn(page, "admin");

    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/locale?set=${locale}`);
      await page.goto("/admin/access");
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
      await expect(page.getByRole("heading", {
        level: 1,
        name: locale === "ar"
          ? OWNED_DESTINATIONS[0].headingAr
          : OWNED_DESTINATIONS[0].headingEn,
        exact: true,
      })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${locale} at ${width}`).toBeLessThanOrEqual(1);
    }
  });
}

test("a Planner sees the pinned destination but is refused at the admin boundary", async ({ page }) => {
  await signIn(page, "planner");
  const response = await page.goto("/admin/access");
  expect(response?.status()).toBeLessThan(400);
  const refusal = page.locator("section.sq-access-refusal");
  await expect(refusal.getByRole("heading", {
    level: 1,
    name: "You do not have access to this destination",
    exact: true,
  })).toBeVisible();
  await expect(refusal).toContainText(
    "A Planner reaches the destination and is refused at the boundary.",
  );
  await expect(
    page.locator('[data-saqeel-admin-destination="frame-19-admin-users-roles"]'),
  ).toHaveCount(0);
});

test("anonymous users cannot read an Administration destination", async ({ page }) => {
  await page.goto("/locale?set=en");
  const response = await page.goto("/admin/access");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", {
    name: "Sign in",
    exact: true,
  })).toBeVisible();
});
