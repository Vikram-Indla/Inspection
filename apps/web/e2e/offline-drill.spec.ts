import { test, expect } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must, assertOk } from "./live-rest";
import { signAndConfirm } from "./sign-helper";

// G10 offline drill (STM-SYNC-001/002, MVP1-FND-005/006): answers and the
// submission queue while offline, replay exactly once on reconnect, no data loss.
// Fixture staging goes over PostgREST with persona JWTs (sacrificial visit,
// same pattern as B10-EV-001); the drill itself is driven through the real UI.

test.use({ storageState: storageStatePath("inspector") });

let inspectionId: string;
let itemIds: Record<string, string>;

test.beforeAll(async () => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);

  const fac = must(await rest("GET", "factories?select=id&factory_code=eq.F-1102", planner.jwt), "factory")[0];
  const pkg = must(await rest("GET", "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1", planner.jwt), "package")[0];
  const plan = must(await rest("POST", "visit_plans", planner.jwt, { method: "single", status: "draft", created_by: planner.userId }), "plan")[0];
  const now = new Date();
  // A fixed +3-day offset collides with the sole seeded inspector persona's
  // bookings from every other suite sharing this live project (cd-023/cd-022/
  // golden-journey all hit this same 23505 unique-violation historically) —
  // spread across a ~270-year range instead, same fix applied everywhere else.
  const dayOffset = 4000 + Math.floor(Math.random() * 90000);
  const visit = must(await rest("POST", "visits", planner.jwt, {
    visit_plan_id: plan.id, factory_id: fac.id, visit_type: "periodic",
    execution_mode: "physical", planning_status: "draft",
    window_start: new Date(now.getTime() + dayOffset * 864e5).toISOString(),
    window_end: new Date(now.getTime() + dayOffset * 864e5 + 4 * 36e5).toISOString(),
    package_version_id: pkg.id,
  }), "visit")[0];
  assertOk(await rest("POST", "assignments", planner.jwt, { visit_id: visit.id, inspector_id: inspector.userId, method: "manual" }, "return=minimal"), "assign");
  assertOk(await rest("PATCH", `visits?id=eq.${visit.id}`, planner.jwt, { planning_status: "published" }, "return=minimal"), "publish");

  const ins = must(await rest("POST", "inspections", inspector.jwt, {
    visit_id: visit.id, package_version_id: pkg.id, status: "in_progress", started_at: now.toISOString(),
  }), "inspection")[0];
  inspectionId = ins.id;

  const items = must(await rest("GET", "inspection_items?select=id,code&code=in.(FS-101,FS-102,EG-201)", inspector.jwt), "items");
  itemIds = Object.fromEntries(items.map((i: { code: string; id: string }) => [i.code, i.id]));
});

test("offline answers queue locally, replay once on reconnect, offline submit never claims success", async ({ page, context }) => {
  await page.goto(`/field/inspection/${inspectionId}`);
  const badge = page.locator(".ax-sync");
  await expect(badge).toBeVisible();

  // --- go offline ---
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(badge).toHaveClass(/ax-sync--offline/);
  await expect(badge).toContainText("Offline — work saved locally");

  // Answer FS-101 while offline; UI reflects it instantly from the local draft.
  const q101 = page.locator(".ipad-q", { hasText: "FS-101" });
  await q101.getByRole("button", { name: /^compliant$/i }).click();
  await expect(q101).toHaveClass(/is-answered/);

  // Answer the rest and submit while still offline (STM-SYNC-001 leg).
  for (const code of ["FS-102", "EG-201"]) {
    const q = page.locator(".ipad-q", { hasText: code });
    await q.getByRole("button", { name: /^compliant$/i }).click();
    await expect(q).toHaveClass(/is-answered/);
  }
  await page.getByRole("button", { name: "Review & submit — immutable v1" }).click();
  // DEC-009 acknowledgement gate — offline submit still requires a signature.
  await signAndConfirm(page);
  // Never claims "submitted" while unsynced — the queued message is explicit.
  await expect(page.locator(".ax-banner").first()).toContainText("Queued — will submit exactly once on reconnect");

  // --- reconnect ---
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(badge).toHaveClass(/ax-sync--synced/, { timeout: 30_000 });

  // Server truth: all three responses landed and exactly one immutable v1 exists.
  const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
  const resp = must(await rest("GET",
    `checklist_responses?select=item_id,response&inspection_id=eq.${inspectionId}`, inspector.jwt), "responses");
  const values = Object.fromEntries(resp.map((r: { item_id: string; response: { value: string } }) => [r.item_id, r.response.value]));
  for (const code of ["FS-101", "FS-102", "EG-201"]) {
    expect(values[itemIds[code]], `${code} response replayed`).toBe("compliant");
  }
  const subs = must(await rest("GET",
    `submission_versions?select=id,version_number&inspection_id=eq.${inspectionId}`, inspector.jwt), "versions");
  expect(subs.length, "exactly one submission after replay (idempotent)").toBe(1);
  expect(subs[0].version_number).toBe(1);
});
