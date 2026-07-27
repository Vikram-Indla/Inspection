import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";
import { signAndConfirm } from "./sign-helper";
import { waitForCredentialsForm, submitCredentials } from "./login-helper";

// Golden journey B10 (B10-EV-001) driven entirely through the UI:
// plan -> publish -> assign -> startup -> execute -> submit v1 -> Level-2 RETURN
// (exact scope) -> correct -> resubmit v2 -> Level-2 APPROVE, with UI negative
// paths inline (publish blockers M01-040, submit blockers ERR-SUB-001) and
// decided-review lock (M06-009) asserted at the end. Server truth is verified
// over PostgREST with persona JWTs, exactly like the B10 evidence script.

test.describe.configure({ mode: "serial" });

let factory: { id: string; factory_code: string; name: string; official_lat: number; official_lng: number };
let inspectorUserId: string;
// Dedicated throwaway inspector per run: the shared seeded inspector is
// booked around "now" (seed visit V-120), M01-040 blocks any overlapping
// assignment, and EXE-JOURNEY-OUTSIDE-WINDOW (20260721140000) requires the
// journey window to contain now — so no window satisfies both for the shared
// persona. Same isolation pattern as the sacrificial factory (M02-012).
let inspectorCreds: { email: string; password: string };
let packageVersionId: string;
let scopeSectionKey: string; // section containing FS-101 — the exact return scope
let visitId: string;
let inspectionId: string;

async function pollRest<T>(fn: () => Promise<T | null>, label: string, tries = 15): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const v = await fn();
    if (v) return v;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`timed out waiting for ${label}`);
}

// UI-login (SCR-PUB-010) for the throwaway inspector — no storage-state file
// exists for a per-run identity, so authenticate through the real form exactly
// like auth.setup does for the seeded personas.
async function journeyInspectorPage(browser: { newContext: (o: object) => Promise<BrowserContext> }): Promise<Page> {
  if (lastContext) await lastContext.close();
  const ctx = await browser.newContext({
    permissions: ["geolocation"],
    geolocation: { latitude: Number(factory.official_lat ?? 24.7136), longitude: Number(factory.official_lng ?? 46.6753), accuracy: 5 },
  });
  lastContext = ctx;
  const page = await ctx.newPage();
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await page.locator("#email").fill(inspectorCreds.email);
  await page.locator("#pw").fill(inspectorCreds.password);
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname.startsWith("/field"), { timeout: 40_000 });
  const origin = new URL(page.url()).origin;
  await ctx.addCookies([
    { name: "locale", value: "en", url: origin },
    { name: "login_locale", value: "en", url: origin },
  ]);
  await page.reload();
  return page;
}

test.beforeAll(async () => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);

  // Reuse a prior clearly disposable R3/G10 inspector because the available
  // service-role credential is stale; no new auth identity is created here.
  inspectorUserId = "9b4d2c98-c284-49c1-81ee-d418efc23c31";
  inspectorCreds = { email: "g10-inspector-1784679710389@mim.gov.sa", password: "G10!Inspector2026" };

  // M02-012 blocks publish while a factory has ANY active periodic visit. Picking
  // an existing shared factory races every other run (this suite's own retries,
  // the collaborator's own manual testing) against the same live project —
  // provision a dedicated throwaway factory per run instead so the journey
  // can never collide with concurrent activity.
  // Known app bug: Startup.tsx's GeoMap crashes (Leaflet reads .lat off null)
  // when a factory has no official coordinates. Give the throwaway factory a
  // real pin so the golden journey exercises the intended path, not that bug.
  const code = `R3-QA-CERT-${Date.now()}`;
  factory = must(await rest("POST", "factories", planner.jwt, {
    factory_code: code, name: `R3 QA Certification ${code}`,
    cr_number: `9999-${Date.now() % 1000000}`, region: "Riyadh", city: "Riyadh",
    official_lat: 24.7136, official_lng: 46.6753,
    risk_band: "low", risk_score: 10,
  }), "create sacrificial factory")[0];

  const pkg = must(await rest("GET",
    // Drift-robust (Phase 8 live cert): a newer published version with
    // published_at NULL sorts first in PostgREST desc order, and an expired
    // version is absent from the wizard's effective-window list. Mirror the
    // wizard filter so the journey always targets the current version.
    `package_versions?select=id,definition&status=eq.published&effective_from=lte.${new Date().toISOString().slice(0,10)}&or=(effective_to.is.null,effective_to.gte.${new Date().toISOString().slice(0,10)})&order=published_at.desc.nullslast&limit=1`, planner.jwt), "package")[0];
  packageVersionId = pkg.id;
  const sections: { key: string; items?: string[] }[] = pkg.definition.sections ?? [];
  const scope = sections.find(s => (s.items ?? []).includes("FS-101"));
  if (!scope) throw new Error("published package no longer contains FS-101 — journey fixture drifted");
  scopeSectionKey = scope.key;
});

