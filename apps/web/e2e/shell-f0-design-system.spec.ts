import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(css|tsx?|jsx?)$/.test(entry.name) ? [target] : [];
  });
}

test.describe("shell-f0 SAQEEL design-system migration", () => {
  test("runtime source has no retired namespace or font family", () => {
    const hits = sourceFiles(path.join(root, "src")).flatMap(file => {
      const source = fs.readFileSync(file, "utf8");
      return /astryx|(?<!m)ax-|Space Grotesk|JetBrains|Barlow/i.test(source)
        ? [path.relative(root, file)]
        : [];
    });
    expect(hits).toEqual([]);
  });

  test("typography and visual values resolve through canonical SAQEEL tokens", () => {
    const tokens = read("src/app/tokens.css");
    expect(tokens).toContain("--type-page-title-size: 22px");
    expect(tokens).toContain("--type-body-size: 14px");
    expect(tokens).toContain("--type-compact-size: 13px");
    expect(tokens).toContain("--radius-sm: 6px");
    expect(tokens).not.toMatch(/--sq-[a-z0-9-]+\s*:/);
    expect(tokens).not.toContain("@import url(");
  });

  test("shared panels retain the supplied Revamp surface treatment", () => {
    const components = read("src/app/saqeel-components.css");
    const violations = read("src/app/(app)/admin/violations/page.tsx");
    expect(components).toMatch(
      /\.panel\s*\{[^}]*background:\s*var\(--surface-primary\)[^}]*border:[^}]*var\(--border-subtle\)[^}]*border-radius:\s*var\(--radius-md\)/s,
    );
    expect(violations).toContain('className="panel"');
    expect(violations).toContain('className="panel stack"');
  });
});
