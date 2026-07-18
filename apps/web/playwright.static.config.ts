import { defineConfig } from "@playwright/test";

// Source-contract tests have no browser or authenticated-backend dependency.
// Keeping them separate lets the policy guard run even when a clean worktree
// intentionally has no local Supabase credential file.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /(design-foundation-contract|ipad-gps-policy|mvp2-m2-05-contract|mvp2-m2-02-events|mvp2-m2-04-risk-model|mvp2-m2-08-portal|mvp2-m2-09-exceptions|mvp2-m2-10-cases|mvp2-m2-11-ai|mvp2-m2-12-signature|mvp2-m2-06-spatial|mvp2-shared-0193|mvp2-email-resend|mvp2-ai-gemini|mvp2-sms-twilio|mvp2-signature-docusign|mvp3-enterprise-contract)\.spec\.ts/,
  // mvp2-ocr-gemini uses a browser `page` fixture for its live test (canvas
  // render); its two fail-closed unit tests would fit here but the file is
  // run as a whole via the main config to keep the live test in one place.
  reporter: "line",
  workers: 1,
});
