// SAQEEL Runner — local Figma dev plugin.
//
// Purpose: run Plugin API scripts against the Web master without going through
// the Figma MCP server, which is metered per seat/plan. Nothing here talks to
// the network.
//
// IMPORTANT for anyone editing this file: the convenience helpers available in
// the MCP `use_figma` tool — node.query(), node.set(), figma.createAutoLayout(),
// await node.screenshot() — DO NOT EXIST in the real Plugin API. Use findAll,
// findAllWithCriteria and plain property assignment. figma.notify() does work
// here (it only throws inside use_figma).

figma.showUI(__html__, { width: 720, height: 620 });

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function summarise(node, depth) {
  const out = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: 'width' in node ? Math.round(node.width) : null,
  };

  if (node.type === 'TEXT') {
    out.characters = node.characters;
    out.fontSize = node.fontSize;
    out.fontSizeBound = !!(node.boundVariables && node.boundVariables.fontSize);
    out.textStyleId = node.textStyleId || null;
    out.textAutoResize = node.textAutoResize;
    out.textAlignHorizontal = node.textAlignHorizontal;
  }

  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    out.layoutMode = node.layoutMode;
    out.primaryAxisAlignItems = node.primaryAxisAlignItems;
    out.counterAxisAlignItems = node.counterAxisAlignItems;
    out.itemSpacing = node.itemSpacing;
  }

  if ('layoutSizingHorizontal' in node) {
    out.layoutSizingHorizontal = node.layoutSizingHorizontal;
    out.layoutAlign = node.layoutAlign;
  }

  // The trap A8 documented: FILL is silently rejected on a node left in this
  // inconsistent state, and the same call also resets textAutoResize to NONE.
  if (out.layoutAlign === 'STRETCH' && out.layoutSizingHorizontal === 'FIXED') {
    out.WARNING_STRETCH_FIXED = 'FILL will be silently rejected on this node; it must be rebuilt';
  }

  if ('fills' in node && Array.isArray(node.fills)) {
    out.fills = node.fills.map(function (f) {
      return {
        type: f.type,
        bound: !!(node.boundVariables && node.boundVariables.fills),
        visible: f.visible !== false,
      };
    });
  }

  if (depth > 0 && 'children' in node) {
    out.children = node.children.map(function (c) { return summarise(c, depth - 1); });
  }

  return out;
}

// Find FLOAT variables whose value in any mode equals `size`, scoped to font size.
async function fontSizeTokenCandidates(size) {
  const vars = await figma.variables.getLocalVariablesAsync('FLOAT');
  const hits = [];

  for (const v of vars) {
    const scopeOk = v.scopes.indexOf('ALL_SCOPES') !== -1 || v.scopes.indexOf('FONT_SIZE') !== -1;
    if (!scopeOk) continue;

    const values = Object.keys(v.valuesByMode).map(function (m) { return v.valuesByMode[m]; });
    if (values.indexOf(size) !== -1) {
      hits.push({ id: v.id, name: v.name, scopes: v.scopes, valuesByMode: v.valuesByMode });
    }
  }

  return hits;
}

async function loadFontsFor(textNode) {
  const segs = textNode.getStyledTextSegments(['fontName']);
  for (const s of segs) await figma.loadFontAsync(s.fontName);
  return segs.map(function (s) { return s.fontName; });
}

// ---------------------------------------------------------------------------
// preset: inspect page-back
// ---------------------------------------------------------------------------

async function inspectPageBack() {
  const node = await figma.getNodeByIdAsync('401:47774');
  if (!node) return { error: 'page-back 401:47774 not found in this file' };

  const texts = node.findAllWithCriteria
    ? node.findAllWithCriteria({ types: ['TEXT'] })
    : node.findAll(function (n) { return n.type === 'TEXT'; });

  const unbound = [];
  for (const t of texts) {
    if (!(t.boundVariables && t.boundVariables.fontSize)) {
      unbound.push({
        id: t.id,
        name: t.name,
        characters: t.characters,
        fontSize: t.fontSize,
        textStyleId: t.textStyleId || null,
        candidates: await fontSizeTokenCandidates(t.fontSize),
      });
    }
  }

  const instances = figma.root.findAllWithCriteria
    ? figma.root.findAllWithCriteria({ types: ['INSTANCE'] })
    : [];

  let instanceCount = 0;
  for (const i of instances) {
    const mc = await i.getMainComponentAsync();
    if (mc && (mc.id === node.id || (mc.parent && mc.parent.id === node.id))) instanceCount++;
  }

  return {
    component: summarise(node, 3),
    unboundFontSizes: unbound,
    liveInstanceCount: instanceCount,
    note: 'Bind only to a token that already exists. If candidates is empty or has more than one entry, STOP and report — do not guess.',
  };
}

