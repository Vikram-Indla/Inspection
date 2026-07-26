import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EnforcementLibrary, {
  type EnforcementLibraryRow,
  type EnforcementLibraryStrings,
} from "./EnforcementLibrary";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

type RuntimeViolation = {
  id: string;
  mapping_version: string;
  invalidated_at: string | null;
  violation_codes: {
    code: string;
    title: string;
    level: string;
  } | null;
  inspections: {
    id: string;
    status: string;
    started_at: string | null;
    submitted_at: string | null;
    visits: {
      id: string;
      factories: {
        id: string;
        name: string;
        factory_code: string;
        license_number: string | null;
        region: string | null;
        city: string | null;
      } | null;
      assignments: {
        status: string;
        profiles: { full_name: string } | null;
      }[];
    } | null;
    action_forms: {
      id: string;
      violation_id: string | null;
      form_type: string;
      status: string;
      owner_name: string | null;
    }[];
    evidence: {
      id: string;
      linked_type: string;
      linked_id: string;
      content_sha256: string | null;
    }[];
  } | null;
};

export default async function EnforcementPage() {
  const [{ t, locale }, sb] = await Promise.all([useT(), supabaseServer()]);
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);

  const { data, error } = await sb
    .from("violations")
    .select(`
      id,mapping_version,invalidated_at,
      violation_codes(code,title,level),
      inspections!inner(
        id,status,started_at,submitted_at,
        visits!inner(
          id,
          factories!inner(id,name,factory_code,license_number,region,city),
          assignments(status,profiles(full_name))
        ),
        action_forms(id,violation_id,form_type,status,owner_name),
        evidence(id,linked_type,linked_id,content_sha256)
      )
    `)
    .in("inspections.visits.factories.factory_code", [...CLEAN_FACTORY_CODES])
    .limit(100);

  const strings: EnforcementLibraryStrings = {
    search: tr("mvp3.enforcement.search", "Search enforcement", "البحث في سجلات الإنفاذ"),
    status: tr("mvp3.enforcement.filter.status", "Status", "الحالة"),
    allStatuses: tr("mvp3.enforcement.filter.allStatuses", "All statuses", "جميع الحالات"),
    region: tr("mvp3.enforcement.filter.region", "Region", "المنطقة"),
    allRegions: tr("mvp3.enforcement.filter.allRegions", "All regions", "جميع المناطق"),
    export: tr("mvp3.enforcement.export", "Export", "تصدير"),
    exportUnavailable: tr("mvp3.enforcement.exportUnavailable", "Export is not configured for this governed record set.", "التصدير غير مهيأ لمجموعة السجلات المحكومة هذه."),
    licence: tr("mvp3.enforcement.licence", "Licence", "الترخيص"),
    penalty: tr("mvp3.enforcement.penalty", "Applied penalty", "العقوبة المطبقة"),
    inspector: tr("mvp3.enforcement.inspector", "Inspector", "المفتش"),
    issueDate: tr("mvp3.enforcement.issueDate", "Inspection date", "تاريخ التفتيش"),
    actionForm: tr("mvp3.enforcement.actionForm", "Action form", "نموذج الإجراء"),
    notConfigured: tr("mvp3.enforcement.notConfigured", "Not configured", "غير مهيأ"),
    noActionForm: tr("mvp3.enforcement.noActionForm", "No linked action form", "لا يوجد نموذج إجراء مرتبط"),
    empty: tr("mvp3.enforcement.empty", "No RLS-visible enforcement records match these filters.", "لا توجد سجلات إنفاذ ظاهرة وفق صلاحيات الصفوف تطابق عوامل التصفية."),
    close: tr("common.close", "Close", "إغلاق"),
    factorySummary: tr("mvp3.enforcement.factorySummary", "Factory summary", "ملخص المنشأة"),
    inspectionSummary: tr("mvp3.enforcement.inspectionSummary", "Inspection summary", "ملخص التفتيش"),
    violation: tr("mvp3.enforcement.violation", "Violation", "المخالفة"),
    evidence: tr("mvp3.enforcement.evidence", "Evidence", "الأدلة"),
    attachments: tr("mvp3.enforcement.attachments", "Linked attachments", "المرفقات المرتبطة"),
    custody: tr("mvp3.enforcement.custody", "Chain of custody", "سلسلة الحيازة"),
    custodyRecorded: tr("mvp3.enforcement.custodyRecorded", "Content hashes recorded", "تم تسجيل بصمات المحتوى"),
    custodyIncomplete: tr("mvp3.enforcement.custodyIncomplete", "Hash record incomplete", "سجل البصمة غير مكتمل"),
    timeline: tr("mvp3.enforcement.timeline", "Enforcement timeline", "الخط الزمني للإنفاذ"),
    recorded: tr("mvp3.enforcement.recorded", "Inspection recorded", "تم تسجيل التفتيش"),
    audit: tr("mvp3.enforcement.audit", "Audit", "التدقيق"),
    mappingVersion: tr("mvp3.enforcement.mappingVersion", "Immutable mapping version", "إصدار الربط غير القابل للتعديل"),
    openFactory: tr("mvp3.enforcement.openFactory", "Open Factory 360", "فتح ملف المنشأة 360"),
  };

  const rows = ((data ?? []) as unknown as RuntimeViolation[]).flatMap((violation): EnforcementLibraryRow[] => {
    const inspection = violation.inspections;
    const visit = inspection?.visits;
    const factory = visit?.factories;
    const code = violation.violation_codes;
    if (!inspection || !visit || !factory || !code) return [];

    const actionForm = (inspection.action_forms ?? []).find((form) => form.violation_id === violation.id) ?? null;
    const evidence = (inspection.evidence ?? []).filter((item) => item.linked_id === violation.id);
    const assignment = (visit.assignments ?? []).find((item) => item.status !== "returned") ?? visit.assignments?.[0] ?? null;
    const recordedAt = inspection.submitted_at ?? inspection.started_at;

    return [{
      id: violation.id,
      code: code.code,
      title: code.title,
      level: code.level,
      status: violation.invalidated_at ? "invalidated" : inspection.status,
      factoryId: factory.id,
      factoryName: factory.name,
      factoryCode: factory.factory_code,
      licenceNumber: factory.license_number,
      region: factory.region,
      city: factory.city,
      inspectionId: inspection.id,
      visitId: visit.id,
      inspectorName: assignment?.profiles?.full_name ?? null,
      recordedAt,
      actionForm: actionForm ? `${actionForm.form_type.replaceAll("_", " ")} · ${actionForm.status.replaceAll("_", " ")}` : null,
      evidenceCount: evidence.length,
      custodyComplete: evidence.length > 0 && evidence.every((item) => Boolean(item.content_sha256)),
      mappingVersion: violation.mapping_version,
    }];
  });

  return (
    <Shell
      current="/enforcement"
      title={tr("mvp3.enforcement.title", "Enforcement Library", "مكتبة الإنفاذ")}
      context={<span className="badge badge-info">M3-09 · CD-059 · {tr("mvp3.enforcement.badge", "source-linked records", "سجلات مرتبطة بالمصدر")}</span>}
    >
      <h1 className="ax-sr-only">{tr("mvp3.enforcement.title", "Enforcement Library", "مكتبة الإنفاذ")}</h1>

      <div className="sq-banner">
        <div>
          <strong>{tr("mvp3.enforcement.rule", "Every record remains linked to its source inspection, violation mapping and human review.", "يبقى كل سجل مرتبطًا بالتفتيش المصدر وربط المخالفة والمراجعة البشرية.")}</strong>{" "}
          {tr("mvp3.enforcement.ruleBody", "Missing links are shown as incomplete—not silently repaired.", "تُعرض الروابط المفقودة على أنها غير مكتملة، ولا تُصلح بصمت.")}
        </div>
      </div>

      <div className="sq-banner sq-banner--warning" role="note">
        <div>
          <strong>{tr("mvp3.enforcement.config.title", "Enforcement policy: Not configured.", "سياسة الإنفاذ: غير مهيأة.")}</strong>{" "}
          {tr(
            "mvp3.enforcement.config.body",
            "The sponsor must supply the approved enforcement measure catalogue and authoritative legal-basis wording. Until supplied, no applied measure, amount, escalation ladder, citation or Arabic legal wording is asserted.",
            "يجب على الراعي تزويد كتالوج تدابير الإنفاذ المعتمد والصياغة الموثوقة للأساس القانوني. وحتى يتم ذلك، لا تُعرض تدابير مطبقة أو مبالغ أو سلالم تصعيد أو استشهادات أو صياغة قانونية عربية.",
          )}
        </div>
      </div>

      {error ? (
        <div className="sq-banner sq-banner--warning" role="alert">
          <div>{tr("mvp3.enforcement.unavailable", "The enforcement record contract is unavailable in this environment. No record count is claimed.", "عقد سجلات الإنفاذ غير متاح في هذه البيئة. لا يُدّعى أي عدد للسجلات.")}</div>
        </div>
      ) : (
        <EnforcementLibrary rows={rows} strings={strings} locale={locale} />
      )}
    </Shell>
  );
}
