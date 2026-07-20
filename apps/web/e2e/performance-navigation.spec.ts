import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PERSONAS, type PersonaKey } from "./personas";
import { submitCredentials, waitForCredentialsForm } from "./login-helper";

type ResourceSample = {
  name: string;
  duration: number;
  transferSize: number;
  decodedBodySize: number;
  initiatorType: string;
};

type Sample = {
  route: string;
  mode: "cold" | "warm";
  elapsedMs: number;
  firstDomResponseMs: number | null;
  requestCount: number;
  transferredBytes: number;
  decodedBytes: number;
  apiMs: number;
  longTasks: number[];
  resources: ResourceSample[];
};

type RouteTarget = {
  route: string;
  title: string;
  persona: PersonaKey;
  navHref?: string;
};

const targets: RouteTarget[] = [
  { route: "/dashboard", title: "Dashboard", persona: "ops", navHref: "/dashboard" },
  { route: "/operations", title: "Operations Center", persona: "ops", navHref: "/operations" },
  { route: "/factories", title: "Factory 360", persona: "ops", navHref: "/factories" },
  { route: "/planning", title: "Visit planning", persona: "ops", navHref: "/planning" },
  { route: "/reviews", title: "Level 2 review queue", persona: "ops", navHref: "/reviews" },
  { route: "/ai/suggestions", title: "Assistive AI dockets", persona: "ops", navHref: "/ai/suggestions" },
];

const coldRuns = Number(process.env.PERF_COLD_RUNS ?? 5);
const warmRuns = Number(process.env.PERF_WARM_RUNS ?? 10);
const outputPath = resolve(process.env.PERF_OUTPUT ?? "../../docs/performance/results/baseline.json");
const authStateDir = process.env.PERF_AUTH_STATE_DIR;

async function login(browser: Browser, persona: PersonaKey): Promise<Record<string, unknown>> {
  if (authStateDir) {
    return JSON.parse(await readFile(resolve(authStateDir, `${persona}.json`), "utf8")) as Record<string, unknown>;
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  const account = PERSONAS[persona];
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await page.locator("#email").fill(account.email);
  await page.locator("#pw").fill(account.password);
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname.startsWith(account.home), { timeout: 40_000 });
  await page.context().addCookies([
    { name: "locale", value: "en", url: new URL(page.url()).origin },
    { name: "login_locale", value: "en", url: new URL(page.url()).origin },
  ]);
  const state = await context.storageState();
  await context.close();
  return state as unknown as Record<string, unknown>;
}

async function installObservers(page: Page) {
  await page.evaluate(() => {
    performance.clearResourceTimings();
    const state = window as typeof window & {
      __perfFirstMutation?: number | null;
      __perfLongTasks?: number[];
      __perfObserver?: PerformanceObserver;
      __perfMutation?: MutationObserver;
    };
    state.__perfFirstMutation = null;
    state.__perfLongTasks = [];
    state.__perfMutation?.disconnect();
    state.__perfObserver?.disconnect();
    const started = performance.now();
    state.__perfMutation = new MutationObserver(() => {
      if (state.__perfFirstMutation == null) state.__perfFirstMutation = performance.now() - started;
    });
    state.__perfMutation.observe(document.body, { childList: true, subtree: true, attributes: true });
    try {
      state.__perfObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) state.__perfLongTasks!.push(entry.duration);
      });
      state.__perfObserver.observe({ type: "longtask", buffered: true });
    } catch {
      // Long Task API is not exposed by every browser build. The result remains an empty list.
    }
  });
}

async function collect(page: Page, route: string, mode: Sample["mode"], elapsedMs: number): Promise<Sample> {
  const observed = await page.evaluate(() => {
    const state = window as typeof window & {
      __perfFirstMutation?: number | null;
      __perfLongTasks?: number[];
    };
    const resources = performance.getEntriesByType("resource").map(entry => {
      const item = entry as PerformanceResourceTiming;
      return {
        name: item.name.replace(location.origin, ""),
        duration: item.duration,
        transferSize: item.transferSize,
        decodedBodySize: item.decodedBodySize,
        initiatorType: item.initiatorType,
      };
    });
    return {
      firstDomResponseMs: state.__perfFirstMutation ?? null,
      longTasks: state.__perfLongTasks ?? [],
      resources,
    };
  });
  const relevant = observed.resources.filter(resource =>
    resource.name.startsWith("/_next/") || resource.name.startsWith("/api/") || resource.name.includes("supabase"),
  );
  const api = relevant.filter(resource => resource.initiatorType === "fetch" || resource.name.startsWith("/api/"));
  return {
    route,
    mode,
    elapsedMs,
    firstDomResponseMs: observed.firstDomResponseMs,
    requestCount: relevant.length,
    transferredBytes: relevant.reduce((sum, resource) => sum + resource.transferSize, 0),
    decodedBytes: relevant.reduce((sum, resource) => sum + resource.decodedBodySize, 0),
    apiMs: api.reduce((sum, resource) => sum + resource.duration, 0),
    longTasks: observed.longTasks,
    resources: relevant,
  };
}

async function newAuthenticatedContext(browser: Browser, state: Record<string, unknown>): Promise<BrowserContext> {
  return browser.newContext({ storageState: state as never });
}

test("PERF-G11-001 captures repeatable authenticated route timings", async ({ browser }) => {
  test.setTimeout(20 * 60_000);
  const states = new Map<PersonaKey, Record<string, unknown>>();
  for (const persona of new Set(targets.map(target => target.persona))) {
    console.log(`[perf] load authenticated state: ${persona}`);
    states.set(persona, await login(browser, persona));
  }

  const samples: Sample[] = [];
  for (const target of targets) {
    console.log(`[perf] ${target.route}: ${coldRuns} cold, ${target.navHref ? warmRuns : 0} warm`);
    const state = states.get(target.persona)!;
    for (let run = 0; run < coldRuns; run += 1) {
      const context = await newAuthenticatedContext(browser, state);
      const page = await context.newPage();
      const started = Date.now();
      await page.goto(target.route, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".ax-pagehead__context h2")).toHaveText(target.title, { timeout: 40_000 });
      samples.push(await collect(page, target.route, "cold", Date.now() - started));
      await context.close();
    }

    if (!target.navHref) continue;
    const context = await newAuthenticatedContext(browser, state);
    const page = await context.newPage();
    const home = PERSONAS[target.persona].home;
    for (let run = 0; run < warmRuns; run += 1) {
      const origin = run % 2 === 0 && target.route !== home ? home : "/profile";
      await page.goto(origin, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".ax-pagehead__context h2")).toBeVisible({ timeout: 40_000 });
      await installObservers(page);
      const link = page.getByRole("navigation", { name: "Primary navigation" }).locator(`a[href="${target.navHref}"]`);
      await expect(link).toHaveCount(1);
      const started = Date.now();
      await link.click();
      await expect(page.locator(".ax-pagehead__context h2")).toHaveText(target.title, { timeout: 40_000 });
      samples.push(await collect(page, target.route, "warm", Date.now() - started));
    }
    await context.close();
  }

  const payload = {
    schemaVersion: "1.0",
    taskId: "TASK-G11-REMEDIATION-PERFORMANCE-001",
    capturedAt: new Date().toISOString(),
    build: "next-production",
    coldRuns,
    warmRuns,
    targets,
    samples,
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  expect(samples.length).toBeGreaterThanOrEqual(targets.length * coldRuns);
});
