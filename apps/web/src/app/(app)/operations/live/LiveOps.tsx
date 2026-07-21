"use client";
// Live Operations shell — real KPI counters (behind auth, so a genuine "LIVE"
// claim), a colourblind-safe legend, and the animated national map. The map
// itself is browser-only and loads via next/dynamic ssr:false.
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import type { LiveFactory, LiveRegion, LiveInspector } from "./types";
import EmptyState from "@/components/EmptyState";

export type LiveOpsStrings = {
  loading: string;
  enRoute: string;
  executing: string;
  completed: string;
  legendTitle: string;
  high: string;
  medium: string;
  low: string;
  inspector: string;
  projected: string;
  mapUnavailable: string;
  mapboxNotConfigured: string;
  mapAriaLabel: string;
};

// Module scope, not inside the component: next/dynamic must be called once
// at module load — calling it inside a component/hook (even memoized)
// re-registers the same chunk on every remount (Strict Mode dev double-mount,
// Fast Refresh) and desyncs the loadable's chunk-id tracking from the
// compiled bundle (ChunkLoadError that survives a full dev-server restart).
const Map = dynamic(() => import("./LiveMapInner"), { ssr: false });

export default function LiveOps({ factories, regions, inspectors, strings: s }: {
  factories: LiveFactory[];
  regions: LiveRegion[];
  inspectors: LiveInspector[];
  strings: LiveOpsStrings;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const enRoute = inspectors.filter(i => i.state === "on_the_way").length;
  const executing = inspectors.filter(i => i.state === "executing" || i.state === "arrived").length;

  return (
    <div className="lv-wrap">
      <div className="lv-counters">
        <div className="lv-counter lv-counter--live">
          <span className="lv-counter__dot" /><strong>{enRoute}</strong><span>{s.enRoute}</span>
        </div>
        <div className="lv-counter">
          <strong>{executing}</strong><span>{s.executing}</span>
        </div>
        <div className="lv-counter">
          <strong>{factories.length}</strong><span>{s.completed}</span>
        </div>
      </div>

      <div className="lv-map">
        <Suspense fallback={
          <div style={{ blockSize: "100%", display: "grid", placeItems: "center" }}>
            <EmptyState glyph="…" title={s.loading} bare role="status" ariaBusy />
          </div>
        }>
          <Map factories={factories} regions={regions} inspectors={inspectors}
            selectedId={selectedId} onSelect={setSelectedId} strings={{
              unavailable: s.mapUnavailable, notConfigured: s.mapboxNotConfigured, ariaLabel: s.mapAriaLabel,
            }} />
        </Suspense>
      </div>

      <div className="lv-legend" role="note">
        <span className="lv-legend__title">{s.legendTitle}</span>
        <span className="lv-legend__item"><span className="lv-glyph lv-glyph--high">▲</span>{s.high}</span>
        <span className="lv-legend__item"><span className="lv-glyph lv-glyph--medium">◆</span>{s.medium}</span>
        <span className="lv-legend__item"><span className="lv-glyph lv-glyph--low">●</span>{s.low}</span>
        <span className="lv-legend__item lv-legend__item--sep"><span className="lv-glyph lv-glyph--insp">▲</span>{s.inspector}</span>
        <span className="lv-legend__note">{s.projected}</span>
      </div>
    </div>
  );
}
