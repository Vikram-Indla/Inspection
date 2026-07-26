/**
 * TEMPORARY BS-1 diagnostic. Not a measurement and never writes a score.
 * It records, per card, the exact first failure that would null it, so the
 * null diagnosis table is observed rather than guessed.
 */
import { test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "../login-helper";
import { loadPixelCredentials } from "./credentials";
import { captureGeometry } from "./geometry";
import { DESIGNS_ROOT, loadManifest } from "./manifest";
import { startPrototypeServer } from "./prototype-server";

const WEB_ROOT = resolve(__dirname, "../..");
const OUT = process.env.PIXEL_DIAGNOSE_OUT ?? "/tmp/bs1-diagnose.json";
const NAV = 90_000;

test.setTimeout(60 * 60_000);

interface Probe {
  cardId: string;
  manifestIssues: string[];
  designPages: string[];
  targets: { label: string; kind: string; ok: boolean; path?: string; ms?: number; error?: string; anchors?: number; sample?: string[] }[];
  shipped: { path: string; locale: string; ok: boolean; error?: string; applicable?: number; ms?: number }[];
  design: { page: string; locale: string; ok: boolean; error?: string; applicable?: number }[];
}

async function signIn(page: Page): Promise<void> {
  const credentials = loadPixelCredentials(WEB_ROOT);
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: NAV });
  await waitForCredentialsForm(page);
  await identifierField(page).fill(credentials.email);
  await passwordField(page).fill(credentials.password);
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname.startsWith("/field"), { timeout: NAV, waitUntil: "commit" });
}

