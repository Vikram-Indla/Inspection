"use client";
// Redesigned "My daily inspection briefing" card (TASK-FIELD-BRIEFING-AUTOLOAD-001,
// sponsor-owned deviation, verbatim, overrides Figma default if one exists).
//
// - No manual "Generate" button as the primary path: `daily` / `weekly` are
//   already-fetched, already-cached briefings passed in as props from the
//   server component (field/page.tsx via lib/ai/briefing.ts). The card is
//   populated the instant it renders.
// - A small icon-only "Refresh" affordance stays as a secondary path for an
//   inspector whose assignments changed intraday.
// - ONE advisory disclosure (a small caption line), not three overlapping
//   elements. No source-reference IDs (MVP1-M03-001 etc.) in visible text —
//   they are still recorded server-side in ai_suggestions for audit and are
//   carried here only as a non-visible data attribute.
// - "Review or reject this advisory" stays functional, styled as a plain text
//   link (human-in-the-loop governance affordance, unchanged).
// - Daily/Weekly segmented toggle: both scopes are pre-fetched server-side, so
//   switching is instant (no extra network round trip). Shared with the KPI
//   strip's Daily/Weekly toggle (see FieldScopeProvider) — one toggle, one
//   mental model, since both surfaces answer "today or this week".

import { useEffect, useState, useTransition } from "react";
import { refreshBriefingAction, type BriefingPayload, type BriefingScope } from "@/lib/ai/briefing";
import { useFieldScope } from "./FieldScopeProvider";

export type DailyBriefingStrings = {
  titleDaily: string;
  titleWeekly: string;
  advisory: string;           // "AI-advisory · not a decision"
  refreshAria: string;        // "Refresh briefing"
  refreshing: string;         // "Refreshing…"
  review: string;             // "Review or reject this advisory"
  unavailable: string;        // "Briefing unavailable — nothing was generated or changed."
  cachedFrom: string;         // "Generated {time}" (time already localized by caller if needed)
};

// New generations come back "- one fact per line" (ai-gemini.ts) and split
// cleanly on "\n". Older cached rows, generated before that fix landed, are
// one continuous prose paragraph with no line breaks at all — split("\n")
// on those returns a single giant line, i.e. no list at all. Fall back to
// splitting on sentence boundaries so legacy cache entries still render as a
// scannable list instead of a wall of text until they naturally expire and
// regenerate in the new format.
function toBulletLines(text: string): string[] {
  const lines = text.split("\n").map((line) => line.replace(/^- /, "").trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return (lines[0] ?? text).split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
}

export default function DailyBriefingCard({
  daily,
  weekly,
  strings,
  evidenceRefs,
}: {
  daily: BriefingPayload;
  weekly: BriefingPayload;
  strings: DailyBriefingStrings;
  /** Internal traceability only — never rendered as visible text (sponsor
   *  direction); carried as a non-visible data attribute for audit/debug. */
  evidenceRefs: string[];
}) {
  const { scope } = useFieldScope();
  const [current, setCurrent] = useState<Record<BriefingScope, BriefingPayload>>({ daily, weekly });
  const [pending, startTransition] = useTransition();

  // Keep in sync if the server component re-renders with newer initial data
  // (e.g. after a full navigation), without clobbering a client-side refresh.
  useEffect(() => { setCurrent((c) => ({ ...c, daily })); }, [daily]);
  useEffect(() => { setCurrent((c) => ({ ...c, weekly })); }, [weekly]);

  const active = current[scope];
  const title = scope === "weekly" ? strings.titleWeekly : strings.titleDaily;

  function onRefresh() {
    startTransition(async () => {
      const fresh = await refreshBriefingAction(scope);
      setCurrent((c) => ({ ...c, [scope]: fresh }));
    });
  }

  return (
    <section
      className="ax-surface ax-panel"
      aria-labelledby="inspector-briefing-heading"
      data-testid="inspector-daily-briefing-panel"
      data-evidence-refs={evidenceRefs.join(",")}
      style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}
    >
      <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--ax-space-150)" }}>
        <h3 id="inspector-briefing-heading" style={{ font: "var(--ax-text-heading)", margin: 0 }}>{title}</h3>
        <div className="ax-row" style={{ alignItems: "center", gap: "var(--ax-space-100)" }}>
          <span className="ax-caption" style={{ color: "var(--ax-color-text-secondary)" }}>{strings.advisory}</span>
          <button
            type="button"
            className="ax-btn ax-btn--subtle ax-btn--icon"
            aria-label={strings.refreshAria}
            title={strings.refreshAria}
            disabled={pending}
            onClick={onRefresh}
          >
            <span aria-hidden style={pending ? { display: "inline-block", animation: "ax-spin 0.9s linear infinite" } : undefined}>⟳</span>
          </button>
        </div>
      </div>

      {pending ? (
        <p className="ax-caption" style={{ color: "var(--ax-color-text-secondary)" }}>{strings.refreshing}</p>
      ) : active.text ? (
        <ul style={{ font: "var(--ax-text-body)", lineHeight: 1.5, margin: 0, paddingInlineStart: "var(--ax-space-200)", display: "flex", flexDirection: "column", gap: "var(--ax-space-050)" }}
          data-briefing-period={active.periodDate ?? undefined}>
          {toBulletLines(active.text).map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      ) : (
        <p role="status" className="ax-caption" style={{ color: "var(--ax-color-text-secondary)" }}>{strings.unavailable}</p>
      )}

      {active.insightId && (
        <a className="ax-link ax-caption" href={`/ai/suggestions#ai-suggestion-${active.insightId}`}>
          {strings.review} →
        </a>
      )}
    </section>
  );
}
