import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("admin risk studio safe-now contract", () => {
  test("keeps Studio and governed Models as distinct route-faithful surfaces", () => {
    const nav = read("src/components/sections/admin-risk-models/risk-section-nav.tsx");
    const studio = read("src/components/sections/admin-risk/risk-studio-screen.tsx");
    const screen = read("src/components/sections/admin-risk-models/risk-models-screen.tsx");

    expect(nav).toContain('href: "/admin/risk"');
    expect(nav).toContain('href: "/admin/risk/models"');
    expect(studio).toContain('current="/admin/risk"');
    expect(screen).toContain('current="/admin/risk/models"');
  });

  test("separates verified empty from read failure on both data routes", () => {
    const studio = read("src/components/sections/admin-risk/risk-studio-screen.tsx");
    const studioCopy = read("src/i18n/locales/en/admin-risk.json");
    const screen = read("src/components/sections/admin-risk-models/risk-models-screen.tsx");
    const copy = read("src/i18n/locales/en/admin-risk-models.json");

    expect(studioCopy).toContain("Couldn’t load risk settings.");
    expect(studio).toContain('data.state === "empty"');
    expect(studio).toContain('data.state === "error"');
    expect(copy).toContain("Couldn't load risk models. Nothing changed.");
    expect(screen).toContain("data.readFailed");
    expect(screen).toContain("data.rows.length === 0");
    expect(screen).toContain("RiskModelCard");
  });

  test("validates canonical weights and bands in the client before either submit", () => {
    const live = read("src/components/sections/admin-risk/risk-form.tsx");
    const liveCopy = read("src/i18n/locales/en/admin-risk.json");
    const governed = read("src/components/sections/admin-risk-models/risk-composer.tsx");

    expect(live).toContain("validateWeights");
    expect(live).toContain("validateBands");
    expect(live).toContain("confirmedLive");
    expect(liveCopy).toContain("takes effect right away");
    expect(governed).toContain("validateRiskModelPayload");
    expect(governed).toContain('type="hidden" name="payload"');
    expect(governed).not.toContain('defaultValue={\'{"factors"');
  });

  test("preserves maker-checker transitions and exposes immutable published state", () => {
    const board = read("src/components/sections/admin-risk-models/risk-model-card.tsx");
    const actions = read("src/app/(app)/admin/risk/models/actions.ts");
    const domain = read("src/lib/risk/model.ts");

    expect(board).toContain("isRiskModelTransitionAllowed");
    expect(board).toContain('model.status === "published"');
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
