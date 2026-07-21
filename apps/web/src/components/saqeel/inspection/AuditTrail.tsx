import React from "react";
import { Timeline } from "../data/Timeline";

export interface AuditTrailProps {
  entries?: Array<{ action: string; detail?: string; actor?: string; time?: string; tone?: string; accent?: boolean }>;
}

export function AuditTrail({ entries = [] }: AuditTrailProps) {
  return (
    <Timeline
      items={entries.map((e) => ({
        title: e.action,
        detail: e.detail,
        actor: e.actor,
        time: e.time,
        tone: e.tone,
        accent: e.accent,
      }))}
    />
  );
}
