import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { buildShellNavigation } from "../src/lib/shell-navigation";

// Component-level visual evidence for TASK-DESIGN-INSPECTOR-SHELL-UPLIFT-002.
// This deliberately avoids the shared backend: it proves responsive geometry,
// theme, RTL and focus for the changed chrome, not authenticated data behavior.
const root = path.resolve(__dirname, "..");
const tokens = fs.readFileSync(path.join(root, "src/app/tokens.css"), "utf8");
const css = fs.readFileSync(path.join(root, "src/app/astryx.css"), "utf8");
const prismData = `data:image/svg+xml;base64,${fs.readFileSync(path.join(root, "public/saqeel-prism.svg")).toString("base64")}`;
const evidenceRoot = "/Users/vikramindla/.codex/visualizations/2026/07/18/019f7494-823c-7091-bf3a-101272b4848c/inspector-shell-uplift";

const navIcons: Record<string, string> = {
  inspect: "M9 11l2 2 4-4M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z",
  virtual: "M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 10l5-3v10l-5-3",
  dashboard: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  radar: "M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l6-6",
  factory: "M3 21V9l6 3V9l6 3V5h6v16z",
};

const localeCopy = {
  en: {
    dir: "ltr", brand: "صقيل", sub: "صناعي", search: "Search navigation",
    account: "Noura Al-Salem", role: "Senior inspector · Riyadh", title: "My assignments",
    context: "Assigned to you", group: "Field work", dashboard: "Assignments",
    visits: "Visits", virtual: "Virtual", next: "Start next visit",
    stats: [["Next visit", "08:30"], ["Travel", "18 min"], ["Offline pack", "Ready"]],
    rows: [["Al Noor Factory", "Fire and life safety · Industrial Zone 2", "Due 08:30"], ["Riyadh Food Store", "Routine food-safety follow-up", "Ready"], ["Oasis Warehouse", "Evidence review and closure check", "Downloaded"]],
  },
  ar: {
    dir: "rtl", brand: "صقيل", sub: "صناعي", search: "البحث في التنقل",
    account: "نورة السالم", role: "مفتشة أولى · الرياض", title: "مهامي",
    context: "مسندة إليك", group: "العمل الميداني", dashboard: "المهام",
    visits: "الزيارات", virtual: "افتراضي", next: "بدء الزيارة التالية",
    stats: [["الزيارة التالية", "08:30"], ["مدة الطريق", "18 دقيقة"], ["حزمة دون اتصال", "جاهزة"]],
    rows: [["مصنع النور", "السلامة من الحريق · المنطقة الصناعية 2", "08:30"], ["متجر أغذية الرياض", "متابعة دورية لسلامة الغذاء", "جاهزة"], ["مستودع الواحة", "مراجعة الأدلة والتحقق من الإغلاق", "تم التنزيل"]],
  },
} as const;

