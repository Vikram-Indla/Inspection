import { defineConfig, devices } from "@playwright/test";

// G10-VERIFICATION-PLAYWRIGHT — headless suite over the local production build.
// Exit criterion for gate G10 (product-contract/execution/CURRENT_SLICE.yaml):
// golden journey B10, offline drill, persona tours, negative paths.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // journey specs mutate shared live data; keep ordering deterministic
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "e2e",
      testMatch: /.*\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
