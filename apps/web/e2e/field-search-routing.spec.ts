import { expect, test } from "@playwright/test";
import {
  isFieldOnlyPersona,
  shellGlobalSearchHref,
  type ShellGlobalSearchResultHref,
} from "../src/lib/shell-navigation";

// PLAN v7 item 1 — exact six-type Field Search routing matrix.
const matrix: { result: ShellGlobalSearchResultHref; fieldHref: string }[] = [
  {
    result: { id: "cr-1", type: "commercial_registration", href: "/factories/cr/cr-1" },
    fieldHref: "/field/factory-360?cr=cr-1",
  },
  {
    result: { id: "license-1", type: "industrial_license", href: "/factories/cr/cr-1?license=license-1" },
    fieldHref: "/field/factory-360?license=license-1",
  },
  {
    result: { id: "plant-license-1", type: "plant", href: "/factories/factory-1" },
    fieldHref: "/field/factory-360?license=plant-license-1",
  },
  {
    result: { id: "factory-1", type: "factory", href: "/factories/factory-1" },
    fieldHref: "/field/factory-360?factory=factory-1",
  },
  {
    result: { id: "visit-1", type: "visit", href: "/visits/visit-1" },
    fieldHref: "/field/visit-1",
  },
  {
    result: { id: "inspection-1", type: "inspection", href: "/field/inspection/inspection-1" },
    fieldHref: "/field/inspection/inspection-1",
  },
];

test.describe("PLAN v7 item 1 Field Search routing", () => {
  for (const { result, fieldHref } of matrix) {
    test(`field-only ${result.type} resolves to its field-safe destination`, () => {
      const fieldOnly = isFieldOnlyPersona(["inspector"]);

      expect(fieldOnly).toBe(true);
      expect(shellGlobalSearchHref(result, fieldOnly)).toBe(fieldHref);
    });

    test(`non-field ${result.type} preserves the API href`, () => {
      for (const roles of [["planner"], ["security_admin"], ["inspector", "planner"]]) {
        const fieldOnly = isFieldOnlyPersona(roles);

        expect(fieldOnly, roles.join(",")).toBe(false);
        expect(shellGlobalSearchHref(result, fieldOnly)).toBe(result.href);
      }
    });
  }
});
