import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("shell-f0 SAQEEL design-system migration", () => {
  test("repository has no retired design-system identity, namespace, or fonts", () => {
    const repositoryRoot = path.resolve(root, "../..");
    const retiredIdentity = ["as", "tryx"].join("");
    const retiredClassPrefix = ["a", "x-"].join("");
    const retiredTokenPrefix = ["--a", "x-"].join("");
    const retiredInputFont = ["space", "grotesk"].join("[ +_-]");
    const retiredMonoFont = ["jet", "brains"].join("[ +_-]?");
    const forbidden = new RegExp(
      `${retiredIdentity}|${retiredTokenPrefix}|(?<![a-z])${retiredClassPrefix}|${retiredInputFont}|${retiredMonoFont}`,
      "i",
    );
    const files = execFileSync("git", ["ls-files"], { cwd: repositoryRoot, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    const hits = files.flatMap(file => {
      const target = path.join(repositoryRoot, file);
      if (!fs.existsSync(target)) return [];
      if (!fs.lstatSync(target).isFile()) return [];
      const source = fs.readFileSync(target);
      if (source.includes(0)) return [];
      return forbidden.test(source.toString("utf8")) ? [file] : [];
    });
    expect(hits).toEqual([]);
  });

  test("one SAQEEL runtime owns the shell and migrated component surfaces", () => {
    const layout = read("src/app/layout.tsx");
    const runtime = read("src/app/saqeel-runtime.css");
    expect(layout).toContain('import "./saqeel-runtime.css"');
    expect(layout).not.toContain("saqeel-components-legacy");
    expect(fs.existsSync(path.join(root, "src/app/saqeel-components-legacy.css"))).toBe(false);
    expect(runtime).toContain(".sq-shell__nav");
    expect(runtime).toContain(".cd-stage");
    expect(runtime).toContain(".rk-model-layout");
    expect(runtime).toContain(".sq-route-progress");
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
