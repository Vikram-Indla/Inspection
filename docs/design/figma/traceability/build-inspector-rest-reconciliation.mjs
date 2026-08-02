#!/usr/bin/env node

import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const [sourcePath, webPath, outputPath] = process.argv.slice(2);
if (!sourcePath || !webPath || !outputPath) {
  console.error(
    "Usage: node --expose-gc build-inspector-rest-reconciliation.mjs <source.json> <web.json> <output.json>",
  );
  process.exit(1);
}

const SOURCE_FILE_KEY = "8wGaofgbopqmGXc0Wjo0eW";
const WEB_FILE_KEY = "ML2PNwfShlQM2k44MvSEw5";
const CONTENT_PAGE_IDS = new Set([
  "269:40019",
  "2284:104021",
  "620:45076",
  "1939:56734",
  "639:79065",
  "2312:95952",
  "2468:31912",
  "1065:77494",
]);
const COMPONENT_PAGE_ID = "301:71625";

const SCREEN_TARGETS = {
  "Establishment Details": ["364:45987"],
  "Establishment Management": ["366:43609"],
  "Summons Notice": ["340:42098"],
  "My Tasks": ["345:42242"],
  Modal: ["349:252"],
  "Inspection Items": ["366:43758"],
  "Production Line Report": ["366:44226"],
  "Non-Compliant Products Destruction Report": ["366:44093"],
  "Violation Report": ["366:43890"],
  "Incident Report": ["366:44012"],
  Actions: ["344:156"],
  "Overlay - Alerts": ["11:43"],
  "Top Bar": ["20:172"],
};

const SCREEN_ROUTES = {
  "Establishment Details": "/field/establishments",
  "Establishment Management": "/field/establishments",
  "Summons Notice": "/field/summons-notices",
  "My Tasks": "/field/my-tasks",
  Modal: "cross-route",
  "Inspection Items": "/field/inspection/[id]",
  "Production Line Report": null,
  "Non-Compliant Products Destruction Report": "/field/destruction-reports",
  "Violation Report": "/field/inspection/[id]/results",
  "Incident Report": "/field/incident-reports",
  Actions: "cross-route",
  "Overlay - Alerts": "cross-route",
  Login: "/login/field",
  "Top Bar": "cross-route",
};

const NON_DELIVERY_SCREEN_REASONS = {
  Login: "reference_only_web_login_has_no_verified_Figma_node",
  "Frame 1984078725": "obsolete_annotation_strip",
  "Home Screen - iPad": "obsolete_operating_system_surface",
  Content: "obsolete_filter_panel_fragment",
  "Frame 1984078759": "obsolete_canvas_banner",
};

const COMPONENT_TARGETS = {
  Questions: ["317:137"],
  "Questions New": ["317:137"],
  "Questions New selection": ["317:137"],
  "Answer Bar": ["318:107"],
  Answa: ["318:107"],
  "Answa 2": ["318:107"],
  "Media Minis": ["318:118"],
  "Multi Media Uploader": ["318:138"],
  "Photos ": ["318:138"],
  "Mic Button": ["318:125"],
  "Checking list": ["319:164", "319:84"],
  "Location Verification": ["319:193"],
  "Task Card": ["164:88"],
  "Task Card2": ["164:88"],
  "Task Cards": ["164:88"],
  "Map Task Card": ["164:88"],
  "Factory Details": ["356:42542"],
  "Factory Detail Table Atom": ["356:42542"],
  "Big Map": ["176:100"],
  "Location Pin": ["15:23"],
  Tabs: ["72:6736"],
  "Task Chips": ["72:6736"],
  "Progress Status": ["15:27"],
  "Contact Person Info Mobile": ["171:28", "9:66"],
  "Top Bar": ["20:172"],
};

const REPORT_COMPONENT_TARGETS = {
  "Summons Notice": ["340:42098"],
  "Incident Report": ["366:44012"],
  "Violation Report": ["366:43890"],
  "Sample Collection Report": ["336:45779"],
  "Non-Compliant Products Destruction Report": ["366:44093"],
  "Facility Report": ["336:45795"],
};

