import { defineConfig } from "@playwright/test";

// Source-contract tests have no browser or authenticated-backend dependency.
// Keeping them separate lets the policy guard run even when a clean worktree
// intentionally has no local Supabase credential file.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /(ipad-gps-policy|mvp2-m2-05-contract|mvp2-m2-02-events|mvp2-m2-04-risk-model)\.spec\.ts/,
  reporter: "line",
  workers: 1,
});
