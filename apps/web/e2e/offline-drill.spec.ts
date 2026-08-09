import { test, expect } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must, assertOk } from "./live-rest";
import { signAndConfirm } from "./sign-helper";

// G10 offline drill (STM-SYNC-001/002, MVP1-FND-005/006): answers and the
// submission queue while offline, replay exactly once on reconnect, no data loss.
// Fixture staging goes over PostgREST with persona JWTs (sacrificial visit,
// same pattern as B10-EV-001); the drill itself is driven through the real UI.

test.use({ storageState: storageStatePath("inspector") });
test.describe.configure({ timeout: 120_000 });

let inspectionId: string;
let itemIds: Record<string, string>;
let inspectorAuth: { jwt: string; userId: string };

async function createReadyInspection(): Promise<string> {
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

  const executionDate = new Date(now.getTime() + dayOffset * 864e5).toISOString().slice(0, 10);
  assertOk(await rest("POST", "rpc/save_visit_preparation", inspector.jwt, {
    p_visit: visit.id, p_execution_date: executionDate, p_confirmed_mode: "physical",
    p_package_version_id: pkg.id, p_form_config: {},
  }, "return=minimal"), "save preparation");
  assertOk(await rest("POST", "rpc/confirm_visit_ready", inspector.jwt, { p_visit: visit.id }, "return=minimal"), "confirm ready");

  const existing = must(await rest("GET", `inspections?select=id&visit_id=eq.${visit.id}`, inspector.jwt), "inspection lookup");
  const ins = existing[0] ?? must(await rest("POST", "inspections", inspector.jwt, {
    visit_id: visit.id, package_version_id: pkg.id, status: "in_progress", started_at: now.toISOString(),
  }), "inspection")[0];

  const items = must(await rest("GET", "inspection_items?select=id,code&code=in.(FS-101,FS-102,EG-201)", inspector.jwt), "items");
  itemIds = Object.fromEntries(items.map((i: { code: string; id: string }) => [i.code, i.id]));
  return ins.id;
}




async function withNavRetry<T>(page: import("@playwright/test").Page, run: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const retriable = String(error).includes("Execution context was destroyed") || String(error).includes("indexeddb open blocked");
      if (attempt >= 2 || !retriable) throw error;
      await page.waitForLoadState("load");
      await page.waitForTimeout(500);
    }
  }
}

test.beforeAll(async () => {
  inspectionId = await createReadyInspection();
});

