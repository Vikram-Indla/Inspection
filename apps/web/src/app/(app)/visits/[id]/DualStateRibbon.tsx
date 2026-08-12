/* @retiring 2026-08-12 · replaced-by components/visits/visit-detail/visit-lifecycle-ribbon · pending none · delete-when 0-imports */
"use client";
// CD-027 / SCR-WEB-210 — Dual-State Ribbon (signature interaction, one per screen).
// Five NEVER-collapsed state domains (planning/operational/assignment/inspection/
// review) as a keyboard-operable tablist (APG tabs pattern: roving tabindex,
// Arrow/Home/End). Each track surfaces the latest VERIFIED event + its source +
// the allowed-action boundary + a history anchor. Status is carried by glyph +
// label, never color/animation alone (MVP1-FND-011). At narrow width the tablist
// reflows into an ordered accessible state ledger via CSS (no motion required).
// SB19 — all copy is pre-translated server-side and passed in as props.
import { useRef, useState, type KeyboardEvent } from "react";

export type RibbonTrack = {
  id: "planning" | "operational" | "assignment" | "inspection" | "review";
  domainLabel: string;      // "Planning", "Operational", …
  stateLabel: string;       // translated current state
  tone: string;             // existing Saqeel badge tone class
  eventLabel: string;       // latest verified event + time, or "no verified event"
  sourceLabel: string;      // who/what proved it (audit / field app / assignment / …)
  boundaryLabel: string;    // what this domain permits from Visit Detail
  anchorHref: string;       // "#audit", "#journey", …
  anchorLabel: string;      // "Open planning history", …
};

export type RibbonStrings = {
  heading: string;          // region heading
  tablistLabel: string;     // aria-label for the tablist
  stateWord: string;        // "State"
  latestWord: string;       // "Latest verified event"
  sourceWord: string;       // "Source"
  boundaryWord: string;     // "Allowed from here"
};

const GLYPH: Record<RibbonTrack["id"], string> = {
  planning: "▣", operational: "●", assignment: "⬡", inspection: "◇", review: "◆",
};
const badgeTone = (tone: string) => tone || "badge-pending";

export default function DualStateRibbon({ tracks, strings }: { tracks: RibbonTrack[]; strings: RibbonStrings }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(i: number) {
    const n = (i + tracks.length) % tracks.length;
    setActive(n);
    tabRefs.current[n]?.focus();
  }
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": e.preventDefault(); focusTab(i + 1); break;
      case "ArrowLeft": case "ArrowUp": e.preventDefault(); focusTab(i - 1); break;
      case "Home": e.preventDefault(); focusTab(0); break;
      case "End": e.preventDefault(); focusTab(tracks.length - 1); break;
    }
  }

  const cur = tracks[active];
  return (
    <section className="panel" aria-labelledby="visit-lifecycle-heading">
      <div className="panel-header">
        <h2 className="panel-title" id="visit-lifecycle-heading">{strings.heading}</h2>
      </div>
      <div className="panel-body stack">
      <div className="tabs" role="tablist" aria-label={strings.tablistLabel} aria-orientation="horizontal">
        {tracks.map((tr, i) => (
          <button
            key={tr.id}
            ref={el => { tabRefs.current[i] = el; }}
            role="tab"
            id={`ribbon-tab-${tr.id}`}
            aria-selected={i === active}
            aria-controls="ribbon-panel"
            tabIndex={i === active ? 0 : -1}
            className={`tab ${i === active ? "is-active" : ""}`}
            onClick={() => setActive(i)}
            onKeyDown={e => onKeyDown(e, i)}
          >
            <span aria-hidden="true">{GLYPH[tr.id]}</span>
            <span>{tr.domainLabel}</span>
            <span className={`badge ${badgeTone(tr.tone)}`}>{tr.stateLabel}</span>
          </button>
        ))}
      </div>
      <div id="ribbon-panel" role="tabpanel" aria-labelledby={`ribbon-tab-${cur.id}`} tabIndex={0} className="panel">
        <div className="panel-body">
        <dl className="desc">
          <dt>{strings.stateWord}</dt><dd><span className={`badge ${badgeTone(cur.tone)}`}>{cur.stateLabel}</span></dd>
          <dt>{strings.latestWord}</dt><dd>{cur.eventLabel}</dd>
          <dt>{strings.sourceWord}</dt><dd>{cur.sourceLabel}</dd>
          <dt>{strings.boundaryWord}</dt><dd>{cur.boundaryLabel}</dd>
        </dl>
        <a className="btn btn-ghost" href={cur.anchorHref}>{cur.anchorLabel}</a>
        </div>
      </div>
      </div>
    </section>
  );
}
