// Server-safe string builders for the Sample Details and Seizure Details
// sections in Visit Report · Results (Step 3 of 4). All visible component copy
// stays here; EN and AR text comes from the supplied PWA design and existing
// governed ui_strings where a registered key exists.

type T = (key: string, en: string) => string;

export type SamplesSectionStrings = {
  title: string;
  gate: string;
  gateYes: string;
  gateNo: string;
  addCta: string;
  itemLabel: string;
  deleteLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  photoFieldLabel: string;
  takePhotoLabel: string;
};

export type SeizureSectionStrings = {
  title: string;
  gate: string;
  gateYes: string;
  gateNo: string;
  addCta: string;
  itemHeader: string;
  deleteLabel: string;
  productNameLabel: string;
  productNamePlaceholder: string;
  quantityLabel: string;
  quantityPlaceholder: string;
};

function designLocale(t: T): "en" | "ar" {
  return t("figma.visitreports.vr036", "Sample Details") === "تفاصيل العينات" ? "ar" : "en";
}

function designString(locale: "en" | "ar", en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

export function buildSamplesSectionStrings(t: T): SamplesSectionStrings {
  const locale = designLocale(t);
  return {
    title: t("figma.visitreports.vr036", "Sample Details"),
    gate: t("figma.visitreports.vr037", "Were samples collected from the establishment?"),
    gateYes: t("field.ws.ctx.yes", "Yes"),
    gateNo: t("field.ws.ctx.no", "No"),
    addCta: t("figma.visitreports.vr047", "Add New Sample"),
    itemLabel: designString(locale, "Sample", "عينة"),
    deleteLabel: designString(locale, "Delete", "حذف"),
    nameLabel: designString(locale, "Sample name", "اسم العينة"),
    namePlaceholder: designString(locale, "Sample name", "اسم العينة"),
    photoFieldLabel: designString(locale, "Sample photo", "صورة العينة"),
    takePhotoLabel: designString(locale, "Take photo", "التقاط صورة"),
  };
}

// VR-048 is captured with its ordinal baked into the string ("Product (1)" /
// "المنتج (1)"). The governed row owns the wording, so the ordinal is
// substituted rather than the label being re-authored. Arabic-Indic and extended
// Arabic-Indic digits are matched as well, because ui_strings is editable and
// the AR row may legitimately be renumbered in native digits. If an edit ever
// removes the ordinal, it is appended instead of silently dropped — otherwise
// every repeated row would render an identical header.
// Escapes, not literals: a bidi digit range pasted into source reorders on
// screen and is not reviewable. U+0660-0669 Arabic-Indic, U+06F0-06F9 extended.
const ORDINAL = /[0-9\u0660-\u0669\u06F0-\u06F9]+/;

export function seizureItemHeader(template: string, position: number): string {
  const ordinal = String(position);
  return ORDINAL.test(template)
    ? template.replace(ORDINAL, ordinal)
    : `${template} ${ordinal}`;
}

export function buildSeizureSectionStrings(t: T): SeizureSectionStrings {
  const locale = designLocale(t);
  return {
    title: t("figma.visitreports.vr038", "Seizure Details"),
    gate: t("figma.visitreports.vr039", "Were products seized?"),
    gateYes: t("field.ws.ctx.yes", "Yes"),
    gateNo: t("field.ws.ctx.no", "No"),
    // VR-048 and VR-049 are registered ui_strings for the seizure repeater, so
    // they win over the Visit Results wording ("Seized product 1" / "Add seized
    // product"). Samples has no equivalent registered header key — VR-043/044
    // are sample DATA values, not labels — so its row badge stays design copy.
    addCta: t("figma.visitreports.vr049", "Add New Products"),
    itemHeader: t("figma.visitreports.vr048", "Product (1)"),
    deleteLabel: designString(locale, "Delete", "حذف"),
    productNameLabel: t("figma.establishmentmanagement.em101", "Product Name"),
    productNamePlaceholder: designString(locale, "Seized product name", "اسم المنتج المحجوز"),
    quantityLabel: designString(locale, "Quantity", "الكمية"),
    quantityPlaceholder: designString(locale, "Quantity", "الكمية"),
  };
}
