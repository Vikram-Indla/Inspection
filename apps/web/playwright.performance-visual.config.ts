import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /performance-visual-evidence\.spec\.ts/,
  timeout: 180_000,
  expect: { timeout: 40_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: origin,
    channel: "chromium",
    trace: "on",
    screenshot: "only-on-failure",
    storageState: process.env.PERF_AUTH_STATE,
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npm run start -- -H 127.0.0.1 -p ${port}`,
    url: `${origin}/login`,
    reuseExistingServer: process.env.PERF_REUSE_SERVER === "1",
    timeout: 60_000,
  },
});
