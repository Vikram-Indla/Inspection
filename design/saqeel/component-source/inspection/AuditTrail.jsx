import React from "react";
import { Timeline } from "../data/Timeline.jsx";
export function AuditTrail({ entries = [] }) {
  return <Timeline items={entries.map((e) => ({
    title: e.action, detail: e.detail, actor: e.actor, time: e.time,
    tone: e.tone, accent: e.accent,
  }))} />;
}