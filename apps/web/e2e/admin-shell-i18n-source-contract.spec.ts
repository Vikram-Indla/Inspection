import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The standalone AdminShellClient.tsx was retired when the admin shell merged
// into the shared shell: the admin chrome is now Shell.tsx (server strings) +
// ShellClient.tsx (adminWorkspace routing, hub rail, ⌘K palette), and the
// admin destination frame is src/app/(app)/admin/_components/AdminShell.tsx.
const root = join(__dirname, "..");
const adminShell = readFileSync(join(root, "src/app/(app)/admin/_components/AdminShell.tsx"), "utf8");
const adminRegistry = readFileSync(join(root, "src/app/(app)/admin/_components/AdminScreenRegistry.tsx"), "utf8");
const sharedShell = readFileSync(join(root, "src/components/ShellClient.tsx"), "utf8");
const serverShell = readFileSync(join(root, "src/components/Shell.tsx"), "utf8");
const generatedKeys = readFileSync(join(root, "src/lib/i18n-keys.generated.ts"), "utf8");
const arabicSeed = readFileSync(join(root, "../../scripts/seed_arabic.py"), "utf8");

test.describe("Admin shell localization source contract", () => {
  test("keeps Arabic copy out of every activated Admin shell component", () => {
    // The admin-workspace wiring inside the shared shell (workspace detection,
    // hub grouping, palette copy table, palette open/close effects) must stay
    // literal-free end to end: adminPaletteCopy now reads strings.admin.*
    // resources, so the slice runs through the palette region with no carve-out.
    const adminRoutingBlock = sharedShell.slice(
      sharedShell.indexOf("const adminWorkspace"),
      sharedShell.indexOf("const adminPaletteResults"),
    );
    expect(adminRoutingBlock).toContain("const adminPaletteCopy");
    expect(adminRoutingBlock).toContain("strings.admin.paletteOpen");
    const serverAdminBlock = serverShell.slice(
      serverShell.indexOf("admin: {"),
      serverShell.indexOf("// WA-PWA-TAB-r1"),
    );

    expect(adminShell).not.toMatch(/[\u0600-\u06ff]/);
    expect(adminRegistry).not.toMatch(/[\u0600-\u06ff]/);
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
      "admin.shell.paletteOpen", "admin.shell.paletteGoTo", "admin.shell.paletteSearch",
      "admin.shell.paletteResultsOne", "admin.shell.paletteResultsOther", "admin.shell.paletteEmpty",
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