// ---------------------------------------------------------------------------
// preset: inspect Select
// ---------------------------------------------------------------------------

async function inspectSelect() {
  await figma.loadAllPagesAsync();

  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
    .filter(function (n) { return /select/i.test(n.name); });

  if (!sets.length) return { error: 'no component named Select found' };

  const report = sets.map(function (set) {
    const rows = [];
    const frames = set.findAll(function (n) {
      return 'layoutMode' in n && n.layoutMode === 'HORIZONTAL';
    });

    for (const f of frames) {
      rows.push({
        id: f.id,
        name: f.name,
        variantPath: f.parent ? f.parent.name : null,
        primaryAxisAlignItems: f.primaryAxisAlignItems,
        counterAxisAlignItems: f.counterAxisAlignItems,
        layoutSizingHorizontal: f.layoutSizingHorizontal,
        childNames: f.children.map(function (c) { return c.name + ':' + c.type; }),
        suspect: f.primaryAxisAlignItems === 'CENTER',
      });
    }

    return { id: set.id, name: set.name, type: set.type, rows: rows };
  });

  return {
    sets: report,
    note: 'Rows with suspect:true centre their content instead of pushing label left / chevron right. Confirm each is really the label+chevron row before changing it — some centred rows are correct.',
  };
}

// ---------------------------------------------------------------------------
// writes — both take explicit node IDs, discovered by the inspect presets first
// ---------------------------------------------------------------------------

async function bindFontSizes(pairs) {
  const done = [];
  for (const p of pairs) {
    const node = await figma.getNodeByIdAsync(p.nodeId);
    if (!node || node.type !== 'TEXT') { done.push({ nodeId: p.nodeId, error: 'not a TEXT node' }); continue; }

    const variable = await figma.variables.getVariableByIdAsync(p.variableId);
    if (!variable) { done.push({ nodeId: p.nodeId, error: 'variable not found' }); continue; }

    const before = node.fontSize;
    await loadFontsFor(node);
    node.setBoundVariable('fontSize', variable);

    done.push({
      nodeId: node.id,
      variable: variable.name,
      fontSizeBefore: before,
      fontSizeAfter: node.fontSize,
      bound: !!(node.boundVariables && node.boundVariables.fontSize),
      unchangedVisually: before === node.fontSize,
    });
  }
  return { mutatedNodeIds: done.map(function (d) { return d.nodeId; }), results: done };
}

async function setPrimaryAxisAlign(nodeIds, value) {
  const done = [];
  for (const id of nodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (!node || !('primaryAxisAlignItems' in node)) { done.push({ id: id, error: 'no auto-layout on node' }); continue; }
    const before = node.primaryAxisAlignItems;
    node.primaryAxisAlignItems = value;
    done.push({ id: id, name: node.name, before: before, after: node.primaryAxisAlignItems });
  }
  return { mutatedNodeIds: nodeIds, results: done };
}

// ---------------------------------------------------------------------------
// message bridge
// ---------------------------------------------------------------------------

figma.ui.onmessage = async function (msg) {
  let result;
  try {
    if (msg.type === 'inspect-page-back') {
      result = await inspectPageBack();
    } else if (msg.type === 'inspect-select') {
      result = await inspectSelect();
    } else if (msg.type === 'bind-font-sizes') {
      result = await bindFontSizes(JSON.parse(msg.payload));
    } else if (msg.type === 'set-align') {
      const cfg = JSON.parse(msg.payload);
      result = await setPrimaryAxisAlign(cfg.nodeIds, cfg.value || 'SPACE_BETWEEN');
    } else if (msg.type === 'run-script') {
      // Arbitrary script channel. The body is wrapped in an async function so
      // top-level await and `return` both work, matching use_figma semantics.
      const fn = new Function('figma', 'summarise', 'loadFontsFor', 'fontSizeTokenCandidates',
        '"use strict"; return (async () => {' + msg.payload + '})();');
      result = await fn(figma, summarise, loadFontsFor, fontSizeTokenCandidates);
    } else {
      result = { error: 'unknown message type: ' + msg.type };
    }
  } catch (e) {
    result = { error: String(e && e.message ? e.message : e), stack: e && e.stack ? String(e.stack) : null };
  }

  figma.ui.postMessage({ type: 'result', result: result });
};
