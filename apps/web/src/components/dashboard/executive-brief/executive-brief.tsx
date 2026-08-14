"use client";

import AdvisoryStrip from "@/components/ai/advisory-strip/advisory-strip";
import type { Locale } from "@/lib/i18n";

const EVIDENCE_REFS = "MVP2-REQ-0056,MVP2-REQ-0057,SCR-WEB-010";
const HEADING_ID = "dashboard-executive-brief";

export type ExecutiveBriefStrings = {
  readonly title: string;
  readonly advisory: string;
  readonly evidence: string;
  readonly idle: string;
  readonly generate: string;
  readonly generating: string;
  readonly noCause: string;
};

export default function ExecutiveBrief({ locale, context, period, region, strings }: {
  locale: Locale;
  context: string;
  period: { readonly from: string | null; readonly to: string | null };
  region: string;
  strings: ExecutiveBriefStrings;
}) {
  return (
    <AdvisoryStrip
      headingId={HEADING_ID}
      strings={strings}
      notesShownWithAdvisory={[strings.evidence, strings.noCause]}
      surfaceFields={
        <>
          <input type="hidden" name="surface" value="executive_brief" />
          <input type="hidden" name="context" value={context} />
          {period.from ? <input type="hidden" name="period_from" value={period.from} /> : null}
          {period.to ? <input type="hidden" name="period_to" value={period.to} /> : null}
          <input type="hidden" name="region" value={region} />
          <input type="hidden" name="evidence_refs" value={EVIDENCE_REFS} />
          <input type="hidden" name="locale" value={locale} />
        </>
      }
    />
  );
}
