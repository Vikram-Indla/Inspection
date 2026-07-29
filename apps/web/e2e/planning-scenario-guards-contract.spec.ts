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

  test("keeps Reassign to the canonical Supervisor role only", () => {
    expect(hasPlanningSupervisorRole(["supervisor"])).toBe(true);
    expect(hasPlanningSupervisorRole(["ops"])).toBe(false);
    expect(hasPlanningSupervisorRole(["leadership"])).toBe(false);
    expect(hasPlanningSupervisorRole(["planner"])).toBe(false);
    expect(hasPlanningSupervisorRole(["reviewer"])).toBe(false);
    expect(hasPlanningSupervisorRole(["inspector"])).toBe(false);
  });

  test("gates Reassign through the canonical capability and atomic server action", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "src/app/(app)/visits/[id]/page.tsx"), "utf8");
    const actions = fs.readFileSync(path.join(process.cwd(), "src/app/(app)/visits/[id]/actions.ts"), "utf8");
    expect(page).toContain('planningAccess.can("planning.reassign")');
    expect(actions).toContain('sb.rpc("reassign_published_visits_atomic"');
    expect(actions).not.toContain("Reassignment is not configured until the governed Supervisor capability mapping is approved.");
  });

  test("keeps automatic assignment disabled and preserves the atomic overlap contract", () => {
    const review = fs.readFileSync(path.join(process.cwd(), "src/app/(app)/planning/bulk/review/page.tsx"), "utf8");
    const migration = fs.readFileSync(path.join(process.cwd(), "../../supabase/migrations/20260723090000_planning_publish_capability_convergence.sql"), "utf8");
    expect(review).toContain("No automatic assignment is made.");
    expect(review).toContain("Supervisor selects the final Inspector during approval");
    expect(migration).toMatch(/not exists \([\s\S]*v\.window_start < p_window_end[\s\S]*v\.window_end > p_window_start/);
    expect(migration).toContain("bulk publish inspector unavailable");
  });
});
