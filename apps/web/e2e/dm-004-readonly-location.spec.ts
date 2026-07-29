import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  containsPlannerLocationOverride,
  PLANNER_LOCATION_OVERRIDE_ERROR,
} from "../src/app/(app)/planning/single/location-authority";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

test.describe("DM-004 Planner location authority", () => {
  test("Single Visit renders official location as read-only external master data", () => {
    const wizard = source("src/app/(app)/planning/single/Wizard.tsx");
    const dossier = source("src/app/(app)/planning/single/IdentityDossier.tsx");

    expect(wizard).not.toContain('name="planner_lat"');
    expect(wizard).not.toContain('name="planner_lng"');
    expect(wizard).not.toContain("setPlannerLat");
    expect(wizard).not.toContain("setPlannerLng");
    expect(wizard).toContain("strings.officialAddress");
    expect(wizard).toContain("strings.officialPin");
    expect(wizard).toContain("strings.locationAuthority");
    expect(wizard).toContain("strings.locationReadOnly");
    expect(wizard).toContain('name="location_confirmed"');
    expect(dossier).not.toContain('id: "planner"');
    expect(dossier).toContain('id: "official"');
  });

  test("publish rejects injected coordinates and never forwards an override", () => {
    const actions = source("src/app/(app)/planning/single/actions.ts");
    const blocker = actions.indexOf("if (plannerLocationOverrideAttempted) blockers.push(PLANNER_LOCATION_OVERRIDE_ERROR)");
    const publish = actions.indexOf('sb.rpc("publish_single_visit_atomic"');

    expect(blocker).toBeGreaterThan(-1);
    expect(publish).toBeGreaterThan(blocker);
    expect(actions).toContain("p_planner_lat: null");
    expect(actions).toContain("p_planner_lng: null");
    expect(actions).not.toMatch(/\.from\("(?:factories|plant_addresses)"\)\s*\.update/);
    expect(containsPlannerLocationOverride(["1.234", "5.678"])).toBe(true);
    expect(containsPlannerLocationOverride(["", null])).toBe(false);
    expect(PLANNER_LOCATION_OVERRIDE_ERROR).toContain("read-only external master data");
  });

  test("drafts reject and do not persist injected coordinate overrides", () => {
    const actions = source("src/app/(app)/planning/single/actions.ts");
    const draftStart = actions.indexOf("export async function saveSingleDraft");
    const draftSource = actions.slice(draftStart);

    expect(draftSource).toContain('"plannerLat", "plannerLng", "planner_lat", "planner_lng"');
    expect(draftSource).toContain('return { error: "location_read_only" }');
    expect(draftSource).not.toContain("planner_lat:");
    expect(draftSource).not.toContain("planner_lng:");
  });
});
