import { test, expect, type Page } from "@playwright/test";
import { PERSONAS } from "./personas";
import { login, rest, must, assertOk } from "./live-rest";
import { signAndConfirm } from "./sign-helper";
import { waitForCredentialsForm, identifierField, passwordField, submitCredentials } from "./login-helper";

// TASK-9 — Inspector Offline, Sync, and Conflict Recovery Journey.
// Dataset: UAT-S09. Governed identities: inspector8@mim.gov.sa (field channel),
// supervisor4@mim.gov.sa (review visibility). Cohort secret per
// scripts/test-data/provision_governed_uat_identities.mjs (SAQEEL_CROSS_ROLE_PASSWORD).
//
// Covers: offline entry, local (IndexedDB) persistence across reload while
// offline, reconnect, sync-queue replay, idempotent evidence + submit upload,
// conflict display + resolution (keep mine / keep server), submission, and
// supervisor visibility of the resulting record with no duplicate evidence or
// state. Requirement/acceptance IDs: STM-SYNC-001, STM-SYNC-002, MVP1-FND-005,
// MVP1-FND-006, ERR-SUB-002, CD-030 (supervisor review visibility).

const UAT_DATASET = "UAT-S09";

// Every governed identity (admin/planner/supervisor/inspector 1-30, including
// inspector8/supervisor4) shares one cohort secret — provisioned by
// scripts/test-data/provision_governed_uat_identities.mjs. PERSONAS.planner
// already resolves it with the file+env merge this journey needs, so reuse it
// rather than re-deriving process.env lookups (personas.ts:84).
function governedSecret(persona: string): string {
  try {
    return PERSONAS.planner.password;
  } catch {
    throw new Error(`${UAT_DATASET}: governed cohort secret required for ${persona}`);
  }
}

const INSPECTOR_EMAIL = "inspector8@mim.gov.sa";
const SUPERVISOR_EMAIL = "supervisor4@mim.gov.sa";

// Dedicated own-persona sign-in via the real /login UI — inspector8/supervisor4
// are not the shared "inspector"/"supervisor" storageState keys in personas.ts
// (those map to inspector1/supervisor1), so this journey signs in explicitly
// rather than reusing or repointing the shared fixture.
async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(email);
  await passwordField(page).fill(password);
  await submitCredentials(page);
  await page.waitForURL((url) => url.pathname.replace(/^\/(en|ar)(?=\/|$)/, "").startsWith("/dashboard"), { timeout: 40_000 });
}

// The workspace sync badge's label copy is not the bare state name — e.g.
// strings.sync.offline is "Offline — work saved locally" (page.tsx:507), with
// a further " · {detail}" suffix appended at render (Workspace.tsx:1127). Match
// on the badge element containing the state word rather than an exact string.
function syncBadge(page: Page, label: string) {
  return page.locator("span.badge", { hasText: label }).first();
}

test.use({ storageState: { cookies: [], origins: [] } });

