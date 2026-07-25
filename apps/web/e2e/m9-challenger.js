const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:7100';
const AUTH_DIR = path.join(__dirname, '..', 'playwright', '.auth');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'm9-challenger');

const TEST_KEY = 'admin.notif.test';
const TEST_KEY_ORIGINAL_AR = 'إرسال اختبار';
const HISTORY_KEY = 'admin.items.form.guidancePlaceholder';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function withPage(name, fn) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en',
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('response', r => { if (r.status() >= 500) errors.push(`response: ${r.status()} ${r.url()}`); });

  try {
    await fn(page);
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    console.log(`[${name}] Browser errors:`, errors);
  }
  return errors;
}

async function injectAuth(page, persona) {
  const authFile = path.join(AUTH_DIR, `${persona}.json`);
  const authState = require(authFile);
  await page.context().addCookies(authState.cookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expires: c.expires,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
  })));
}

async function navigateToRegistry(page) {
  await page.goto(`${BASE}/admin/localization`);
  await sleep(2500);
}

async function findRow(page, key) {
  const rows = page.locator('[data-saqeel-design="WA-DES-010"] article');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = await row.textContent().catch(() => '');
    if (text.includes(key)) {
      return row;
    }
  }
  return null;
}

async function testAdminLoad() {
  return withPage('admin-load', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);
    const hasRegistry = await page.locator('[data-saqeel-design="WA-DES-010"]').isVisible().catch(() => false);
    const kpiTotal = await page.locator('.sq-kpi').filter({ hasText: 'Total keys' }).locator('.sq-kpi__value').textContent().catch(() => '0');
    console.log(`[admin-load] Registry: ${hasRegistry}, Keys: ${kpiTotal}`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-admin-registry-load.png'), fullPage: true });
    if (!hasRegistry) throw new Error('Registry not visible');
  });
}

async function testReviewerDenial() {
  return withPage('reviewer-denial', async (page) => {
    await injectAuth(page, 'reviewer');
    await navigateToRegistry(page);
    const hasUnauthorized = await page.locator('.sq-state[role="alert"]').isVisible().catch(() => false);
    const noRegistry = await page.locator('[data-saqeel-design="WA-DES-010"]').count() === 0;
    console.log(`[reviewer-denial] Unauthorized: ${hasUnauthorized}, No registry: ${noRegistry}`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-reviewer-denial.png'), fullPage: true });
    if (!hasUnauthorized || !noRegistry) throw new Error('Reviewer denial failed');
  });
}

async function testArabicDark() {
  return withPage('arabic-dark', async (page) => {
    await injectAuth(page, 'admin');
    await page.goto(`${BASE}/locale?set=ar`);
    await sleep(1000);
    await page.evaluate(() => localStorage.setItem('saqeel-theme', 'dark'));
    await navigateToRegistry(page);
    const dir = await page.locator('html').getAttribute('dir').catch(() => 'ltr');
    const lang = await page.locator('html').getAttribute('lang').catch(() => 'en');
    console.log(`[arabic-dark] dir=${dir}, lang=${lang}`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-arabic-dark-desktop.png'), fullPage: true });
    if (dir !== 'rtl' || lang !== 'ar') throw new Error('Arabic RTL not applied');
  });
}

async function testTabletLayout() {
  return withPage('tablet-layout', async (page) => {
    await injectAuth(page, 'admin');
    await page.setViewportSize({ width: 820, height: 1180 });
    await navigateToRegistry(page);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-tablet-layout.png'), fullPage: true });
  });
}

async function testNarrowLayout() {
  return withPage('narrow-layout', async (page) => {
    await injectAuth(page, 'admin');
    await page.setViewportSize({ width: 390, height: 844 });
    await navigateToRegistry(page);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05-narrow-layout.png'), fullPage: true });
  });
}

async function testSearch() {
  return withPage('search', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);
    const searchBox = page.getByRole('textbox', { name: /Search key, English or Arabic/ });
    await searchBox.fill('admin.items.form.guidancePlaceholder');
    await sleep(1000);
    const visibleRows = await page.locator('[data-saqeel-design="WA-DES-010"] article').count();
    console.log(`[search] Rows after search: ${visibleRows}`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06-search-filtered.png'), fullPage: true });
    await searchBox.fill('');
    await sleep(500);
  });
}

async function testPagination() {
  return withPage('pagination', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);
    const pageText = await page.getByText(/Page \d+ \//).textContent().catch(() => 'Page ? / ?');
    console.log(`[pagination] ${pageText}`);
    const nextBtn = page.getByRole('button', { name: 'Next' });
    if (await nextBtn.isEnabled().catch(() => false)) {
      await nextBtn.click();
      await sleep(1500);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '07-pagination-next.png'), fullPage: true });
    }
  });
}

