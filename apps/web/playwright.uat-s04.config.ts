import { defineConfig, devices } from "@playwright/test";

// Scoped runner for TASK-INSPECTOR-FIELD-COMPLETION-JOURNEY-384ca3 (dataset
// UAT-S04). The shared playwright.config.ts "e2e" project depends on the
// FULL auth.setup.ts project, including the "ops" persona — which this
// journey never uses. Re-authenticating an already-signed-in persona email
// within one run trips Supabase's per-identity sign-in cooldown (a real
// 400 "Could not sign in" from GoTrue), so the shared config's full-suite
// dependency cannot be reused verbatim for a narrowly scoped run. This file
// only narrows which personas the setup dependency authenticates; it does
// not change auth.setup.ts, personas.ts, or the shared config.
const playwrightPort = Number(process.env.PLAYWRIGHT_PORT ?? 3410);
const playwrightOrigin = `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: playwrightOrigin,
    channel: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "uat-s04-setup", testMatch: /auth\.setup\.ts/, grep: /authenticate (planner|supervisor)/ },
    {
      name: "uat-s04-journey",
      testMatch: /uat-s04-inspector4-journey\.spec\.ts/,
      dependencies: ["uat-s04-setup"],
    },
  ],
  webServer: undefined,
});
