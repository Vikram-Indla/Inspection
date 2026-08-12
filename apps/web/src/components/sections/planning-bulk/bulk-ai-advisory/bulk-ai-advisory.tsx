"use client";

import AdvisoryStrip from "@/components/ai/advisory-strip/advisory-strip";

const EVIDENCE_REFS = "AC-0016,AC-0026,M01-016,M01-026,SCR-WEB-110";
const HEADING_ID = "bulk-ai-title";

export type BulkAiAdvisoryStrings = {
  readonly title: string;
  readonly advisory: string;
  readonly evidence: string;
  readonly idle: string;
  readonly generate: string;
  readonly generating: string;
  readonly unavailable: string;
  readonly description: string;
};

export default function BulkAiAdvisory({ context, locale, strings }: {
  context: string;
  locale: "ar" | "en";
  strings: BulkAiAdvisoryStrings;
}) {
  return (
    <AdvisoryStrip
      headingId={HEADING_ID}
      strings={strings}
      notesShownWithAdvisory={[strings.evidence, strings.description]}
      surfaceFields={
        <>
          <input type="hidden" name="surface" value="planning_summary" />
          <input type="hidden" name="context" value={context} />
          <input type="hidden" name="evidence_refs" value={EVIDENCE_REFS} />
          <input type="hidden" name="locale" value={locale} />
        </>
      }
    />
  );
}