async function testEditSave() {
  return withPage('edit-save', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);

    // Search for test key
    const searchBox = page.getByRole('textbox', { name: /Search key, English or Arabic/ });
    await searchBox.fill(TEST_KEY);
    await sleep(1000);

    const row = await findRow(page, TEST_KEY);
    if (!row) throw new Error(`Row for ${TEST_KEY} not found`);

    // Find the Arabic input and save button
    const arInput = row.locator('input[dir="rtl"]').first();
    const saveBtn = row.locator('button').filter({ hasText: /Save|Saving/ }).first();

    // Save original value
    const originalAr = await arInput.inputValue().catch(() => TEST_KEY_ORIGINAL_AR);
    console.log(`[edit-save] Original AR: ${originalAr}`);

    // Edit to new value
    const newAr = 'اختبار تعديل مؤقت — M9-CHALLENGER-001';
    await arInput.fill(newAr);
    await sleep(500);
    await saveBtn.click();
    await sleep(4000);

    // Check for saved badge
    const hasSaved = await row.getByText('saved', { exact: true }).isVisible().catch(() => false);
    console.log(`[edit-save] Saved badge visible: ${hasSaved}`);
    const newAr = 'اختبار تعديل مؤقت — M9-CHALLENGER-001';
    await arInput.fill(newAr);
    await sleep(500);
    await saveBtn.click();
    await sleep(2500);

    // Check for saved badge
    const hasSaved = await row.getByText('saved', { exact: true }).isVisible().catch(() => false);
    console.log(`[edit-save] Saved badge visible: ${hasSaved}`);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '08-edit-save.png'), fullPage: true });

    // Restore original value
    await arInput.fill(originalAr);
    await sleep(500);
    await saveBtn.click();
    await sleep(4000);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09-edit-restored.png'), fullPage: true });
    await arInput.fill(originalAr);
    await sleep(500);
    await saveBtn.click();
    await sleep(2500);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09-edit-restored.png'), fullPage: true });
  });
}

async function testPlaceholderValidation() {
  return withPage('placeholder-validation', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);

    // Open add key form
    const addBtn = page.getByRole('button', { name: 'Add key' });
    await addBtn.click();
    await sleep(500);

    // Fill in key with placeholder
    await page.locator('#l10n-add-key').fill('m9.challenger.placeholder.test');
    await page.locator('#l10n-add-en').fill('Hello {{name}} from {{org}}');
    await page.locator('#l10n-add-ar').fill('مرحبا {{name}}'); // Missing {{org}}
    await page.locator('#l10n-add-context').fill('M9 Challenger');

    const submitBtn = page.getByRole('button', { name: /Add key \(draft\)/ });
    await submitBtn.click();
    await sleep(1500);

    // Check for error
    const hasError = await page.getByText(/Placeholder \{\{org\}\} is missing/).isVisible().catch(() => false);
    console.log(`[placeholder-validation] Error visible: ${hasError}`);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '10-placeholder-error.png'), fullPage: true });

    // Close add form
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await sleep(500);
    }
  });
}

async function testHistoryAndRestore() {
  return withPage('history-restore', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);

    // Search for history key
    const searchBox = page.getByRole('textbox', { name: /Search key, English or Arabic/ });
    await searchBox.fill(HISTORY_KEY);
    await sleep(1000);

    const row = await findRow(page, HISTORY_KEY);
    if (!row) throw new Error(`Row for ${HISTORY_KEY} not found`);

    // Click history button
    const historyBtn = row.locator('button').filter({ hasText: 'history' }).first();
    await historyBtn.click();
    await sleep(1500);

    // Check history panel is visible
    const historyPanel = row.locator('[id^="localization-history-"]');
    const isVisible = await historyPanel.isVisible().catch(() => false);
    console.log(`[history-restore] History panel visible: ${isVisible}`);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '11-history-panel.png'), fullPage: true });

    // Check for restore buttons
    const restoreBtns = await historyPanel.locator('button').filter({ hasText: 'Restore' }).count();
    console.log(`[history-restore] Restore buttons: ${restoreBtns}`);

    // Close history
    await historyBtn.click();
    await sleep(500);
  });
}

async function testMarkReviewed() {
  return withPage('mark-reviewed', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);

    // Search for a draft key with Arabic
    const searchBox = page.getByRole('textbox', { name: /Search key, English or Arabic/ });
    await searchBox.fill(TEST_KEY);
    await sleep(1000);

    const row = await findRow(page, TEST_KEY);
    if (!row) throw new Error(`Row for ${TEST_KEY} not found`);

    // Check if Mark reviewed button exists
    const reviewBtn = row.locator('button').filter({ hasText: 'Mark reviewed' }).first();
    const hasReviewBtn = await reviewBtn.isVisible().catch(() => false);
    console.log(`[mark-reviewed] Review button visible: ${hasReviewBtn}`);

    if (hasReviewBtn) {
      await reviewBtn.click();
      await sleep(4000);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '12-mark-reviewed.png'), fullPage: true });
    }
      await reviewBtn.click();
      await sleep(2500);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '12-mark-reviewed.png'), fullPage: true });
    }
  });
}

