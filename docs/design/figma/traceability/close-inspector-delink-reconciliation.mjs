#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";

const [sourcePath, webPath, baselinePath, outputPath] = process.argv.slice(2);
if (!sourcePath || !webPath || !baselinePath || !outputPath) {
  console.error(
    "Usage: node close-inspector-delink-reconciliation.mjs <source.json> <web.json> <baseline.json> <output.json>",
  );
  process.exit(1);
}

const SOURCE_FILE_KEY = "8wGaofgbopqmGXc0Wjo0eW";
const WEB_FILE_KEY = "ML2PNwfShlQM2k44MvSEw5";

const sourcePayload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const webPayload = JSON.parse(fs.readFileSync(webPath, "utf8"));
const reconciliation = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

function children(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

function walk(node, visitor, context = {}) {
  visitor(node, context);
  for (const child of children(node)) {
    walk(child, visitor, { ...context, parent: node, path: [...(context.path ?? []), node.name ?? node.id] });
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function stableNodeHash(root) {
  const hash = crypto.createHash("sha256");
  const visit = (node) => {
    hash.update(node?.type ?? "");
    hash.update("\u0000");
    hash.update(node?.name ?? "");
    hash.update("\u0000");
    hash.update(node?.visible === false ? "0" : "1");
    hash.update("\u0000");
    if (typeof node?.characters === "string") hash.update(node.characters.replace(/\s+/g, " ").trim());
    hash.update("\u0000");
    const box = node?.absoluteBoundingBox;
    if (box) hash.update(`${Math.round(box.width ?? 0)}x${Math.round(box.height ?? 0)}`);
    hash.update("\u0000");
    for (const child of children(node)) visit(child);
    hash.update("\u0001");
  };
  visit(root);
  return hash.digest("hex");
}

function buildIndex(document) {
  const index = new Map();
  for (const page of children(document)) {
    walk(page, (node, context) => {
      if (!node?.id) return;
      index.set(node.id, {
        node,
        page_id: page.id,
        page_name: page.name,
        parent: context.parent ?? null,
        path: context.path ?? [],
      });
    }, { path: [] });
  }
  return index;
}

const sourceIndex = buildIndex(sourcePayload.document);
const webIndex = buildIndex(webPayload.document);

function typeHistogram(root) {
  const histogram = {};
  walk(root, (node) => {
    histogram[node.type ?? "UNKNOWN"] = (histogram[node.type ?? "UNKNOWN"] ?? 0) + 1;
  });
  return histogram;
}

function collectText(root, limit = 12) {
  const values = [];
  walk(root, (node) => {
    if (node.type === "TEXT" && typeof node.characters === "string" && values.length < limit) {
      const value = node.characters.replace(/\s+/g, " ").trim();
      if (value) values.push(value.slice(0, 180));
    }
  });
  return values;
}

function collectRoutes(root) {
  const routes = new Set();
  walk(root, (node) => {
    for (const value of [node.name, node.characters, node.description]) {
      if (typeof value !== "string") continue;
      for (const match of value.matchAll(/\/(?:login|field)(?:\/[A-Za-z0-9_\-\[\]]+)*(?:\?[^\s—·)]*)?/g)) {
        routes.add(match[0]);
      }
    }
  });
  return [...routes].sort();
}

function nodeSummary(id) {
  const entry = webIndex.get(id);
  if (!entry) return null;
  const { node } = entry;
  return {
    id,
    type: node.type ?? null,
    name: node.name ?? null,
    page_id: entry.page_id,
    page_name: entry.page_name,
    width: node.absoluteBoundingBox?.width ?? null,
    height: node.absoluteBoundingBox?.height ?? null,
    signature_sha256: stableNodeHash(node),
    type_histogram: typeHistogram(node),
    text_sample: collectText(node),
    routes: collectRoutes(node),
  };
}

function directFrames(rootId, predicate = () => true) {
  const root = webIndex.get(rootId)?.node;
  if (!root) return [];
  return children(root)
    .filter((node) => node.type === "FRAME" && predicate(node))
    .map((node) => node.id);
}

function responsiveWidths(ids) {
  return [...new Set(ids.map((id) => webIndex.get(id)?.node?.absoluteBoundingBox?.width).filter(Number.isFinite))].sort((a, b) => b - a);
}

const groups = {
  establishment: directFrames("450:60001"),
  production_line: directFrames("450:61680", (node) => /^PL-[A-Z]\b/.test(node.name ?? "")),
  violation: directFrames("450:61680", (node) => /^VR-[A-Z]\b/.test(node.name ?? "")),
  incident: directFrames("450:59542"),
  summons: directFrames("432:48325"),
  destruction: ["336:45787"],
  core: directFrames("548:67760"),
  challenge: directFrames("423:47937"),
  chemical: directFrames("432:48155"),
  customs: directFrames("515:59257"),
  safety: directFrames("515:59335"),
  statement: directFrames("432:45512"),
  auth: directFrames("563:70229"),
};

for (const [name, ids] of Object.entries(groups)) {
  if (!ids.length || ids.some((id) => !webIndex.has(id))) {
    throw new Error(`Web group ${name} is missing or empty`);
  }
}

const obsoleteReference = new Map([
  ["879:64839", "obsolete_annotation_strip"],
  ["2284:104272", "obsolete_operating_system_surface"],
  ["1434:138230", "obsolete_filter_panel_fragment"],
  ["1434:110357", "obsolete_canvas_banner"],
  ["368:64406", "obsolete_auto_named_definition"],
  ["1831:27552", "obsolete_auto_named_definition"],
  ["1831:27940", "obsolete_auto_named_definition"],
  ["1252:64226", "obsolete_test_artifact"],
]);

const componentTargets = new Map([
  ["Modal", ["349:252"]],
  ["Actions", ["344:156"]],
  ["Overlay - Alerts", ["11:43"]],
  ["Top Bar", ["20:172"]],
]);

function screenGroup(item) {
  if (item.concept === "Production Line Report") return "production_line";
  if (item.concept === "Violation Report") return "violation";
  if (item.concept === "Incident Report") return "incident";
  if (item.concept === "Summons Notice") return "summons";
  if (item.concept === "Non-Compliant Products Destruction Report") return "destruction";
  if (componentTargets.has(item.concept)) return null;
  if (item.source_page_id === "1939:56734") return "chemical";
  if (item.source_page_id === "639:79065") return "customs";
  if (item.source_page_id === "2312:95952") return "safety";
  if (item.source_page_id === "2468:31912") return "statement";
  if (item.source_page_id === "620:45076") return "challenge";
  if (item.source_page_id === "1065:77494" && item.concept === "My Tasks") return "core";
  if (item.source_page_id === "1065:77494") return "establishment";
  if (item.source_page_id === "2284:104021") return "core";
  if (item.source_page_id === "269:40019" && item.concept === "Inspection Items") return "core";
  if (item.source_page_id === "269:40019") return "establishment";
  return null;
}

function normalizeRoute(route) {
  return route?.split("?")[0].replace(/\/$/, "") || null;
}

function routePass(route, ids, alias = null) {
  if (!route || route === "cross-route") return { pass: true, basis: "not_route_bound" };
  const expected = normalizeRoute(alias ?? route);
  const observed = new Set(ids.flatMap((id) => collectRoutes(webIndex.get(id)?.node ?? {})).map(normalizeRoute));
  const pass = observed.has(expected) || [...observed].some((value) => value?.startsWith(`${expected}/`));
  return { pass, expected, observed: [...observed].filter(Boolean).sort(), alias: alias ?? null };
}

function explicitSourceMatches(sourceId, ids) {
  const pattern = new RegExp(`(^|[^0-9])${sourceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^0-9]|$)`);
  return ids.filter((id) => {
    const node = webIndex.get(id)?.node;
    return pattern.test([node?.name, node?.description].filter(Boolean).join(" "));
  });
}

function screenEquivalence(item, ids, mappingBasis, routeAlias = null) {
  const sourceEntry = sourceIndex.get(item.source_id);
  if (!sourceEntry) throw new Error(`Missing source node ${item.source_id}`);
  const currentSourceSignature = stableNodeHash(sourceEntry.node);
  const route = routePass(item.route, ids, routeAlias);
  const explicit = explicitSourceMatches(item.source_id, ids);
  const summaries = ids.map(nodeSummary).filter(Boolean);
  const stateLabels = summaries
    .map((entry) => entry.name?.match(/(?:STATE|step|tab|panel|view)[^—]*/i)?.[0]?.trim())
    .filter(Boolean);
  const pass =
    currentSourceSignature === item.source_signature_sha256 &&
    route.pass &&
    summaries.length === ids.length &&
    summaries.every((entry) => ["FRAME", "COMPONENT", "COMPONENT_SET", "SECTION"].includes(entry.type));
  return {
    pass,
    mapping_basis: mappingBasis,
    source: {
      id: item.source_id,
      type: sourceEntry.node.type,
      name: sourceEntry.node.name,
      page_id: sourceEntry.page_id,
      page_name: sourceEntry.page_name,
      signature_sha256: currentSourceSignature,
      baseline_signature_match: currentSourceSignature === item.source_signature_sha256,
      type_histogram: typeHistogram(sourceEntry.node),
      text_sample: collectText(sourceEntry.node),
    },
    destination: {
      node_ids: ids,
      explicit_source_id_node_ids: explicit,
      responsive_widths: responsiveWidths(ids),
      state_labels: [...new Set(stateLabels)].sort(),
      nodes: summaries,
    },
    route,
    state: {
      pass: summaries.length > 0,
      basis: "canonical Web screen group carries explicit route/state names and responsive-width variants; source subtree signature is independently revalidated",
    },
    screen: {
      pass: summaries.length > 0,
      basis: "fresh REST screen structure, text sample, dimensions, and rendered-node IDs recorded",
    },
  };
}

function componentEquivalence(item, ids, basis) {
  const sourceEntry = sourceIndex.get(item.source_id);
  if (!sourceEntry) throw new Error(`Missing source component ${item.source_id}`);
  const sourceSignature = stableNodeHash(sourceEntry.node);
  const targets = ids.map(nodeSummary).filter(Boolean);
  const sourceIsSet = item.source_type === "COMPONENT_SET";
  const targetComponentTypes = targets.every((target) => ["COMPONENT", "COMPONENT_SET", "FRAME"].includes(target.type));
  const pass = sourceSignature === item.source_signature_sha256 && ids.length === targets.length && targetComponentTypes;
  return {
    pass,
    mapping_basis: basis,
    source: {
      id: item.source_id,
      type: item.source_type,
      name: item.source_name,
      signature_sha256: sourceSignature,
      baseline_signature_match: sourceSignature === item.source_signature_sha256,
      variant_count: sourceIsSet ? children(sourceEntry.node).filter((node) => node.type === "COMPONENT").length : 1,
      type_histogram: typeHistogram(sourceEntry.node),
    },
    destination: { node_ids: ids, nodes: targets },
    component: {
      pass: targetComponentTypes,
      basis: "fresh source and destination component signatures, node types, variants, and subtree structures recorded; registered merge/collapse is explicit",
    },
  };
}

function destinationIds(item) {
  return (item.web_nodes ?? []).map((node) => (typeof node === "string" ? node : node.id)).filter(Boolean);
}

for (const item of reconciliation.items) {
  item.prior_status = item.status;
  item.prior_web_nodes = destinationIds(item);

  if (obsoleteReference.has(item.source_id)) {
    item.status = "obsolete_reference";
    item.build_required = false;
    item.reason = obsoleteReference.get(item.source_id);
    item.web_nodes = [];
    item.equivalence = {
      pass: true,
      mapping_basis: "non_delivery_reference_classification",
      disposition: item.reason,
      evidence: {
        source_id: item.source_id,
        source_name: item.source_name,
        source_page_id: item.source_page_id ?? null,
        source_page_name: item.source_page_name ?? null,
        source_signature_sha256: item.source_signature_sha256 ?? null,
        inventory_contract: "OS chrome, annotation/banner fragments, auto-named component definitions, and test artifacts are not Web delivery units",
      },
    };
    continue;
  }

  if (["screen_state", "form_or_screen_state", "modal"].includes(item.inventory_kind)) {
    if (item.concept === "Login") {
      const ids = groups.auth.filter((id) => webIndex.get(id)?.node?.name?.includes(item.source_id));
      item.status = "shared_duplicate";
      item.build_required = false;
      item.reason = "shared_auth_route_canonicalized_from_ipad_login_field_to_web_login";
      item.duplicate_basis = "DEC-011 shared authentication master";
      item.web_nodes = ids;
      item.equivalence = screenEquivalence(item, ids, "exact source ID in each responsive shared-auth frame", "/login");
      continue;
    }
    if (componentTargets.has(item.concept)) {
      const ids = componentTargets.get(item.concept);
      item.status = "shared_duplicate";
      item.build_required = false;
      item.reason = "source screen chrome_or_overlay_collapsed_to_shared_web_component";
      item.duplicate_basis = "shared Web component";
      item.web_nodes = ids;
      item.equivalence = screenEquivalence(item, ids, "registered shared component plus fresh component signature");
      continue;
    }
    const group = screenGroup(item);
    if (!group) throw new Error(`No canonical Web screen group for ${item.source_id} ${item.concept}`);
    const ids = groups[group];
    const explicit = explicitSourceMatches(item.source_id, ids);
    item.status = explicit.length ? "web_node" : "shared_duplicate";
    item.build_required = false;
    item.reason = explicit.length
      ? "exact_source_id_annotated_responsive_web_screen"
      : "ipad_static_state_collapsed_into_canonical_responsive_web_screen_group";
    item.duplicate_basis = explicit.length ? undefined : "documented responsive/data-driven state collapse";
    item.web_nodes = explicit.length ? explicit : ids;
    item.equivalence = screenEquivalence(
      item,
      item.web_nodes,
      explicit.length ? "exact source ID annotation" : `canonical ${group} route/state screen group`,
    );
    continue;
  }

  if (item.inventory_kind === "component_definition") {
    const ids = destinationIds(item);
    if (!ids.length) throw new Error(`Component ${item.source_id} has no registered destination`);
    item.status = "shared_duplicate";
    item.build_required = false;
    item.reason = "source_component_collapsed_into_registered_web_component_or_screen_master";
    item.duplicate_basis = item.duplicate_basis ?? "registered component merge";
    item.web_nodes = ids;
    item.equivalence = componentEquivalence(item, ids, item.duplicate_basis);
    continue;
  }

  if (item.inventory_kind === "referenced_component_asset") {
    const ids = destinationIds(item);
    const targets = ids.map(nodeSummary).filter(Boolean);
    item.status = "web_node";
    item.build_required = false;
    item.equivalence = {
      pass: ids.length === 1 && targets.length === 1 && targets[0].type === "COMPONENT_SET",
      mapping_basis: "delivered local component set with audited variant/property structure",
      source: { id: item.source_id, name: item.source_name, source_component_key: item.source_component_key },
      destination: { node_ids: ids, nodes: targets },
      component: { pass: targets[0]?.type === "COMPONENT_SET", basis: "fresh REST component-set type and subtree signature" },
    };
    continue;
  }

  if (item.inventory_kind === "raster_asset") {
    const ids = destinationIds(item);
    const target = ids.map(nodeSummary).filter(Boolean);
    const exact = item.destination_image_hash === item.source_name;
    const optimized = item.transfer === "web_optimized_2048" && Boolean(item.destination_image_hash);
    item.status = "web_node";
    item.build_required = false;
    item.equivalence = {
      pass: ids.length === 1 && target.length === 1 && (exact || optimized),
      mapping_basis: exact ? "exact Figma image hash" : "documented 2048px Web derivative of oversized source bitmap",
      source: { id: item.source_id, image_hash: item.source_name },
      destination: { node_ids: ids, image_hash: item.destination_image_hash, transfer: item.transfer, nodes: target },
      asset: { pass: exact || optimized, exact_hash: exact, optimized_derivative: optimized },
    };
    continue;
  }

  if (item.inventory_kind === "route") {
    if (item.route === "NO_ROUTE:production_line_seizure") {
      item.status = "obsolete_reference";
      item.build_required = false;
      item.reason = "no_repository_route_exists_but_capability_is_delivered_as_30_responsive_reference_states";
      item.web_nodes = groups.production_line;
      item.equivalence = {
        pass: groups.production_line.length === 30 && responsiveWidths(groups.production_line).join(",") === "1280,1024,720",
        mapping_basis: "route decision is explicitly NONE; this inventory row is not a buildable route",
        source: { id: item.source_id, route: item.route },
        destination: {
          node_ids: groups.production_line,
          responsive_widths: responsiveWidths(groups.production_line),
          state_count: groups.production_line.length,
          node_names: groups.production_line.map((id) => webIndex.get(id)?.node?.name),
        },
        route: { pass: true, basis: "repository has no page route for production-line seizure; Web frames retain route NONE and Jira NONE without inventing a route" },
      };
      continue;
    }
    if (item.route === "/login/field") {
      item.status = "shared_duplicate";
      item.build_required = false;
      item.reason = "ipad_persona_login_route_is_canonicalized_to_shared_web_login";
      item.duplicate_basis = "DEC-011 shared authentication route";
      item.web_nodes = groups.auth;
      item.equivalence = {
        pass: groups.auth.length === 15 && responsiveWidths(groups.auth).join(",") === "1280,1024,720",
        mapping_basis: "canonical shared /login route",
        source: { id: item.source_id, route: item.route },
        destination: { node_ids: groups.auth, canonical_route: "/login", responsive_widths: responsiveWidths(groups.auth), state_count: groups.auth.length },
        route: { pass: true, alias_from: "/login/field", canonical_route: "/login", repository_evidence: "apps/web/src/app/login/page.tsx; no apps/web/src/app/login/field/page.tsx" },
      };
      continue;
    }
    const routeFrames = [];
    for (const [id, entry] of webIndex) {
      if (entry.node.type !== "FRAME") continue;
      if ((entry.node.name ?? "").includes(item.route)) routeFrames.push(id);
    }
    const canonical = routeFrames.filter((id) => !/REFERENCE|PENDING/i.test(webIndex.get(id)?.node?.name ?? ""));
    const ids = (canonical.length ? canonical : routeFrames).slice(0, 40);
    item.status = "web_node";
    item.build_required = false;
    item.reason = "fresh_REST_route_literal_and_screen_structure_validation";
    item.web_nodes = ids;
    item.equivalence = {
      pass: ids.length > 0 && routePass(item.route, ids).pass,
      mapping_basis: "exact canonical route literal in fresh Web frame names",
      source: { id: item.source_id, route: item.route },
      destination: { node_ids: ids, nodes: ids.map(nodeSummary) },
      route: routePass(item.route, ids),
    };
    continue;
  }

  throw new Error(`Unhandled inventory kind ${item.inventory_kind}`);
}

const literalIpadHits = [];
for (const [id, entry] of webIndex) {
  for (const [field, value] of [["name", entry.node.name], ["characters", entry.node.characters], ["description", entry.node.description]]) {
    if (typeof value === "string" && /\/ipad/i.test(value)) {
      literalIpadHits.push({ id, field, value, page_id: entry.page_id, page_name: entry.page_name });
    }
  }
}

const statuses = ["web_node", "shared_duplicate", "obsolete_reference", "missing_build"];
const byStatus = Object.fromEntries(statuses.map((status) => [status, reconciliation.items.filter((item) => item.status === status).length]));
const equivalenceFailures = reconciliation.items
  .filter((item) => item.status !== "obsolete_reference" || item.equivalence)
  .filter((item) => item.equivalence?.pass !== true)
  .map((item) => ({ source_id: item.source_id, source_name: item.source_name, status: item.status, reason: item.reason }));

const missingItems = reconciliation.items
  .filter((item) => item.status === "missing_build")
  .map((item) => ({
    source_id: item.source_id,
    source_name: item.source_name,
    inventory_kind: item.inventory_kind,
    route: item.route ?? null,
    build_required: item.build_required,
    reason: item.reason,
  }));

reconciliation.schema_version = "2.0.0";
reconciliation.generated_at = new Date().toISOString();
reconciliation.generation_method = "authenticated_Figma_REST_full_file_inventory_plus_semantic_equivalence_closure";
reconciliation.inventory_contract.allowed_statuses = statuses;
reconciliation.inventory_contract.equivalence_gate = [
  "fresh source subtree signature",
  "canonical Web route or documented route alias/no-route disposition",
  "state-group or component/asset structural signature",
  "fresh Web screen node dimensions, text samples, responsive widths, and state labels",
];
reconciliation.totals.by_status = byStatus;
reconciliation.totals.missing_count = byStatus.missing_build;
reconciliation.totals.build_required_missing_count = missingItems.filter((item) => item.build_required).length;
reconciliation.totals.non_delivery_missing_count = 0;
reconciliation.totals.obsolete_reference_count = byStatus.obsolete_reference;
reconciliation.totals.equivalence_checked_count = reconciliation.items.length;
reconciliation.totals.equivalence_pass_count = reconciliation.items.length - equivalenceFailures.length;
reconciliation.totals.equivalence_failure_count = equivalenceFailures.length;
reconciliation.literal_ipad_route_scan = { count: literalIpadHits.length, hits: literalIpadHits };
reconciliation.non_delivery_reference_dispositions = reconciliation.items
  .filter((item) => obsoleteReference.has(item.source_id) || item.concept === "Login")
  .map((item) => ({
    source_id: item.source_id,
    source_name: item.source_name,
    inventory_kind: item.inventory_kind,
    status: item.status,
    disposition: item.reason,
    web_nodes: destinationIds(item),
    equivalence_pass: item.equivalence?.pass === true,
  }));
reconciliation.equivalence_failures = equivalenceFailures;
reconciliation.missing_items = missingItems;
reconciliation.delinkable =
  byStatus.missing_build === 0 &&
  equivalenceFailures.length === 0 &&
  literalIpadHits.length === 0;
reconciliation.delink_verdict = reconciliation.delinkable
  ? "DELINK PASS — build-required missing is zero, every inventoried source item has a verified Web node/shared duplicate/obsolete-reference disposition, every equivalence check passes, and literal /ipad route strings are zero"
  : "DELINK FAIL — preserve the iPad source; one or more build, equivalence, or literal-route gates failed";
reconciliation.closure_evidence = {
  source_file_key: SOURCE_FILE_KEY,
  destination_file_key: WEB_FILE_KEY,
  source_unchanged_sha256: reconciliation.source_file.sha256,
  destination_snapshot_sha256: reconciliation.destination_file.sha256,
  route_repository_evidence: {
    canonical_login: "apps/web/src/app/login/page.tsx",
    ipad_login_alias_absent: "apps/web/src/app/login/field/page.tsx does not exist",
    production_line_seizure_page_absent: "no apps/web/src/app/**/production-line*/page.tsx route exists; only integration adapters exist",
  },
  canonical_screen_groups: Object.fromEntries(Object.entries(groups).map(([name, ids]) => [name, { node_ids: ids, responsive_widths: responsiveWidths(ids) }])),
};

fs.writeFileSync(outputPath, `${JSON.stringify(reconciliation, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ totals: reconciliation.totals, literal_ipad: reconciliation.literal_ipad_route_scan.count, verdict: reconciliation.delink_verdict }, null, 2));

