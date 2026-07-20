"use client";
// CD-001 V7 Atlas — story panel host. Owns the single source of stage truth
// (the six lifecycle stages) and the 14s motion loop, and lays out the
// map-bound stage event and lifecycle tablist (roving tabindex). The premium 3D atlas
// (SaudiIndustrialAtlas) is dynamically imported (ssr:false) exactly like the
// old map; if Layer 1 cannot initialise (offline, tiles blocked, boundary
// missing) the static SaqeelHero SVG takes the frame instead. Motion is
// disabled under prefers-reduced-motion — the tablist becomes the only driver.
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/ThemeToggle";
import SaqeelHero from "./SaqeelHero";
import { STORY_SCENE_ORDER, type AtlasStageId } from "./saudi-atlas-locations";
import { createAtlasTimeline, type AtlasTimeline } from "./saudi-atlas-motion";
import type { DossierStrings } from "./SaudiAtlasDossier";

// Stage 1 of the 3D atlas rebuild. The raster atlas (SaudiIndustrialAtlas)
// remains in the tree as the reduced-data/offline fallback path.
const Atlas = dynamic(() => import("./atlas3d/SaudiAtlas3D"), { ssr: false });

export type StoryStrings = {
  title: string;
  overline: string;
  illustrativeSummary: string;
  zoneStats: { zone: string; inspections: string; detail: string }[];
  stagesLabel: string;                            // tablist aria-label
  stages: { id: AtlasStageId; label: string; event: string }[];
  dossier: DossierStrings;
  riyadhLabel: string;                            // SaqeelHero fallback SVG city-chip
};

export default function StoryPanel({ strings: s, locale, themeLabels, subdued = false, paused = false }: {
  strings: StoryStrings;
  locale: "ar" | "en";
  themeLabels: { toLight: string; toDark: string };
  // CD-002: recovery views (forgot / forgot-sent / /reset) subordinate the
  // atlas to a quiet static KSA trust motif — no lifecycle chips, interactive
  // markers or photo rail. Default false = byte-identical accepted CD-001
  // rendering. Reuses the existing SaqeelHero fallback motif; no new asset.
  subdued?: boolean;
  // Credential interaction always wins over decorative storytelling. This is
  // driven by the sibling login panel so typing, reset and submit states do
  // not compete with motion.
  paused?: boolean;
}) {
  const [mapFailed, setMapFailed] = useState(false);
  const [stage, setStage] = useState<AtlasStageId>("plan");
  const activeStage = s.stages.find(item => item.id === stage) ?? s.stages[0];
  const activeIndex = Math.max(0, s.stages.findIndex(item => item.id === stage));

  const tlRef = useRef<AtlasTimeline | null>(null);
  const manualRef = useRef(false);   // user took control via the tablist
  const pausedRef = useRef(false);
  const atlasInteractingRef = useRef(false);
  const [atlasInteracting, setAtlasInteracting] = useState(false);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  pausedRef.current = paused;

  // Motion loop runs only while the live interactive atlas is on screen.
  useEffect(() => {
    if (mapFailed || subdued) return;
    const tl = createAtlasTimeline(i => { if (!manualRef.current) setStage(STORY_SCENE_ORDER[i]); });
    tlRef.current = tl;
    tl.start();
    return () => { tl.stop(); tlRef.current = null; };
  }, [mapFailed, subdued]);

  useEffect(() => {
    if (paused) tlRef.current?.pause();
    else if (!manualRef.current && !atlasInteractingRef.current) tlRef.current?.resume();
  }, [paused]);

  const onInteracting = useCallback((on: boolean) => {
    atlasInteractingRef.current = on;
    setAtlasInteracting(on);
    if (on) tlRef.current?.pause();
    else if (!manualRef.current && !pausedRef.current) tlRef.current?.resume();
  }, []);

  const pickStage = useCallback((id: AtlasStageId) => {
    manualRef.current = true;
    tlRef.current?.pause();
    setStage(id);
  }, []);

  const onTabKey = (e: React.KeyboardEvent, idx: number) => {
    const n = s.stages.length;
    let next = idx;
    const forwardKey = locale === "ar" ? "ArrowLeft" : "ArrowRight";
    const backKey = locale === "ar" ? "ArrowRight" : "ArrowLeft";
    if (e.key === forwardKey || e.key === "ArrowDown") next = (idx + 1) % n;
    else if (e.key === backKey || e.key === "ArrowUp") next = (idx - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    pickStage(s.stages[next].id);
    tabsRef.current[next]?.focus();
  };

  return (
    <aside className={`lg-story${subdued ? " lg-story--subdued" : ""}${paused || atlasInteracting ? " is-motion-paused" : ""}`}>
      <header className="lg-story__head">
        <div className="lg-story__heading">
          <span className="lg-story__title">{s.title}</span>
          <span className="lg-story__overline" dir={locale === "ar" ? "rtl" : "ltr"}>{s.overline}</span>
        </div>
        <ThemeToggle className="lg-iconbtn" labels={themeLabels} />
      </header>

      <div className="lg-story__frame" id="saqeel-industrial-atlas">
        {subdued ? (
          <div className="lg-story__fallback"><SaqeelHero riyadhLabel={s.riyadhLabel} /></div>
        ) : mapFailed ? (
          <div className="lg-story__fallback"><SaqeelHero riyadhLabel={s.riyadhLabel} /></div>
        ) : (
          <Atlas locale={locale} activeStage={stage} dossierStrings={s.dossier}
            onInteractingChange={onInteracting} onFail={() => setMapFailed(true)} />
        )}

        {/* The selected tab changes the story on the map, not on the tab. */}
        {!subdued && !mapFailed && (
          <div key={stage} className="lg-atlas3d__event" role="status" aria-live="polite">
            <span className="lg-atlas3d__event-stage">
              <span dir="ltr">{String(activeIndex + 1).padStart(2, "0")}</span>
              {activeStage.label}
            </span>
            <strong>{activeStage.event}</strong>
          </div>
        )}

        {/* One lifecycle strip, physically attached to and controlling the atlas. */}
        {!subdued && !mapFailed && (
          <div className="lg-atlas3d__stages" role="tablist" aria-label={s.stagesLabel}>
            {s.stages.map((st, i) => (
              <button key={st.id} ref={el => { tabsRef.current[i] = el; }} type="button" role="tab"
                aria-controls="saqeel-industrial-atlas" aria-selected={stage === st.id}
                tabIndex={stage === st.id ? 0 : -1}
                className={`lg-atlas3d__stage${stage === st.id ? " is-active" : ""}`}
                onClick={() => pickStage(st.id)} onKeyDown={e => onTabKey(e, i)}>
                <span className="lg-atlas3d__stage-n" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                <span className="lg-atlas3d__stage-label">{st.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
