import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import ImmediateForm, { type ImmediateStrings } from "./ImmediateForm";

export const dynamic = "force-dynamic";

// Distinct, sorted, non-empty string values for a field across the registered
// factory set — same one-line pattern /planning/bulk/page.tsx uses for its
// criteria option lists. No new source is invented.
const distinct = (rows: { [k: string]: unknown }[], key: string) =>
  [...new Set(rows.map(r => r[key]).filter((v): v is string => typeof v === "string" && v.length > 0))].sort();

export default async function Immediate() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  // The governed route catalogue and MVP1-M01-043 authorize Planner and
  // Inspector. The two paths remain distinct: Planner reviews/windows/assigns;
  // Inspector self-assigns and starts immediately (M01-047/048/051/052).
  const { data: myRoles } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[] };
  const isPlanner = (myRoles ?? []).some(r => r.role_key === "planner");
  const isInspector = (myRoles ?? []).some(r => r.role_key === "inspector");
  const actorMode: "planner" | "inspector" = isPlanner ? "planner" : "inspector";

  if (!isPlanner && !isInspector) {
    return (
      <Shell current="/planning" title={t("plan.imm.title", "Immediate visit — urgent dispatch")}>
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">⛔</span>
          <h4>{tr("plan.imm.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}</h4>
          <p className="ax-caption">{tr("plan.imm.unauthorized.body", "Immediate Visit Planning (SCR-WEB-130) is available to Planner and Inspector roles only.", "تخطيط الزيارة الفورية (SCR-WEB-130) متاح لدوري المخطط والمفتش فقط.")}</p>
        </div></div>
      </Shell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: factories }, { data: pkgs }, { data: inspRows }, { data: myProfile }] = await Promise.all([
    sb.from("factories").select("id, name, factory_code, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, source_synced_at").eq("is_temporary", false).order("name"),
    sb.from("package_versions").select("id, version_label, packages(code, title)").in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
    sb.from("profiles").select("full_name").eq("user_id", user!.id).single(),
  ]);
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const factoryRows = (factories ?? []) as unknown as { [k: string]: unknown }[];
  const regionOptions = distinct(factoryRows, "region");
  const cityOptions = distinct(factoryRows, "city");

  const strings: ImmediateStrings = {
    identity: t("plan.imm.identity", "Identity — registered or minimum manual (M01-044/045)"),
    identityToggleRegistered: t("plan.imm.identityToggleRegistered", "Registered factory"),
    identityToggleUnregistered: t("plan.imm.identityToggleUnregistered", "Unregistered / temporary"),
    searchLabel: t("plan.imm.searchLabel", "Search registered factories — CR or Industrial License (M01-044)"),
    searchPlaceholder: t("plan.imm.searchPlaceholder", "CR number, Industrial License or name"),
    searchNoMatch: t("plan.imm.searchNoMatch", "No registered factory matches — switch to Unregistered / temporary below (M01-045)."),
    existingFactory: t("plan.imm.existingFactory", "Registered factory"),
    selectOption: t("plan.imm.select", "— select"),
    previewCr: t("plan.imm.previewCr", "CR"),
    previewLicense: t("plan.imm.previewLicense", "License"),
    previewRegion: t("plan.imm.previewRegion", "Region"),
    previewFreshness: t("plan.imm.previewFreshness", "Registry sync"),
    previewFreshnessNever: t("plan.imm.previewFreshnessNever", "no sync record"),
    previewRisk: t("plan.imm.previewRisk", "Risk (advisory)"),
    previewRiskUnknown: t("plan.imm.previewRiskUnknown", "unknown"),
    manualName: tr("plan.imm.manualNameOptional", "Factory name (optional)", "اسم المصنع (اختياري)"),
    manualPlaceholder: t("plan.imm.manualPlaceholder", "As observed / reported — becomes a flagged temporary entity"),
    manualCr: t("plan.imm.manualCr", "CR number (optional)"),
    manualLicense: t("plan.imm.manualLicense", "Industrial License (optional)"),
    manualActivity: t("plan.imm.manualActivity", "Business activity (optional)"),
    manualActivityPlaceholder: t("plan.imm.manualActivityPlaceholder", "Any available business information — stored with the temporary entity"),
    manualRegion: tr("plan.imm.manualRegionOptional", "Region (optional)", "المنطقة (اختيارية)"),
    manualCity: tr("plan.imm.manualCityOptional", "City (optional)", "المدينة (اختيارية)"),
    manualCityPlaceholder: t("plan.imm.manualCityPlaceholder", "City name"),
    temporaryNote: t("plan.imm.temporaryNote", "This creates a flagged temporary entity pending registry reconciliation — no reconciliation queue surface exists yet (HANDOFF_BLOCKED); the flag alone is recorded."),
    urgencyReason: t("plan.imm.urgencyReason", "Urgency reason *"),
    reasonComplaint: t("plan.imm.reasonComplaint", "Complaint received"),
    reasonIncident: tr("plan.imm.reasonIncident", "Incident / accident report", "بلاغ حادث / إصابة"),
    reasonReferral: tr("plan.imm.reasonReferral", "Referral from authority", "إحالة من جهة رسمية"),
    reasonOther: tr("plan.imm.reasonOther", "Other", "أخرى"),
    reasonOtherHint: tr("plan.imm.reasonOtherHint", "Justify “Other” in Notes before dispatch.", "برّر سبب «أخرى» في الملاحظات قبل الإرسال."),
    locationDispatch: t("plan.imm.locationDispatch", "Location (mandatory — M01-046)"),
    useOfficialLocation: t("plan.imm.useOfficialLocation", "Use registered official location"),
    latitude: t("plan.imm.latitude", "Latitude *"),
    longitude: t("plan.imm.longitude", "Longitude *"),
    locationSourceOfficial: t("plan.imm.locationSourceOfficial", "Source: official registry pin"),
    locationSourceManual: t("plan.imm.locationSourceManual", "Source: manually confirmed by {who} at {when}"),
    locationSourceNone: t("plan.imm.locationSourceNone", "No location entered yet"),
    mapLoading: t("plan.imm.mapLoading", "Loading location map"),
    packageLabel: t("plan.imm.package", "Package *"),
    inspector: t("plan.imm.inspector", "Inspector — auto-assign or pick (M01-048)"),
    autoAssign: t("plan.imm.autoAssign", "Auto-assign — first available inspector (M01-048)"),
    visitType: t("plan.imm.visitType", "Visit type (M01-047)"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint"),
    windowStart: t("plan.imm.windowStart", "Window start"),
    windowEnd: t("plan.imm.windowEnd", "Window end"),
    windowHint: tr("plan.imm.windowHintExplicit", "Required for Planner-created Immediate Visits; end must be after start (M01-047)", "مطلوبة للزيارة الفورية التي ينشئها المخطط؛ يجب أن تكون النهاية بعد البداية (M01-047)"),
    priority: t("plan.imm.priority", "Priority (ungoverned — no approved value list)"),
    priorityPlaceholder: t("plan.imm.priorityPlaceholder", "As set by your dispatch process — optional, free text"),
    notes: t("plan.imm.notes", "Notes (M01-047)"),
    notesPlaceholder: t("plan.imm.notesPlaceholder", "Context for the inspector — appended to the urgency reason"),
    consequenceTitle: t("plan.imm.consequenceTitle", "This will:"),
    consequenceVisit: t("plan.imm.consequenceVisit", "Create a published Visit directly — no Visit Plan (M01-050)"),
    consequenceAssign: actorMode === "planner"
      ? t("plan.imm.consequenceAssign", "Assign an eligible inspector and record automatic candidates in the audit trail")
      : tr("plan.imm.consequenceSelfAssign", "Assign this visit to you and open the standard start flow (M01-048/051)", "إسناد هذه الزيارة إليك وفتح مسار البدء القياسي (M01-048/051)"),
    consequenceNotify: actorMode === "planner"
      ? t("plan.imm.consequenceNotify", "Queue an assignment notification with truthful provider status (M01-052/ENG-11)")
      : tr("plan.imm.consequenceNoNotify", "No assignment notification is created for a self-created Inspector visit (M01-052)", "لا يُنشأ إشعار تكليف للزيارة التي ينشئها المفتش لنفسه (M01-052)"),
    consequenceAudit: t("plan.imm.consequenceAudit", "Record every step in the append-only audit log"),
    reviewConfirm: tr("plan.imm.reviewConfirm", "I reviewed the mandatory information and duplicate-active-visit rule (M01-049)", "راجعت المعلومات الإلزامية وقاعدة عدم تكرار الزيارة النشطة (M01-049)"),
    inspectorStartNow: tr("plan.imm.inspectorStartNow", "Inspector-created: assigned to you, no planning window, then start through the standard inspection lifecycle (M01-047/048/051)", "إنشاء المفتش: تُسند إليك بلا نافذة تخطيط، ثم تبدأ عبر دورة التفتيش القياسية (M01-047/048/051)"),
    blockedTitle: t("plan.imm.blocked", "Cannot create — minimum controls (P01)"),
    create: t("plan.imm.create", "Create & dispatch (Visit ID directly, no plan — M01-050)"),
    createAndStart: tr("plan.imm.createAndStart", "Create & start inspection (M01-050/051)", "إنشاء وبدء التفتيش (M01-050/051)"),
    creating: t("plan.imm.creating", "Dispatching…"),
    chipGroupLabel: tr("plan.imm.chipGroupLabel", "Immediate dispatch protections", "ضوابط الإرسال الفوري"),
    chipSatisfied: tr("plan.imm.chipSatisfied", "satisfied", "مستوفى"),
    chipBlocking: tr("plan.imm.chipBlocking", "blocking", "يحظر الإنشاء"),
    chipTruth: tr("plan.imm.chipTruth", "informational", "معلوماتي"),
    chipAllSatisfied: tr("plan.imm.chipAllSatisfied", "All protections satisfied", "تم استيفاء جميع ضوابط الحماية"),
    chipBlockedAnnouncement: tr("plan.imm.chipBlockedAnnouncement", "{label} blocking — {detail}", "{label} يحظر الإنشاء — {detail}"),
    chipAuthorizedLabel: tr("plan.imm.chip.authorized", "AUTHORIZED", "التصريح"),
    chipReasonLabel: tr("plan.imm.chip.reason", "REASON", "السبب"),
    chipIdentityLabel: tr("plan.imm.chip.identity", "IDENTITY", "الهوية"),
    chipLocationLabel: tr("plan.imm.chip.location", "LOCATION", "الموقع"),
    chipPackageLabel: tr("plan.imm.chip.package", "PACKAGE", "الحزمة"),
    chipInspectorLabel: tr("plan.imm.chip.inspector", "INSPECTOR", "المفتش"),
    chipWindowLabel: tr("plan.imm.chip.window", "WINDOW", "النافذة"),
    chipAuditLabel: tr("plan.imm.chip.audit", "AUDIT", "التدقيق"),
    chipNotifyLabel: tr("plan.imm.chip.notify", "NOTIFY", "الإشعار"),
    chipAuthorizedDetail: actorMode === "planner"
      ? tr("plan.imm.chipAuthorizedPlanner", "Planner", "المخطط")
      : tr("plan.imm.chipAuthorizedInspector", "Inspector — self-created visit", "المفتش — زيارة منشأة ذاتيًا"),
    chipReasonBlocked: tr("plan.imm.chipReasonBlocked", "select an urgency reason", "اختر سببًا للاستعجال"),
    chipReasonOtherBlocked: tr("plan.imm.chipReasonOtherBlocked", "justify Other in Notes", "برّر سبب «أخرى» في الملاحظات"),
    chipIdentityBlocked: tr("plan.imm.chipIdentityBlocked", "enter factory identity", "أدخل هوية المصنع"),
    chipIdentityRegistered: tr("plan.imm.chipIdentityRegistered", "registered factory selected", "تم اختيار مصنع مسجل"),
    chipIdentityTemporary: tr("plan.imm.chipIdentityTemporary", "temporary entity — flagged", "كيان مؤقت — معلّم"),
    chipLocationBlocked: tr("plan.imm.chipLocationBlocked", "enter valid coordinates", "أدخل إحداثيات صالحة"),
    chipLocationOfficial: tr("plan.imm.chipLocationOfficial", "official registry pin", "نقطة السجل الرسمية"),
    chipLocationManual: tr("plan.imm.chipLocationManual", "manually confirmed pin", "نقطة مؤكدة يدويًا"),
    chipPackageBlocked: tr("plan.imm.chipPackageBlocked", "select a published package", "اختر حزمة منشورة"),
    chipInspectorAuto: tr("plan.imm.chipInspectorAuto", "auto-assign", "إسناد تلقائي"),
    chipInspectorManual: tr("plan.imm.chipInspectorManual", "manual pick", "اختيار يدوي"),
    chipInspectorBlocked: tr("plan.imm.chipInspectorBlocked", "no inspector available", "لا يوجد مفتش متاح"),
    chipWindowImmediate: tr("plan.imm.chipWindowImmediate", "starts immediately — no planner window", "تبدأ فورًا — بلا نافذة للمخطط"),
    chipWindowSet: tr("plan.imm.chipWindowSet", "custom window set", "تم تحديد نافذة مخصصة"),
    chipWindowBlocked: tr("plan.imm.chipWindowBlocked", "both-or-neither, end after start", "الحقلان معًا أو كلاهما فارغ، والنهاية بعد البداية"),
    chipAuditDetail: tr("plan.imm.chipAuditDetail", "every step recorded, append-only", "تُسجّل كل خطوة في سجل إلحاق فقط"),
    chipNotifyDetail: tr("plan.imm.chipNotifyDetail", "queued with provider status — delivery not claimed", "في قائمة الانتظار مع حالة المزود — دون ادعاء التسليم"),
    enforcementLabel: tr("plan.imm.enforcementLabel", "Recommended enforcement action (optional)", "الإجراء الموصى به (اختياري)"),
    enforcementHint: tr("plan.imm.enforcementHint", "This is a recommendation only — an authorized Operations or Compliance reviewer makes the final decision; you cannot execute it yourself.", "هذه توصية فقط — يتخذ القرار النهائي مراجع مصرح له من العمليات أو الامتثال؛ لا يمكنك تنفيذه بنفسك."),
    enforcementNone: tr("plan.imm.enforcementNone", "No recommendation", "بدون توصية"),
    enforcementFine: tr("plan.imm.enforcementFine", "Financial fine", "غرامة مالية"),
    enforcementCommittee: tr("plan.imm.enforcementCommittee", "Refer to committee", "تحويل للجنة"),
    enforcementWarning: tr("plan.imm.enforcementWarning", "Final warning", "إنذار نهائي"),
    enforcementClosure: tr("plan.imm.enforcementClosure", "Immediate closure", "إغلاق فوري"),
    enforcementNotes: tr("plan.imm.enforcementNotes", "Notes for the reviewer", "ملاحظات للمراجع"),
    enforcementNotesPlaceholder: tr("plan.imm.enforcementNotesPlaceholder", "What you observed — helps the reviewer decide", "ما لاحظته — يساعد المراجع على اتخاذ القرار"),
  };
  return (
    <Shell current="/planning" title={t("plan.imm.title", "Immediate visit — urgent dispatch")}
      context={<span className="ax-lozenge ax-lozenge--warning">{t("plan.imm.context", "SCR-WEB-130 · bypasses Visit Plans (M01-050)")}</span>}>
      <ImmediateForm
        factories={(factories ?? []) as never}
        packages={(pkgs ?? []) as never}
        inspectors={inspectors}
        regionOptions={regionOptions}
        cityOptions={cityOptions}
        hasInspectorPool={inspectors.length > 0}
        actorName={myProfile?.full_name ?? ""}
        actorMode={actorMode}
        locale={locale}
        strings={strings}
      />
    </Shell>
  );
}
