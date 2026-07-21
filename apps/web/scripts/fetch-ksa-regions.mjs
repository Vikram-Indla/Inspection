#!/usr/bin/env node
// TASK-KSA-REGION-GEOJSON-001 — ArcGIS → bundled KSA region boundaries utility.
//
// Single source of record for the 13 Saudi first-level administrative regions
// used by the login atlas and (future) operations maps. It pulls GADM v4.1
// level-1 polygons from the public ArcGIS FeatureServer, simplifies them
// (topology-aware, so shared borders never split into gaps/overlaps), strips
// the properties down to a stable minimal schema, and writes a small static
// asset the app ships and serves itself.
//
// Why bundle instead of fetching ArcGIS live on the login page:
//   - The login surface is UNAUTHENTICATED. A live third-party fetch there would
//     leak every visitor's IP to Esri/ArcGIS before sign-in.
//   - Raw response is ~5.4 MB; the simplified bundle is a small fraction of that.
//   - The public page must render without an external runtime dependency.
//
// Regenerate after a GADM release or a border correction:
//   node scripts/fetch-ksa-regions.mjs
//
// Requires network access + npx (mapshaper is fetched on demand). Deterministic
// output: same input + same flags → identical file (sorted, fixed precision).

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  "https://services7.arcgis.com/co15Y7Q02mBEZqnK/ArcGIS/rest/services/" +
  "gadm41_SAU_shp/FeatureServer/1/query?where=1%3D1&outFields=*" +
  "&returnGeometry=true&outSR=4326&f=geojson";

// Retain ~6% of vertices with Visvalingam weighting — enough to keep every
// region visually faithful at login/operations zoom while staying tiny.
const SIMPLIFY_PERCENT = "6%";
const COORD_PRECISION = 4; // ~11 m; more than enough for a boundary reference layer.

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../public/geo/sau-regions.geo.json");

async function main() {
  console.log("[ksa-regions] fetching GADM SAU level-1 from ArcGIS…");
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status} ${res.statusText}`);
  const raw = await res.json();
  if (raw.type !== "FeatureCollection" || !Array.isArray(raw.features)) {
    throw new Error("Unexpected ArcGIS payload — not a FeatureCollection.");
  }
  if (raw.exceededTransferLimit) {
    throw new Error("ArcGIS truncated the result (exceededTransferLimit). Add paging.");
  }
  console.log(`[ksa-regions] received ${raw.features.length} features.`);

  // Stable, friendly canonical ids keyed off HASC_1 (GADM's ISO-style code),
  // so the id never drifts with a name spelling change and reads cleanly in
  // code. This is the single canonical id space every map surface joins on.
  const ID_BY_HASC = {
    "SA.RI": "riyadh", "SA.MK": "makkah", "SA.MD": "madinah",
    "SA.SH": "eastern", "SA.AS": "asir", "SA.TB": "tabuk",
    "SA.HA": "hail", "SA.QS": "qassim", "SA.JZ": "jazan",
    "SA.NJ": "najran", "SA.BA": "bahah", "SA.JF": "jawf",
    "SA.HS": "northern",
  };

  // Normalise properties to a stable, minimal, RTL-ready schema BEFORE
  // simplifying so mapshaper carries them through untouched.
  const normalised = {
    type: "FeatureCollection",
    features: raw.features.map((f) => {
      const p = f.properties ?? {};
      const nameEn = String(p.NAME_1 ?? "").replace(/^'/, "").trim();
      const hasc = String(p.HASC_1 ?? "");
      const id = ID_BY_HASC[hasc] ?? slug(nameEn);
      if (!ID_BY_HASC[hasc]) {
        console.warn(`[ksa-regions] no canonical id for HASC "${hasc}" (${nameEn}); fell back to slug "${id}".`);
      }
      return {
        type: "Feature",
        properties: {
          id,
          name_en: nameEn,
          name_ar: String(p.NL_NAME_1 ?? "").trim(),
          gid: String(p.GID_1 ?? ""),
          hasc,
        },
        geometry: f.geometry,
      };
    }),
  };
  normalised.features.sort((a, b) => a.properties.id.localeCompare(b.properties.id));

  const tmp = mkdtempSync(join(tmpdir(), "ksa-regions-"));
  const inFile = join(tmp, "in.geojson");
  const outFile = join(tmp, "out.geojson");
  writeFileSync(inFile, JSON.stringify(normalised));

  console.log(`[ksa-regions] simplifying (Visvalingam ${SIMPLIFY_PERCENT}, topology-aware)…`);
  // -clean fixes any GADM self-intersections; shared boundaries stay welded.
  execFileSync(
    "npx",
    [
      "--yes", "mapshaper", inFile,
      "-clean",
      "-simplify", "visvalingam", "weighted", SIMPLIFY_PERCENT, "keep-shapes",
      "-o", "format=geojson", `precision=${1 / 10 ** COORD_PRECISION}`, outFile,
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );

  const simplified = JSON.parse(readFileSync(outFile, "utf8"));
  writeFileSync(OUT_PATH, JSON.stringify(simplified) + "\n");
  rmSync(tmp, { recursive: true, force: true });

  const bytes = Buffer.byteLength(JSON.stringify(simplified));
  console.log(
    `[ksa-regions] wrote ${simplified.features.length} regions → ` +
    `${OUT_PATH} (${(bytes / 1024).toFixed(1)} KB)`,
  );
}

function slug(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main().catch((err) => {
  console.error("[ksa-regions] FAILED:", err.message);
  process.exit(1);
});
