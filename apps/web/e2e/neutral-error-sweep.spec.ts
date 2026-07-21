import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Cross-cutting ERRORMAP proof. These paths are server-rendered or client
// adapters, so source-level assertions are the deterministic negative path:
// provider details may be logged, but must never become user-visible copy.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.describe("neutral provider-error boundary", () => {
  test("admin read surfaces use neutral copy and server diagnostics", () => {
    for (const p of [
      "src/app/(app)/admin/items/page.tsx",
      "src/app/(app)/admin/violations/page.tsx",
      "src/app/(app)/admin/gis/page.tsx",
    ]) {
      const src = SRC(p);
      expect(src, `${p} must log provider diagnostics`).toContain("logProviderError");
      expect(src, `${p} must not render provider message`).not.toMatch(/\{(?:error|clauseError|err)\??\.message\}/);
      expect(src).toContain("NEUTRAL_LOAD_ERROR");
    }
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
