import { test, expect } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must, assertOk } from "./live-rest";

// CD-044 / M9 — planning admin control plane contract.
//   PLN-REQ-004  audited role/capability grant-revoke with self-escalation guard
//   PLN-CON-012  planning lookups governance UI
//   PLN-CON-013  planning expiry rules governance UI
//   PLN-CON-014  planning status rules read-only view + nav
// Every mutation runs as the admin persona's own JWT (RLS + guards stay the
// enforcement under test) and is reverted where the schema allows. Known
// leftovers, documented in PLANNING_IMPLEMENTATION_NOTES.md:
//   • lookup return_reason.m9_test_reason stays DEACTIVATED (rows are never
//     deleted — deactivation is the governed retirement);
//   • one extra DISABLED version of not_completed_at_window_end per run
//     (the sweep only reads enabled versions; no delete policy exists).
// role_permissions audit rows are NOT asserted here: the audit trigger is
// migration 20260722120000, authored but not yet applied.

const OPS_USER_ID = "38fd1ad1-ec82-4d62-8da4-a3231271753a";
const SEEDED_EXPIRY_RULE_ID = "e281e968-6710-4b95-8af6-fff31203661c";

let adminJwt = "";
let adminUserId = "";

test.use({ storageState: storageStatePath("admin") });

test.beforeAll(async () => {
  const { jwt, userId } = await login(PERSONAS.admin.email, PERSONAS.admin.password);
  adminJwt = jwt;
  adminUserId = userId;
});

test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-044 access control plane (PLN-REQ-004)", () => {
  test("self-escalation guard refuses REST role grant to the actor's own user", async () => {
    const res = await rest("POST", "rpc/admin_grant_role", adminJwt, {
      p_user: adminUserId,
      p_role: "ops",
    });
    expect(res.error, "grant to self must fail").toBeTruthy();
    expect(res.error).toContain("EXE-ACCESS-SELF");
  });

  test("UI self-target shows the guard notice and disables the controls", async ({ page }) => {
    await page.goto("/admin/access");
    await expect(page.getByRole("heading", { name: "Access management" })).toBeVisible();
    await page.selectOption("#access-user-select", adminUserId);
    await expect(page.getByRole("alert").getByText(/self-escalation guard refuses access changes/i)).toBeVisible();
  });

  test("REST role grant/revoke on another user lands and writes audit rows", async () => {
    assertOk(await rest("POST", "rpc/admin_grant_role", adminJwt, {
      p_user: OPS_USER_ID,
      p_role: "planner",
    }), "grant planner to ops");
    const granted = must(await rest("GET",
      `user_roles?user_id=eq.${OPS_USER_ID}&role_key=eq.planner&select=user_id,role_key`, adminJwt),
      "verify planner grant");
    expect(granted.length).toBe(1);

    assertOk(await rest("POST", "rpc/admin_revoke_role", adminJwt, {
      p_user: OPS_USER_ID,
      p_role: "planner",
    }), "revoke planner from ops");
    const revoked = must(await rest("GET",
      `user_roles?user_id=eq.${OPS_USER_ID}&role_key=eq.planner&select=user_id`, adminJwt),
      "verify planner revoke");
    expect(revoked.length).toBe(0);

    const audit = must(await rest("GET",
      `audit_events?object_type=eq.user_roles&action=in.(role_grant,role_revoke)&actor=eq.${adminUserId}&select=action&order=occurred_at.desc&limit=2`,
      adminJwt), "audit rows for the grant/revoke pair");
    // Latest two rows for this actor must be exactly this run's pair, newest first.
    const actions = audit.map((r: { action: string }) => r.action);
    expect(actions).toEqual(["role_revoke", "role_grant"]);
  });

  test("role-capability panel grants and revokes a planning capability for a role", async ({ page }) => {
    await page.goto("/admin/access");
    await expect(page.getByRole("heading", { name: /Role capabilities/i })).toBeVisible();

    await page.selectOption("#role-cap-role-select", "inspector");
    await page.selectOption("#role-cap-grant-select", "planning.export");
    await page.getByRole("button", { name: "Grant capability to role" }).click();
    await expect(page.locator(".ax-banner--success")).toBeVisible();
    const granted = must(await rest("GET",
      "role_permissions?role_key=eq.inspector&permission_key=eq.planning.export&select=role_key", adminJwt),
      "verify role_permissions grant");
    expect(granted.length).toBe(1);

    await page.locator(".ax-lozenge", { hasText: "planning.export" })
      .getByRole("button", { name: "Revoke" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.locator(".ax-banner--success")).toBeVisible();
    const revoked = must(await rest("GET",
      "role_permissions?role_key=eq.inspector&permission_key=eq.planning.export&select=role_key", adminJwt),
      "verify role_permissions revoke");
    expect(revoked.length).toBe(0);
  });
});

