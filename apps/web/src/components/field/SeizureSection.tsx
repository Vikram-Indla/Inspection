/**
 * SeizureSection — additive iPad inspection sub-section shell (SCR-IPAD
 * Visit-Reports). Captured scaffold only:
 *   header VR-038 · gate VR-039 · item-header VR-048 · add-CTA VR-049.
 * VR-038/VR-039 are flagged PENDING_LEGAL_NATIVE_REVIEW (TQ-04, "seizure vs
 * detention of products") in TRANSLATION_REVIEW_REGISTER.csv — the strings are
 * captured and used here, but their EN release still awaits native-Arabic/legal
 * signoff (surfaced as PENDING_LEGAL_NATIVE_REVIEW in the seeded ui_strings row).
 *
 * No captured photo affordance for Seizure (VR-041/042 are Samples-only), so
 * none is rendered. Per-product detail fields are uncaptured and render as a
 * build placeholder inside GatedRepeaterSection.
 *
 * NOT yet wired into the inspection submit/outbox flow — additive shell pending
 * the missing item fields + engine wire-in. Takes pre-translated strings
 * (build them server-side via buildSeizureSectionStrings(t)).
 */
"use client";

import GatedRepeaterSection from "./GatedRepeaterSection";
import type { SeizureSectionStrings } from "./samplesSeizureStrings";

export type { SeizureSectionStrings };

export default function SeizureSection({ strings }: { strings: SeizureSectionStrings }) {
  return (
    <GatedRepeaterSection
      idPrefix="seizure"
      title={strings.title}
      gate={strings.gate}
      gateYes={strings.gateYes}
      gateNo={strings.gateNo}
      addLabel={strings.addCta}
      removeLabel={strings.removeLabel}
      itemHeader={strings.itemHeader}
      // No captured photo affordance for Seizure → omitted.
    />
  );
}