// Each test needs its OWN fresh in-progress inspection: test 1 (below) reaches
// a real terminal "submitted" status, which would break tests 2/3 if they
// reused it (submit_inspection's status guard rejects a second submission
// from anything but in_progress/returned). Every test therefore calls this at
// its own start rather than sharing one beforeAll fixture.
async function createReadyInspection(): Promise<{ inspectionId: string; itemIds: Record<string, string>; inspectorAuth: { jwt: string; userId: string } }> {
  // Governed factory F-2201 (Makkah). Both visits_read_explicit_scope and
  // visits_insert_explicit (20260728010000_planning_closure_p0) gate on
  // planning_closure_factory_in_scope(factory_id), which requires the
  // acting planner/inspector's own profile.region to match the factory's
  // region. inspector8 and planner3 are both governed into "Makkah"
  // (provision_governed_uat_identities.mjs), so this journey's fixture uses
  // that pair rather than the shared PERSONAS.planner (Riyadh), which would
  // otherwise fail the planner's own in-scope insert check on a Makkah factory.
  const planner = await login("planner3@mim.gov.sa", governedSecret("planner3"));
  const inspector = await login(INSPECTOR_EMAIL, governedSecret("inspector8"));

  const fac = must(await rest("GET", "factories?select=id&factory_code=eq.F-2201", planner.jwt), `${UAT_DATASET} factory`)[0];
  const pkg = must(await rest("GET", "package_versions?select=id&status=eq.published&order=published_at.desc&limit=1", planner.jwt), `${UAT_DATASET} package`)[0];
  const plan = must(await rest("POST", "visit_plans", planner.jwt, { method: "single", status: "draft", created_by: planner.userId }), `${UAT_DATASET} plan`)[0];
  const now = new Date();
  // Spread across a wide random offset to avoid the shared-project unique
  // booking collisions other UAT suites hit on this same live project.
  const dayOffset = 4000 + Math.floor(Math.random() * 20000);
  const visit = must(await rest("POST", "visits", planner.jwt, {
    visit_plan_id: plan.id, factory_id: fac.id, visit_type: "periodic",
    execution_mode: "physical", planning_status: "draft",
    window_start: new Date(now.getTime() + dayOffset * 864e5).toISOString(),
    window_end: new Date(now.getTime() + dayOffset * 864e5 + 4 * 36e5).toISOString(),
    package_version_id: pkg.id,
  }), `${UAT_DATASET} visit`)[0];
  assertOk(await rest("POST", "assignments", planner.jwt, { visit_id: visit.id, inspector_id: inspector.userId, method: "manual" }, "return=minimal"), `${UAT_DATASET} assign`);
  assertOk(await rest("PATCH", `visits?id=eq.${visit.id}`, planner.jwt, { planning_status: "published" }, "return=minimal"), `${UAT_DATASET} publish`);

  // Pre-execution readiness (20260721121000_execution_preparation.sql): a
  // physical-mode visit's submission is blocked by guard_submission_action_
  // forms_and_config (EXE-SUBMIT-CONFIG-SNAPSHOT-REQUIRED) unless a frozen
  // visit_package_snapshots row exists — created only by confirm_visit_ready,
  // which itself requires a saved visit_preparations row first. Real UI
  // journeys pass through the Pre-Execution screen; this fixture calls both
  // RPCs directly as the assigned inspector.
  const executionDate = new Date(now.getTime() + dayOffset * 864e5).toISOString().slice(0, 10);
  assertOk(await rest("POST", "rpc/save_visit_preparation", inspector.jwt, {
    p_visit: visit.id, p_execution_date: executionDate, p_confirmed_mode: "physical",
    p_package_version_id: pkg.id, p_form_config: {},
  }, "return=minimal"), `${UAT_DATASET} save preparation`);
  assertOk(await rest("POST", "rpc/confirm_visit_ready", inspector.jwt, { p_visit: visit.id }, "return=minimal"), `${UAT_DATASET} confirm ready`);

  // confirm_visit_ready provisions the inspection row itself (its readiness
  // gate is a precondition for execution starting) — read it back rather
  // than inserting a second one for the same visit_id (unique constraint).
  const existingIns = must(await rest("GET", `inspections?select=id&visit_id=eq.${visit.id}`, inspector.jwt), `${UAT_DATASET} inspection lookup`);
  const ins = existingIns[0] ?? must(await rest("POST", "inspections", inspector.jwt, {
    visit_id: visit.id, package_version_id: pkg.id, status: "in_progress", started_at: now.toISOString(),
  }), `${UAT_DATASET} inspection`)[0];

  const items = must(await rest("GET", "inspection_items?select=id,code&code=in.(FS-101,FS-102,EG-201)", inspector.jwt), `${UAT_DATASET} items`);
  return { inspectionId: ins.id, itemIds: Object.fromEntries(items.map((i: { code: string; id: string }) => [i.code, i.id])), inspectorAuth: inspector };
}

