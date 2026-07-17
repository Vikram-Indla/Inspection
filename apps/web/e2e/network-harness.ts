// Cycle 2 Wave 2.G — reusable offline/network-condition harness, extracted
// from the patterns already used ad hoc in offline-drill.spec.ts. Lives under
// e2e/ (not src/) so it can never be imported into the production bundle —
// it depends on Playwright's Page/BrowserContext and has no reason to exist
// outside a test process.
import type { Page, BrowserContext, Route } from "@playwright/test";

/** offline / online — real browser-level offline mode, matches offline-drill.spec.ts. */
export async function goOffline(context: BrowserContext, page: Page) {
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
}
export async function goOnline(context: BrowserContext, page: Page) {
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
}

/** latency — delay every matching request by `ms` before letting it through. */
export async function simulateLatency(page: Page, urlPattern: string | RegExp, ms: number) {
  await page.route(urlPattern, async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, ms));
    await route.continue();
  });
}

/** timeout — never resolve; caller's own request-timeout logic must fire. */
export async function simulateTimeout(page: Page, urlPattern: string | RegExp) {
  await page.route(urlPattern, async () => { /* deliberately never continue/abort/fulfill */ });
}

/** dropped request — abort as if the connection failed outright. */
export async function simulateDroppedRequest(page: Page, urlPattern: string | RegExp) {
  await page.route(urlPattern, (route: Route) => route.abort("connectionfailed"));
}

/** reordered requests — delay the Nth matching request more than the (N+1)th. */
export async function simulateReorderedRequests(page: Page, urlPattern: string | RegExp, delaysMs: number[]) {
  let i = 0;
  await page.route(urlPattern, async (route: Route) => {
    const delay = delaysMs[Math.min(i, delaysMs.length - 1)];
    i += 1;
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });
}

/** ambiguous retry — the server actually applied the write, but the client never saw the response. */
export async function simulateAmbiguousRetry(page: Page, urlPattern: string | RegExp) {
  let first = true;
  await page.route(urlPattern, async (route: Route) => {
    if (first) { first = false; await route.abort("connectionreset"); return; } // client sees failure
    await route.continue(); // server-side, the retried request still lands normally
  });
}

/** server conflict — return 409 so the app's own conflict-resolution path is exercised. */
export async function simulateServerConflict(page: Page, urlPattern: string | RegExp, body: unknown = { error: "conflict" }) {
  await page.route(urlPattern, (route: Route) => route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify(body) }));
}

/** app restart/resume — a fresh navigation, simulating cold start after backgrounding. */
export async function simulateAppRestart(page: Page, url: string) {
  await page.goto(url);
}

/** clear all route interception — call before asserting normal sync recovery. */
export async function clearNetworkConditions(page: Page) {
  await page.unrouteAll({ behavior: "ignoreErrors" });
}

/**
 * duplicate-prevention assertion helper — counts POST/PATCH/PUT requests to a
 * pattern during `fn()`; caller asserts the count matches the expected
 * exactly-once (or intentionally-N) semantics.
 */
export async function countMutatingRequests(page: Page, urlPattern: string | RegExp, fn: () => Promise<void>): Promise<number> {
  let count = 0;
  const handler = (route: Route) => {
    if (["POST", "PATCH", "PUT"].includes(route.request().method())) count += 1;
    route.continue();
  };
  await page.route(urlPattern, handler);
  try { await fn(); } finally { await page.unroute(urlPattern, handler); }
  return count;
}
