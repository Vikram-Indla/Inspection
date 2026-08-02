#!/usr/bin/env node

import fs from "node:fs";

const [reconciliationPath, deliveryPath] = process.argv.slice(2);
if (!reconciliationPath || !deliveryPath) {
  console.error(
    "Usage: node apply-inspector-shared-delivery.mjs <reconciliation.json> <shared-delivery.json>",
  );
  process.exit(1);
}

const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, "utf8"));
const delivery = JSON.parse(fs.readFileSync(deliveryPath, "utf8"));
const componentTargets = new Map(
  (delivery.components ?? []).map((entry) => [entry.source_id, entry]),
);
const rasterTargets = new Map(
  (delivery.raster_assets ?? []).map((entry) => [entry.source_id, entry]),
);

for (const item of reconciliation.items) {
  const delivered =
    item.inventory_kind === "referenced_component_asset"
      ? componentTargets.get(item.source_id)
      : item.inventory_kind === "raster_asset"
        ? rasterTargets.get(item.source_id)
        : null;
  if (!delivered) continue;
  item.status = "web_node";
  item.build_required = false;
  item.reason = "verified_shared_delivery_map";
  item.web_nodes = [delivered.web_node_id];
  if (item.inventory_kind === "raster_asset") {
    item.image_node_id = delivered.image_node_id;
    item.destination_image_hash = delivered.destination_image_hash;
    item.transfer = delivered.transfer;
  }
}

const statuses = ["web_node", "shared_duplicate", "missing_build"];
const statusCounts = Object.fromEntries(
  statuses.map((status) => [
    status,
    reconciliation.items.filter((item) => item.status === status).length,
  ]),
);
const missingItems = reconciliation.items
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

reconciliation.generated_at = new Date().toISOString();
reconciliation.totals.by_status = statusCounts;
reconciliation.totals.missing_count = statusCounts.missing_build;
reconciliation.totals.build_required_missing_count = missingItems.filter(
  (item) => item.build_required,
).length;
reconciliation.totals.non_delivery_missing_count = missingItems.filter(
  (item) => !item.build_required,
).length;
reconciliation.totals.exact_raster_hashes_present_in_web = reconciliation.items.filter(
  (item) =>
    item.inventory_kind === "raster_asset" &&
    item.status === "web_node" &&
    item.destination_image_hash === item.source_name,
).length;
reconciliation.totals.optimized_raster_derivatives = reconciliation.items.filter(
  (item) => item.inventory_kind === "raster_asset" && item.transfer === "web_optimized_2048",
).length;
reconciliation.missing_items = missingItems;
reconciliation.delinkable = statusCounts.missing_build === 0;
reconciliation.delink_verdict = reconciliation.delinkable
  ? "PASS — every inventoried source item has a verified Web node or documented true shared duplicate"
  : "FAIL — preserve the iPad source; one or more inventoried items remain missing_build";
reconciliation.applied_shared_delivery = {
  path: deliveryPath,
  component_references: componentTargets.size,
  raster_assets: rasterTargets.size,
};

fs.writeFileSync(reconciliationPath, `${JSON.stringify(reconciliation, null, 2)}\n`, "utf8");

const csvPath = reconciliationPath.replace(/\.json$/, ".missing.csv");
const columns = [
  "source_id",
  "inventory_kind",
  "source_name",
  "page_id",
  "page_name",
  "route",
  "build_required",
  "reason",
];
const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (typeof value === "boolean") return text;
  return `"${text.replaceAll('"', '""')}"`;
};
const csv = [
  columns.map(csvEscape).join(","),
  ...missingItems.map((item) => columns.map((column) => csvEscape(item[column])).join(",")),
].join("\n");
fs.writeFileSync(csvPath, `${csv}\n`, "utf8");

console.log(
  JSON.stringify({ totals: reconciliation.totals, delink_verdict: reconciliation.delink_verdict }),
);
