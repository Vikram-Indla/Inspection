import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// TASK-DESIGN-FOUNDATION-SHELL-RESET-001
// SPONSOR-DSF-001..030 · DSF-AC-001..030
const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
function cssFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(target);
    return entry.isFile() && entry.name.endsWith(".css") ? [target] : [];
  });
}

function luminance(hex: string) {
  const channel = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test.describe("Government Foundation V1 contract", () => {
  test("DSF-AC-001..006 palettes exceed WCAG AA and primary text targets AAA", () => {
    expect(contrast("#1B242C", "#F5F7F8")).toBeGreaterThanOrEqual(7);
    expect(contrast("#49545E", "#FFFFFF")).toBeGreaterThanOrEqual(7);
    expect(contrast("#FFFFFF", "#176B52")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#F1F4F6", "#101317")).toBeGreaterThanOrEqual(7);
    expect(contrast("#ABB4BD", "#191D22")).toBeGreaterThanOrEqual(7);
    expect(contrast("#101317", "#78AEDA")).toBeGreaterThanOrEqual(7);
    expect(contrast("#FFFFFF", "#B42318")).toBeGreaterThanOrEqual(4.5);
  });

  test("DSF-AC-007..013 typography is productive and bilingual", () => {
    const tokens = read("src/app/tokens.css");
    expect(tokens).toContain('--ax-font-sans: var(--font-plex-arabic');
    expect(tokens).toContain("--ax-text-display: 500 32px/40px");
    expect(tokens).toContain("--ax-text-body:    400 16px/24px");
    expect(tokens).toContain("--ax-text-field:   400 17px/26px");
    expect(tokens).toContain("--ax-text-micro:   500 12px/16px var(--ax-font-sans)");
  });

  test("DSF-AC-014..018 frozen text-box geometry and behavior tokens remain intact", () => {
    const tokens = read("src/app/tokens.css");
    const css = read("src/app/astryx.css");
    expect(tokens).toContain("--ax-radius-input: 12px");
    expect(tokens).toContain("--ax-control-height: 44px");
    expect(tokens).toContain("--ax-control-height-field: 52px");
    expect(tokens).toContain("--ax-text-input:   400 16px/24px var(--ax-font-input)");
    expect(css).toContain("padding-block: var(--ax-space-100); padding-inline: var(--ax-space-150)");
    expect(css).toContain("border-radius: var(--ax-radius-input)");
    expect(css).toContain("resize: vertical");
  });

  test("DSF-AC-019..023 authenticated foundation rejects cinematic styling", () => {
    const css = read("src/app/astryx.css");
    const dashboard = read("src/app/(app)/dashboard/dashboard.module.css");
    const authenticated = cssFiles(path.join(root, "src/app"))
      .filter(file => !file.endsWith("tokens.css") && !file.endsWith("login.css"))
      .map(file => fs.readFileSync(file, "utf8")).join("\n");
    expect(authenticated).not.toMatch(/font-style:\s*italic/);
    expect(authenticated).not.toMatch(/text-transform:\s*uppercase/);
    expect(authenticated).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(dashboard).not.toContain("linear-gradient");
    expect(authenticated).not.toContain("--ax-color-prism-magenta");
    expect(css).not.toContain("backdrop-filter: blur(12px)");
    expect((authenticated.match(/linear-gradient\(/g) ?? []).length).toBe(1);
    expect(css).toContain(".ax-skeleton");
  });

  test("DSF-AC-024..027 prism, notification and account shell are ring-fenced", async () => {
    const prism = read("public/saqeel-prism.svg");
    const bell = read("src/components/NotificationBell.tsx");
    const shell = read("src/components/ShellClient.tsx");
    const css = read("src/app/astryx.css");
    expect(prism).not.toContain("<rect");
    expect(bell).not.toContain("🔔");
    expect(bell).toContain("ax-notification__trigger");
    expect(shell).toContain("ax-shell-account__chevron");
    expect(css).toContain("@media (max-width: 959px)");
    const { channels, width, height } = await sharp(path.join(root, "public/saqeel-prism-192.png")).metadata();
    expect(channels).toBe(4);
    expect([width, height]).toEqual([192, 192]);
  });

  test("DSF-AC-028..030 future modules inherit the foundation and Atlas remains local", () => {
    const decisions = read("../../design/claude-design-mvp1/authority/DESIGN_DECISIONS.md");
    const authority = read("../../design/claude-design-mvp1/authority/GOVERNMENT_FOUNDATION_SHELL_RESET_V1.md");
    const login = read("src/app/login/login.css");
    expect(decisions).toContain("New MVP2/MVP3 UI must consume the shared semantic tokens");
    expect(authority).toContain("Cinematic Atlas v0.8 is the only expressive visual exception");
    expect(login).toContain("lg-atlas");
  });
});
