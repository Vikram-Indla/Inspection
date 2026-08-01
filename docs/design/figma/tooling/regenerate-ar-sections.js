/**
 * Regenerate the AR · RTL and AR · RTL · Dark sections from EN · Light.
 *
 * WHY THIS EXISTS
 * Figma has no RTL. There is no `direction` property, no `layoutDirection`, nothing that
 * mirrors a frame. The only way to produce an RTL screen is to reverse the children of
 * every horizontal auto-layout by hand — and instances do not allow child reordering, so
 * every instance has to be detached first.
 *
 * That is why the AR sections carry ~980 instances against ~2,265 in EN: they are
 * flattened. The consequence is that a component edit does NOT reach them.
 *
 * Rather than leave that as "someone must redo the AR sections by hand", this script makes
 * it one deterministic operation. Edit a component, run this, and AR is correct again.
 *
 * HOW TO RUN
 * Paste into the Figma plugin console (or hand to an agent with the Figma MCP) with the
 * SAQEEL file open. It is destructive to the AR sections by design: it deletes and rebuilds
 * the screen frames inside them. Nothing outside those two sections is touched.
 *
 * INPUT
 * `AR_INDEX` must be the contents of docs/design/figma/i18n/ar-index.json. Regenerate that
 * first with `python3 docs/design/figma/i18n/build-ar-index.py`, then paste it below.
 * Strings with no entry stay English — this script never invents Arabic, per CLAUDE.md
 * rule 8, which keeps Arabic in the reviewed i18n layer.
 */

const AR_INDEX = {/* paste docs/design/figma/i18n/ar-index.json here */};

const SCREENS_PAGE_ID = '6:9';
const COLOR_COLLECTION = 'VariableCollectionId:3:2';
const SHADOW_COLLECTION = 'VariableCollectionId:5:2';
const DARK_COLOR_MODE = '3:1';
const DARK_SHADOW_MODE = '5:1';

const page = await figma.getNodeByIdAsync(SCREENS_PAGE_ID);
await figma.setCurrentPageAsync(page);

const sections = page.children.filter(c => c.type === 'SECTION');
const en   = sections.find(s => s.name.includes('EN · Light') && !s.name.includes('STATES'));
const ar   = sections.find(s => s.name.trim().startsWith('SCREENS — AR · RTL  '));
const arDk = sections.find(s => s.name.includes('AR · RTL · Dark'));

// Load every font the file uses before touching text, including the Arabic face.
const available = await figma.listAvailableFontsAsync();
for (const style of ['Regular', 'Medium', 'SemiBold', 'Bold', 'Light']) {
  for (const family of ['IBM Plex Sans', 'IBM Plex Mono', 'Noto Sans Arabic']) {
    if (available.some(a => a.fontName.family === family && a.fontName.style === style)) {
      await figma.loadFontAsync({ family, style });
    }
  }
}

const arabicStyle = s => ['Regular', 'Medium', 'SemiBold', 'Bold'].includes(s) ? s : 'Regular';

/** Mirror one cloned frame in place. */
function mirror(node) {
  // Reverse only HORIZONTAL stacks. On a vertical stack the inline axis is the CROSS
  // axis, so the fix there is counterAxisAlignItems, handled below.
  if ('layoutMode' in node && node.layoutMode === 'HORIZONTAL' && node.children && node.children.length > 1) {
    for (const child of [...node.children]) node.insertChild(0, child);
  }
  // A hugging child of a vertical stack sits wherever counterAxisAlignItems says. Under
  // RTL that has to flip, or every section title clings to the wrong edge.
  if ('layoutMode' in node && node.layoutMode === 'VERTICAL') {
    if (node.counterAxisAlignItems === 'MIN') node.counterAxisAlignItems = 'MAX';
    else if (node.counterAxisAlignItems === 'MAX') node.counterAxisAlignItems = 'MIN';
  }
  // Asymmetric inline padding swaps sides.
  if ('paddingLeft' in node && node.paddingLeft !== node.paddingRight) {
    const l = node.paddingLeft;
    node.paddingLeft = node.paddingRight;
    node.paddingRight = l;
  }
  if (node.type === 'TEXT') {
    if (node.textAlignHorizontal === 'LEFT') node.textAlignHorizontal = 'RIGHT';
    else if (node.textAlignHorizontal === 'RIGHT') node.textAlignHorizontal = 'LEFT';
    const translated = AR_INDEX[node.characters];
    if (translated) {
      const style = node.fontName && node.fontName.style ? arabicStyle(node.fontName.style) : 'Regular';
      node.fontName = { family: 'Noto Sans Arabic', style };
      node.characters = translated;
    }
  }
  if (node.children) for (const child of node.children) mirror(child);
}

const report = { rebuilt: [], skipped: [], translated: 0, stillEnglish: 0 };

