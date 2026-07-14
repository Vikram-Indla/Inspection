import { defineConfig, devices } from "@playwright/test";

const playwrightPort = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const playwrightOrigin = `http://127.0.0.1:${playwrightPort}`;

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
    baseURL: playwrightOrigin,
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
    command: `npm run start -- -H 127.0.0.1 -p ${playwrightPort}`,
    url: `${playwrightOrigin}/login`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER !== "0",
    timeout: 60_000,
  },
});
