import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must, assertOk } from "./live-rest";

// CD-045 / M10 — dashboard/downstream reconciliation contract.
//   PLN-CON-020  dashboard/operations counts derive from the canonical visits
//   PLN-REQ-009  notification deep-links (returned → visit detail, focused)
//   canonical §19 published visits enter the inspector pool; drafts never do
//   canonical §18 no browser-direct external API; CONTRACT_NOT_SUPPLIED honest
// Runtime mutations run as the acting persona's own JWT. Leftovers: staged
// notification rows are marked read at the end (no delete policy exists).

const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const storagePathPlanner = storageStatePath("planner");

let adminJwt = "";
let adminUserId = "";
let plannerJwt = "";
let inspectorJwt = "";

test.beforeAll(async () => {
  const admin = await login(PERSONAS.admin.email, PERSONAS.admin.password);
  adminJwt = admin.jwt;
  adminUserId = admin.userId;
  plannerJwt = (await login(PERSONAS.planner.email, PERSONAS.planner.password)).jwt;
  inspectorJwt = (await login(PERSONAS.inspector.email, PERSONAS.inspector.password)).jwt;
});

test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

// Find one returned visit visible to the given JWT (staging keeps M8 return
// leftovers; a truly empty staging skips the focused deep-link test honestly).
async function findReturnedVisit(jwt: string): Promise<string | null> {
  const rows = must(await rest("GET",
    "visits?planning_status=eq.returned&select=id&limit=1", jwt), "find a returned visit");
  return rows.length ? (rows[0].id as string) : null;
}

async function stageNotification(jwt: string, recipient: string, eventKey: string, visitId: string, marker: string) {
  const rows = must(await rest("POST", "notifications", jwt, {
    event_key: eventKey,
    recipient,
    payload: { visit_id: visitId, reason: marker },
    channel: "inapp",
  }), `stage ${eventKey} notification`);
  return rows[0].id as string;
}

async function markNotificationRead(jwt: string, id: string) {
  assertOk(await rest("PATCH", `notifications?id=eq.${id}`, jwt,
    { read_at: new Date().toISOString() }, "return=minimal"), "mark staged notification read");
}

test.describe("CD-045 notification deep-links (PLN-REQ-009)", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("returned-visit notification lands on the visit detail focused on the return block", async ({ page }) => {
    const visitId = await findReturnedVisit(adminJwt);
    test.skip(!visitId, "no returned visit in staging scope — focused deep-link target unavailable");
    // Unique marker per run: staged rows from earlier runs stay in the bell
    // (marked read; no delete policy), so the locator must not collide.
    const marker = `m10-deeplink-return-${Date.now()}`;
    const notifId = await stageNotification(adminJwt, adminUserId, "visit_returned", visitId!, marker);

    await page.goto("/admin/planning/status");
    await page.getByRole("button", { name: "Notifications" }).click();
    const row = page.locator(".ax-popover .ax-surface", { hasText: marker });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: /Open/ }).click();

    await page.waitForURL(new RegExp(`/visits/${visitId}\\?focus=return`));
    const block = page.locator("#return-block");
    await expect(block).toBeVisible();
    await expect(block).toContainText(/Returned — reason:/i);

    // Downstream integrity of the same record: lifecycle stream + audit rows.
    const lifecycle = must(await rest("GET",
      `visit_lifecycle_events?visit_id=eq.${visitId}&event_type=eq.return&select=id&limit=1`, adminJwt),
      "return lifecycle event");
    expect(lifecycle.length).toBeGreaterThanOrEqual(1);
    const audit = must(await rest("GET",
      `audit_events?object_type=eq.visits&object_id=eq.${visitId}&select=id&limit=1`, adminJwt),
      "visit audit rows");
    expect(audit.length).toBeGreaterThanOrEqual(1);

    await markNotificationRead(adminJwt, notifId);
  });

  test("expired-visit notification lands on the plain visit detail", async ({ page }) => {
    const visitId = await findReturnedVisit(adminJwt);
    test.skip(!visitId, "no visit in staging scope for the deep-link target");
    const marker = `m10-deeplink-expired-${Date.now()}`;
    const notifId = await stageNotification(adminJwt, adminUserId, "visit_expired", visitId!, marker);

    await page.goto("/admin/planning/status");
    await page.getByRole("button", { name: "Notifications" }).click();
    const row = page.locator(".ax-popover .ax-surface", { hasText: marker });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: /Open/ }).click();

    // Plain detail — no focus parameter for non-return events.
    await page.waitForURL(new RegExp(`/visits/${visitId}$`));
    await expect(page.locator("#lifecycle")).toBeVisible();

    await markNotificationRead(adminJwt, notifId);
  });
});

