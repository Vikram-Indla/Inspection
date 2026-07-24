import { expect, test } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, must, rest } from "./live-rest";

// PLAN v7 item 2 · MVP1-M03-001 · AC-0099
// Live tests use the acting Inspector JWT throughout. Notification rows have no
// recipient delete policy, so fixtures are left as read audit history.
let inspectorJwt = "";
let inspectorUserId = "";

test.beforeAll(async () => {
  const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
  inspectorJwt = inspector.jwt;
  inspectorUserId = inspector.userId;
});

test.use({ storageState: storageStatePath("inspector") });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

async function stageNotification(payload: unknown, marker: string) {
  const rows = must(await rest("POST", "notifications", inspectorJwt, {
    event_key: `field_item_2_${marker}`,
    recipient: inspectorUserId,
    payload,
    channel: "inapp",
    delivery_state: "queued",
  }), `stage field notification ${marker}`);
  return rows[0] as { id: string; event_key: string };
}

async function readNotification(id: string) {
  const rows = must(await rest("GET",
    `notifications?id=eq.${id}&select=id,event_key,payload,delivery_state,read_at,created_at`,
    inspectorJwt), `read field notification ${id}`);
  expect(rows).toHaveLength(1);
  return rows[0] as { delivery_state: string; read_at: string | null };
}

test("detail opens a real row, renders its stored keys, and records read_at", async ({ page }) => {
  const marker = `detail_${Date.now()}`;
  const row = await stageNotification({ arbitrary_alpha: marker, count: 0, nested: { source: "stored-row" } }, marker);

  await page.goto(`/field/notifications/${row.id}`);
  await expect(page.getByText(row.event_key, { exact: true })).toBeVisible();
  await expect(page.getByText("arbitrary_alpha", { exact: true })).toBeVisible();
  await expect(page.getByText(marker, { exact: true })).toBeVisible();
  await expect(page.getByText('{"source":"stored-row"}', { exact: true })).toBeVisible();

  const stored = await readNotification(row.id);
  expect(stored.read_at).toBeTruthy();
  expect(stored.delivery_state).toBe("read");
});

test("malformed scalar payload renders a safe fallback and still records read_at", async ({ page }) => {
  const marker = `malformed_${Date.now()}`;
  const row = await stageNotification("not-an-object", marker);

  await page.goto(`/field/notifications/${row.id}`);
  await expect(page.getByText("No notification payload is available.", { exact: true })).toBeVisible();

  const stored = await readNotification(row.id);
  expect(stored.read_at).toBeTruthy();
  expect(stored.delivery_state).toBe("read");
});

test("field inbox mark-read action writes read_at and keeps queued-to-read compatibility", async ({ page }) => {
  const marker = `action_${Date.now()}`;
  const row = await stageNotification({ reason: marker }, marker);

  await page.goto("/field");
  const listItem = page.getByRole("listitem").filter({ hasText: marker });
  await expect(listItem).toBeVisible();
  await listItem.getByRole("button", { name: "Mark read" }).click();
  await expect(listItem.getByRole("button", { name: "Mark read" })).toHaveCount(0);

  const stored = await readNotification(row.id);
  expect(stored.read_at).toBeTruthy();
  expect(stored.delivery_state).toBe("read");
});
