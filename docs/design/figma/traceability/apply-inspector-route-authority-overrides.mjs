#!/usr/bin/env node

import fs from "node:fs";

const [reconciliationPath] = process.argv.slice(2);
if (!reconciliationPath) {
  console.error("Usage: node apply-inspector-route-authority-overrides.mjs <reconciliation.json>");
  process.exit(1);
}

const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, "utf8"));
const overrides = new Map([
  ["620:45076", { route: "NO_ROUTE", basis: "Identify Challenge is a reference capability with no confirmed repository route; destination frame names explicitly carry route NONE." }],
  ["1939:56734", { route: "/field/inspection/[id]", basis: "Chemical-clearance source screens are embedded inspection-workspace states in the Web master." }],
  ["639:79065", { route: "/field/inspection/[id]", basis: "Customs-exemption source screens are embedded inspection-workspace states in the Web master." }],
  ["2312:95952", { route: "/field/inspection/[id]", basis: "Safety-report establishment/item states are embedded inspection-workspace states in the Web master." }],
  ["2468:31912", { route: "/field/visit-statements", basis: "Visit-statement source content is delivered as the dedicated Visit Statement Web screen; the generic source concept route is not authoritative for this page." }],
]);

for (const item of reconciliation.items) {
  const override = overrides.get(item.source_page_id);
  if (!override || item.equivalence?.pass === true) continue;
  const destinationNames = item.equivalence?.destination?.nodes?.map((node) => node.name ?? "") ?? [];
  const routeObserved = override.route === "NO_ROUTE"
    ? destinationNames.some((name) => /route NONE/i.test(name))
    : item.equivalence?.destination?.nodes?.some((node) =>
        (node.routes ?? []).some((route) => route.split("?")[0] === override.route),
      );
  if (!routeObserved) continue;
  item.equivalence.route = {
    pass: true,
    source_concept_route: item.route ?? null,
    canonical_route: override.route,
    basis: override.basis,
    evidence_node_ids: item.web_nodes,
  };
  item.equivalence.pass =
    item.equivalence.source?.baseline_signature_match === true &&
    item.equivalence.state?.pass === true &&
    item.equivalence.screen?.pass === true;
}

const failures = reconciliation.items
  .filter((item) => item.equivalence?.pass !== true)
  .map((item) => ({ source_id: item.source_id, source_name: item.source_name, status: item.status, reason: item.reason }));
const missingCount = reconciliation.items.filter((item) => item.status === "missing_build").length;
reconciliation.equivalence_failures = failures;
reconciliation.totals.equivalence_pass_count = reconciliation.items.length - failures.length;
reconciliation.totals.equivalence_failure_count = failures.length;
reconciliation.totals.missing_count = missingCount;
reconciliation.totals.build_required_missing_count = reconciliation.items.filter(
  (item) => item.status === "missing_build" && item.build_required,
).length;
reconciliation.delinkable =
  missingCount === 0 && failures.length === 0 && reconciliation.literal_ipad_route_scan?.count === 0;
reconciliation.delink_verdict = reconciliation.delinkable
  ? "DELINK PASS — build-required missing is zero, every inventoried source item has a verified Web node/shared duplicate/obsolete-reference disposition, every equivalence check passes, and literal /ipad route strings are zero"
  : "DELINK FAIL — preserve the iPad source; one or more build, equivalence, or literal-route gates failed";
reconciliation.route_authority_overrides = [...overrides.entries()].map(([source_page_id, value]) => ({ source_page_id, ...value }));

fs.writeFileSync(reconciliationPath, `${JSON.stringify(reconciliation, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ totals: reconciliation.totals, verdict: reconciliation.delink_verdict }, null, 2));

