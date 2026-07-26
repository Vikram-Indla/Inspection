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
  tone: string;             // sq-lozenge tone class ("" | sq-lozenge--warning | …)
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
    <section className="panel sq-ribbon" aria-label={strings.heading} style={{ padding: "var(--space-6)" }}>
      <h4 style={{ margin: 0, marginBlockEnd: "var(--space-4)" }}>{strings.heading}</h4>
      <div className="sq-ribbon__tracks" role="tablist" aria-label={strings.tablistLabel} aria-orientation="horizontal">
        {tracks.map((tr, i) => (
          <button
            key={tr.id}
            ref={el => { tabRefs.current[i] = el; }}
            role="tab"
            id={`ribbon-tab-${tr.id}`}
            aria-selected={i === active}
            aria-controls="ribbon-panel"
            tabIndex={i === active ? 0 : -1}
            className={`sq-ribbon__track ${i === active ? "is-active" : ""}`}
            onClick={() => setActive(i)}
            onKeyDown={e => onKeyDown(e, i)}
          >
            <span className="sq-ribbon__glyph" aria-hidden="true">{GLYPH[tr.id]}</span>
            <span className="sq-ribbon__domain">{tr.domainLabel}</span>
            <span className={`sq-lozenge ${tr.tone}`}>{tr.stateLabel}</span>
          </button>
        ))}
      </div>
      <div id="ribbon-panel" role="tabpanel" aria-labelledby={`ribbon-tab-${cur.id}`} tabIndex={0} className="sq-ribbon__panel">
        <dl className="sq-ribbon__facts">
          <div><dt>{strings.stateWord}</dt><dd><span className={`sq-lozenge ${cur.tone}`}>{cur.stateLabel}</span></dd></div>
          <div><dt>{strings.latestWord}</dt><dd>{cur.eventLabel}</dd></div>
          <div><dt>{strings.sourceWord}</dt><dd>{cur.sourceLabel}</dd></div>
          <div><dt>{strings.boundaryWord}</dt><dd>{cur.boundaryLabel}</dd></div>
        </dl>
        <a className="sq-link" href={cur.anchorHref}>{cur.anchorLabel}</a>
      </div>
    </section>
  );
}