test("BS-1 diagnostic sweep", async ({ browser }) => {
  const manifest = loadManifest();
  const started = Date.now();
  const authContext = await browser.newContext();
  const authPage = await authContext.newPage();
  await signIn(authPage);
  const storageState = await authContext.storageState();
  await authContext.close();
  console.log(`AUTH ok in ${Date.now() - started}ms`);

  const server = await startPrototypeServer(DESIGNS_ROOT);
  const probes: Probe[] = [];
  const context: BrowserContext = await browser.newContext({
    storageState,
    viewport: { width: 834, height: 1024 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(NAV);
  page.setDefaultTimeout(30_000);

  try {
    for (const card of manifest) {
      const probe: Probe = {
        cardId: card.cardId,
        manifestIssues: card.manifestIssues,
        designPages: card.designPages,
        targets: [],
        shipped: [],
        design: [],
      };
      const resolved: string[] = [];
      for (const target of card.routeTargets) {
        const t0 = Date.now();
        try {
          if (target.kind === "static") {
            probe.targets.push({ label: target.label, kind: "static", ok: true, path: target.path });
            resolved.push(target.path);
            continue;
          }
          await page.goto(target.seedPath, { waitUntil: "domcontentloaded", timeout: NAV });
          // The manifest's `via` hops are part of the route contract: some surfaces
          // are only ever linked from inside another record, so the walk is the real
          // user path. resolveTarget() in pixel-diff.spec.ts has always honoured it.
          // This probe did not, so it matched the final pattern against the SEED page
          // and reported "no href matched" for routes that are perfectly reachable.
          let anchors: string[] = [];
          const findHref = async (hrefPattern: string, excludePattern?: string) => {
            const pattern = new RegExp(hrefPattern);
            const exclude = excludePattern ? new RegExp(excludePattern) : undefined;
            const deadline = Date.now() + 30_000;
            while (Date.now() < deadline) {
              anchors = await page.locator("a[href]").evaluateAll(list =>
                list.map(a => a.getAttribute("href")).filter((h): h is string => Boolean(h)));
              const origin = new URL(page.url()).origin;
              const hit = anchors.find(h => {
                let pathname: string;
                try { pathname = new URL(h, origin).pathname; } catch { return false; }
                if (exclude?.test(pathname)) return false;
                return pattern.test(pathname);
              });
              if (hit) return new URL(hit, page.url()).pathname;
              await page.waitForTimeout(1000);
            }
            throw new Error(`no href matched ${hrefPattern} (${anchors.length} anchors)`);
          };
          for (const hop of target.via ?? []) {
            const hopPath = await findHref(hop.hrefPattern, hop.excludePattern);
            await page.goto(hopPath, { waitUntil: "domcontentloaded", timeout: NAV });
          }
          const found = await findHref(target.hrefPattern, target.excludePattern);
          const path = target.suffix ? `${found}${target.suffix}` : found;
          probe.targets.push({ label: target.label, kind: "discover", ok: true, path, ms: Date.now() - t0, anchors: anchors.length });
          resolved.push(path);
        } catch (error) {
          const anchors = await page.locator("a[href]").evaluateAll(list =>
            list.map(a => a.getAttribute("href")).filter((h): h is string => Boolean(h))).catch(() => [] as string[]);
          probe.targets.push({
            label: target.label,
            kind: target.kind,
            ok: false,
            ms: Date.now() - t0,
            error: error instanceof Error ? error.message.split("\n")[0] : String(error),
            anchors: anchors.length,
            sample: [...new Set(anchors)].slice(0, 25),
          });
        }
      }

      for (const routePath of [...new Set(resolved)]) {
        for (const locale of ["en", "ar"]) {
          const t0 = Date.now();
          const errors: string[] = [];
          const onError = (e: Error) => errors.push(e.message);
          page.on("pageerror", onError);
          try {
            await page.goto(routePath, { waitUntil: "domcontentloaded", timeout: NAV });
            const origin = new URL(page.url()).origin;
            await context.addCookies([
              { name: "locale", value: locale, url: origin },
              { name: "login_locale", value: locale, url: origin },
            ]);
            await page.reload({ waitUntil: "domcontentloaded", timeout: NAV });
            await page.waitForTimeout(800);
            const lang = await page.locator("html").getAttribute("lang");
            const dir = await page.locator("html").getAttribute("dir");
            const finalPath = new URL(page.url()).pathname;
            const geo = await captureGeometry(page, locale);
            const applicable = geo.metrics.filter(m => m.applicable).length;
            const problems: string[] = [];
            if (lang !== locale) problems.push(`html lang=${lang}`);
            if (dir !== (locale === "ar" ? "rtl" : "ltr")) problems.push(`html dir=${dir}`);
            if (finalPath !== routePath) problems.push(`redirected to ${finalPath}`);
            if (errors.length) problems.push(`pageerror: ${errors[0].slice(0, 120)}`);
            if (applicable < 4) problems.push(`only ${applicable} applicable metrics`);
            probe.shipped.push({
              path: routePath, locale, ok: problems.length === 0,
              error: problems.join("; ") || undefined, applicable, ms: Date.now() - t0,
            });
          } catch (error) {
            probe.shipped.push({
              path: routePath, locale, ok: false, ms: Date.now() - t0,
              error: error instanceof Error ? error.message.split("\n")[0] : String(error),
            });
          } finally {
            page.off("pageerror", onError);
          }
        }
      }

      for (const designPage of card.designPages) {
        for (const locale of ["en", "ar"]) {
          const direction = locale === "ar" ? "rtl" : "ltr";
          try {
            await page.goto(`${server.origin}/${encodeURIComponent(designPage)}?lang=${locale}`, {
              waitUntil: "domcontentloaded", timeout: NAV,
            });
            await page.waitForSelector("#dc-root > .sc-host", { timeout: 15_000 });
            const root = page.locator("#dc-root > .sc-host [dir]").first();
            let rendered = await root.getAttribute("dir");
            if (rendered !== direction) {
              const control = page.getByRole("button").filter({ hasText: /^(?:AR|EN|العربية|English)$/i }).first();
              const count = await control.count();
              if (!count) throw new Error(`no locale control for ${locale}`);
              await control.click();
              await page.waitForTimeout(600);
              rendered = await root.getAttribute("dir");
            }
            if (rendered !== direction) throw new Error(`prototype stayed dir=${rendered}`);
            const geo = await captureGeometry(page, locale);
            const applicable = geo.metrics.filter(m => m.applicable).length;
            const problems: string[] = [];
            if (geo.runtimeErrorCount) problems.push(`${geo.runtimeErrorCount} sc-logic-error`);
            if (geo.unresolvedTemplateCount) problems.push(`${geo.unresolvedTemplateCount} unresolved`);
            if (applicable < 4) problems.push(`only ${applicable} applicable metrics`);
            probe.design.push({ page: designPage, locale, ok: problems.length === 0, error: problems.join("; ") || undefined, applicable });
          } catch (error) {
            probe.design.push({
              page: designPage, locale, ok: false,
              error: error instanceof Error ? error.message.split("\n")[0] : String(error),
            });
          }
        }
      }

      probes.push(probe);
      const bad = [
        ...probe.targets.filter(t => !t.ok).map(t => `route/${t.label}: ${t.error}`),
        ...probe.shipped.filter(s => !s.ok).map(s => `shipped/${s.locale} ${s.path}: ${s.error}`),
        ...probe.design.filter(d => !d.ok).map(d => `design/${d.locale}: ${d.error}`),
      ];
      console.log(`CARD ${probe.cardId} :: ${probe.manifestIssues.join("; ") || (bad.length ? bad.join(" | ") : "ALL PROBES OK")}`);
      writeFileSync(OUT, `${JSON.stringify(probes, null, 2)}\n`, "utf8");
    }
  } finally {
    await context.close();
    await server.close();
    writeFileSync(OUT, `${JSON.stringify(probes, null, 2)}\n`, "utf8");
  }
});
