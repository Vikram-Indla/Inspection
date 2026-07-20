"use client";
// CD-022 — Identity dossier: identifier grid + provenance + official/planner
// location (map with mandatory text equivalent) + risk context (advisory
// only) + duplicate/overlap guard + Factory 360 deep link. Composed inside
// the comparison rail in Wizard.tsx; nothing here mutates the registry —
// the planner pin is per-visit only (M01-038).
import { useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import type { GradedFactory, WizardStrings } from "./Wizard";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export default function IdentityDossier({
  factory, plannerLat, plannerLng, strings,
}: {
  factory: GradedFactory; plannerLat: string; plannerLng: string; strings: WizardStrings;
}) {
  const [view, setView] = useState<"map" | "text">("map");
  const hasOfficial = factory.official_lat != null && factory.official_lng != null;
  const pLat = Number(plannerLat); const pLng = Number(plannerLng);
  const hasPlannerPin = plannerLat !== "" && plannerLng !== "" && Number.isFinite(pLat) && Number.isFinite(pLng);
  const markers: GeoMarkerData[] = [
    ...(hasOfficial ? [{
      id: "official", lat: factory.official_lat as number, lng: factory.official_lng as number,
      label: `${strings.officialPin} — ${factory.name}`,
      tone: (factory.risk_band === "high" ? "high" : factory.risk_band === "medium" ? "medium" : "low") as GeoMarkerData["tone"],
      radiusM: factory.geofence_radius_m ?? undefined,
    }] : []),
    ...(hasPlannerPin ? [{ id: "planner", lat: pLat, lng: pLng, label: strings.plannerPin, tone: "neutral" as const }] : []),
  ];
  const center: [number, number] = hasOfficial
    ? [factory.official_lat as number, factory.official_lng as number]
    : hasPlannerPin ? [pLat, pLng] : [24.7136, 46.6753];

  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }} role="region" aria-label={factory.name}>
      <div>
        <strong style={{ fontSize: "var(--ax-font-size-150)" }}>{factory.name}</strong>
        {factory.grade === "exact"
          ? <span className="badge badge-compliant" style={{ marginInlineStart: 8 }}>{strings.exactBadge}</span>
          : <span className="badge badge-warning" style={{ marginInlineStart: 8 }}>{strings.similarBadge}</span>}
        {factory.degraded && <span className="badge badge-critical" style={{ marginInlineStart: 8 }}>{strings.degradedBadge}</span>}
        <p className="t-caption">{factory.grade === "exact" ? strings.exactRule : strings.similarRule}</p>
      </div>

      {/* Identifier grid — bdi-isolated so LTR codes read correctly inside Arabic labels */}
      <dl className="ax-grid-2" style={{ rowGap: "var(--ax-space-100)" }}>
        <div><dt className="t-caption">{strings.crPrefix}</dt><dd><bdi>{factory.cr_number ?? "—"}</bdi></dd></div>
        <div><dt className="t-caption">{strings.licenseLabel}</dt><dd><bdi>{factory.license_number ?? strings.licenseNone}</bdi></dd></div>
        <div><dt className="t-caption">{strings.factory360}</dt><dd><bdi>{factory.factory_code ?? "—"}</bdi></dd></div>
        <div><dt className="t-caption">{factory.region ?? "—"}{factory.city ? `, ${factory.city}` : ""}</dt></div>
      </dl>

      {/* Provenance — real FND-013 freshness; no invented staleness threshold */}
      <p className="t-caption">{strings.freshnessLabel}: <bdi>{factory.source_synced_at ? new Date(factory.source_synced_at).toISOString().slice(0, 10) : strings.freshnessNever}</bdi></p>

      {factory.duplicate && (
        <div className="ax-banner ax-banner--warning" role="status">
          <div>
            {strings.duplicateWarning}
            {factory.duplicateVisitId && (
              <> — <bdi>{factory.duplicateVisitId.slice(0, 8)}</bdi>
                {factory.duplicateVisitStatus && <> · {strings.duplicateStatusLabel}: <bdi>{factory.duplicateVisitStatus}</bdi></>}{" "}
                <a href={`/visits/${factory.duplicateVisitId}`} target="_blank" rel="noopener noreferrer">{strings.duplicateOpenVisit}</a>
              </>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="ax-segmented" role="group" aria-label={strings.mapToggle}>
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>{strings.mapToggle.split(" / ")[0]}</button>
          <button type="button" aria-pressed={view === "text"} onClick={() => setView("text")}>{strings.mapToggle.split(" / ")[1]}</button>
        </div>
        {view === "map" ? (
          <div style={{ blockSize: 220, marginBlockStart: "var(--ax-space-150)" }}>
            <GeoMap center={center} zoom={hasOfficial || hasPlannerPin ? 14 : 6} markers={markers} height="100%" />
          </div>
        ) : (
          <ul className="t-caption" style={{ marginBlockStart: "var(--ax-space-150)" }} aria-label={strings.textEquivalent}>
            <li>{strings.officialPin}: {hasOfficial ? <bdi>{factory.official_lat}, {factory.official_lng}</bdi> : strings.noOfficialPin}</li>
            {hasPlannerPin && <li>{strings.plannerPin}: <bdi>{plannerLat}, {plannerLng}</bdi></li>}
          </ul>
        )}
      </div>

      <p className="t-caption">{strings.riskContext}: {factory.risk_band ?? strings.riskUnknown}{factory.risk_score != null ? ` (${factory.risk_score})` : ""}</p>

      <a href={`/factories/${factory.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-touch">{strings.factory360}</a>
    </div>
  );
}