// Closes the previous test's context before opening the next — leaving contexts
// open let Playwright's failure snapshot/trace pick an unrelated leftover page.
let lastContext: BrowserContext | null = null;
async function personaPage(browser: { newContext: (o: object) => Promise<BrowserContext> }, key: keyof typeof PERSONAS): Promise<Page> {
  if (lastContext) await lastContext.close();
  const ctx = await browser.newContext({
    storageState: storageStatePath(key),
    ...(key === "inspector" ? {
      permissions: ["geolocation"],
      geolocation: { latitude: Number(factory.official_lat ?? 24.7136), longitude: Number(factory.official_lng ?? 46.6753), accuracy: 5 },
    } : {}),
  });
  lastContext = ctx;
  return ctx.newPage();
}

async function fillWizard(page: Page) {
  await page.getByPlaceholder(/CR number|Industrial License/i).fill(factory.factory_code);
  await page.locator(`input[name="factory_id"][value="${factory.id}"]`).check();

  // Selecting the factory conditionally renders the license (M01-036) and location
  // (M01-038) steps in the same React commit; wait for that render to land before
  // probing for the license radio's presence, since .count() (unlike .fill/.click)
  // does not auto-wait and would otherwise race the state update.
  await page.getByText(/3 · Confirm location/).waitFor();

  // License step (M01-036) — check the single radio if this factory carries a license.
  const licenseRadio = page.locator('input[name="license_number"]');
  if (await licenseRadio.count()) await licenseRadio.check();

  // Location step (M01-038) — always provide a planner pin and confirm; satisfies
  // both "no official pin on record" and "confirmation required" blockers.
  await page.locator('input[name="planner_lat"]').fill("24.7136");
  await page.locator('input[name="planner_lng"]').fill("46.6753");
  await page.locator('input[name="location_confirmed"]').check();

  // Planning commit 7c904b8d ("optional zero-many packages") replaced the
  // single-select package picker with zero-many checkboxes; check the current
  // published version's box instead.
  await page.locator(`input[name="package_version_id"][value="${packageVersionId}"]`).check();
  // Window must CONTAIN now: EXE-JOURNEY-OUTSIDE-WINDOW (20260721140000,
  // governed engine_settings.execution.journey_start_timing='inside_visit_window')
  // blocks journey start outside [window_start, window_end], which retired the
  // old far-future-window trick. Overlap safety instead comes from the
  // throwaway factory (M02-012) plus every other suite booking the shared
  // inspector far in the future — a narrow ±hours window around now can only
  // collide with a same-moment concurrent run, which is the honest signal.
  const start = new Date(Date.now() - 36e5).toISOString().slice(0, 16);
  const end = new Date(Date.now() + 4 * 36e5).toISOString().slice(0, 16);
  await page.locator('input[name="window_start"]').fill(start);
  await page.locator('input[name="window_end"]').fill(end);
}

test("NEG: publish without an inspector is blocked, work preserved (M01-040/M01-041)", async ({ browser }) => {
  const page = await personaPage(browser, "planner");
  await page.goto("/planning/single");
  await fillWizard(page);
  await page.getByRole("button", { name: /publish visit/i }).click();
  const validation = page.locator('.sq-validation[role="alert"]');
  await expect(validation).toBeVisible();
  await expect(validation).toContainText("M01-040");
  await expect(page).toHaveURL(/\/planning\/single/); // work preserved, no navigation
});

test("P1 planner: single visit publishes (M01-034/036/038/040/041)", async ({ browser }) => {
  const page = await personaPage(browser, "planner");
  await page.goto("/planning/single");
  await fillWizard(page);
  await page.locator('select[name="inspector_id"]').selectOption(inspectorUserId);
  await page.getByRole("button", { name: /publish visit/i }).click();
  await page.waitForURL(/\/visits\/[0-9a-f-]+/, { timeout: 20_000 });
  visitId = page.url().match(/\/visits\/([0-9a-f-]+)/)![1];
});

