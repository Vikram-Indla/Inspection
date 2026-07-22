import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-DESIGN-PLATFORM-FOUNDATION-PROMOTION-003
// Permanent platform guard: new roles and MVP modules inherit the governed
// foundation by construction, while approved non-shell surfaces stay explicit.
const root = path.resolve(__dirname, "..");
const appRoot = path.join(root, "src/app");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function files(dir: string, suffix: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(target, suffix);
    return entry.isFile() && entry.name.endsWith(suffix) ? [target] : [];
  });
}

test.describe("Platform-wide government design-system contract", () => {
  test("PDS-AC-001..005 root layout governs typography, surfaces, theme and direction", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain('import "./tokens.css"');
    expect(layout).toContain('import "./astryx.css"');
    expect(layout).toContain('localFont({');
    expect(layout).toContain("ibm-plex-sans-arabic");
    expect(layout).toContain('dir={locale === "ar" ? "rtl" : "ltr"}');
    expect(layout).toContain("<ThemeScript />");
  });

  test("PDS-AC-006..011 every working page uses Shell; redirects, auth and print stay explicit", () => {
    const approvedExceptions: Record<string, RegExp> = {
      "src/app/page.tsx": /redirect\("\/login"\)/,
      "src/app/launch/page.tsx": /redirect\(home\)/,
      "src/app/login/page.tsx": /login\.css/,
      "src/app/reset/page.tsx": /login\/login\.css/,
      "src/app/reports/inspection/[id]/page.tsx": /report\.css/,
      "src/app/reference/web-admin/f0/page.tsx": /SAQEEL_F0_REFERENCE_RENDERER/,
      "src/app/(app)/reviews/[id]/started/page.tsx": /redirect\(`\/reviews\//,
      "src/app/(app)/admin/regulations/[id]/page.tsx": /import Regulations from "\.\.\/page"/,
    };
    const pages = files(appRoot, "page.tsx");
    expect(pages.length).toBeGreaterThanOrEqual(55);
    for (const page of pages) {
      const relative = path.relative(root, page);
      const source = fs.readFileSync(page, "utf8");
      if (/\bShell\b/.test(source)) continue;
      expect(approvedExceptions[relative], `${relative} must use Shell or be a governed exception`).toBeDefined();
      expect(source).toMatch(approvedExceptions[relative]);
    }
    expect(Object.keys(approvedExceptions)).toHaveLength(8);
  });

  test("PDS-AC-012..016 semantic palette is centralized, including non-CSS map renderers", () => {
    const tsx = files(path.join(root, "src"), ".tsx");
    const rawColour = /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{3})(?![0-9A-Fa-f])/;
    const rawColourFiles = tsx.filter(file => rawColour.test(fs.readFileSync(file, "utf8")))
      .map(file => path.relative(root, file));
    expect(rawColourFiles).toEqual(["src/app/layout.tsx"]);
    const palette = read("src/lib/map-palette.ts");
    expect(palette).toContain("Government Foundation V1");
    expect(read("src/components/GeoMap.tsx")).toContain('from "@/lib/map-palette"');
    expect(read("src/app/(app)/operations/live/LiveMapInner.tsx")).toContain('from "@/lib/map-palette"');
    expect(read("src/app/(app)/operations/live/LiveMapInner.tsx")).not.toContain("#6941c6");
  });

  test("PDS-AC-017..021 inputs and Atlas retain their approved boundaries", () => {
    const tokens = read("src/app/tokens.css");
    const css = read("src/app/astryx.css");
    const login = read("src/app/login/login.css");
    expect(tokens).toContain("--ax-radius-input:    var(--radius-sm)"); // SAQEEL: inputs 3px (frozen 12px retired)
    expect(tokens).toContain("--ax-text-input:        400 14px/1.5 var(--font-body)"); // SAQEEL body input, IBM Plex Sans
    expect(css).toContain("border-radius: var(--ax-radius-input)");
    expect(login).toContain("lg-atlas");
    expect(css).not.toContain("--ax-color-prism-magenta");
  });

  test("PDS-AC-022..025 authenticated CSS remains institutional and token-driven", () => {
    // Page/module CSS only — the SAQEEL DS component sheet is a design-system
    // layer (peer to tokens.css), not a page, and is excluded like login.css.
    const authenticated = files(appRoot, ".css")
      .filter(file => !file.endsWith("tokens.css") && !file.endsWith("login.css") && !file.endsWith("saqeel-components.css"))
      .map(file => fs.readFileSync(file, "utf8")).join("\n");
    expect(authenticated).not.toMatch(/font-style:\s*italic/);
    expect(authenticated).not.toMatch(/text-transform:\s*uppercase/);
    expect(authenticated).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(authenticated).not.toContain("--ax-color-prism-magenta");
  });
});
