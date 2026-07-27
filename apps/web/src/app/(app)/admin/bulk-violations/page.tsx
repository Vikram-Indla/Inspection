import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { IconBlocked } from "@/app/icons";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import BulkViolationForm, { type BulkViolationStrings } from "./BulkViolationForm";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

export const dynamic = "force-dynamic";

// DEC-L (option 1) — bulk violation issuance reframed as bulk administrative
// inspection creation; every issued violation is a real violations row via a
// real inspections row (issue_bulk_violation RPC, 20260719030000). No
// product-contract screen_id exists for this route yet — housekeeping
// follow-up, not a blocker.
export default async function BulkViolations() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const { data: roleRows, error: roleError } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = (roleRows ?? []).map(r => r.role_key);
  const isAuthorized = roles.includes("ops") || roles.includes("compliance_admin");

  if (!isAuthorized) {
    return (
      <Shell current="/admin/bulk-violations" title={tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}>
        <h1 className="sq-sr-only">{tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}</h1>
        <EmptyState icon={<IconBlocked size={28} />} title={tr("admin.bulkvio.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("admin.bulkvio.unauthorized.body", "Bulk violation issuance (DEC-L) is available to Operations and Compliance Admin roles only.", "إصدار المخالفات الجماعي (DEC-L) متاح لدوري العمليات ومسؤول الامتثال فقط.")} />
      </Shell>
    );
  }

  const [{ data: factories, error: factoriesError }, { data: violationRows, error: violationsError }] = await Promise.all([
    sb.from("factories").select("id, name, factory_code, cr_number, region, city").in("factory_code", [...CLEAN_FACTORY_CODES]).order("name").limit(24),
    sb.from("violation_codes").select("id, code, title, level, penalty_mappings(mapping_version, penalty_ref, legal_basis, status)").order("code"),
  ]);

  const violations = (violationRows ?? [])
    .map(v => ({
      code: v.code, title: v.title, level: v.level,
      penalty_ref: (v.penalty_mappings ?? []).find((m: { status: string }) => ["published", "locked"].includes(m.status))?.penalty_ref ?? null,
    }))
    .filter(v => v.penalty_ref !== null);   // only issuable violations have an accepted mapping (M09-004)

  const strings: BulkViolationStrings = {
    searchFactoryLabel: tr("admin.bulkvio.searchFactory", "Search establishments", "البحث عن المنشآت"),
    searchFactoryPlaceholder: tr("admin.bulkvio.searchFactoryPlaceholder", "Name, CR number or code", "الاسم أو رقم السجل التجاري أو الرمز"),
    selectedCount: tr("admin.bulkvio.selectedCount", "{n} selected", "{n} محددة"),
    violationLabel: tr("admin.bulkvio.violationLabel", "Violation", "المخالفة"),
    violationPlaceholder: tr("admin.bulkvio.violationPlaceholder", "— select a violation", "— حدد مخالفة"),
    notesLabel: tr("admin.bulkvio.notesLabel", "Notes (optional)", "ملاحظات (اختياري)"),
    notesPlaceholder: tr("admin.bulkvio.notesPlaceholder", "Recorded with the audit event", "يُسجَّل مع حدث التدقيق"),
    previewTitle: tr("admin.bulkvio.previewTitle", "Impact summary", "ملخص الأثر"),
    previewBody: tr("admin.bulkvio.previewBody", "{n} establishment(s) will each receive one {level} violation ({code} · {penalty}). This creates a real, permanent violation record for each — it cannot be undone.", "ستتلقى {n} منشأة/منشآت مخالفة واحدة من نوع {level} ({code} · {penalty}) لكل منها. يُنشئ هذا سجل مخالفة حقيقيًا ودائمًا لكل منشأة — ولا يمكن التراجع عنه."),
    acknowledgeLabel: tr("admin.bulkvio.acknowledge", "I have reviewed the establishment list and violation, and confirm this action is authorized.", "لقد راجعت قائمة المنشآت والمخالفة، وأؤكد أن هذا الإجراء مصرح به."),
    submit: tr("admin.bulkvio.submit", "Issue violation to selected establishments", "إصدار المخالفة للمنشآت المحددة"),
    submitting: tr("admin.bulkvio.submitting", "Issuing…", "جارٍ الإصدار…"),
    resultsTitle: tr("admin.bulkvio.resultsTitle", "Result", "النتيجة"),
    resultSuccess: tr("admin.bulkvio.resultSuccess", "issued", "تم الإصدار"),
    resultFailed: tr("admin.bulkvio.resultFailed", "failed", "فشل"),
    partialWarning: tr("admin.bulkvio.partialWarning", "Not all targets succeeded — review the failed rows below before assuming this batch is complete.", "لم تنجح جميع الأهداف — راجع الصفوف الفاشلة أدناه قبل افتراض اكتمال هذه الدفعة."),
    allSucceeded: tr("admin.bulkvio.allSucceeded", "All {n} violations issued successfully.", "تم إصدار جميع المخالفات البالغ عددها {n} بنجاح."),
  };

  return (
    <Shell current="/admin/bulk-violations" title={tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}
      context={<span className="badge badge-info">DEC-L</span>}>
      <h1 className="sq-sr-only">{tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}</h1>
      {roleError && <div className="sq-banner sq-banner--warning" role="alert"><div>{tr("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.", "تعذر التحقق من صلاحيات الإعداد. تم تعطيل الكتابة؛ أعد تحميل الصفحة.")}</div></div>}
      <div className="sq-banner sq-banner--warning">
        <div><strong>{tr("admin.bulkvio.warnTitle", "This issues real, permanent violations.", "هذا يُصدر مخالفات حقيقية ودائمة.")}</strong>{" "}
          {tr("admin.bulkvio.warnBody", "Each selected establishment receives a real inspection record and a real violation, exactly as if found during a field visit. This cannot be undone.", "تتلقى كل منشأة محددة سجل تفتيش حقيقيًا ومخالفة حقيقية، تمامًا كما لو تم اكتشافها أثناء زيارة ميدانية. لا يمكن التراجع عن هذا.")}</div>
      </div>
      {factoriesError && <div className="sq-banner sq-banner--warning" role="alert"><div>{tr("admin.bulkvio.factoriesError", "The establishment registry is unavailable in this environment.", "سجل المنشآت غير متاح في هذه البيئة.")}</div></div>}
      {violationsError && <div className="sq-banner sq-banner--warning" role="alert"><div>{tr("admin.bulkvio.violationsError", "The violation catalogue is unavailable in this environment.", "كتالوج المخالفات غير متاح في هذه البيئة.")}</div></div>}
      <BulkViolationForm
        factories={(factories ?? []).map(f => ({ id: f.id, name: f.name, factory_code: f.factory_code, cr_number: f.cr_number, region: f.region, city: f.city }))}
        violations={violations}
        strings={strings}
      />
    </Shell>
  );
}
