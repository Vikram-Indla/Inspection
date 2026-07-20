import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /performance-navigation\.spec\.ts/,
  timeout: 20 * 60_000,
  expect: { timeout: 40_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: origin,
    channel: "chromium",
    trace: "off",
    screenshot: "off",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npm run start -- -H 127.0.0.1 -p ${port}`,
    url: `${origin}/login`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