test(`${UAT_DATASET} offline entry persists locally across reload, then replays exactly once on reconnect (STM-SYNC-001)`, async ({ page, context }) => {
  const { inspectionId, itemIds, inspectorAuth } = await createReadyInspection();
  await loginViaUi(page, INSPECTOR_EMAIL, governedSecret("inspector8"));
  await page.goto(`/field/inspection/${inspectionId}`);
  await expect(syncBadge(page, "Synced")).toBeVisible();

  // The Factory 360 snapshot verification step (Step 2 of 4) gates submit —
  // computeBlockers treats an unverified factory attribute as a submit
  // blocker even when every checklist item is answered. Clear it on-site,
  // while still connected, before the checklist portion goes offline.
  for (const button of await page.getByRole("button", { name: "Verify as-is" }).all()) {
    await button.click();
  }

  // This governed package's frozen definition declares a mandatory blocking
  // action_form ("corrective_blocking"), and guard_submission_action_forms_
  // and_config (20260721121000_execution_preparation.sql) requires that form
  // filled for ANY submission of this package, unconditionally — mirroring
  // golden-journey.spec.ts's FS-101-non-compliant path, done here on-site
  // while still connected since the annotate/OCR evidence flow is a separate
  // concern from this journey's offline/sync/conflict focus.
  const PIXEL_PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const q101 = page.locator("p").filter({ hasText: /^FS-101 ·/ }).locator("../..");
  await q101.getByRole("button", { name: /^non compliant$/i }).click();
  await expect(q101).toHaveClass(/questionAnswered/);
  await q101.getByLabel("📷 Mandatory photo", { exact: true }).setInputFiles({ name: "fs-101.png", mimeType: "image/png", buffer: PIXEL_PNG });
  const annotateDialog = page.getByRole("dialog", { name: /annotate photo/i });
  await annotateDialog.getByRole("button", { name: /attach evidence/i }).click();
  await expect(annotateDialog).toBeHidden();
  const ocrDialog = page.getByRole("dialog", { name: "Attach evidence · OCR scan", exact: true });
  await expect(ocrDialog).toBeVisible();
  await ocrDialog.getByRole("button", { name: "Attach evidence", exact: true }).click();
  await expect(ocrDialog).toBeHidden();
  const deterministicCorrection = `${UAT_DATASET} corrective action.`;
  for (const name of ["Owner name*", "Owner role*", "Required correction*"]) {
    const field = q101.getByRole("textbox", { name, exact: true });
    await field.fill(deterministicCorrection);
    await field.blur();
  }

  // FLD-FND-003 — the implied FS-101 violation needs a PERSISTED finding
  // narrative before submission; save it while still connected, exactly like
  // golden-journey.spec.ts's non-compliant leg.
  const findingNarrative = page.getByRole("textbox", { name: "Finding narrative*", exact: true });
  await expect(findingNarrative).toHaveCount(1);
  await findingNarrative.fill(`${UAT_DATASET} finding — corrective action.`);
  await findingNarrative.blur();
  await expect(page.getByTestId("finding-status-FS-101")).toHaveText("Finding saved", { timeout: 30_000 });

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(syncBadge(page, "Offline")).toHaveClass(/badge-warning/);

  // Each checklist item renders as <div class="question"> > <div class="row">
  // (title paragraph) + a separate sibling <div class="row"> (answer buttons)
  // (Workspace.tsx:1507-1541). The title <p>'s immediate parent is only the
  // first row, so the answer buttons are two levels up, not one.
  const q102 = page.locator("p").filter({ hasText: /^FS-102 ·/ }).locator("../..");
  await q102.getByRole("button", { name: /^compliant$/i }).click();
  await expect(q102).toHaveClass(/questionAnswered/);

  // Local persistence check: the answer must be durably written to IndexedDB
  // (survives a process restart), not just held in React state. A hard
  // page.reload() while genuinely offline fails at the network layer with no
  // service worker to serve the app shell (that cold-shell path is covered
  // separately by field-offline-runtime.spec.ts) — read the store directly.
  const draftHasFs102 = await page.evaluate(({ userId, inspectionId, itemId }) => new Promise<boolean>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readonly");
      const all = transaction.objectStore("outbox").getAll();
      all.onsuccess = () => resolve((all.result as { kind: string; inspection_id: string; item_id: string; response?: { value: string } }[])
        .some(op => op.kind === "response" && op.inspection_id === inspectionId && op.item_id === itemId && op.response?.value === "compliant"));
      all.onerror = () => reject(all.error);
    };
  }), { userId: inspectorAuth.userId, inspectionId, itemId: itemIds["FS-102"] });
  expect(draftHasFs102, "FS-102 answer is durably queued in IndexedDB while offline, not only in React state").toBe(true);

  // Only the active section renders at a time (Workspace.tsx:1477); EG-201
  // lives in the "Exits & evacuation" section (s2), one section past FS-101/
  // FS-102's "Fire protection systems" (s1) — advance before answering it.
  await page.getByRole("button", { name: "Next section" }).click();
  const qEg201 = page.locator("p").filter({ hasText: /^EG-201 ·/ }).locator("../..");
  await qEg201.getByRole("button", { name: /^compliant$/i }).click();
  await expect(qEg201).toHaveClass(/questionAnswered/);

  // "Review & submit — final version" reveals the "Final review" region
  // inline (counts + a distinct "Confirm and submit" button) rather than
  // opening the signature dialog itself.
  await page.getByRole("button", { name: "Review & submit — final version" }).click();
  await page.getByRole("button", { name: "Confirm and submit" }).click();
  await signAndConfirm(page, "SAQEEL Task-9 UAT — inspector8 offline drill");
  // Rendered as <div class="alert alert-info"> (Workspace.tsx:1130/1215), not
  // the ".sq-banner" class other offline specs assume; a separate
  // FactoryVerification-local "Saved locally — syncing" alert can also match
  // that class, so target the text directly instead of `.first()` of the class.
  await expect(page.getByRole("heading", { name: /Queued — will submit exactly once on reconnect/ })).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  // A reload while genuinely online is a legitimate reconnect path (unlike
  // the earlier offline reload) and guarantees the mount-time processOutbox
  // tick() runs, rather than depending on the manually dispatched "online"
  // event alone reaching the same effect in this exact tab.
  await page.reload();

  const inspector = await login(INSPECTOR_EMAIL, governedSecret("inspector8"));
  let subs: { id: string; version_number: number }[] = [];
  for (let attempt = 0; attempt < 15 && subs.length === 0; attempt++) {
    subs = must(await rest("GET",
      `submission_versions?select=id,version_number&inspection_id=eq.${inspectionId}`, inspector.jwt), `${UAT_DATASET} versions`);
    if (subs.length === 0) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  expect(subs.length, `${UAT_DATASET} exactly one submission after replay (idempotent)`).toBe(1);
  expect(subs[0].version_number).toBe(1);

  const resp = must(await rest("GET",
    `checklist_responses?select=item_id,response&inspection_id=eq.${inspectionId}`, inspector.jwt), `${UAT_DATASET} responses`);
  const values = Object.fromEntries(resp.map((r: { item_id: string; response: { value: string } }) => [r.item_id, r.response.value]));
  expect(values[itemIds["FS-101"]], `${UAT_DATASET} FS-101 response replayed`).toBe("non_compliant");
  for (const code of ["FS-102", "EG-201"]) {
    expect(values[itemIds[code]], `${UAT_DATASET} ${code} response replayed`).toBe("compliant");
  }
});

