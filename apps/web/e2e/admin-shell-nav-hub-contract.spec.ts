import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// INSP-728 — regression contract for the empty-admin-sidebar defect.
//
// buildShellNavigation() (shell-navigation.ts) once fanned the catalogue's
// single "administration" group into "admin-control" / "admin-people" / ...
// sub-groups. That fan-out was removed and the catalogue's admin item ids
// were renamed/consolidated, but two consumers still assumed the old shape:
// ShellClient.tsx filtered groups by `id.startsWith("admin-")` (never
// matches the literal id "administration"), and the admin hub map's entries
// referenced item ids ("users", "surveys", "planning-lookups", ...)
// that no longer exist in the catalogue. Together this meant the hub rail
// computed to empty on every admin route — only the brand mark and the
// "Find a tool" button rendered.
//
// The standalone AdminShellClient.tsx has since been retired: the hub map
// lives in ShellClient.tsx as ADMIN_HUB_ITEMS and the rail renders it inside
// renderNavGroup's "administration" branch. The contract follows the code.
//
// This is a static source contract (no browser, no auth) so it stays fast
// and catches the next id-rename before it ships silently.

const root = join(__dirname, "..");
const shellNavigation = readFileSync(join(root, "src/lib/shell-navigation.ts"), "utf8");
const shellClient = readFileSync(join(root, "src/components/ShellClient.tsx"), "utf8");

function catalogueAdminItemIds(): string[] {
  const groupStart = shellNavigation.indexOf('id: "administration"');
  const groupEnd = shellNavigation.indexOf("\n  },", groupStart);
  const block = shellNavigation.slice(groupStart, groupEnd);
  return [...block.matchAll(/\{ id: "([a-z0-9-]+)"/g)].map(m => m[1]);
}

function hubItemIds(): string[] {
  const start = shellClient.indexOf("const ADMIN_HUB_ITEMS");
  const end = shellClient.indexOf("};", start);
  const block = shellClient.slice(start, end);
  return [...block.matchAll(/"([a-z0-9-]+)"/g)].map(m => m[1]);
}

test.describe("Admin shell hub-nav source contract (INSP-728)", () => {
  test("ShellClient selects the real 'administration' group id, not a dead 'admin-' prefix", () => {
    // Any surviving `.startsWith("admin-")` group filter would silently
    // match nothing forever, since no group in SHELL_NAVIGATION has ever
    // had that literal prefix since the fan-out was removed.
    expect(shellClient).not.toMatch(/group\.id\.startsWith\("admin-"\)/);
    const adminGroupComparisons = [...shellClient.matchAll(/group\.id [!=]== "administration"/g)];
    expect(adminGroupComparisons.length).toBeGreaterThanOrEqual(3);
  });

  test("every ADMIN_HUB_ITEMS entry points at a real catalogue item id", () => {
    const catalogueIds = catalogueAdminItemIds();
    expect(catalogueIds.length).toBeGreaterThan(0);
    const hubIds = hubItemIds();
    expect(hubIds.length).toBeGreaterThan(0);
    for (const id of hubIds) {
      expect(catalogueIds).toContain(id);
    }
  });

  test("every catalogue admin item is reachable from at least one hub", () => {
    // A regression the other direction: a new admin item added to the
    // catalogue but never wired into a hub would be enabled but
    // undiscoverable in the rail.
    const catalogueIds = catalogueAdminItemIds();
    const wiredIds = new Set(hubItemIds());
    const unreachable = catalogueIds.filter(id => !wiredIds.has(id));
    expect(unreachable).toEqual([]);
  });

  test("the rail renders every hub item directly, not one link per hub gated behind a click (PO ruling, INSP-728 amendment)", () => {
    // The original design rendered one Link per hub, pointed at
    // hub.items[0].href — the rest of a hub's items were only reachable by
    // clicking through to a subnav in the main content, or via the ⌘K
    // palette. PO ruled every manageable area must be listed and visible
    // in the sidebar itself. `hubItems.map(item => renderNavItem(...))`
    // inside renderNavGroup's administration branch proves every item gets
    // its own row there, not just the first.
    const hubsRailStart = shellClient.indexOf("ADMIN_HUB_ORDER.map(hubId");
    const hubsRailEnd = shellClient.indexOf(": group.items.map(", hubsRailStart);
    expect(hubsRailStart).toBeGreaterThan(-1);
    expect(hubsRailEnd).toBeGreaterThan(hubsRailStart);
    const hubsRailBlock = shellClient.slice(hubsRailStart, hubsRailEnd);
    expect(hubsRailBlock).toContain("hubItems.map(item => renderNavItem(item, true))");
    expect(hubsRailBlock).not.toContain("hubItems[0]");
    expect(hubsRailBlock).not.toContain("items[0].href");
  });

  test("⌘K stays available as a secondary shortcut, not the only nav mechanism", () => {
    // The palette must still exist (secondary shortcut) — it must not be the
    // only way to discover admin areas, which the previous test already
    // guards from the other direction. Both entry points survive: the
    // keyboard listener and the visible topbar trigger.
    expect(shellClient).toContain('(event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k"');
    expect(shellClient).toContain("ref={adminPaletteTriggerRef}");
    expect(shellClient).toContain("aria-label={`${adminPaletteCopy.open} (Ctrl/⌘ K)`}");
  });
});
