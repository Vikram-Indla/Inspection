import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("admin risk studio safe-now contract", () => {
  test("keeps Studio and governed Models as distinct route-faithful surfaces", () => {
    const nav = read("src/app/(app)/admin/risk/RiskSectionNav.tsx");
    const studio = read("src/app/(app)/admin/risk/page.tsx");
    const models = read("src/app/(app)/admin/risk/models/page.tsx");

    expect(nav).toContain('href: "/admin/risk"');
    expect(nav).toContain('href: "/admin/risk/models"');
    expect(studio).toContain('current="/admin/risk"');
    expect(models).toContain('current="/admin/risk/models"');
  });

  test("separates verified empty from read failure on both data routes", () => {
    const studio = read("src/app/(app)/admin/risk/page.tsx");
    const models = read("src/app/(app)/admin/risk/models/page.tsx");

    expect(studio).toContain("Couldn’t load risk configuration.");
    expect(studio).toContain("!error && !data");
    expect(models).toContain("Couldn’t load risk models. Nothing changed.");
    expect(models).toContain("!error && (rows ?? []).length === 0");
    expect(models).toContain("!error && <RiskModelsBoard");
  });

  test("validates canonical weights and bands in the client before either submit", () => {
    const live = read("src/app/(app)/admin/risk/RiskForm.tsx");
    const governed = read("src/app/(app)/admin/risk/models/RiskModels.tsx");

    expect(live).toContain("validateWeights");
    expect(live).toContain("validateBands");
    expect(live).toContain("confirmedLive");
    expect(live).toContain("effective immediately");
    expect(governed).toContain("validateRiskModelPayload");
    expect(governed).toContain('type="hidden" name="payload"');
    expect(governed).not.toContain('defaultValue={\'{"factors"');
  });

  test("preserves maker-checker transitions and exposes immutable published state", () => {
    const board = read("src/app/(app)/admin/risk/models/RiskModels.tsx");
    const actions = read("src/app/(app)/admin/risk/models/actions.ts");
    const domain = read("src/lib/risk/model.ts");

    expect(board).toContain("isRiskModelTransitionAllowed");
    expect(board).toContain('m.status === "published"');
    expect(actions).toContain('sb.rpc("risk_model_transition"');
    expect(domain).toContain('draft: ["review"]');
    expect(domain).toContain('approved: ["published", "draft"]');
    expect(domain).toContain('published: ["retired"]');
  });

  test("uses logical responsive styling for RTL/LTR and theme token parity", () => {
    const css = read("src/app/saqeel-runtime.css");

    expect(css).toContain(".rk-section-nav");
    expect(css).toContain('[dir="rtl"] .rk-section-nav__item.is-active');
    expect(css).toContain("inset-block-start");
    expect(css).toContain("@media (max-width: 600px)");
    expect(css).toContain("var(--surface-primary)");
    expect(css).not.toContain("#fff");
  });
});
