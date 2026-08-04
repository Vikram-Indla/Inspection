import { expect, test } from "@playwright/test";
import {
  ALLOWED_NONPRODUCTION_PROJECT_REF,
  guardServiceFixtureEnvironment,
} from "./service-fixture-guard";

const allowed = {
  acknowledgement: "1",
  supabaseUrl: `https://${ALLOWED_NONPRODUCTION_PROJECT_REF}.supabase.co`,
  configuredProjectRef: ALLOWED_NONPRODUCTION_PROJECT_REF,
  serviceRoleKey: "private-test-placeholder",
};

test("service fixture guard is default-off without explicit acknowledgement", () => {
  expect(guardServiceFixtureEnvironment({ ...allowed, acknowledgement: undefined }))
    .toEqual({ allowed: false, code: "FIXTURE_GUARD_ACK_REQUIRED" });
});

test("service fixture guard rejects a missing private service-role key", () => {
  expect(guardServiceFixtureEnvironment({ ...allowed, serviceRoleKey: undefined }))
    .toEqual({ allowed: false, code: "FIXTURE_GUARD_SERVICE_ROLE_REQUIRED" });
});

test("service fixture guard rejects wrong and unknown Supabase projects", () => {
  for (const projectRef of ["aaaaaaaaaaaaaaaaaaaa", "unknownprojectref1234"]) {
    expect(guardServiceFixtureEnvironment({
      ...allowed,
      supabaseUrl: `https://${projectRef}.supabase.co`,
      configuredProjectRef: projectRef,
    })).toEqual({ allowed: false, code: "FIXTURE_GUARD_PROJECT_NOT_ALLOWED" });
  }
  expect(guardServiceFixtureEnvironment({
    ...allowed,
    configuredProjectRef: "aaaaaaaaaaaaaaaaaaaa",
  })).toEqual({ allowed: false, code: "FIXTURE_GUARD_PROJECT_REFERENCE_MISMATCH" });
});

test("service fixture guard rejects production-shaped custom configuration", () => {
  expect(guardServiceFixtureEnvironment({
    ...allowed,
    supabaseUrl: "https://inspection.mim.gov.sa",
  })).toEqual({ allowed: false, code: "FIXTURE_GUARD_PROJECT_NOT_ALLOWED" });
});

test("service fixture guard allows only the acknowledged private project", () => {
  expect(guardServiceFixtureEnvironment(allowed)).toEqual({
    allowed: true,
    projectRef: ALLOWED_NONPRODUCTION_PROJECT_REF,
  });
});
