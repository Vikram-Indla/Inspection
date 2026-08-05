import React from "react";
import { StateSurface } from "./StateSurface";

export type MapTruthStateKind = "provider-unavailable" | "offline" | "stale";

export interface MapTruthStateProps {
  state: MapTruthStateKind;
  locale?: "en" | "ar";
  /** Localized display copy supplied by the route i18n resource. */
  title: string;
  body: string;
  observedAt?: string | null;
  observedAtLabel?: React.ReactNode;
  action?: React.ReactNode;
}

export function MapTruthState({ state, locale = "en", title, body, observedAt, observedAtLabel, action }: MapTruthStateProps) {
  return (
    <StateSurface
      kind={state}
      locale={locale}
      title={title}
      body={body}
      action={action}
      className="map-panel"
    >
      {observedAt && observedAtLabel ? <time dateTime={observedAt}>{observedAtLabel}</time> : null}
    </StateSurface>
  );
}