const NON_DELIVERY_COMPONENT_REASONS = {
  "Frame 1984078811": "obsolete_auto_named_definition",
  "Frame 1984078775": "obsolete_auto_named_definition",
  "Frame 1984078776": "obsolete_auto_named_definition",
  "Task Cards Test": "obsolete_test_artifact",
};

const ROUTES = [
  ["/field/establishments", ["364:45987", "366:43609"]],
  ["/field/establishments/unregistered", ["366:43609"]],
  ["/field/summons-notices", ["340:42098"]],
  ["/field/destruction-reports", ["366:44093"]],
  ["/field/incident-reports", ["366:44012"]],
  ["/field/inspection/[id]/results", ["366:43890"]],
  ["NO_ROUTE:production_line_seizure", []],
  ["/field/inspection/[id]", ["366:43758", "317:137", "318:107"]],
  ["/field/my-tasks", ["345:42242"]],
  ["/login/field", []],
  ["/field/[visitId]/travel", ["319:193"]],
  ["/field/factory-360/[id]", ["356:42542"]],
  ["/field/map", ["176:100"]],
  ["/field/sample-collection-reports", ["336:45779"]],
  ["/field/facility-reports", ["336:45795"]],
];

function fileSha256(filePath) {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead;
    while ((bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest("hex");
}

function nodeChildren(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

function walk(node, visitor, context = {}) {
  visitor(node, context);
  for (const child of nodeChildren(node)) {
    walk(child, visitor, { ...context, parent: node });
  }
}

function pageNodeMap(document) {
  return new Map(nodeChildren(document).map((page) => [page.id, page]));
}

function indexDocument(document) {
  const index = new Map();
  const imageRefs = new Map();
  for (const page of nodeChildren(document)) {
    walk(page, (node) => {
      if (node?.id) {
        index.set(node.id, {
          id: node.id,
          type: node.type ?? null,
          name: node.name ?? null,
          page_id: page.id,
          page_name: page.name,
        });
      }
      for (const fill of Array.isArray(node?.fills) ? node.fills : []) {
        if (fill?.type !== "IMAGE" || !fill.imageRef) continue;
        if (!imageRefs.has(fill.imageRef)) imageRefs.set(fill.imageRef, []);
        const entries = imageRefs.get(fill.imageRef);
        if (entries.length < 20) {
          entries.push({ node_id: node.id, node_name: node.name, page_id: page.id });
        }
      }
    });
  }
  return { index, imageRefs };
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
    for (const child of nodeChildren(node)) visit(child);
    hash.update("\u0001");
  };
  visit(root);
  return hash.digest("hex");
}

function validatedTargets(ids, webIndex) {
  return ids.map((id) => webIndex.get(id)).filter(Boolean);
}

function itemKind(concept) {
  if (concept === "Modal") return "modal";
  if (
    concept.includes("Report") ||
    concept === "Summons Notice" ||
    concept === "Inspection Items" ||
    concept === "Establishment Details" ||
    concept === "Establishment Management"
  ) return "form_or_screen_state";
  return "screen_state";
}

function webNodeItem(base, targetIds, webIndex, evidence) {
  const targets = validatedTargets(targetIds, webIndex);
  if (targets.length !== targetIds.length) {
    return {
      ...base,
      status: "missing_build",
      build_required: true,
      reason: "registered_web_target_not_present_in_REST_inventory",
      expected_web_node_ids: targetIds,
      missing_web_node_ids: targetIds.filter((id) => !webIndex.has(id)),
    };
  }
  return {
    ...base,
    status: "web_node",
    build_required: false,
    evidence,
    web_nodes: targets,
  };
}

const webBytes = fs.statSync(webPath).size;
const webSha256 = fileSha256(webPath);
let webPayload = JSON.parse(fs.readFileSync(webPath, "utf8"));
if (!webPayload.document) throw new Error("Web REST payload has no document");
const webMeta = {
  key: WEB_FILE_KEY,
  name: webPayload.name,
  last_modified: webPayload.lastModified,
  version: webPayload.version,
  bytes: webBytes,
  sha256: webSha256,
};
const { index: webIndex, imageRefs: webImageRefs } = indexDocument(webPayload.document);
webPayload = null;
if (global.gc) global.gc();

const sourceBytes = fs.statSync(sourcePath).size;
const sourceSha256 = fileSha256(sourcePath);
let sourcePayload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (!sourcePayload.document) throw new Error("Source REST payload has no document");
const sourceMeta = {
  key: SOURCE_FILE_KEY,
  name: sourcePayload.name,
  last_modified: sourcePayload.lastModified,
  version: sourcePayload.version,
  bytes: sourceBytes,
  sha256: sourceSha256,
};
const pages = pageNodeMap(sourcePayload.document);

const screenNodes = [];
for (const pageId of CONTENT_PAGE_IDS) {
  const page = pages.get(pageId);
  if (!page) throw new Error(`Missing source page ${pageId}`);
  const visit = (node, parent, insideFrame) => {
    const isSectionFrame = node.type === "FRAME" && parent?.type === "SECTION";
    const isOverlay = node.type === "INSTANCE" && parent?.type === "CANVAS" && node.name === "Overlay - Alerts";
    const isTopBarRoot = node.id === "I905:88962;905:83720";
    const isNestedCanvasBanner = node.id === "1434:110357";
    if (isSectionFrame || isOverlay || isTopBarRoot || isNestedCanvasBanner) {
      screenNodes.push({
        node,
        page,
        concept: isTopBarRoot ? "Top Bar" : node.name,
      });
    }
    for (const child of nodeChildren(node)) visit(child, node, insideFrame || node.type === "FRAME");
  };
  visit(page, null, false);
}
if (screenNodes.length !== 295) {
  throw new Error(`Expected 295 source frames/states, found ${screenNodes.length}`);
}

const componentPage = pages.get(COMPONENT_PAGE_ID);
if (!componentPage) throw new Error("Missing source components page");
const componentNodes = [];
const visitDefinitions = (node, parent, insideDefinition) => {
  const isDefinition = node.type === "COMPONENT" || node.type === "COMPONENT_SET";
  if (isDefinition && !insideDefinition) componentNodes.push({ node, page: componentPage });
  for (const child of nodeChildren(node)) {
    visitDefinitions(child, node, insideDefinition || isDefinition);
  }
};
visitDefinitions(componentPage, null, false);
if (componentNodes.length !== 61) {
  throw new Error(`Expected 61 source component definitions, found ${componentNodes.length}`);
}

const items = [];
const signatureCanonicals = new Map();

for (const { node, page, concept } of screenNodes) {
  const signature = stableNodeHash(node);
  const signatureKey = `${concept}\u0000${signature}`;
  const base = {
    source_id: node.id,
    source_type: node.type,
    source_name: node.name,
    source_page_id: page.id,
    source_page_name: page.name,
    inventory_kind: itemKind(concept),
    concept,
    route: SCREEN_ROUTES[concept] ?? null,
    source_signature_sha256: signature,
  };
  const canonical = signatureCanonicals.get(signatureKey);
  if (canonical) {
    items.push({
      ...base,
      status: "shared_duplicate",
      build_required: false,
      duplicate_of_source_id: canonical.source_id,
      duplicate_basis: "exact_normalized_subtree_signature",
      web_nodes: canonical.web_nodes ?? [],
    });
    continue;
  }
  if (SCREEN_TARGETS[concept]) {
    const mapped = webNodeItem(base, SCREEN_TARGETS[concept], webIndex, "explicit_concept_count_register_plus_REST_node_validation");
    items.push(mapped);
    signatureCanonicals.set(signatureKey, mapped);
    continue;
  }
  const missing = {
    ...base,
    status: "missing_build",
    build_required: !(concept in NON_DELIVERY_SCREEN_REASONS),
    reason: NON_DELIVERY_SCREEN_REASONS[concept] ?? "no_verified_web_equivalent",
  };
  items.push(missing);
  signatureCanonicals.set(signatureKey, missing);
}

for (const { node, page } of componentNodes) {
  const base = {
    source_id: node.id,
    source_type: node.type,
    source_name: node.name,
    source_page_id: page.id,
    source_page_name: page.name,
    inventory_kind: "component_definition",
    concept: node.name,
    source_signature_sha256: stableNodeHash(node),
  };
  if (REPORT_COMPONENT_TARGETS[node.name]) {
    const targets = validatedTargets(REPORT_COMPONENT_TARGETS[node.name], webIndex);
    if (targets.length === REPORT_COMPONENT_TARGETS[node.name].length) {
      items.push({
        ...base,
        status: "shared_duplicate",
        build_required: false,
        duplicate_basis: "documented_report_definition_collapse",
        web_nodes: targets,
      });
    } else {
      items.push({
        ...base,
        status: "missing_build",
        build_required: true,
        reason: "registered_report_target_not_present_in_REST_inventory",
        expected_web_node_ids: REPORT_COMPONENT_TARGETS[node.name],
      });
    }
    continue;
  }
  if (COMPONENT_TARGETS[node.name]) {
    items.push(
      webNodeItem(base, COMPONENT_TARGETS[node.name], webIndex, "explicit_component_register_plus_REST_node_validation"),
    );
    continue;
  }
  items.push({
    ...base,
    status: "missing_build",
    build_required: !(node.name in NON_DELIVERY_COMPONENT_REASONS),
    reason: NON_DELIVERY_COMPONENT_REASONS[node.name] ?? "no_verified_web_component_equivalent",
  });
}

const sourceComponentsRegistry = sourcePayload.components ?? {};
const sourceComponentSetsRegistry = sourcePayload.componentSets ?? {};
const referencedSetIds = Object.entries(sourceComponentSetsRegistry)
  .filter(([, value]) => /^(?:_RatingStar|Rating|Weight)$/i.test(value.name ?? ""))
  .map(([id]) => id)
  .sort();
const variantIdsBySet = new Map(referencedSetIds.map((id) => [id, []]));
for (const [variantId, component] of Object.entries(sourceComponentsRegistry)) {
  if (variantIdsBySet.has(component.componentSetId)) {
    variantIdsBySet.get(component.componentSetId).push(variantId);
  }
}
const expandedInstanceCounts = new Map(referencedSetIds.map((id) => [id, 0]));
walk(sourcePayload.document, (node) => {
  if (node.type !== "INSTANCE" || !node.componentId) return;
  for (const [setId, variantIds] of variantIdsBySet) {
    if (variantIds.includes(node.componentId)) expandedInstanceCounts.set(setId, expandedInstanceCounts.get(setId) + 1);
  }
});
for (const setId of referencedSetIds) {
  const registry = sourceComponentSetsRegistry[setId];
  items.push({
    source_id: setId,
    source_type: "REFERENCED_COMPONENT_SET",
    source_name: registry.name,
    source_component_key: registry.key,
    inventory_kind: "referenced_component_asset",
    concept: registry.name,
    component_variant_ids: variantIdsBySet.get(setId),
    rest_expanded_instance_count: expandedInstanceCounts.get(setId),
    status: "missing_build",
    build_required: true,
    reason: "referenced_source_component_set_has_no_verified_web_equivalent",
  });
}

const sourceImageRefs = new Map();
for (const page of nodeChildren(sourcePayload.document)) {
  if (page.id === "370:40975" || /^-+$/.test(page.name ?? "")) continue;
  walk(page, (node) => {
    for (const fill of Array.isArray(node?.fills) ? node.fills : []) {
      if (fill?.type !== "IMAGE" || !fill.imageRef) continue;
      if (!sourceImageRefs.has(fill.imageRef)) sourceImageRefs.set(fill.imageRef, []);
      const refs = sourceImageRefs.get(fill.imageRef);
      if (refs.length < 20 && !refs.some((entry) => entry.node_id === node.id)) {
        refs.push({ node_id: node.id, node_name: node.name, page_id: page.id, page_name: page.name });
      }
    }
  });
}
if (sourceImageRefs.size !== 81) {
  throw new Error(`Expected 81 unique non-cover source raster assets, found ${sourceImageRefs.size}`);
}
for (const [imageRef, sourceNodes] of [...sourceImageRefs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const webNodes = webImageRefs.get(imageRef) ?? [];
  items.push({
    source_id: `image:${imageRef}`,
    source_type: "IMAGE_REF",
    source_name: imageRef,
    inventory_kind: "raster_asset",
    source_nodes: sourceNodes,
    status: webNodes.length ? "web_node" : "missing_build",
    build_required: !webNodes.length,
    reason: webNodes.length ? undefined : "source_image_hash_absent_from_web_REST_inventory",
    web_nodes: webNodes,
  });
}

for (const [route, targetIds] of ROUTES) {
  const base = {
    source_id: `route:${route}`,
    source_type: "ROUTE",
    source_name: route,
    inventory_kind: "route",
    route,
  };
  if (targetIds.length === 0) {
    items.push({
      ...base,
      status: "missing_build",
      build_required: true,
      reason: route.startsWith("NO_ROUTE:") ? "source_capability_has_no_repo_or_web_route" : "route_has_no_verified_web_Figma_node",
    });
  } else {
    items.push(webNodeItem(base, targetIds, webIndex, "explicit_route_register_plus_REST_node_validation"));
  }
}

const statusCounts = Object.fromEntries(
  ["web_node", "shared_duplicate", "missing_build"].map((status) => [
    status,
    items.filter((item) => item.status === status).length,
  ]),
);
const kindCounts = Object.fromEntries(
  [...new Set(items.map((item) => item.inventory_kind))]
    .sort()
    .map((kind) => [kind, items.filter((item) => item.inventory_kind === kind).length]),
);
const missingItems = items
  .filter((item) => item.status === "missing_build")
  .map((item) => ({
    source_id: item.source_id,
    source_name: item.source_name,
    inventory_kind: item.inventory_kind,
    page_id: item.source_page_id ?? null,
    page_name: item.source_page_name ?? null,
    route: item.route ?? null,
    build_required: item.build_required,
    reason: item.reason,
  }));

const reconciliation = {
  schema_version: "1.0.0",
  generated_at: new Date().toISOString(),
  generation_method: "authenticated_Figma_REST_full_file_inventory",
  source_file: sourceMeta,
  destination_file: webMeta,
  inventory_contract: {
    content_frames_and_states: "295 top-level source frames/instances from the eight content pages, matching the audited source-frame boundary",
    component_definitions: "61 top-level component/component-set definitions on source page 301:71625",
    referenced_component_assets: "all REST component-set registry entries named Rating, _RatingStar, or Weight",
    raster_assets: "all unique IMAGE fill hashes outside the cover and separator pages",
    routes: "all distinct delivery routes explicitly carried by the verified source/Web disposition register, plus the production-line no-route gap",
    allowed_statuses: ["web_node", "shared_duplicate", "missing_build"],
    no_speculative_matches: true,
  },
  totals: {
    items: items.length,
    by_kind: kindCounts,
    by_status: statusCounts,
    missing_count: statusCounts.missing_build,
    build_required_missing_count: missingItems.filter((item) => item.build_required).length,
    non_delivery_missing_count: missingItems.filter((item) => !item.build_required).length,
    source_raster_assets: sourceImageRefs.size,
    exact_raster_hashes_present_in_web: [...sourceImageRefs.keys()].filter((ref) => webImageRefs.has(ref)).length,
  },
  delinkable: statusCounts.missing_build === 0,
  delink_verdict:
    statusCounts.missing_build === 0
      ? "PASS — every inventoried source item has a verified Web node or documented true shared duplicate"
      : "FAIL — preserve the iPad source; one or more inventoried items remain missing_build",
  missing_items: missingItems,
  items,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(reconciliation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(reconciliation.totals));
console.log(reconciliation.delink_verdict);
