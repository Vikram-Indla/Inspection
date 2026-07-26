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
let inspectorAuth: { jwt: string; userId: string };

test.beforeAll(async () => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
  inspectorAuth = inspector;

  const fac = must(await rest("GET", "factories?select=id&factory_code=eq.F-1102", planner.jwt), "factory")[0];
  const pkg = must(await rest("GET", "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1", planner.jwt), "package")[0];
  const plan = must(await rest("POST", "visit_plans", planner.jwt, { method: "single", status: "draft", created_by: planner.userId }), "plan")[0];
  const now = new Date();
  // A fixed +3-day offset collides with the sole seeded inspector persona's
  // bookings from every other suite sharing this live project (cd-023/cd-022/
  // golden-journey all hit this same 23505 unique-violation historically) —
  // spread across a ~270-year range instead, same fix applied everywhere else.
  const dayOffset = 4000 + Math.floor(Math.random() * 20000);
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
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();

  // --- go offline ---
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  const offlineBadge = page.getByText("Offline", { exact: true });
  await expect(offlineBadge).toHaveClass(/badge-warning/);

  // Answer FS-101 while offline; UI reflects it instantly from the local draft.
  const q101 = page.locator("p").filter({ hasText: /^FS-101 ·/ }).locator("..");
  await q101.getByRole("button", { name: /^compliant$/i }).click();
  await expect(q101).toHaveClass(/is-answered/);

  // Answer the rest and submit while still offline (STM-SYNC-001 leg).
  for (const code of ["FS-102", "EG-201"]) {
    const q = page.locator("p").filter({ hasText: new RegExp(`^${code} ·`) }).locator("..");
    await q.getByRole("button", { name: /^compliant$/i }).click();
    await expect(q).toHaveClass(/is-answered/);
  }
  await page.getByRole("button", { name: "Review & submit — final version" }).click();
  // DEC-009 acknowledgement gate — offline submit still requires a signature.
  await signAndConfirm(page);
  // Never claims "submitted" while unsynced — the queued message is explicit.
  await expect(page.locator(".sq-banner").first()).toContainText("Queued — will submit exactly once on reconnect");

  // --- reconnect ---
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("Synced", { exact: true })).toHaveClass(/badge-compliant/, { timeout: 30_000 });

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

test("STM-SYNC-002 detects a moved server row and never silently overwrites it", async ({ page }) => {
  const itemId = itemIds["FS-101"];
  assertOk(await rest("POST", "checklist_responses", inspectorAuth.jwt, {
    inspection_id: inspectionId,
    item_id: itemId,
    response: { value: "compliant" },
    is_complete: true,
  }, "resolution=merge-duplicates,return=minimal"), "seed response baseline");

  const baseline = must(await rest("GET",
    `checklist_responses?select=updated_at&inspection_id=eq.${inspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt), "response baseline")[0].updated_at as string;

  await page.goto(`/field/inspection/${inspectionId}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();

  await page.evaluate(({ userId, inspectionId, itemId, baseline }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readwrite");
      transaction.objectStore("outbox").add({
        kind: "response",
        inspection_id: inspectionId,
        item_id: itemId,
        response: { value: "non_compliant" },
        baseline_updated_at: baseline,
        queued_at: new Date().toISOString(),
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { userId: inspectorAuth.userId, inspectionId, itemId, baseline });

  await new Promise(resolve => setTimeout(resolve, 25));
  assertOk(await rest("PATCH",
    `checklist_responses?inspection_id=eq.${inspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt,
    {
      response: { value: "compliant", server_move: "STM-SYNC-002" },
      is_complete: true,
      updated_at: new Date().toISOString(),
    },
    "return=minimal"), "move server response underneath offline baseline");

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.reload();
  await expect(page.getByText(/Conflict on FS-101.*STM-SYNC-002.*no silent overwrite/)).toBeVisible({ timeout: 30_000 });

  const conflicts = await page.evaluate(({ userId }) => new Promise<unknown[]>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("conflicts", "readonly");
      const all = transaction.objectStore("conflicts").getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    };
  }), { userId: inspectorAuth.userId });
  expect(conflicts).toHaveLength(1);

  const server = must(await rest("GET",
    `checklist_responses?select=response&inspection_id=eq.${inspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt), "server response after conflict")[0];
  expect(server.response).toEqual({ value: "compliant", server_move: "STM-SYNC-002" });
});

test("STM-SYNC-001 replays a duplicated queued submit exactly once under its idempotency key", async ({ page }) => {
  const idempotencyKey = `offline-submit-${inspectionId}-${Date.now()}`;
  await page.goto(`/field/inspection/${inspectionId}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();

  await page.evaluate(({ userId, inspectionId, idempotencyKey }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readwrite");
      const operation = {
        kind: "submit",
        inspection_id: inspectionId,
        version_number: 1,
        snapshot: {},
        idempotency_key: idempotencyKey,
        acknowledgement: {
          name: "SAQEEL E2E Inspector",
          signed: true,
          ts: new Date().toISOString(),
          signed_at: new Date().toISOString(),
          signature_data_url: "data:image/png;base64,",
        },
        queued_at: new Date().toISOString(),
      };
      transaction.objectStore("outbox").add(operation);
      transaction.objectStore("outbox").add(operation);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { userId: inspectorAuth.userId, inspectionId, idempotencyKey });

  await page.reload();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible({ timeout: 30_000 });

  const versions = must(await rest("GET",
    `submission_versions?select=id,version_number,idempotency_key&inspection_id=eq.${inspectionId}&idempotency_key=eq.${idempotencyKey}`,
    inspectorAuth.jwt), "idempotent submission versions");
  expect(versions, "two queued copies with one idempotency key must create exactly one immutable version").toHaveLength(1);
  expect(versions[0].idempotency_key).toBe(idempotencyKey);

  const outboxCount = await page.evaluate(({ userId }) => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readonly");
      const count = transaction.objectStore("outbox").count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
  }), { userId: inspectorAuth.userId });
  expect(outboxCount, "both replay attempts must be consumed after the server reuses the idempotency key").toBe(0);
});
