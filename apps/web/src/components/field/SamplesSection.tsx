/**
 * SamplesSection — additive iPad inspection sub-section shell (SCR-IPAD
 * Visit-Reports). Captured scaffold only:
 *   header VR-036 · gate VR-037 · add-CTA VR-047 · photo VR-041/VR-042.
 * Per-sample detail fields are uncaptured (VR-043/044/046 are sample data, not
 * labels) and render as a build placeholder inside GatedRepeaterSection.
 *
 * NOT yet wired into the inspection submit/outbox flow — additive shell pending
 * the missing item fields + engine wire-in. Takes pre-translated strings
 * (build them server-side via buildSamplesSectionStrings(t)).
 */
"use client";

import GatedRepeaterSection from "./GatedRepeaterSection";
import type { SamplesSectionStrings } from "./samplesSeizureStrings";

export type { SamplesSectionStrings };

export default function SamplesSection({ strings }: { strings: SamplesSectionStrings }) {
  return (
    <GatedRepeaterSection
      idPrefix="samples"
      title={strings.title}
      gate={strings.gate}
      gateYes={strings.gateYes}
      gateNo={strings.gateNo}
      addLabel={strings.addCta}
      removeLabel={strings.removeLabel}
      // No captured per-sample header in this Figma set → none rendered.
      photo={{ label: strings.photoLabel, helper: strings.photoHelper }}
    />
  );
}