function shellMarkup(locale: "en" | "ar") {
  const c = localeCopy[locale];
  const nav = buildShellNavigation(["inspector"]);
  const navMarkup = nav.map(group => `
    <section class="ax-nav-group">
      <button class="ax-nav-group__trigger" aria-expanded="true"><span class="ax-nav-label">${group.id === "inspection" ? c.group : locale === "ar" ? group.labelAr : group.labelEn}</span></button>
      ${group.items.map((item, index) => `<a class="ax-nav-item" ${group.id === "inspection" && index === 0 ? 'aria-current="page"' : ""} href="#"><span class="ax-nav-icon"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${navIcons[item.icon] ?? navIcons.dashboard}" /></svg></span><span class="ax-nav-label">${locale === "ar" ? item.labelAr : item.labelEn}</span></a>`).join("")}
    </section>`).join("");
  const tabs = `<nav aria-label="${c.dashboard}" class="ax-field-taskbar">
    <a href="#" class="ax-field-taskbar__item" aria-current="page"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" /></svg>${c.dashboard}</a>
    <a href="#visits" class="ax-field-taskbar__item"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>${c.visits}</a>
    <a href="#" class="ax-field-taskbar__item"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 10l5-3v10l-5-3" /></svg>${c.virtual}</a>
    <a href="#next" aria-label="${c.next}" class="ax-field-taskbar__primary"><span>${c.next}</span><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
  </nav>`;
  const stats = c.stats.map(([label, value]) => `<div class="ax-kpi"><span class="ax-caption">${label}</span><strong>${value}</strong></div>`).join("");
  const rows = c.rows.map(([title, detail, state]) => `<a href="#" class="ax-surface ax-panel" style="padding:var(--ax-space-200);text-decoration:none;color:inherit"><div class="ax-row" style="justify-content:space-between"><strong>${title}</strong><span class="ax-lozenge ax-lozenge--ops">${state}</span></div><span class="ax-caption">${detail}</span></a>`).join("");
  return `
    <div class="ax-shell">
      <nav class="ax-shell__nav" aria-label="${locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}">
        <div class="ax-shell__brand"><img class="ax-shell__brand-mark" src="${prismData}" alt=""><span class="ax-shell__brand-lockup"><strong class="ax-shell__brand-wordmark">${c.brand}</strong><span class="ax-shell__brand-sub">${c.sub}</span></span></div>
        <div class="ax-shell__groups">${navMarkup}</div>
        <button class="ax-shell__collapse"><span class="ax-nav-label">${locale === "ar" ? "طي القائمة" : "Collapse navigation"}</span></button>
      </nav>
      <main class="ax-shell__main">
        <header class="ax-pagehead">
          <div class="ax-pagehead__topbar"><div class="ax-shell-search"><input aria-label="${c.search}" placeholder="${c.search}"></div><div class="ax-pagehead__actions"><button class="ax-topbar-icon" aria-label="${locale === "ar" ? "الإشعارات" : "Notifications"}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" /></svg></button><button class="ax-shell-account__trigger"><span class="ax-shell-account__avatar">NA</span><span class="ax-shell-account__identity"><strong>${c.account}</strong><small>${c.role}</small></span></button></div></div>
          <div class="ax-pagehead__row"><div class="ax-pagehead__context"><h2>${c.title}</h2><span class="ax-lozenge ax-lozenge--info">${c.context}</span></div></div>
        </header>
        <div class="ax-content ax-field-page"><div class="ax-kpi-row">${stats}</div><section id="visits" style="display:grid;gap:var(--ax-space-200)">${rows}</section><details class="ax-field-performance"><summary>${locale === "ar" ? "نظرة عامة على الأداء" : "Performance overview"}</summary></details></div>
        ${tabs}
      </main>
    </div>`;
}

async function mount(page: import("@playwright/test").Page, locale: "en" | "ar", theme: "light" | "dark") {
  const c = localeCopy[locale];
  await page.setContent(`<html lang="${locale}" dir="${c.dir}" data-theme="${theme}"><head><style>${tokens}\n${css}\nbody{margin:0;background:var(--ax-color-canvas);color:var(--ax-color-text);font:var(--ax-text-body)}.ax-field-taskbar svg,.ax-nav-icon svg,.ax-topbar-icon svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}</style></head><body>${shellMarkup(locale)}</body></html>`);
}

test("changed inspector chrome reflows, retains 52px targets and exposes focus", async ({ page }) => {
  fs.mkdirSync(evidenceRoot, { recursive: true });
  for (const frame of [
    { locale: "en" as const, theme: "light" as const, width: 1366, height: 1024, file: "inspector-a-en-light-landscape.png" },
    { locale: "en" as const, theme: "dark" as const, width: 1024, height: 1366, file: "inspector-a-en-dark-portrait.png" },
    { locale: "ar" as const, theme: "dark" as const, width: 1024, height: 1366, file: "inspector-a-ar-rtl-dark-portrait.png" },
    { locale: "ar" as const, theme: "light" as const, width: 390, height: 844, file: "inspector-a-ar-rtl-light-narrow.png" },
  ]) {
    await page.setViewportSize({ width: frame.width, height: frame.height });
    await mount(page, frame.locale, frame.theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const targets = await page.locator(".ax-field-taskbar a").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
    expect(Math.min(...targets)).toBeGreaterThanOrEqual(52);
    await page.screenshot({ path: path.join(evidenceRoot, frame.file), fullPage: true });
    await page.locator(".ax-field-taskbar__primary").focus();
    expect(await page.locator(".ax-field-taskbar__primary").evaluate(node => getComputedStyle(node).boxShadow)).not.toBe("none");
  }
});
