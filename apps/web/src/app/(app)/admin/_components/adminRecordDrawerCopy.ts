import type { AdminRecordDrawerLabels } from "./AdminRecordDrawer";

export function createAdminRecordDrawerLabels(
  t: (key: string, fallback: string) => string,
  locale: string,
): AdminRecordDrawerLabels {
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  return {
    record: t("admin.recordDrawer.record", copy("Record", "السجل")),
    governance: t("admin.recordDrawer.governance", copy("Governance", "الحوكمة")),
    audit: t("admin.recordDrawer.audit", copy("Audit", "التدقيق")),
    rule: t("admin.recordDrawer.rule", copy("Rule", "القاعدة")),
    editThroughRequest: t("admin.recordDrawer.edit", copy("Edit through request", "التعديل عبر طلب")),
    viewActivityLog: t("admin.recordDrawer.activity", copy("View activity log", "عرض سجل النشاط")),
    close: t("admin.recordDrawer.close", copy("Close", "إغلاق")),
    closePanel: t("admin.recordDrawer.closePanel", copy("Close record panel", "إغلاق لوحة السجل")),
    openRecord: t("admin.recordDrawer.open", copy("Open record", "فتح السجل")),
    auditDisclosure: t(
      "admin.recordDrawer.auditDisclosure",
      copy(
        "Open the governed activity log for RLS-visible facts. No actor, event or timestamp is inferred in this drawer.",
        "افتح سجل النشاط المحكوم لعرض الحقائق المرئية وفق أمن الصفوف. لا تستنتج هذه اللوحة أي منفذ أو حدث أو وقت.",
      ),
    ),
    editUnavailable: t(
      "admin.recordDrawer.editUnavailable",
      copy(
        "No governed edit workflow is available for this record.",
        "لا يتوفر مسار تعديل محكوم لهذا السجل.",
      ),
    ),
  };
}
