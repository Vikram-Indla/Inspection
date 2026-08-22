"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import SaqeelHero from "./SaqeelHero";
import { STORY_SCENE_ORDER } from "./saudi-atlas-locations";
import type { DossierStrings } from "./SaudiAtlasDossier";

const Atlas = dynamic(() => import("./SaudiIndustrialAtlas"), { ssr: false });

type StoryScene = (typeof STORY_SCENE_ORDER)[number];

const RESTING_STAGE: StoryScene = "decide";
const MANUAL_HOLD_MS = 12000;

export type StoryStrings = {
  overline: string;
  stagesLabel: string;
  riyadhLabel: string;
  stages: Record<StoryScene, { label: string; event: string }>;
  dossier: DossierStrings;
};

export default function StoryPanel({ strings: s, locale, subdued = false, paused = false }: {
  strings: StoryStrings;
  locale: "ar" | "en";
  subdued?: boolean;
  paused?: boolean;
}) {
  const [mapFailed, setMapFailed] = useState(false);
  const [stage, setStage] = useState<StoryScene>(RESTING_STAGE);
  const [atlasInteracting, setAtlasInteracting] = useState(false);
  const stages = STORY_SCENE_ORDER.map(id => ({ id, ...s.stages[id] }));
  const activeStage = s.stages[stage];

  const returnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => () => { if (returnRef.current) clearTimeout(returnRef.current); }, []);

  const pickStage = useCallback((id: StoryScene) => {
    if (returnRef.current) clearTimeout(returnRef.current);
    setStage(id);
    if (id !== RESTING_STAGE) {
      returnRef.current = setTimeout(() => setStage(RESTING_STAGE), MANUAL_HOLD_MS);
    }
  }, []);

  const nextTabIndex = (key: string, idx: number, n: number): number | null => {
    const forwardKey = locale === "ar" ? "ArrowLeft" : "ArrowRight";
    const backKey = locale === "ar" ? "ArrowRight" : "ArrowLeft";
    if (key === forwardKey || key === "ArrowDown") return (idx + 1) % n;
    if (key === backKey || key === "ArrowUp") return (idx - 1 + n) % n;
    if (key === "Home") return 0;
    if (key === "End") return n - 1;
    return null;
  };

  const onTabKey = (e: React.KeyboardEvent, idx: number) => {
    const next = nextTabIndex(e.key, idx, stages.length);
    if (next === null) return;
    e.preventDefault();
    pickStage(stages[next].id);
    tabsRef.current[next]?.focus();
  };

  return (
    <aside className={`lg-story${subdued ? " lg-story--subdued" : ""}${paused || atlasInteracting ? " is-motion-paused" : ""}`}>
      <header className="lg-story__head">
        <div className="lg-story__heading">
          <span className="lg-story__overline" dir={locale === "ar" ? "rtl" : "ltr"}>{s.overline}</span>
        </div>
      </header>

      <div className="lg-story__frame" id="saqeel-industrial-atlas">
        {subdued || mapFailed ? (
          <div className="lg-story__fallback"><SaqeelHero riyadhLabel={s.riyadhLabel} /></div>
        ) : (
          <Atlas locale={locale} activeStage={stage} dossierStrings={s.dossier}
            onInteractingChange={setAtlasInteracting} onFail={() => setMapFailed(true)} />
        )}

        <div className="lg-story__seam" aria-hidden="true" />

        {!subdued && !mapFailed && (
          <p className="sr-only" role="status" aria-live="polite">{activeStage.event}</p>
        )}

        {!subdued && !mapFailed && (
          <div className="lg-atlas3d__stages" role="tablist" aria-label={s.stagesLabel}>
            {stages.map((st, i) => (
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
