"use client";

import AdvisoryStrip from "@/components/ai/advisory-strip/advisory-strip";

const EVIDENCE_REFS = "M07-014,M07-015,SCR-WEB-300";
const HEADING_ID = "factory-ai-title";

export type FactoryAiAdvisoryStrings = {
  readonly title: string;
  readonly fallback: string;
  readonly generate: string;
  readonly generating: string;
};

export default function FactoryAiAdvisory({ factoryId, locale, strings }: {
  factoryId: string;
  locale: "ar" | "en";
  strings: FactoryAiAdvisoryStrings;
}) {
  return (
    <AdvisoryStrip
      headingId={HEADING_ID}
      strings={strings}
      surfaceFields={
        <>
          <input type="hidden" name="surface" value="factory_risk_explanation" />
          <input type="hidden" name="target_ref" value={factoryId} />
          <input type="hidden" name="context" value={JSON.stringify({ scope: "factory-risk" })} />
          <input type="hidden" name="evidence_refs" value={EVIDENCE_REFS} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="fallback" value={strings.fallback} />
        </>
      }
    />
  );
}