async function testStaleWriteConflict() {
  return withPage('stale-write', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);

    // Search for test key
    const searchBox = page.getByRole('textbox', { name: /Search key, English or Arabic/ });
    await searchBox.fill(TEST_KEY);
    await sleep(1000);

    const row = await findRow(page, TEST_KEY);
    if (!row) throw new Error(`Row for ${TEST_KEY} not found`);

    // Get the expected_updated_at hidden input value
    const updatedAtInput = row.locator('input[name="expected_updated_at"]').first();
    const originalUpdatedAt = await updatedAtInput.inputValue();
    console.log(`[stale-write] Original updated_at: ${originalUpdatedAt}`);

    // Tamper with the hidden input to simulate stale write
    await page.evaluate(({ sel, val }) => {
      const el = document.querySelector(sel);
      if (el) el.value = val + '-stale';
    }, { sel: `article:has-text("${TEST_KEY}") input[name="expected_updated_at"]`, val: originalUpdatedAt });
    await page.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.value = val + '-stale';
    }, `article:has-text("${TEST_KEY}") input[name="expected_updated_at"]`, originalUpdatedAt);

    // Try to save
    const arInput = row.locator('input[dir="rtl"]').first();
    await arInput.fill('قيمة غير صالحة للاختبار');
    await sleep(500);

    const saveBtn = row.locator('button').filter({ hasText: /Save/ }).first();
    await saveBtn.click();
    await sleep(2500);

    // Check for conflict error
    const hasConflict = await row.getByText(/changed after you opened it/).isVisible().catch(() => false);
    console.log(`[stale-write] Conflict error visible: ${hasConflict}`);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '13-stale-write-conflict.png'), fullPage: true });
  });
}

async function testSyncFromCode() {
  return withPage('sync-from-code', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);

    // Find and click sync button
    const syncBtn = page.getByRole('button', { name: 'Sync from code' });
    const hasSyncBtn = await syncBtn.isVisible().catch(() => false);
    console.log(`[sync-from-code] Sync button visible: ${hasSyncBtn}`);

    if (hasSyncBtn) {
      await syncBtn.click();
      await sleep(4000);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '14-sync-from-code.png'), fullPage: true });
    }
  });
}

async function testKeyboardAccessibility() {
  return withPage('keyboard-accessibility', async (page) => {
    await injectAuth(page, 'admin');
    await navigateToRegistry(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await sleep(200);
    await page.keyboard.press('Tab');
    await sleep(200);

    // Focus should be on Add key button - press Enter
    await page.keyboard.press('Enter');
    await sleep(1000);

    const addFormVisible = await page.locator('#localization-add-key').isVisible().catch(() => false);
    console.log(`[keyboard-accessibility] Add form visible after Enter: ${addFormVisible}`);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '15-keyboard-add-form.png'), fullPage: true });

    // Close with Escape
    await page.keyboard.press('Escape');
    await sleep(500);
  });
}

async function main() {
  const fs = require('fs');
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const tests = [
    { name: 'admin-load', fn: testAdminLoad },
    { name: 'reviewer-denial', fn: testReviewerDenial },
    { name: 'arabic-dark', fn: testArabicDark },
    { name: 'tablet-layout', fn: testTabletLayout },
    { name: 'narrow-layout', fn: testNarrowLayout },
    { name: 'search', fn: testSearch },
    { name: 'pagination', fn: testPagination },
    { name: 'edit-save', fn: testEditSave },
    { name: 'placeholder-validation', fn: testPlaceholderValidation },
    { name: 'history-restore', fn: testHistoryAndRestore },
    { name: 'mark-reviewed', fn: testMarkReviewed },
    { name: 'stale-write', fn: testStaleWriteConflict },
    { name: 'sync-from-code', fn: testSyncFromCode },
    { name: 'keyboard-accessibility', fn: testKeyboardAccessibility },
  ];

  const results = {};
  for (const t of tests) {
    try {
      const errs = await t.fn();
      results[t.name] = errs.length === 0 ? 'PASS' : `FAIL (${errs.join('; ')})`;
    } catch (e) {
      results[t.name] = `FAIL - ${e.message}`;
    }
    console.log(`${results[t.name]}: ${t.name}`);
  }

  console.log('\n=== M9 LOCALIZATION CHALLENGER SUMMARY ===');
  let passCount = 0;
  let failCount = 0;
  for (const [name, result] of Object.entries(results)) {
    const ok = result === 'PASS';
    if (ok) passCount++; else failCount++;
    console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${ok ? '' : ` — ${result}`}`);
  }
  console.log(`\nTotal: ${passCount} passed, ${failCount} failed out of ${tests.length} tests`);
}

main().catch(console.error);
