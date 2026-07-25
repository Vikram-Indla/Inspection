import { defineConfig } from "@playwright/test";

// Pure contract/model suites that do not need authentication or a running app.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /field-daily-visit-hub\.spec\.ts/,
  timeout: 30_000,
  workers: 1,
  reporter: "list",
});