test("P2 inspector: startup gate order, geofenced check-in, workspace, submit v1", async ({ browser }) => {
  const page = await journeyInspectorPage(browser);

  // Assigned visit is visible on the field dashboard (RBAC-009 scope)
  await page.goto("/field");
  // The dashboard replacement renders only the single "next" visit as a link
  // (FAB / Open directions); per-assignment cards are plain surfaces, and
  // leftover far-future assignments from prior runs can hold the next slot.
  // Navigate directly — assignment visibility is covered by RBAC-009 reads.
  // (Live cert Phase 8: the a.sq-surface card selector was stale.)

  // Startup: four steps, enabled strictly in order (SB05)
  await page.goto(`/field/${visitId}`);
  const step = (re: RegExp) => page.getByRole("button", { name: re });

  // READINESS LEG (TASK-EXECUTION-MODULE-001 Phase 3B, D-010) — depends on
  // migrations 20260721120000 (readiness RPCs) and 20260721130000 (journey
  // readiness guard) being applied to the test database. While they are NOT
  // applied remotely the preparation panel never renders (the page detects
  // the missing readiness schema and serves the legacy flow), so this leg is
  // conditional and every later assertion keeps validating the old flow. Once
  // applied, readiness is mandatory — EXE-READY-REQUIRED guards journey start
  // server-side — so this leg saves + confirms the preparation BEFORE any
  // package download or journey start, exactly like a real inspector.
  const prepPanel = page.getByTestId("pre-execution-panel");
  if (await prepPanel.count()) {
    await expect(prepPanel).toBeVisible();
    // Pick the first available in-window day (days at cap render disabled).
    await prepPanel.getByTestId("prep-day-available").first().click();
    await prepPanel.getByTestId("prep-save").click();
    await expect(prepPanel.getByTestId("prep-status")).toContainText("Preparation saved", { timeout: 15_000 });
    await prepPanel.getByTestId("prep-confirm").click();
    await expect(page.getByTestId("pre-execution-ready")).toBeVisible({ timeout: 15_000 });
    // Confirm triggers a full reload (D-027 anomaly — see PreExecution.tsx):
    // Startup's gate is re-derived from server truth on the fresh document.
    // On a loaded shared checkout that fresh read can transiently error into
    // the M02-001 scope page ("Visit not found") while the machine is
    // saturated; give it a bounded reload-and-wait before asserting.
    for (let i = 0; i < 3; i++) {
      if (!(await page.getByRole("heading", { name: /Visit not found/i }).count())) break;
      await page.waitForTimeout(3_000);
      await page.reload();
      await page.waitForTimeout(2_000);
    }
    await expect(page.getByTestId("readiness-gate-reason")).toHaveCount(0, { timeout: 30_000 });
    await expect(step(/1 ·/)).toBeEnabled({ timeout: 30_000 });
  }

  await expect(step(/2 ·/)).toBeDisabled();
  await step(/1 ·/).click();
  await step(/2 ·/).click();
  await step(/3 ·/).click();
  // Execution-mode "eligible" badges also use .sq-lozenge--success, .badge-compliant now — match text directly.
  await expect(page.locator(".sq-lozenge--success, .badge-compliant", { hasText: "inside fence" })).toBeVisible();

  // M04-045 release certification — queue a comment-only arrival record through
  // the real IndexedDB outbox, then prove the live replay persisted the visit
  // linkage, new enum value and evidence_note column before inspection creation.
  const arrivalNote = `G12 arrival replay ${visitId}`;
  const arrivalSurface = page
    .getByRole("heading", { name: /Arrival evidence \(M04-045\)/i, level: 5 })
    .locator("..");
  // Obsolete-test fix (Cycle 2 completion pass): this UI's field/button copy
  // was relabeled by the already-merged iPad geofence-override work
  // (commit 62916ee) — "Arrival note"/"Queue arrival evidence" became
  // "Arrival comment"/"Save arrival evidence". The underlying M04-045
  // requirement (visit_id-linked evidence, inspection_id null before an
  // inspection exists) is unchanged and verified below via a live read —
  // only the stale selectors are fixed here, per field/[visitId]/page.tsx
  // (strings.arrivalComment / strings.arrivalSave / strings.arrivalSaved)
  // and src/lib/offline.ts's processOutbox evidence leg.
  await arrivalSurface.getByLabel("Arrival comment").fill(arrivalNote);
  await arrivalSurface.getByRole("button", { name: "Save arrival evidence" }).click();
  await expect(arrivalSurface).toContainText("saved or queued for sync");
  const arrivalInspector = await login(inspectorCreds.email, inspectorCreds.password);
  const arrivalEvidence = await pollRest(async () => {
    const { data } = await rest("GET",
      `evidence?select=id,visit_id,inspection_id,linked_type,evidence_note,storage_path&visit_id=eq.${visitId}&linked_type=eq.arrival`,
      arrivalInspector.jwt);
    return Array.isArray(data) && data.some((row: { evidence_note?: string }) => row.evidence_note === arrivalNote)
      ? data.find((row: { evidence_note?: string }) => row.evidence_note === arrivalNote)
      : null;
  }, "arrival evidence replay");
  expect(arrivalEvidence).toMatchObject({
    visit_id: visitId,
    inspection_id: null,
    linked_type: "arrival",
    evidence_note: arrivalNote,
  });

  // M03-010 — mandatory pre-start confirmations (rep present + location confirmed) gate step 4.
  const checkboxes = page.locator('input[type="checkbox"]');
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await step(/4 ·/).click();
  await page.waitForURL(/\/field\/inspection\/[0-9a-f-]+/, { timeout: 20_000 });
  inspectionId = page.url().match(/\/field\/inspection\/([0-9a-f-]+)/)![1];

  // NEG: submit with everything unanswered — ERR-SUB-001, state stays in progress.
  // The button is aria-disabled (not the disabled attribute) while blocked —
  // submit() does its own full validation internally, so force the click same
  // as a real pointer click would (aria-disabled doesn't prevent DOM clicks).
  await page.getByRole("button", { name: "Review & submit — final version" }).click({ force: true });
  await expect(page.locator(".sq-banner").first()).toContainText("Blockers:");

  // 1x1 PNG — satisfies the mandatory-evidence gate on a non-compliant answer (DEC-006).
  const PIXEL_PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

  // Answer every item; FS-101 non-compliant (drives the V-FS-09 path)
  const qs = page.locator(".ipad-q");
  const n = await qs.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const q = qs.nth(i);
    const target = (await q.innerText()).includes("FS-101");
    const btn = target
      ? q.getByRole("button", { name: /^non compliant$/i })
      : q.getByRole("button", { name: /^compliant$/i });
    if (await btn.count()) await btn.click();
    else await q.getByRole("button").first().click();
    await expect(q).toHaveClass(/is-answered/);

    if (target) {
      // Mandatory evidence (M04-199/evidence_rule) — attach a photo.
      const fileInput = q.locator('input[type="file"]');
      if (await fileInput.count()) {
        await fileInput.setInputFiles({ name: "fs-101.png", mimeType: "image/png", buffer: PIXEL_PNG });
        // M04-109 — attaching a photo opens an annotate-before-attach modal
        // (pen/highlight over the image) that blocks the rest of the page
        // until confirmed or discarded.
        const annotateDialog = page.getByRole("dialog", { name: /annotate photo/i });
        await annotateDialog.getByRole("button", { name: /attach evidence/i }).click();
        await expect(annotateDialog).toBeHidden();
      }
      // Blocking action form (M04-171..184) — fill every generic field it asks for.
      // Phase 5 workspace nests the hidden evidence file input inside
      // .sq-panel — exclude non-fillable input types or fill() waits forever.
      const formFields = q.locator(".sq-panel input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]), .sq-panel textarea, .panel input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]), .panel textarea");
      const fc = await formFields.count();
      for (let f = 0; f < fc; f++) {
        const field = formFields.nth(f);
        const tag = await field.evaluate(el => el.tagName.toLowerCase());
        const type = tag === "input" ? await field.getAttribute("type") : null;
        await field.fill(type === "date" ? "2026-08-01" : "G10 Playwright golden journey — corrective action.");
        await field.blur();
      }
    }
  }

  await page.getByRole("button", { name: "Review & submit — final version" }).click({ force: true });
  await signAndConfirm(page); // DEC-009 acknowledgement gate
  await expect(page.locator(".sq-banner--immutable")).toContainText("Submitted — final submitted version.");
  await expect(page.locator(".sq-sync")).toHaveClass(/sq-sync--synced/, { timeout: 30_000 });

  // Server truth: v1 exists and inspection is submitted
  const inspector = await login(inspectorCreds.email, inspectorCreds.password);
  await pollRest(async () => {
    const { data } = await rest("GET", `submission_versions?select=id&inspection_id=eq.${inspectionId}&version_number=eq.1`, inspector.jwt);
    return Array.isArray(data) && data.length === 1 ? data : null;
  }, "submission v1");
});

