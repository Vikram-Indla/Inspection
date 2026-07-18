import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /inspector-shell-visual\.spec\.ts/,
  reporter: "line",
  workers: 1,
  use: {
    channel: "chromium",
    ...devices["Desktop Chrome"],
  },
});
