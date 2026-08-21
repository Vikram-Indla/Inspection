import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Cross-cutting ERRORMAP proof. These paths are server-rendered or client
// adapters, so source-level assertions are the deterministic negative path:
// provider details may be logged, but must never become user-visible copy.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.describe("neutral provider-error boundary", () => {
  test("admin read surfaces use neutral copy and server diagnostics", () => {
    // Both admin read surfaces named by this contract migrated to the
    // feature/section split. Items logs provider diagnostics and renders neutral
    // copy; the enforcement (violation) catalogue reduces provider failure to a
    // governed boolean and never surfaces a provider message.
    const itemsQueries = SRC("src/features/admin-items/queries.ts");
    const itemsScreen = SRC("src/components/sections/admin-items/items-screen.tsx");
    expect(itemsQueries, "items load must log provider diagnostics").toContain("logProviderError");
    expect(itemsQueries, "items load must not render provider message").not.toMatch(/\{(?:error|clauseError|err)\??\.message\}/);
    expect(itemsScreen, "items error surface must use governed neutral copy").toContain("strings.error.body");

    const enforcement = SRC("src/features/enforcement/catalogue.ts");
    const enforcementScreen = SRC("src/components/sections/enforcement/catalogue/catalogue-screen/catalogue-screen.tsx");
    expect(enforcement, "violation catalogue must not render provider message").not.toMatch(/\{(?:error|codeError|err)\??\.message\}/);
    expect(enforcement, "violation catalogue reduces provider failure to a governed boolean").toContain("catalogueReadable");
    expect(enforcementScreen, "violation catalogue degraded surface uses governed neutral copy").toContain("strings.degradedBody");

    const gisQueries = SRC("src/features/admin-gis/queries.ts");
    const gisScreen = SRC("src/components/sections/admin-gis/gis-screen.tsx");
    expect(gisQueries, "gis load must log provider diagnostics").toContain("logProviderError");
    expect(gisQueries, "gis load must not render provider message").not.toMatch(/\{(?:error|clauseError|err)\??\.message\}/);
    expect(gisScreen, "gis error surface must use governed neutral copy").toContain("strings.error.body");
  });

  test("admin publish/draft actions and notification adapter never return raw provider text", () => {
    const packages = SRC("src/app/(app)/admin/packages/actions.ts");
    const workflows = SRC("src/app/(app)/admin/workflows/actions.ts");
    const notify = SRC("src/lib/notify.ts");
    expect(packages).not.toMatch(/return \{ error: verErr\.message \}/);
    expect(workflows).not.toMatch(/return \{ error: baseError\.message \}/);
    expect(packages).toContain("NEUTRAL_LOAD_ERROR");
    expect(workflows).toContain("NEUTRAL_LOAD_ERROR");
    expect(notify).not.toMatch(/return error \? \{ error: error\.message \}/);
    expect(notify).toContain("NEUTRAL_WRITE_ERROR");
    expect(notify).toContain('delivery_state = "failed"');
  });

  test("field, bell, offline, and virtual-session paths keep provider details diagnostic-only", () => {
    const bell = SRC("src/components/NotificationBell.tsx");
    const offline = SRC("src/lib/offline.ts");
    const fieldPage = SRC("src/app/(app)/field/inspection/[id]/page.tsx");
    const field = SRC("src/app/(app)/field/inspection/[id]/FactoryVerification.tsx");
    const helper = SRC("src/lib/factory-verification.ts");
    const virtual = SRC("src/app/(app)/virtual/[id]/actions.ts");
    expect(bell).not.toContain("setErr(error.message)");
    expect(offline).not.toMatch(/onState\("failed",\s*String\(/);
    expect(fieldPage).not.toMatch(/checksErr\s*\?\s*checksErr\.message/);
    expect(field).not.toMatch(/setFailDetail\(detail/);
    expect(helper).not.toContain("error ? error.message");
    expect(helper).toContain('error ? "unavailable" : null');
    expect(virtual).not.toMatch(/timeline append failed: \$\{evErr\}/);
    expect(virtual).not.toMatch(/notification failed: \$\{(?:n|rep)\.error\}/);
    expect(virtual).toContain("DELIVERY_DEGRADED");
  });
});