test("offline answers queue locally, replay once on reconnect, offline submit never claims success", async ({ page, context }) => {
  await page.goto(`/field/inspection/${inspectionId}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();

  for (const button of await page.getByRole("button", { name: "Verify as-is" }).all()) {
    await button.click();
  }

  // --- go offline ---
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  const offlineBadge = page.getByText(/^Offline — work saved locally/).first();
  await expect(offlineBadge).toHaveClass(/badge-warning/);

  // Answer all three while offline; sections are paged, so walk the section
  // rail until each item's page is active. UI reflects answers instantly from
  // the local draft.
  for (const code of ["FS-101", "FS-102", "EG-201"]) {
    const q = page.locator('[class*="question"]').filter({ hasText: new RegExp(`${code} ·`) }).first();
    if (!(await q.isVisible().catch(() => false))) {
      const tabs = page.locator('button[class*="sectionTab"]');
      const tabCount = await tabs.count();
      for (let index = 0; index < tabCount; index += 1) {
        await tabs.nth(index).click();
        await page.waitForTimeout(300);
        if (await q.isVisible().catch(() => false)) break;
      }
    }
    await q.getByRole("button", { name: /^compliant$/i }).click();
    await expect(q).toHaveClass(/questionAnswered/);
  }
  await page.getByRole("button", { name: "Review & submit — final version" }).click();
  await page.getByRole("button", { name: "Confirm and submit", exact: true }).click();
  // DEC-009 acknowledgement gate — offline submit still requires a signature.
  await signAndConfirm(page);
  // Never claims "submitted" while unsynced — the queued message is explicit.
  await expect(page.getByRole("heading", { name: /Queued — will submit exactly once on reconnect/ })).toBeVisible();

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
  const conflictInspectionId = await createReadyInspection();
  const itemId = itemIds["FS-101"];
  assertOk(await rest("POST", "checklist_responses?on_conflict=inspection_id,item_id", inspectorAuth.jwt, {
    inspection_id: conflictInspectionId,
    item_id: itemId,
    response: { value: "compliant" },
    is_complete: true,
  }, "resolution=merge-duplicates,return=minimal"), "seed response baseline");

  const baseline = must(await rest("GET",
    `checklist_responses?select=updated_at&inspection_id=eq.${conflictInspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt), "response baseline")[0].updated_at as string;

  await page.goto(`/field/inspection/${conflictInspectionId}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  await withNavRetry(page, () => page.evaluate(({ userId, inspectionId, itemId, baseline }) => new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("indexeddb open blocked")), 10_000);
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => { clearTimeout(timer); reject(request.error); };
    request.onblocked = () => { clearTimeout(timer); reject(new Error("indexeddb open blocked")); };
    request.onsuccess = () => {
      clearTimeout(timer);
      const database = request.result;
      const transaction = database.transaction(["outbox", "conflicts"], "readwrite");
      transaction.objectStore("conflicts").clear();
      const outbox = transaction.objectStore("outbox");
      outbox.clear();
      outbox.add({
        kind: "response",
        inspection_id: inspectionId,
        item_id: itemId,
        response: { value: "non_compliant" },
        baseline_updated_at: baseline,
        queued_at: new Date().toISOString(),
      });
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }), { userId: inspectorAuth.userId, inspectionId: conflictInspectionId, itemId, baseline }));

  await new Promise(resolve => setTimeout(resolve, 25));
  assertOk(await rest("PATCH",
    `checklist_responses?inspection_id=eq.${conflictInspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt,
    {
      response: { value: "compliant", server_move: "STM-SYNC-002" },
      is_complete: true,
      updated_at: new Date().toISOString(),
    },
    "return=minimal"), "move server response underneath offline baseline");

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.reload();
  const conflictCard = page.getByTestId("conflict-card").filter({ hasText: "STM-SYNC-002" });
  await expect(conflictCard).toBeVisible({ timeout: 30_000 });
  await expect(conflictCard).toContainText(/Conflict on FS-101 — resolve explicitly; nothing is overwritten silently/);

  await page.waitForLoadState("load");
  const readConflicts = () => page.evaluate(({ userId }) => new Promise<unknown[]>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("conflicts", "readonly");
      const all = transaction.objectStore("conflicts").getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    };
  }), { userId: inspectorAuth.userId });
  const conflicts = await withNavRetry(page, readConflicts);
  expect(conflicts).toHaveLength(1);

  const server = must(await rest("GET",
    `checklist_responses?select=response&inspection_id=eq.${conflictInspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt), "server response after conflict")[0];
  expect(server.response).toEqual({ value: "compliant", server_move: "STM-SYNC-002" });
});

test("STM-SYNC-001 replays a duplicated queued submit exactly once under its idempotency key", async ({ page }) => {
  const freshInspectionId = await createReadyInspection();
  const idempotencyKey = `offline-submit-${freshInspectionId}-${Date.now()}`;
  await page.goto(`/field/inspection/${freshInspectionId}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  await withNavRetry(page, () => page.evaluate(({ userId, inspectionId, idempotencyKey }) => new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("indexeddb open blocked")), 10_000);
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => { clearTimeout(timer); reject(request.error); };
    request.onblocked = () => { clearTimeout(timer); reject(new Error("indexeddb open blocked")); };
    request.onsuccess = () => {
      clearTimeout(timer);
      const transaction = request.result.transaction("outbox", "readwrite");
      transaction.objectStore("outbox").clear();
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
  }), { userId: inspectorAuth.userId, inspectionId: freshInspectionId, idempotencyKey }));

  await page.reload();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible({ timeout: 30_000 });

  await expect.poll(async () => {
    const rows = must(await rest("GET",
      `submission_versions?select=id&inspection_id=eq.${freshInspectionId}&idempotency_key=eq.${idempotencyKey}`,
      inspectorAuth.jwt), "idempotent submission versions poll");
    return rows.length;
  }, {
    message: "the queued submit must replay under its idempotency key",
    timeout: 45_000,
  }).toBe(1);

  const versions = must(await rest("GET",
    `submission_versions?select=id,version_number,idempotency_key&inspection_id=eq.${freshInspectionId}&idempotency_key=eq.${idempotencyKey}`,
    inspectorAuth.jwt), "idempotent submission versions");
  expect(versions, "two queued copies with one idempotency key must create exactly one immutable version").toHaveLength(1);
  expect(versions[0].idempotency_key).toBe(idempotencyKey);

  await expect.poll(() => page.evaluate(({ userId }) => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readonly");
      const count = transaction.objectStore("outbox").count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
  }), { userId: inspectorAuth.userId }), {
    message: "both replay attempts must be consumed after the server reuses the idempotency key",
    timeout: 30_000,
  }).toBe(0);
});