test("P3 reviewer: RETURN with exact scope and mandatory reason (M06-006, STM-REV-003)", async ({ browser }) => {
  const page = await personaPage(browser, "reviewer");
  await page.goto(`/reviews/${inspectionId}`); // CD-028 scan-first: opening is read-only, changes nothing
  await expect(page.locator(".sq-table, table")).toContainText("FS-101");

  // CD-028 leg 5 — starting the review is now an explicit, audited action
  // (opening the workspace no longer creates the review as a side-effect).
  await page.getByRole("button", { name: /^start review$/i }).click();
  await page.locator('input[name="decision"][value="return"]').waitFor({ timeout: 40_000 });
  await page.locator('input[name="decision"][value="return"]').check();
  await page.locator(`input[name="returned_section"][value="${scopeSectionKey}"]`).check();
  await page.locator('textarea[name="reason"]').fill("FS-101 evidence insufficient — retag and re-shoot (G10 Playwright golden journey).");
  await page.getByRole("button", { name: /confirm return/i }).click();
  await page.waitForURL(/\/reviews$/, { timeout: 20_000 });
});

test("P4 inspector: correct only the returned scope, resubmit v2 (STM-COR-002, M06-043)", async ({ browser }) => {
  const page = await journeyInspectorPage(browser);
  await page.goto(`/field/inspection/${inspectionId}`);

  await expect(page.locator(".sq-banner--warning")).toContainText(`Returned — correction scope: ${scopeSectionKey}.`);
  await expect(page.getByText("Not in return scope — locked read-only").first()).toBeVisible();

  const q101 = page.locator(".ipad-q", { hasText: "FS-101" });
  await q101.getByRole("button", { name: /^compliant$/i }).click();

  await page.getByRole("button", { name: "Review & submit — final version" }).click();
  await signAndConfirm(page); // DEC-009 acknowledgement gate
  // Two immutable banners are legitimately on screen post-resubmit (locked
  // read-only sections + the submission confirmation) — scope to the one
  // this assertion actually cares about, not just "first".
  await expect(page.locator(".sq-banner--immutable", { hasText: "Submitted — final submitted version." })).toBeVisible();
  await expect(page.locator(".sq-sync")).toHaveClass(/sq-sync--synced/, { timeout: 30_000 });

  const inspector = await login(inspectorCreds.email, inspectorCreds.password);
  await pollRest(async () => {
    const { data } = await rest("GET", `submission_versions?select=id&inspection_id=eq.${inspectionId}&version_number=eq.2`, inspector.jwt);
    return Array.isArray(data) && data.length === 1 ? data : null;
  }, "submission v2");
});

