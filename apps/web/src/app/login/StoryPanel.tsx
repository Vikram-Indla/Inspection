"use client";
// SCR-PUB-010 v4 — the story panel (Login.dc.html Turn 4): header (title +
// SAMPLE overline + theme toggle), a framed KSA map telling one inspection
// journey, and a four-step storyline strip built from the real modules
// (Planning, Field, Level-2 Review, Factory 360 / Risk). Decorative, sample
// data only. If the live map cannot initialise (offline, tiles blocked,
// boundary missing) the static SaqeelHero SVG takes the frame instead.
import { useState } from "react";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/ThemeToggle";
import SaqeelHero from "./SaqeelHero";
import type { StoryMapLabels } from "./StoryMapInner";

const StoryMapInner = dynamic(() => import("./StoryMapInner"), { ssr: false });

export type StoryStep = { n: string; title: string; body: string };
export type StoryStrings = {
  title: string;
  overline: string;
  steps: StoryStep[];
  mapLabels: StoryMapLabels;
};

export default function StoryPanel({ strings: s, locale, themeLabels }: {
  strings: StoryStrings;
  locale: "ar" | "en";
  themeLabels: { toLight: string; toDark: string };
}) {
  const [mapFailed, setMapFailed] = useState(false);

  return (
    <aside className="lg-story">
      <header className="lg-story__head">
        <div className="lg-story__heading">
          <span className="lg-story__title">{s.title}</span>
          <span className="lg-story__overline" dir="ltr">{s.overline}</span>
        </div>
        <ThemeToggle className="lg-iconbtn" labels={themeLabels} />
      </header>

      <div className="lg-story__frame">
        {mapFailed
          ? <div className="lg-story__fallback"><SaqeelHero /></div>
          : <StoryMapInner locale={locale} labels={s.mapLabels} onFail={() => setMapFailed(true)} />}
      </div>

      <div className="lg-story__strip">
        {s.steps.map(step => (
          <div className="lg-story__step" key={step.n}>
            <div className="lg-story__step-head">
              <span className="lg-story__step-badge" dir="ltr">{step.n}</span>
              <span className="lg-story__step-title">{step.title}</span>
            </div>
            <p className="lg-story__step-body">{step.body}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
