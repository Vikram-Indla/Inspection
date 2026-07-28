import Shell from "@/app/(app)/admin/_components/AdminShell";
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

// DEC-L (option 1) is visible as a read-only impact preview. DEC-032 blocks the
// underlying real inspection submission until its database digest migration is
// approved and deployed.
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

  if (roleError) {
    return (
      <Shell current="/admin/bulk-violations" title={tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}>
        <h1 className="sr-only">{tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}</h1>
        <EmptyState
          icon={<IconBlocked size={28} />}
          title={tr("admin.permissionsUnavailable.title", "Permissions unavailable", "الصلاحيات غير متاحة")}
          body={tr("admin.permissionsUnavailable.body", "Your permissions could not be verified. No establishment or violation data is shown; retry the page.", "تعذر التحقق من صلاحياتك. لم يتم عرض بيانات المنشآت أو المخالفات؛ أعد تحميل الصفحة.")}
        />
      </Shell>
    );
  }

  if (!isAuthorized) {
    return (
      <Shell current="/admin/bulk-violations" title={tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}>
        <h1 className="sr-only">{tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}</h1>
        <EmptyState icon={<IconBlocked size={28} />} title={tr("admin.bulkvio.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("admin.bulkvio.unauthorized.body", "Bulk violation issuance (DEC-L) is available to Operations and Compliance Admin roles only.", "إصدار المخالفات الجماعي (DEC-L) متاح لدوري العمليات ومسؤول الامتثال فقط.")} />
      </Shell>
    );
  }

  const [
    { data: factories, error: factoriesError },
    { data: violationRows, error: violationsError },
    { data: packageRows, error: packagesError },
  ] = await Promise.all([
    sb.from("factories").select("id, name, factory_code, cr_number, region, city").in("factory_code", [...CLEAN_FACTORY_CODES]).order("name").limit(24),
    sb.from("violation_codes").select("id, code, title, level, status, active_from, active_to, penalty_mappings(mapping_version, penalty_ref, legal_basis, status)").in("status", ["published", "locked"]).order("code"),
    sb.from("package_versions")
      .select("id, version_label, status, published_at, deactivation_reason, definition, packages(code, title)")
      .eq("status", "locked")
      .not("published_at", "is", null)
      .is("deactivation_reason", null)
      .order("published_at", { ascending: false })
      .limit(20),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const violations = (violationRows ?? [])
    .filter(v => (!v.active_from || v.active_from <= today) && (!v.active_to || v.active_to >= today))
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
    packageLabel: tr("admin.bulkvio.packageLabel", "Locked, published and active package version", "إصدار حزمة مقفل ومنشور ونشط"),
    packagePlaceholder: tr("admin.bulkvio.packagePlaceholder", "— select an eligible package version", "— حدد إصدار حزمة مؤهلًا"),
    notesLabel: tr("admin.bulkvio.notesLabel", "Notes (optional)", "ملاحظات (اختياري)"),
    notesPlaceholder: tr("admin.bulkvio.notesPlaceholder", "Recorded with the audit event", "يُسجَّل مع حدث التدقيق"),
    previewTitle: tr("admin.bulkvio.previewTitle", "Impact summary", "ملخص الأثر"),
    previewBody: tr("admin.bulkvio.previewBody", "Read-only preview: {n} establishment(s) are selected for one {level} violation ({code} · {penalty}). No inspection or violation can be created while DEC-032 remains open.", "معاينة للقراءة فقط: تم تحديد {n} منشأة/منشآت لمخالفة واحدة من نوع {level} ({code} · {penalty}). لا يمكن إنشاء تفتيش أو مخالفة ما دام القرار DEC-032 مفتوحًا."),
    acknowledgeLabel: tr("admin.bulkvio.acknowledge", "I have reviewed this blocked impact preview.", "لقد راجعت معاينة الأثر المحظورة هذه."),
    submit: tr("admin.bulkvio.submit", "Issuance unavailable — DEC-032", "الإصدار غير متاح — DEC-032"),
    submitting: tr("admin.bulkvio.submitting", "Issuing…", "جارٍ الإصدار…"),
    resultsTitle: tr("admin.bulkvio.resultsTitle", "Result", "النتيجة"),
    resultSuccess: tr("admin.bulkvio.resultSuccess", "issued", "تم الإصدار"),
    resultFailed: tr("admin.bulkvio.resultFailed", "failed", "فشل"),
    partialWarning: tr("admin.bulkvio.partialWarning", "Not all targets succeeded — review the failed rows below before assuming this batch is complete.", "لم تنجح جميع الأهداف — راجع الصفوف الفاشلة أدناه قبل افتراض اكتمال هذه الدفعة."),
    allSucceeded: tr("admin.bulkvio.allSucceeded", "All {n} violations issued successfully.", "تم إصدار جميع المخالفات البالغ عددها {n} بنجاح."),
    blockedReason: tr(
      "admin.bulkvio.dec032",
      "Submission unavailable — DEC-032 blocks all real inspection submissions until the required database digest migration is approved and deployed. No violation will be issued from this page.",
      "الإرسال غير متاح — يمنع القرار DEC-032 جميع عمليات إرسال التفتيش الفعلية حتى اعتماد ونشر ترحيل بصمة قاعدة البيانات المطلوب. لن تُصدر أي مخالفة من هذه الصفحة.",
    ),
    errors: {
      dec032_blocked: tr(
        "admin.bulkvio.error.dec032",
        "No change was made. DEC-032 blocks this submission until the required database migration is approved and deployed.",
        "لم يتم إجراء أي تغيير. يمنع القرار DEC-032 هذا الإرسال حتى اعتماد ترحيل قاعدة البيانات المطلوب ونشره.",
      ),
      auth_required: tr("admin.bulkvio.error.auth", "Your session is unavailable. Sign in again.", "جلستك غير متاحة. سجّل الدخول مرة أخرى."),
      invalid_request: tr("admin.bulkvio.error.invalid", "Select establishments, a violation and a governed package version.", "حدد المنشآت والمخالفة وإصدار حزمة محكومًا."),
      acknowledgement_required: tr("admin.bulkvio.error.ack", "Review and acknowledge the impact summary.", "راجع ملخص الأثر وأقر به."),
      idempotency_conflict: tr("admin.bulkvio.error.conflict", "This request identifier was already used with different inputs. Start a new request.", "استُخدم معرف الطلب هذا سابقًا بمدخلات مختلفة. ابدأ طلبًا جديدًا."),
      not_authorized: tr("admin.bulkvio.error.denied", "Your role cannot issue bulk violations.", "لا يسمح دورك بإصدار مخالفات جماعية."),
      governed_violation_required: tr("admin.bulkvio.error.violation", "The selected violation is not an active governed violation.", "المخالفة المحددة ليست مخالفة محكومة ونشطة."),
      penalty_mapping_required: tr("admin.bulkvio.error.penalty", "The selected violation has no active approved penalty mapping.", "لا يوجد ربط عقوبة نشط ومعتمد للمخالفة المحددة."),
      package_version_invalid: tr("admin.bulkvio.error.package", "The selected package version is not locked, published and active.", "إصدار الحزمة المحدد ليس مقفلًا ومنشورًا ونشطًا."),
      write_failed: tr("admin.bulkvio.error.write", "Issuance failed. No successful result is claimed.", "فشل الإصدار. لا يُدّعى تحقيق نتيجة ناجحة."),
    },
  };

  return (
    <Shell current="/admin/bulk-violations" title={tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}
      context={<span className="badge badge-info">DEC-L</span>}>
      <h1 className="sr-only">{tr("admin.bulkvio.title", "Bulk violation issuance", "إصدار عدة مخالفات")}</h1>
      <div className="alert alert-warning">
        <div><strong>{tr("admin.bulkvio.warnTitle", "Real issuance is blocked by DEC-032.", "الإصدار الفعلي محظور بموجب DEC-032.")}</strong>{" "}
          {tr("admin.bulkvio.warnBody", "You may review the eligible establishments and mapped violations, but this route cannot create an inspection or violation while the submission digest defect remains open.", "يمكنك مراجعة المنشآت المؤهلة والمخالفات المرتبطة، لكن لا يمكن لهذا المسار إنشاء تفتيش أو مخالفة ما دام خلل بصمة الإرسال مفتوحًا.")}</div>
      </div>
      {factoriesError && <div className="alert alert-warning" role="alert"><div>{tr("admin.bulkvio.factoriesError", "The establishment registry is unavailable in this environment.", "سجل المنشآت غير متاح في هذه البيئة.")}</div></div>}
      {violationsError && <div className="alert alert-warning" role="alert"><div>{tr("admin.bulkvio.violationsError", "The violation catalogue is unavailable in this environment.", "كتالوج المخالفات غير متاح في هذه البيئة.")}</div></div>}
      {packagesError && <div className="alert alert-warning" role="alert"><div>{tr("admin.bulkvio.packagesError", "Published package versions are unavailable in this environment.", "إصدارات الحزم المنشورة غير متاحة في هذه البيئة.")}</div></div>}
      <BulkViolationForm
        factories={(factories ?? []).map(f => ({ id: f.id, name: f.name, factory_code: f.factory_code, cr_number: f.cr_number, region: f.region, city: f.city }))}
        violations={violations}
        packages={(packageRows ?? []).filter(row =>
          Array.isArray((row.definition as { sections?: unknown } | null)?.sections)
          && ((row.definition as { sections: unknown[] }).sections.length > 0)
        ).map(row => {
          const pkg = row.packages as unknown as { code: string; title: string } | null;
          return { id: row.id, label: `${pkg?.code ?? "?"} · ${row.version_label} — ${pkg?.title ?? ""}` };
        })}
        strings={strings}
      />
    </Shell>
  );
}
