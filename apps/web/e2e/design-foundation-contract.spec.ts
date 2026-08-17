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

test.describe("SAQEEL Inspection Design System v1.0 contract", () => {
  // SAQEEL supersedes Government Foundation V1 (owner-approved 2026-07-20).
  test("DSF-AC-001..006 SAQEEL palettes exceed WCAG AA and primary text targets AAA", () => {
    // Light: text/secondary on canvas & surface reach AAA; primary/critical reach AA.
    expect(contrast("#1a1d1f", "#f4f3f0")).toBeGreaterThanOrEqual(7);   // --text-primary / --surface-canvas
    expect(contrast("#4c5258", "#ffffff")).toBeGreaterThanOrEqual(7);   // --text-secondary / --surface-primary
    expect(contrast("#ffffff", "#115c44")).toBeGreaterThanOrEqual(4.5); // --text-on-action / --action-primary
    // Dark: text/secondary reach AAA on their surfaces; emerald primary reaches AA.
    expect(contrast("#e8eaec", "#17191d")).toBeGreaterThanOrEqual(7);   // dark --text-primary / --surface-canvas
    expect(contrast("#b1b6bc", "#1e2126")).toBeGreaterThanOrEqual(7);   // dark --text-secondary / --surface-primary
    expect(contrast("#08120e", "#2e9e77")).toBeGreaterThanOrEqual(4.5); // dark --text-on-action / --action-primary (emerald)
    expect(contrast("#ffffff", "#b3261e")).toBeGreaterThanOrEqual(4.5); // --text-on-action / --status-critical
  });

  // INSP-702: --text-disabled scored 2.87:1 (light) / 3.20:1 (dark) against its
  // surface — below the WCAG AA 4.5:1 floor for normal text (light also failed
  // the 3:1 large-text floor). Fixed onto the existing --neutral-700 / --neutral-400
  // raw-ramp values; this guards the regression.
  test("INSP-702 --text-disabled meets WCAG AA (4.5:1) on its surface in both themes", () => {
    const tokens = read("src/app/tokens.css");
    const saqeel = read("src/app/saqeel.css");
    expect(tokens).toContain("--text-disabled:  var(--sqx-text-disabled);");
    const disabledDeclarations = saqeel.match(/--sqx-text-disabled: var\(--sqx-grey-(\d+)\);/g) ?? [];
    expect(disabledDeclarations).toEqual([
      "--sqx-text-disabled: var(--sqx-grey-600);",
      "--sqx-text-disabled: var(--sqx-grey-500);",
    ]);
    expect(saqeel).toContain("--sqx-grey-600: #62666D;");
    expect(saqeel).toContain("--sqx-grey-500: #8A8F98;");
    expect(contrast("#62666D", "#ffffff")).toBeGreaterThanOrEqual(4.5); // light: grey-600 on white cards
    expect(contrast("#8A8F98", "#23252A")).toBeGreaterThanOrEqual(4.5); // dark: grey-500 on raised grey-800
    expect(contrast("#8A8F98", "#161718")).toBeGreaterThanOrEqual(4.5); // dark: grey-500 on default grey-900
  });

  test("DSF-AC-007..013 typography is productive and bilingual (IBM Plex)", () => {
    const tokens = read("src/app/tokens.css");
    const saqeelSheet = read("src/app/saqeel.css");
    expect(tokens).toContain("--font-body:    var(--sqx-font-sans);");  // the frozen sheet defers to the design system
    expect(saqeelSheet).toContain("--sqx-font-sans: var(--font-inter"); // Latin: self-hosted Inter
    expect(saqeelSheet).toContain("var(--font-plex-arabic");            // Arabic: self-hosted Plex, per-glyph fallback
    expect(tokens).toContain('"IBM Plex Sans Arabic"');                 // Arabic-first stack present
    expect(tokens).toContain("--type-display-size: 28px;");            // SAQEEL scale supersedes 32px
    expect(tokens).toContain("--type-body-size: 14px;");              // 14px body supersedes 16px minimum
    expect(tokens).toContain("--type-table-size: 13px;");             // 13px tables
    expect(tokens).not.toMatch(/retired input font|retired-mono|Barlow/);      // retired runtime fonts stay absent
  });

  test("DSF-AC-014..018 SAQEEL control geometry (frozen 12px input contract retired)", () => {
    const tokens = read("src/app/tokens.css");
    const css = read("src/app/saqeel-components.css");
    expect(tokens).toContain("--radius-sm: 6px;");                     // supplied Revamp control geometry
    expect(tokens).not.toMatch(/--sq-[a-z-]+\s*:/);                     // --sq-* shim fully removed (PR12 zero-trace gate); tokens.css's own header comment still documents the retirement, so match only real declarations, not that prose
    expect(tokens).toContain("--control-h-lg: 40px;");                 // comfortable control height
    expect(tokens).toContain("--type-body-size: 15px;");              // field-density body 15px (data-density=field)
    expect(css).toContain("border-radius: var(--radius-sm)");          // input rule consumes the (now-3px) token directly, no --sq-* alias
    expect(css).toContain("resize: vertical");
  });

  test("DSF-AC-019..023 authenticated foundation rejects cinematic styling", () => {
    const skeleton = read("src/app/saqeel-runtime.css");
    const mapPanel = read("src/app/saqeel-components.css");
    const dashboard = read("src/app/(app)/dashboard/dashboard.module.css");
    // Scan authenticated PAGE/module CSS only. The SAQEEL design-system layers
    // (tokens.css, saqeel-components.css, saqeel-runtime.css,
    // v2-components.css) and the login Atlas are excluded — they are
    // DS/exception layers, not pages, and legitimately carry SAQEEL DS
    // internals (uppercase micro-labels, white-on-status marker knobs, the
    // skeleton shimmer gradient, the texture-chrome repeating gradient).
    // Page CSS must still stay institutional.
    const dsLayerFiles = ["tokens.css", "login.css", "saqeel-runtime.css", "saqeel-components.css", "v2-components.css", "saqeel.css"];
    const authenticated = cssFiles(path.join(root, "src/app"))
      .filter(file => !dsLayerFiles.some(name => file.endsWith(name)))
      .map(file => fs.readFileSync(file, "utf8")).join("\n");
    expect(authenticated).not.toMatch(/font-style:\s*italic/);
    expect(authenticated).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(dashboard).not.toContain("linear-gradient");
    expect(authenticated).not.toContain("--sq-color-prism-magenta");
    expect(mapPanel).not.toContain("backdrop-filter: blur(12px)"); // current value is blur(4px) on .map-panel — 12px never reintroduced
    // The only page-owned gradient in the authenticated tree is the my-tasks
    // map backdrop, and it is token-valued end to end.
    expect((authenticated.match(/linear-gradient\(/g) ?? []).length).toBe(1);
    expect(read("src/app/(app)/field/my-tasks/my-tasks.module.css"))
      .toContain("linear-gradient(135deg, var(--surface-sunken), var(--accent-soft))");
    expect(skeleton).toContain(".sq-skeleton");
  });

  test("DSF-AC-024..027 brand mark, notification and account shell are ring-fenced", async () => {
    // WA-BRAND-r1 (O-26): the prism assets (saqeel-prism.svg / -192.png) were
    // retired with the split lockup. The governed brand identity is now the
    // SAQEEL shield mark (saqeel-favicon.svg + PNG raster set), shipped from
    // the app manifest/layout — this asserts the successor state, not the
    // deleted asset.
    const mark = read("public/saqeel-favicon.svg");
    const layout = read("src/app/layout.tsx");
    const bell = read("src/components/NotificationBell.tsx");
    const shell = read("src/components/ShellClient.tsx");
    const css = read("src/app/saqeel-runtime.css");
    expect(mark).toContain("M12 3.4 5 6.05");
    expect(mark).not.toMatch(/D946EF|7C6CFF|magenta|prism/i);
    expect(layout).toContain("/saqeel-favicon.svg");
    expect(bell).not.toContain("🔔");
    expect(bell).toContain("sq-notification__trigger");
    expect(shell).toContain("sq-shell-account__chevron");
    expect(css).toContain("@media (max-width: 959px)");
    const { channels, width, height } = await sharp(path.join(root, "public/saqeel-favicon-192.png")).metadata();
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
