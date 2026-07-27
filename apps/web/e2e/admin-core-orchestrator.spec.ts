import { expect, test, type Page } from "@playwright/test";
import { PERSONAS, type PersonaKey } from "./personas";

const OWNED_DESTINATIONS = [
  {
    route: "/admin/access",
    designId: "frame-19-admin-users-roles",
    headingEn: "Users & Roles",
    headingAr: "المستخدمون والأدوار",
  },
  {
    route: "/admin/localization",
    designId: "frame-20-admin-lookup-management",
    headingEn: "Lookup Management",
    headingAr: "إدارة القوائم المرجعية",
  },
  {
    route: "/admin/risk",
    designId: "frame-21-admin-risk-configuration",
    headingEn: "Risk Configuration",
    headingAr: "تهيئة المخاطر",
  },
  {
    route: "/admin/packages",
    designId: "frame-22-admin-survey-configuration",
    headingEn: "Survey Configuration",
    headingAr: "تهيئة النماذج",
  },
  {
    route: "/admin/integrations",
    designId: "frame-24-admin-integration-management",
    headingEn: "Integration Management",
    headingAr: "إدارة التكاملات",
  },
] as const;

const PINNED_DESTINATIONS = [
  { label: "Users & Roles", href: "/admin/access" },
  { label: "Lookup Management", href: "/admin/localization" },
  { label: "Risk Configuration", href: "/admin/risk" },
  { label: "Survey Configuration", href: "/admin/packages" },
  { label: "Notification Configuration", href: "/admin/notifications" },
  { label: "Integration Management", href: "/admin/integrations" },
] as const;

test.use({ storageState: { cookies: [], origins: [] } });

async function signIn(page: Page, personaKey: PersonaKey) {
  const persona = PERSONAS[personaKey];
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await page.getByRole("textbox", {
    name: "National ID / Staff number",
    exact: true,
  }).fill(persona.email);
  await page.getByRole("textbox", {
    name: "Password Show password",
    exact: true,
  }).fill(persona.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(url => url.pathname === persona.home, { timeout: 20_000 });
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

test("the pinned Administration group exposes exactly the six source destinations", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/access");

  const administration = page.locator('[data-nav-group="administration"]');
  await expect(administration).toBeVisible();
  const trigger = administration.getByRole("button", {
    name: "Administration",
    exact: true,
  });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }

  const links = administration.getByRole("link");
  await expect(links).toHaveCount(PINNED_DESTINATIONS.length);
  for (const destination of PINNED_DESTINATIONS) {
    const link = administration.getByRole("link", {
      name: destination.label,
      exact: true,
    });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", destination.href);
  }
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