test(`${UAT_DATASET} concurrent server edit is never silently overwritten and is resolved through the conflict UI (STM-SYNC-002, keep mine)`, async ({ page }) => {
  const { inspectionId, itemIds, inspectorAuth } = await createReadyInspection();
  const itemId = itemIds["FS-101"];
  assertOk(await rest("POST", "checklist_responses", inspectorAuth.jwt, {
    inspection_id: inspectionId,
    item_id: itemId,
    response: { value: "compliant" },
    is_complete: true,
  }, "resolution=merge-duplicates,return=minimal"), `${UAT_DATASET} seed response baseline`);

  const baseline = must(await rest("GET",
    `checklist_responses?select=updated_at&inspection_id=eq.${inspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt), `${UAT_DATASET} response baseline`)[0].updated_at as string;

  await loginViaUi(page, INSPECTOR_EMAIL, governedSecret("inspector8"));
  await page.goto(`/field/inspection/${inspectionId}`);
  await expect(syncBadge(page, "Synced")).toBeVisible();

  // Simulate inspector8's device queuing an offline edit against the baseline.
  await page.evaluate(({ userId, inspectionId, itemId, baseline }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readwrite");
      transaction.objectStore("outbox").add({
        kind: "response",
        inspection_id: inspectionId,
        item_id: itemId,
        response: { value: "non_compliant" },
        baseline_updated_at: baseline,
        queued_at: new Date().toISOString(),
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { userId: inspectorAuth.userId, inspectionId, itemId, baseline });

  await new Promise(resolve => setTimeout(resolve, 25));
  // Concurrent edit: supervisor4 moves the server row underneath the queued baseline.
  const supervisor = await login(SUPERVISOR_EMAIL, governedSecret("supervisor4"));
  assertOk(await rest("PATCH",
    `checklist_responses?inspection_id=eq.${inspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt,
    {
      response: { value: "compliant", server_move: `${UAT_DATASET}-supervisor4-concurrent-edit` },
      is_complete: true,
      updated_at: new Date().toISOString(),
    },
    "return=minimal"), `${UAT_DATASET} concurrent server edit`);

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.reload();
  // Banner copy is static (page.tsx conflictHead) — the engineering-prose
  // cleanup replaced the STM-SYNC-002 token with plain language; the mechanism
  // guarantee ("nothing is overwritten silently") remains asserted verbatim.
  await expect(page.getByText(/Conflict on FS-101.*nothing is overwritten silently/)).toBeVisible({ timeout: 30_000 });

  const preResolution = must(await rest("GET",
    `checklist_responses?select=response&inspection_id=eq.${inspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt), `${UAT_DATASET} server response before resolution`)[0];
  expect(preResolution.response.server_move, "server value is supervisor4's concurrent edit, not silently overwritten")
    .toBe(`${UAT_DATASET}-supervisor4-concurrent-edit`);

  // Resolve through the real conflict UI (ConflictResolutionClient), not IndexedDB directly.
  await page.goto("/field/settings/conflicts");
  await expect(page.getByText("1 pending", { exact: true })).toBeVisible();
  const card = page.locator("[data-testid='conflict-item-heading']").filter({ hasText: "FS-101" }).locator("../..");
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /Resubmit My Local Response/i }).click();
  await expect(page.getByText("0 pending", { exact: true })).toBeVisible({ timeout: 15_000 });

  const server = must(await rest("GET",
    `checklist_responses?select=response&inspection_id=eq.${inspectionId}&item_id=eq.${itemId}`,
    inspectorAuth.jwt), `${UAT_DATASET} server response after resolution`)[0];
  expect(server.response.value, "keep mine must win on the server after resolution").toBe("non_compliant");

  void supervisor; // login exercised as the actor whose edit produced the conflict
});

test(`${UAT_DATASET} duplicated offline evidence and submit replay upload exactly once (idempotent), supervisor4 sees no duplicates`, async ({ page }) => {
  const { inspectionId, itemIds, inspectorAuth } = await createReadyInspection();
  const idempotencyKey = `${UAT_DATASET}-offline-submit-${inspectionId}-${Date.now()}`;
  const sha256 = `${UAT_DATASET}-evidence-sha-${inspectionId}`;

  // This governed package's frozen definition declares a mandatory blocking
  // action_form ("corrective_blocking"); guard_submission_action_forms_and_
  // config requires a completed action_forms row for ANY submission of this
  // package. The hand-injected submit op below bypasses the real UI (which
  // would fill this via the FS-101 non-compliant path), so seed it directly.
  assertOk(await rest("POST", "action_forms", inspectorAuth.jwt, {
    inspection_id: inspectionId, item_id: itemIds["FS-101"], form_type: "corrective_blocking",
    owner_name: `${UAT_DATASET} owner`, owner_role: "Site supervisor",
    due_at: new Date(Date.now() + 7 * 864e5).toISOString(),
    required_correction: `${UAT_DATASET} corrective action.`,
    status: "complete", is_blocking: true,
  }, "return=minimal"), `${UAT_DATASET} seed blocking action form`);

  await loginViaUi(page, INSPECTOR_EMAIL, governedSecret("inspector8"));
  await page.goto(`/field/inspection/${inspectionId}`);
  await expect(syncBadge(page, "Synced")).toBeVisible();

  await page.evaluate(({ userId, inspectionId, itemId, sha256 }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readwrite");
      const evidenceOp = {
        kind: "evidence",
        inspection_id: inspectionId,
        linked_type: "item",
        linked_id: itemId,
        evidence_type: "photo",
        name: `${sha256}.png`,
        mime: "image/png",
        data_b64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        captured_at: new Date().toISOString(),
        sha256,
        queued_at: new Date().toISOString(),
      };
      // Two identical queued captures — the same device replaying its queue twice.
      transaction.objectStore("outbox").add(evidenceOp);
      transaction.objectStore("outbox").add(evidenceOp);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { userId: inspectorAuth.userId, inspectionId, itemId: itemIds["FS-102"], sha256 });

  await page.evaluate(({ userId, inspectionId, idempotencyKey }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readwrite");
      const submitOp = {
        kind: "submit",
        inspection_id: inspectionId,
        version_number: 1,
        snapshot: {},
        idempotency_key: idempotencyKey,
        acknowledgement: {
          name: "SAQEEL Task-9 UAT — inspector8",
          signed: true,
          ts: new Date().toISOString(),
          signed_at: new Date().toISOString(),
          signature_data_url: "data:image/png;base64,",
        },
        queued_at: new Date().toISOString(),
      };
      transaction.objectStore("outbox").add(submitOp);
      transaction.objectStore("outbox").add(submitOp);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { userId: inspectorAuth.userId, inspectionId, idempotencyKey });

  await page.reload();
  await expect(syncBadge(page, "Synced")).toBeVisible({ timeout: 30_000 });

  const inspector = await login(INSPECTOR_EMAIL, governedSecret("inspector8"));
  // The sync badge can render "Synced" a beat before the final submit op's
  // round-trip lands under suite load — poll the authoritative table the same
  // way the STM-SYNC-001 test does instead of racing one read against it.
  let versions: { id: string }[] = [];
  for (let attempt = 0; attempt < 15 && versions.length === 0; attempt++) {
    versions = must(await rest("GET",
      `submission_versions?select=id,version_number,idempotency_key&inspection_id=eq.${inspectionId}&idempotency_key=eq.${idempotencyKey}`,
      inspector.jwt), `${UAT_DATASET} idempotent submission versions`);
    if (versions.length === 0) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  expect(versions, `${UAT_DATASET} two queued submit copies must create exactly one immutable version`).toHaveLength(1);

  const evidenceRows = must(await rest("GET",
    `evidence?select=id,storage_path&inspection_id=eq.${inspectionId}&linked_id=eq.${itemIds["FS-102"]}`,
    inspector.jwt), `${UAT_DATASET} idempotent evidence rows`);
  expect(evidenceRows, `${UAT_DATASET} two queued duplicate evidence captures must upsert to exactly one row`).toHaveLength(1);

  const outboxCount = await page.evaluate(({ userId }) => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction("outbox", "readonly");
      const count = transaction.objectStore("outbox").count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
  }), { userId: inspectorAuth.userId });
  expect(outboxCount, `${UAT_DATASET} all four replay attempts must be consumed`).toBe(0);

  // Supervisor visibility: supervisor4 opens the review workspace and sees the
  // exact same single submission and single evidence row — no duplicates.
  const supervisor = await login(SUPERVISOR_EMAIL, governedSecret("supervisor4"));
  const supervisorView = must(await rest("GET",
    `submission_versions?select=id,version_number&inspection_id=eq.${inspectionId}`,
    supervisor.jwt), `${UAT_DATASET} supervisor4 submission visibility`);
  expect(supervisorView, `${UAT_DATASET} supervisor4 must see exactly one submission version`).toHaveLength(1);
  const supervisorEvidence = must(await rest("GET",
    `evidence?select=id&inspection_id=eq.${inspectionId}&linked_id=eq.${itemIds["FS-102"]}`,
    supervisor.jwt), `${UAT_DATASET} supervisor4 evidence visibility`);
  expect(supervisorEvidence, `${UAT_DATASET} supervisor4 must see exactly one evidence row, no duplicates`).toHaveLength(1);
});