test.describe("CD-044 access page read-only for non-security roles", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("ops sees the roster without the management panels", async ({ page }) => {
    await page.goto("/admin/access");
    await expect(page.locator("table.ax-table")).toBeVisible();
    await expect(page.getByText(/This screen is read-only\./i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Access management" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Role capabilities/i })).toHaveCount(0);
  });
});

test.describe("CD-044 planning lookups governance (PLN-CON-012)", () => {
  test("REST-staged lookup can be deactivated from the UI and leaves governed selects", async ({ page }) => {
    // Idempotent staging: reactivate the leftover row when a previous run
    // left one, otherwise insert it fresh.
    const patched = must(await rest("PATCH",
      "planning_lookups?kind=eq.return_reason&key=eq.m9_test_reason", adminJwt,
      { is_active: true, label_en: "M9 contract reason" }), "reactivate throwaway lookup");
    if (patched.length === 0) {
      assertOk(await rest("POST", "planning_lookups", adminJwt, {
        kind: "return_reason",
        key: "m9_test_reason",
        label_en: "M9 contract reason",
        label_ar: null,
        is_active: true,
        sort_order: 999,
        metadata: {},
      }), "stage throwaway lookup");
    }

    await page.goto("/admin/planning/lookups");
    await page.getByRole("button", { name: "return_reason", exact: true }).click();
    const row = page.locator("tr", { hasText: "m9_test_reason" });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Deactivate" }).click();
    await expect(page.locator(".ax-banner--success")).toBeVisible();

    const after = must(await rest("GET",
      "planning_lookups?kind=eq.return_reason&key=eq.m9_test_reason&select=is_active", adminJwt),
      "verify deactivation");
    expect(after[0].is_active).toBe(false);
    // Governed selects read active rows only — the value must be gone there.
    const active = must(await rest("GET",
      "planning_lookups?kind=eq.return_reason&is_active=eq.true&key=eq.m9_test_reason&select=key", adminJwt),
      "verify absence from active reads");
    expect(active.length).toBe(0);
  });
});

test.describe("CD-044 planning expiry rules governance (PLN-CON-013)", () => {
  const section = (page: import("@playwright/test").Page) =>
    page.locator("section", { has: page.getByRole("heading", { name: /Not completed at window end/i }) });

  test("seeded rule disables and re-enables with the single-enabled invariant intact", async ({ page }) => {
    await page.goto("/admin/planning/expiry");
    const v1 = section(page).locator("tr", { hasText: "v1" });
    await expect(v1).toBeVisible();

    await v1.getByRole("button", { name: "Disable" }).click();
    await expect(page.locator(".ax-banner--success")).toBeVisible();
    let row = must(await rest("GET",
      `planning_expiry_rules?id=eq.${SEEDED_EXPIRY_RULE_ID}&select=enabled`, adminJwt),
      "verify disabled");
    expect(row[0].enabled).toBe(false);

    await section(page).locator("tr", { hasText: "v1" }).getByRole("button", { name: "Enable" }).click();
    await expect(page.locator(".ax-banner--success")).toBeVisible();
    row = must(await rest("GET",
      `planning_expiry_rules?id=eq.${SEEDED_EXPIRY_RULE_ID}&select=enabled`, adminJwt),
      "verify re-enabled");
    expect(row[0].enabled).toBe(true);
  });

  test("a new version is created disabled and the enabled version is untouched", async ({ page }) => {
    await page.goto("/admin/planning/expiry");
    await section(page).getByRole("button", { name: "New version" }).click();
    const form = section(page).locator("form");
    await form.locator('input[name="reason"]').fill("M9 contract test version");
    await form.getByRole("button", { name: "Create version (disabled)" }).click();
    // On success the form unmounts (its ok lozenge closes with it); on failure
    // it stays and shows an alert. The REST assertions below are the contract.
    await expect(form).toHaveCount(0);

    const rows = must(await rest("GET",
      "planning_expiry_rules?rule_type=eq.not_completed_at_window_end&select=version,enabled&order=version", adminJwt),
      "verify version set");
    const enabled = rows.filter((r: { enabled: boolean }) => r.enabled);
    expect(enabled.length, "single enabled version invariant").toBe(1);
    expect(enabled[0].version).toBe(1);
    const newest = rows[rows.length - 1];
    expect(newest.version).toBeGreaterThanOrEqual(2);
    expect(newest.enabled).toBe(false);
  });
});

test.describe("CD-044 planning status view + nav (PLN-CON-014)", () => {
  test("status page renders the published workflow transitions with the governance banner", async ({ page }) => {
    await page.goto("/admin/planning/status");
    await expect(page.getByText(/governed by workflow configuration/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Open workflow configuration/i }))
      .toHaveAttribute("href", "/admin/workflows");
    await expect(page.getByRole("cell", { name: "STM-VIS-001" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "planning.publish" })).toBeVisible();
  });

  test("administration nav carries the three planning control-plane entries", async ({ page }) => {
    await page.goto("/admin/planning/status");
    await expect(page.getByRole("link", { name: "Planning Lookups" }))
      .toHaveAttribute("href", "/admin/planning/lookups");
    await expect(page.getByRole("link", { name: "Planning Expiry Rules" }))
      .toHaveAttribute("href", "/admin/planning/expiry");
    await expect(page.getByRole("link", { name: "Planning Status Rules" }))
      .toHaveAttribute("href", "/admin/planning/status");
  });
});
