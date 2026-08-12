"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./visit-detail.module.css";

export type RibbonTrack = {
  readonly id: "planning" | "operational" | "assignment" | "inspection" | "review";
  readonly domainLabel: string;
  readonly stateLabel: string;
  readonly tone: StatusTone;
  readonly eventLabel: string;
  readonly sourceLabel: string;
  readonly boundaryLabel: string;
  readonly anchorHref: string;
  readonly anchorLabel: string;
};

export type RibbonStrings = {
  readonly heading: string;
  readonly tablistLabel: string;
  readonly stateWord: string;
  readonly latestWord: string;
  readonly sourceWord: string;
  readonly boundaryWord: string;
};

export default function VisitLifecycleRibbon({ tracks, strings }: {
  tracks: readonly RibbonTrack[];
  strings: RibbonStrings;
}) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(index: number) {
    const next = (index + tracks.length) % tracks.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight": case "ArrowDown": event.preventDefault(); focusTab(index + 1); break;
      case "ArrowLeft": case "ArrowUp": event.preventDefault(); focusTab(index - 1); break;
      case "Home": event.preventDefault(); focusTab(0); break;
      case "End": event.preventDefault(); focusTab(tracks.length - 1); break;
    }
  }

  const current = tracks[active];
  return (
    <Card as="section" labelledBy="visit-lifecycle-heading">
      <CardHeader level="h2" titleId="visit-lifecycle-heading" title={strings.heading} />
      <CardBody gap="tight">
        <div className={styles.tablist} role="tablist" aria-label={strings.tablistLabel} aria-orientation="horizontal">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              ref={element => { tabRefs.current[index] = element; }}
              type="button"
              role="tab"
              id={`ribbon-tab-${track.id}`}
              aria-selected={index === active}
              aria-controls="ribbon-panel"
              tabIndex={index === active ? 0 : -1}
              className={styles.tab}
              data-active={index === active ? "" : undefined}
              onClick={() => setActive(index)}
              onKeyDown={event => onKeyDown(event, index)}
            >
              <span className={styles.tabDomain}>{track.domainLabel}</span>
              <StatusPill tone={track.tone} ping={false}>{track.stateLabel}</StatusPill>
            </button>
          ))}
        </div>
        <div id="ribbon-panel" role="tabpanel" aria-labelledby={`ribbon-tab-${current.id}`} tabIndex={0}>
          <DefinitionList
            columns="two"
            items={[
              { label: strings.stateWord, value: <StatusPill tone={current.tone} ping={false}>{current.stateLabel}</StatusPill> },
              { label: strings.latestWord, value: current.eventLabel },
              { label: strings.sourceWord, value: current.sourceLabel },
              { label: strings.boundaryWord, value: current.boundaryLabel },
            ]}
          />
          <Button variant="tertiary" size="sm" href={current.anchorHref} label={current.anchorLabel}>
            {current.anchorLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