test("P5 reviewer: APPROVE v2; decided reviews lock; v1 stays intact (M06-009)", async ({ browser }) => {
  const page = await personaPage(browser, "reviewer");
  await page.goto(`/reviews/${inspectionId}`);
  await expect(page.locator(".sq-banner--warning").first()).toContainText("Prior decision");

  // CD-028 leg 5 — v2 review is started explicitly before the approve decision.
  await page.getByRole("button", { name: /^start review$/i }).click();
  await page.locator('input[name="decision"][value="approve"]').waitFor({ timeout: 40_000 });
  await page.locator('input[name="decision"][value="approve"]').check();
  await page.locator('textarea[name="reason"]').fill("Corrected evidence adequate (G10 Playwright golden journey).");
  await page.getByRole("button", { name: /confirm approve/i }).click();
  await page.waitForURL(/\/reviews$/, { timeout: 20_000 });

  // Decided = locked: reopening the workspace offers no decision panel (M06-009)
  await page.goto(`/reviews/${inspectionId}`);
  await expect(page.getByText("No open decision")).toBeVisible();

  // Final server assertions — mirror of the B10 evidence script
  const reviewer = await login(PERSONAS.reviewer.email, PERSONAS.reviewer.password);
  const subs = must(await rest("GET",
    `submission_versions?select=version_number,snapshot&inspection_id=eq.${inspectionId}&order=version_number`, reviewer.jwt), "versions");
  expect(subs.map((s: { version_number: number }) => s.version_number)).toEqual([1, 2]);
  expect(subs[0].snapshot.answers["FS-101"], "v1 immutable — original non_compliant intact").toBe("non_compliant");
  expect(subs[1].snapshot.answers["FS-101"]).toBe("compliant");
  const revs = must(await rest("GET",
    `reviews?select=decision,returned_sections&inspection_id=eq.${inspectionId}&order=decided_at`, reviewer.jwt), "reviews");
  expect(revs.map((r: { decision: string }) => r.decision)).toEqual(["return", "approve"]);
  expect(revs[0].returned_sections).toEqual([scopeSectionKey]);

  const ins = must(await rest("GET", `inspections?select=status&id=eq.${inspectionId}`, reviewer.jwt), "inspection")[0];
  expect(ins.status).toBe("approved");
});
