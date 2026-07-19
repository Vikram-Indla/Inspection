// Server-safe string builders for the Samples and Seizure inspection sections
// (SCR-IPAD Visit-Reports family). Called from a server component via useT() and
// passed as pre-translated `strings` props into the client components below,
// exactly like WorkspaceStrings / FactoryVerificationStrings.
//
// PROVENANCE — every user-facing string cites its Figma string_id from
// TRANSLATION_REVIEW_REGISTER.csv; the Arabic is served at runtime from
// ui_strings, seeded in migration
// 20260719000000_mim_ipad_figma_localization_seed.sql (figma.visitreports.*).
// The English defaults below match that seed byte-for-byte so the code↔DB
// i18n-sync reconciler reports no drift (note the U+00D7 "×" in the photo helper).
// No string is invented here.
//
// SCOPE — SHELLS ONLY. The per-sample / per-seized-item DETAIL field labels are
// NOT captured: VR-043 "Final Product Sample", VR-044 "Polyethylene (PE) Pellets"
// and VR-046 are sample DATA values (disposition NON_PRODUCT_REFERENCE /
// sample-data), not field labels. These builders therefore carry only the
// captured section scaffold (header, Yes/No gate question, add-CTA, and — for
// Samples — the photo-upload label + helper). The item detail form is rendered
// as an explicit build placeholder in the components, pending live-Figma
// extraction of the real labels.

type T = (key: string, en: string) => string;

export type SamplesSectionStrings = {
  title: string;       // Figma VR-036 (figma.visitreports.vr036)
  gate: string;        // Figma VR-037 (figma.visitreports.vr037)
  gateYes: string;     // Figma VR-034 also captures "Yes"; reuse existing app key field.ws.ctx.yes
  gateNo: string;      // "No" NOT captured in this Figma set — reuse existing app key field.ws.ctx.no
  addCta: string;      // Figma VR-047 (figma.visitreports.vr047)
  removeLabel: string; // reuse existing app key plan.review.remove (Repeater remove control)
  photoLabel: string;  // Figma VR-041 (figma.visitreports.vr041)
  photoHelper: string; // Figma VR-042 (figma.visitreports.vr042) — carries the 550×340 / jpg / 2 MB constraints
};

export type SeizureSectionStrings = {
  title: string;       // Figma VR-038 (figma.visitreports.vr038) — PENDING_LEGAL_NATIVE_REVIEW, TQ-04
  gate: string;        // Figma VR-039 (figma.visitreports.vr039) — PENDING_LEGAL_NATIVE_REVIEW, TQ-04
  gateYes: string;     // reuse existing app key field.ws.ctx.yes
  gateNo: string;      // reuse existing app key field.ws.ctx.no
  addCta: string;      // Figma VR-049 (figma.visitreports.vr049)
  itemHeader: string;  // Figma VR-048 (figma.visitreports.vr048) "Product (1)" — repeater item-header pattern
  removeLabel: string; // reuse existing app key plan.review.remove
};

export function buildSamplesSectionStrings(t: T): SamplesSectionStrings {
  return {
    title: t("figma.visitreports.vr036", "Sample Details"),
    gate: t("figma.visitreports.vr037", "Were samples collected from the establishment?"),
    gateYes: t("field.ws.ctx.yes", "Yes"),
    gateNo: t("field.ws.ctx.no", "No"),
    addCta: t("figma.visitreports.vr047", "Add New Sample"),
    removeLabel: t("plan.review.remove", "Remove"),
    photoLabel: t("figma.visitreports.vr041", "Add Sample Photo"),
    photoHelper: t("figma.visitreports.vr042", "For best results upload an image 550 px wide × 340 px high, jpg format, max size 2 MB."),
  };
}

export function buildSeizureSectionStrings(t: T): SeizureSectionStrings {
  return {
    title: t("figma.visitreports.vr038", "Seizure Details"),
    gate: t("figma.visitreports.vr039", "Were products seized?"),
    gateYes: t("field.ws.ctx.yes", "Yes"),
    gateNo: t("field.ws.ctx.no", "No"),
    addCta: t("figma.visitreports.vr049", "Add New Products"),
    itemHeader: t("figma.visitreports.vr048", "Product (1)"),
    removeLabel: t("plan.review.remove", "Remove"),
  };
}
