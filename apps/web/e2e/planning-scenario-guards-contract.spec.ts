import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  hasPlanningSupervisorRole,
  requiresMixedAcknowledgement,
} from "../src/lib/planning/scenario-guards";

test.describe("Planning scenario guards", () => {
  test("requires acknowledgement only for a mixed selected/excluded result", () => {
    expect(requiresMixedAcknowledgement(23, 2)).toBe(true);
    expect(requiresMixedAcknowledgement(23, 0)).toBe(false);
    expect(requiresMixedAcknowledgement(0, 2)).toBe(false);
  });

  test("keeps Reassign supervisor-only", () => {
    expect(hasPlanningSupervisorRole(["ops"])).toBe(true);
    expect(hasPlanningSupervisorRole(["leadership"])).toBe(true);
    expect(hasPlanningSupervisorRole(["planner"])).toBe(false);
    expect(hasPlanningSupervisorRole(["reviewer"])).toBe(false);
    expect(hasPlanningSupervisorRole(["inspector"])).toBe(false);
  });

  test("gates both the Reassign UI and its server action", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "src/app/(app)/visits/[id]/page.tsx"), "utf8");
    const actions = fs.readFileSync(path.join(process.cwd(), "src/app/(app)/visits/[id]/actions.ts"), "utf8");
    expect(page).toContain("isPlanningSupervisor &&");
    expect(actions).toContain("!hasPlanningSupervisorRole");
  });

  test("keeps automatic assignment overlap validation fail-closed", () => {
    const review = fs.readFileSync(path.join(process.cwd(), "src/app/(app)/planning/bulk/review/page.tsx"), "utf8");
    const migration = fs.readFileSync(path.join(process.cwd(), "../../supabase/migrations/20260723090000_planning_publish_capability_convergence.sql"), "utf8");
    expect(review).not.toContain("overlap not re-checked for auto (known gap)");
    expect(review).toContain("atomic overlap re-check at publish");
    expect(migration).toMatch(/not exists \([\s\S]*v\.window_start < p_window_end[\s\S]*v\.window_end > p_window_start/);
    expect(migration).toContain("bulk publish inspector unavailable");
  });
});
