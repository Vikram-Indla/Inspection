import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PERSONAS, storageStatePath } from "./personas";

const webRoot = join(__dirname, "..");
const read = (relative: string) => readFileSync(join(webRoot, relative), "utf8");

test.describe("INSP-703 synced label localization contract", () => {
  test("keeps approved Arabic in the reviewed i18n fallback", () => {
    const i18n = read("src/lib/i18n.ts");

    expect(i18n).toContain('"field.ws.sync.synced": "متزامن"');
    expect(i18n).toContain("...FIELD_AR_FALLBACK");
    expect(i18n.indexOf("...FIELD_AR_FALLBACK")).toBeLessThan(i18n.lastIndexOf("...dict"));
  });

  test("keeps the Field workspace component resource-backed", () => {
    const page = read("src/app/(app)/field/inspection/[id]/page.tsx");
    const syncStart = page.indexOf("sync: {");
    const syncEnd = page.indexOf("},", syncStart);
    const syncBlock = page.slice(syncStart, syncEnd + 2);

    expect(syncBlock).toContain('synced: t("field.ws.sync.synced", "Synced")');
    expect(syncBlock).not.toContain('tr("field.ws.sync.synced"');
    expect(syncBlock).not.toMatch(/[\u0600-\u06ff]/);
  });
});

test.describe("INSP-703 Arabic runtime parity", () => {
  test.use({ storageState: storageStatePath("inspector") });

  test("renders the approved synced label through Arabic RTL resources", async ({ page }) => {
    const { login, must, rest } = await import("./live-rest");
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const inspections = must(await rest(
      "GET",
      "inspections?select=id,visits!inner(id)&status=eq.in_progress&order=started_at.desc&limit=1",
      inspector.jwt,
    ), "read an assigned in-progress inspection") as { id: string }[];
    expect(
      inspections,
      "The controlled non-production Inspector must have an RLS-visible in-progress inspection.",
    ).not.toHaveLength(0);

    await page.goto("/locale?set=ar");
    await page.goto(`/field/inspection/${inspections[0].id}`);

    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("متزامن", { exact: true })).toBeVisible();
    await expect(page.getByText("Synced", { exact: true })).toHaveCount(0);
  });
});
