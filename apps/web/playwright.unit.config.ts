import { defineConfig } from "@playwright/test";

// Pure contract/model suites that do not need authentication or a running app.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /(field-daily-visit-hub|mvp2-m2-08-portal|insp-713-portal-repair)\.spec\.ts/,
  timeout: 30_000,
  workers: 1,
  reporter: "list",
});