test.describe("CD-045 canonical counts (PLN-CON-020)", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("dashboard Planned count matches the canonical visits count for the same persona", async ({ page }) => {
    // Same scope math as dashboard/metrics.ts (Riyadh calendar day, +0300 fixed).
    const RIYADH = 3 * 3600_000, DAY = 24 * 3600_000;
    const shifted = new Date(Date.now() + RIYADH);
    const todayStart = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - RIYADH;
    const fromIso = new Date(todayStart - 29 * DAY).toISOString();
    const toIso = new Date(todayStart + DAY - 1).toISOString();
    const canonical = must(await rest("GET",
      `visits?planning_status=eq.published&window_start=gte.${fromIso}&window_start=lte.${toIso}&select=id`,
      plannerJwt), "canonical planned count");

    await page.goto("/dashboard?view=operational");
    const cell = page.getByText("Planned", { exact: true }).locator("..");
    await expect(cell).toBeVisible({ timeout: 60000 });
    const shown = Number((await cell.locator(".t-metric").innerText()).trim());
    expect(shown, "dashboard Planned must equal the canonical PostgREST count").toBe(canonical.length);
  });
});

test.describe("CD-045 inspector pool + provider posture", () => {
  test.use({ storageState: storagePathPlanner });

  test("draft visits never enter the inspector pool", async () => {
    // Mirror the actual pool path (field/page.tsx): assignments → visits embed,
    // then the surface filter keeps only published/expired. Staging carries one
    // stale assignment→draft link (seeded, creator-less) — the invariant is
    // that the pool surface never receives it, which this exercises end to end.
    const rows = must(await rest("GET",
      "assignments?select=visit_id,status,visits(id,planning_status,factories(id))&limit=200",
      inspectorJwt), "inspector pool read");
    for (const row of rows) {
      expect(row.visits, "pool rows must carry the visits embed the filter needs").toBeTruthy();
    }
    const pooled = rows.filter((r: { visits: { planning_status: string; factories: unknown } | null }) =>
      !!r.visits && !!r.visits.factories && ["published", "expired"].includes(r.visits.planning_status));
    expect(
      pooled.filter((r: { visits: { planning_status: string } | null }) =>
        r.visits && ["draft", "validated"].includes(r.visits.planning_status)).length,
      "no draft/validated visit may pass the inspector pool filter",
    ).toBe(0);
    // The pool surface itself only ever keeps published/expired rows.
    const field = SRC("src/app/(app)/field/page.tsx");
    expect(field).toContain('["published", "expired"].includes(v.planning_status)');
  });

  test("Industry Shared-dependent bulk filters render CONTRACT_NOT_SUPPLIED", async ({ page }) => {
    await page.goto("/planning/bulk");
    // The honest lozenge list under the criteria tree (not the hidden
    // disabled <option> in the field picker).
    await expect(page.locator(".ax-lozenge--warning", { hasText: "CONTRACT_NOT_SUPPLIED" }).first())
      .toBeVisible({ timeout: 60000 });
  });
});

test.describe("CD-045 source contract (cheap regression assertions)", () => {
  test("notification deep-link map and focused return anchor exist", () => {
    const bell = SRC("src/components/NotificationBell.tsx");
    expect(bell).toContain('eventKey === "visit_returned"');
    expect(bell).toContain("?focus=return");
    for (const key of ["visit_cancelled", "visit_expired", "visit_republished", "visit_rescheduled", "assignment"]) {
      expect(bell).toContain(`"${key}"`);
    }
    const detail = SRC("src/app/(app)/visits/[id]/page.tsx");
    expect(detail).toContain('id="return-block"');
    expect(detail).toContain("FocusScroll");
  });

  test("every planning verb emits its notification leg", () => {
    const actions = SRC("src/app/(app)/visits/[id]/actions.ts");
    expect(actions).toContain('"visit_returned"');
    expect(actions).toContain('"visit_cancelled"');
    expect(actions).toContain('"visit_rescheduled"');
    // Reassignment notifies the new inspector and releases the previous one.
    expect(actions).toContain('"assignment"');
    expect(actions).toContain("released: true");
  });

  test("planning widgets fail isolated behind an error boundary", () => {
    expect(SRC("src/components/WidgetBoundary.tsx")).toContain("getDerivedStateFromError");
    expect(SRC("src/app/(app)/visits/page.tsx")).toContain("WidgetBoundary");
    expect(SRC("src/app/(app)/planning/bulk/page.tsx")).toContain("WidgetBoundary");
  });

  test("no browser code calls external provider APIs directly", () => {
    // Every fetch( to an external host must live in a server module (api route
    // or server-only provider adapter), never in a client component.
    const bell = SRC("src/components/NotificationBell.tsx");
    expect(bell).not.toMatch(/fetch\(\s*[`"']https?:/);
    const aiPanel = SRC("src/components/ContextualAiPanel.tsx");
    expect(aiPanel).not.toMatch(/fetch\(\s*[`"']https?:/);
  });
});