for (const [section, isDark] of [[ar, false], [arDk, true]]) {
  for (const frame of [...section.children]) frame.remove();

  const dy = section.y - en.y;
  for (const source of en.children) {
    const clone = source.clone();
    section.appendChild(clone);
    clone.x = source.x;
    clone.y = source.y + dy;
    clone.name = source.name.replace('EN · Light', isDark ? 'AR · RTL · Dark' : 'AR · RTL');

    // Detach every instance so children can be reordered. This is the step that costs the
    // component link, and the reason this script exists.
    let guard = 0, instance;
    while ((instance = clone.findOne(n => n.type === 'INSTANCE')) && guard++ < 6000) {
      instance.detachInstance();
    }

    mirror(clone);

    if (isDark) {
      clone.setExplicitVariableModeForCollection(COLOR_COLLECTION, DARK_COLOR_MODE);
      clone.setExplicitVariableModeForCollection(SHADOW_COLLECTION, DARK_SHADOW_MODE);
    }

    // The notification badge is absolutely positioned; under RTL it moves to the other
    // edge. saqeel-runtime.css:967 — inset-inline-end: 1px, inset-block-start: 2px, 18px.
    for (const button of clone.findAll(n => n.name === 'btn-notifications')) {
      const badge = button.children.find(c => c.name === 'notif-count');
      if (!badge) continue;
      badge.resize(18, 18);
      badge.x = 1;
      badge.y = 2;
      if ('cornerRadius' in badge) badge.cornerRadius = 9;
    }

    report.rebuilt.push(clone.name);
  }

  const right = section.children.reduce((a, c) => Math.max(a, c.x + c.width), 0);
  const bottom = section.children.reduce((a, c) => Math.max(a, c.y + c.height), 0);
  section.resizeWithoutConstraints(right - section.x + 80, bottom - section.y + 80);
  section.name = `SCREENS — AR · RTL${isDark ? ' · Dark' : ''}  (${section.children.length} routes)`;
}

// Honest coverage number rather than a claim of completeness.
for (const frame of ar.children) {
  for (const text of frame.findAll(n => n.type === 'TEXT')) {
    if (/[؀-ۿ]/.test(text.characters)) report.translated++;
    else if (/[A-Za-z]{3}/.test(text.characters)) report.stillEnglish++;
  }
}

/* ROLE PARITY — the assertion that would have caught the worst AR bug.
 *
 * On 2026-08-01 the AR review-queue card had the identifier sitting inside the status
 * badge and the status sitting in the id node, with the two metrics also transposed. The
 * node TREE was identical to EN, so every structural check passed. Only the content was
 * in the wrong places, and no amount of counting nodes finds that.
 *
 * So assert on meaning: a node named `id-code` must hold an identifier in AR exactly as
 * it does in EN. Compare EN and AR frame by frame, node name by node name. */
const IDENTIFIER = /^[A-Z]{2,5}-\d{2,6}$/;
const KIND = value => {
  const v = String(value).trim();
  if (!v) return 'empty';
  if (IDENTIFIER.test(v)) return 'identifier';
  if (/^[\d.,]+\s*%?$/.test(v)) return 'number';
  if (/[؀-ۿ]/.test(v)) return 'arabic';
  if (/[A-Za-z]/.test(v)) return 'latin';
  return 'other';
};

// Latin and arabic are the expected difference between the two sections; anything else
// changing kind means content moved between nodes.
const EQUIVALENT = (a, b) =>
  a === b || (a === 'latin' && b === 'arabic') || (a === 'arabic' && b === 'latin');

/* Compare ONLY names that occur once in a frame. Those are semantic slots — `id-code`,
 * `facility`, `score`. A name repeated across table rows (`cell-text`) is positional, and
 * RTL legitimately reorders those, so pairing them by index compares different cells.
 *
 * Learned the hard way: the first version of this check did pair by index and reported
 * 210 violations, every one of them an artifact of that reordering. A checker that cries
 * wolf is worse than no checker, because the real signal drowns. */
const collectUniqueSlots = frame => {
  const all = {};
  for (const t of frame.findAll(n => n.type === 'TEXT' && n.name)) {
    (all[t.name] = all[t.name] || []).push(t);
  }
  const slots = {};
  for (const name of Object.keys(all)) {
    if (all[name].length === 1) slots[name] = KIND(all[name][0].characters);
  }
  return slots;
};

report.parity = { checked: 0, violations: [] };
for (const enFrame of en.children) {
  const base = enFrame.name.replace(' — EN · Light', '');
  const arFrame = ar.children.find(f => f.name.replace(' — AR · RTL', '') === base);
  if (!arFrame) continue;
  const enSlots = collectUniqueSlots(enFrame), arSlots = collectUniqueSlots(arFrame);
  for (const name of Object.keys(enSlots)) {
    if (!(name in arSlots)) continue;
    report.parity.checked++;
    if (!EQUIVALENT(enSlots[name], arSlots[name])) {
      report.parity.violations.push(
        `${base.split(' — ')[0]} · "${name}" EN=${enSlots[name]} AR=${arSlots[name]}`);
    }
  }
}

return report;
