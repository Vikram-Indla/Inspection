import { defineConfig } from "@playwright/test";

// Source-contract tests have no browser or authenticated-backend dependency.
// Keeping them separate lets the policy guard run even when a clean worktree
// intentionally has no local Supabase credential file.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /(admin-access-route-aware|admin-platform-design-contract|cd-004-admin-control-plane-home|compliance-approval-queue|compliance-library|compliance-request-engine|compliance-shared-shell|demo-admin-account-contract|design-foundation-contract|platform-design-system-contract|inspector-shell-uplift|ui-compliance-contract|ipad-gps-policy|mvp2-m2-05-contract|mvp2-m2-02-events|mvp2-m2-04-risk-model|mvp2-m2-08-portal|mvp2-m2-09-exceptions|mvp2-m2-10-cases|mvp2-m2-11-ai|mvp2-m2-12-signature|mvp2-m2-06-spatial|mvp2-shared-0193|mvp2-email-resend|mvp2-ai-gemini|mvp2-sms-twilio|mvp2-signature-docusign|mvp3-enterprise-contract|ai-delta-contract|ocr-journey-contract|senaei-integration-contract|industry-shared-integration-contract|factory360-admin-control-plane|factory360-cr-dossier-contract|factory360-cross-provider-contract|factory360-ipad-field|field-search-routing|field-notifications-contract|field-settings-contract|field-offline-isolation|field-establishment-incidents|ipad-pwa-shell-contract|terminology-regression|execution-canonical-contract|execution-admin-contract|execution-access-contract|execution-preparation-contract|performance-pass4-contract|execution-preexecution-ui-contract|execution-journey-contract|execution-journey-ui-contract|execution-workspace-contract|execution-submission-contract|execution-crossmodule-contract|field-notification-attention-center)\.spec\.ts/,
  // mvp2-ocr-gemini uses a browser `page` fixture for its live test (canvas
  // render); its two fail-closed unit tests would fit here but the file is
  // run as a whole via the main config to keep the live test in one place.
  reporter: "line",
  workers: 1,
});
