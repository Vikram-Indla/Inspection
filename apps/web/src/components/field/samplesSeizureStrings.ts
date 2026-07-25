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

export function buildSeizureSectionStrings(t: T): SeizureSectionStrings {
  const locale = designLocale(t);
  return {
    title: t("figma.visitreports.vr038", "Seizure Details"),
    gate: t("figma.visitreports.vr039", "Were products seized?"),
    gateYes: t("field.ws.ctx.yes", "Yes"),
    gateNo: t("field.ws.ctx.no", "No"),
    addCta: designString(locale, "Add seized product", "إضافة منتج محجوز"),
    itemHeader: designString(locale, "Seized product (1)", "منتج محجوز (1)"),
    deleteLabel: designString(locale, "Delete", "حذف"),
    productNameLabel: t("figma.establishmentmanagement.em101", "Product Name"),
    productNamePlaceholder: designString(locale, "Seized product name", "اسم المنتج المحجوز"),
    quantityLabel: designString(locale, "Quantity", "الكمية"),
    quantityPlaceholder: designString(locale, "Quantity", "الكمية"),
  };
}
