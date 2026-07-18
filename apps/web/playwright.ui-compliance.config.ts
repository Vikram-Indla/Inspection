import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.UI_COMPLIANCE_PORT ?? 3137);
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /ui-compliance-runtime\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: origin,
    channel: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npm run start -- -H 127.0.0.1 -p ${port}`,
    url: `${origin}/login`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
