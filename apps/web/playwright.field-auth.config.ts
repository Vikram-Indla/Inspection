import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /field-auth-session-contract\.spec\.ts/,
  reporter: "line",
  workers: 1,
});
