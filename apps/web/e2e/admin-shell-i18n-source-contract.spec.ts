import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");
const adminShell = readFileSync(join(root, "src/components/admin/AdminShellClient.tsx"), "utf8");
const sharedShell = readFileSync(join(root, "src/components/ShellClient.tsx"), "utf8");
const serverShell = readFileSync(join(root, "src/components/Shell.tsx"), "utf8");
const generatedKeys = readFileSync(join(root, "src/lib/i18n-keys.generated.ts"), "utf8");
const arabicSeed = readFileSync(join(root, "../../scripts/seed_arabic.py"), "utf8");

test.describe("Admin shell localization source contract", () => {
  test("keeps Arabic copy out of every activated Admin shell component", () => {
    const adminRoutingBlock = sharedShell.slice(
      sharedShell.indexOf("if (adminWorkspace)"),
      sharedShell.indexOf("function handleShellNavigation"),
    );
    const serverAdminBlock = serverShell.slice(
      serverShell.indexOf("admin: {"),
      serverShell.indexOf("// WA-PWA-TAB-r1"),
    );

    expect(adminShell).not.toMatch(/[\u0600-\u06ff]/);
    expect(adminRoutingBlock).not.toMatch(/[\u0600-\u06ff]/);
    expect(serverAdminBlock).not.toMatch(/[\u0600-\u06ff]/);
  });

  test("registers every Admin shell label in both approved resources", () => {
    const keys = [
      "admin.shell.languageSwitch", "admin.shell.navigation", "admin.shell.controlPanel",
      "admin.shell.authorized", "admin.shell.loadingDestination", "admin.shell.brandLabel",
      "admin.shell.brandArabic", "admin.shell.brandEnglish", "admin.shell.findTool",
      "admin.shell.viewAll", "admin.shell.administration", "admin.shell.allTools",
      "admin.shell.close", "admin.shell.paletteTitle", "admin.shell.noMatch",
      "admin.shell.hub.control", "admin.shell.hub.people", "admin.shell.hub.rules",
      "admin.shell.hub.planning", "admin.shell.hub.risk", "admin.shell.hub.connections",
      "admin.shell.hub.governance",
    ];

    for (const key of keys) {
      expect(generatedKeys).toContain(`key: "${key}"`);
      expect(arabicSeed).toContain(`"${key}":`);
    }
  });
});
