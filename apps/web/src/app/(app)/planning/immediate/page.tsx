import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { getPlanningAccess } from "@/lib/planning/access";
import ImmediateForm, { type ImmediateStrings, type ManualReasonOption, type VisitTypeOption } from "./ImmediateForm";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

// Distinct, sorted, non-empty string values for a field across the registered
// factory set — same one-line pattern /planning/bulk/page.tsx uses for its
// criteria option lists. No new source is invented.
const distinct = (rows: { [k: string]: unknown }[], key: string) =>
  [...new Set(rows.map(r => r[key]).filter((v): v is string => typeof v === "string" && v.length > 0))].sort();

type LookupRow = { kind: string; key: string; label_en: string; label_ar: string | null; metadata: Record<string, unknown> | null };

export default async function Immediate({ searchParams }: { searchParams: Promise<{ factory?: string; cr?: string; license?: string; returnTo?: string }> }) {
  const { factory: initialFactoryId, cr: sourceCrId, license: sourceLicenseId, returnTo } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/factories/cr/") ? returnTo : null;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  // PLN-REQ-025 — capability-gated entry (M5 reconciliation). The canonical
  // planning access model resolves the session class plus explicit grants;
  // planning.create.immediate is the page capability. Fail closed: any
  // resolution error is a denial, never a permissive default.
  const access = await getPlanningAccess(sb, ["planning.create.immediate"]);
  if (!user || access.error !== null || !access.can("planning.create.immediate") || access.accessClass !== "business_staff") {
    return (
      <Shell current="/planning" title={t("plan.imm.title", "Create an urgent visit")}>
        <EmptyState glyph="⛔" title={tr("plan.imm.unauthorized.title", "You don't have permission", "ليست لديك الصلاحية اللازمة")}
          body={tr("plan.imm.unauthorized.body", "Only Planner and Supervisor roles can use Create an urgent visit. Inspectors raise urgent issues from their own assigned work.", "إنشاء زيارة عاجلة متاح للمخطط والمشرف فقط. يرفع المفتشون البلاغات العاجلة من عملهم المكلّفين به.")} />
      </Shell>
    );
  }

  // Urgent requests are initiated by Planner or Supervisor but are never
  // released from this page. A different Supervisor must confirm assignment.
  const actorMode: "planner" | "inspector" = "planner";
  const manualAllowed = false;

  const today = new Date().toISOString().slice(0, 10);
  const FACTORY_COLUMNS = "id, name, factory_code, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, source_synced_at";
  const [{ data: factories }, { data: pkgs }, { data: inspRows }, { data: myProfile }, { data: lookupRows, error: lookupError }] = await Promise.all([
    // Keep the normal sourced catalog, plus the canonical labelled test target.
    // The test target deliberately has a TEST- code so it must not be excluded
    // from the same journey it is intended to prove.
    sb.from("factories").select(FACTORY_COLUMNS).eq("is_temporary", false).or("factory_code.like.F-%,source.eq.saqeel_test_data").not("name", "ilike", "CD%").order("name"),
    sb.from("package_versions").select("id, version_label, packages(code, title)").in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
    sb.from("profiles").select("full_name").eq("user_id", user.id).single(),
    // PLN-REQ-026/027 — governed reference data: per-type manual eligibility +
    // the manual-entry reason dropdown. Read-only; admins amend via configure_lookups.
    sb.from("planning_lookups").select("kind, key, label_en, label_ar, metadata").in("kind", ["visit_type", "manual_entry_reason"]).eq("is_active", true).order("sort_order"),
  ]);
  // Bug: the factories list is capped at PostgREST's default 1000-row page,
  // so a Factory 360 "Create inspection" deep link can pass a factory that
  // sorts outside that page (e.g. staging currently holds 1252 registered
  // factories) and the Identity step would silently fail to resolve it, even
  // though initialFactoryId below tries to look it up in the same list. Fetch
  // it directly when missing rather than dropping the CR/license context the
  // link carried.
  let factoryList = factories ?? [];
  if (initialFactoryId && !factoryList.some(f => f.id === initialFactoryId)) {
    const { data: linked } = await sb.from("factories").select(FACTORY_COLUMNS).eq("id", initialFactoryId).eq("is_temporary", false).maybeSingle();
    if (linked) factoryList = [linked, ...factoryList];
  }
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const factoryRows = factoryList as unknown as { [k: string]: unknown }[];
  const regionOptions = distinct(factoryRows, "region");
  const cityOptions = distinct(factoryRows, "city");
  // Region → cities map for the manual-entry dependent city dropdown (PLN-REQ-026).
  const cityByRegion: Record<string, string[]> = {};
  for (const row of factoryRows) {
    const region = row.region; const city = row.city;
    if (typeof region === "string" && region && typeof city === "string" && city) {
      (cityByRegion[region] ??= []).includes(city) || cityByRegion[region].push(city);
    }
  }
  for (const region of Object.keys(cityByRegion)) cityByRegion[region].sort();

  // Fail closed on reference-data failure: manual entry becomes unavailable
  // (no reason list, no per-type eligibility) while the registered path keeps
  // working with the three known visit types. Logged, never silent.
  if (lookupError) console.error("[ planning_lookups]", lookupError.message);
  const lookups = (lookupRows ?? []) as LookupRow[];
  const lookupLabel = (r: LookupRow) => locale === "ar" && r.label_ar ? r.label_ar : r.label_en;
  const visitTypes: VisitTypeOption[] = !lookupError && lookups.some(r => r.kind === "visit_type")
    ? lookups.filter(r => r.kind === "visit_type").map(r => ({
      key: r.key,
      label: t(`enum.${r.key}`, lookupLabel(r)),
      manualEntryAllowed: r.metadata?.manual_entry_allowed === true,
      attachmentRequired: r.metadata?.attachment_required === true,
    }))
    : [
      { key: "periodic", label: t("enum.periodic", "Periodic compliance"), manualEntryAllowed: false, attachmentRequired: false },
      { key: "follow_up", label: t("enum.follow_up", "Follow-up"), manualEntryAllowed: false, attachmentRequired: false },
      { key: "complaint", label: t("enum.complaint", "Complaint"), manualEntryAllowed: false, attachmentRequired: false },
    ];
  const manualReasons: ManualReasonOption[] = lookupError ? [] : lookups
    .filter(r => r.kind === "manual_entry_reason")
    .map(r => ({ key: r.key, label: lookupLabel(r) }));

  const strings: ImmediateStrings = {
    identity: t("plan.imm.identity", "Identity — registered or minimum manual"),
    r05BlockedTitle: tr("plan.imm.r05BlockedTitle", "Urgent requests still require a registered factory", "تتطلب الطلبات العاجلة مصنعاً مسجلاً"),
    r05BlockedBody: tr("plan.imm.r05BlockedBody", "Urgency only changes the response time — not who is checked or who supervises. Choose a registered factory; you can't enter one that isn't registered.", "لا تغيّر العجلة سوى وقت الاستجابة — لا هوية الهدف ولا الإشراف. اختر مصنعاً مسجلاً؛ لا يمكن إدخال مصنع غير مسجل."),
    identityToggleRegistered: t("plan.imm.identityToggleRegistered", "Registered factory"),
    identityToggleUnregistered: t("plan.imm.identityToggleUnregistered", "Unregistered / temporary"),
    manualLockedPermission: tr("plan.imm.manualLockedPermission", "Manual entry requires the manual-factory permission.", "الإدخال اليدوي يتطلب صلاحية المصنع اليدوي."),
    manualLockedType: tr("plan.imm.manualLockedType", "The selected visit type does not allow unregistered factories.", "نوع الزيارة المحدد لا يسمح بالمصانع غير المسجلة."),
    manualLockedLookups: tr("plan.imm.manualLockedLookups", "Manual entry is not available — we couldn't load reference data.", "الإدخال اليدوي غير متاح — تعذر تحميل البيانات المرجعية."),
    notFoundConfirm: tr("plan.imm.notFoundConfirm", "I confirm this factory was not found in the registered factory list", "أؤكد أن هذا المصنع غير موجود في قائمة المصانع المسجلة"),
    searchLabel: t("plan.imm.searchLabel", "Search registered factories — CR or Industrial License"),
    searchPlaceholder: t("plan.imm.searchPlaceholder", "CR number, Industrial License or name"),
    searchNoMatch: t("plan.imm.searchNoMatch", "No registered factory matches — switch to Unregistered / temporary below."),
    existingFactory: t("plan.imm.existingFactory", "Registered factory"),
    selectOption: t("plan.imm.select", "— select"),
    previewCr: t("plan.imm.previewCr", "CR"),
    previewLicense: t("plan.imm.previewLicense", "License"),
    previewRegion: t("plan.imm.previewRegion", "Region"),
    previewFreshness: t("plan.imm.previewFreshness", "Factory list sync"),
    previewFreshnessNever: t("plan.imm.previewFreshnessNever", "no sync record"),
    previewRisk: t("plan.imm.previewRisk", "Risk (advisory)"),
    previewRiskUnknown: t("plan.imm.previewRiskUnknown", "unknown"),
    manualName: tr("plan.imm.manualName", "Establishment name *", "اسم المنشأة *"),
    manualPlaceholder: t("plan.imm.manualPlaceholder", "As observed / reported — becomes a flagged temporary entity"),
    manualCr: t("plan.imm.manualCr", "CR number (if available)"),
    manualLicense: t("plan.imm.manualLicense", "Industrial License (optional — unverified)"),
    manualActivity: t("plan.imm.manualActivity", "Business activity (optional)"),
    manualActivityPlaceholder: t("plan.imm.manualActivityPlaceholder", "Any available business information — stored with the temporary entity"),
    manualRegion: tr("plan.imm.manualRegion", "Region *", "المنطقة *"),
    manualCity: tr("plan.imm.manualCity", "City *", "المدينة *"),
    manualCityPlaceholder: t("plan.imm.manualCityPlaceholder", "City under the selected region"),
    manualReasonLabel: tr("plan.imm.manualReasonLabel", "Manual entry reason *", "سبب الإدخال اليدوي *"),
    manualReasonComment: tr("plan.imm.manualReasonComment", "Reason comment * (required for Other)", "تعليق السبب * (مطلوب عند اختيار «أخرى»)"),
    manualReasonCommentPlaceholder: tr("plan.imm.manualReasonCommentPlaceholder", "Explain why a non-registered factory is used", "اشرح سبب استخدام مصنع غير مسجل"),
    notifyFactory: tr("plan.imm.notifyFactory", "Notify the factory (requires a contact mobile)", "إشعار المصنع (يتطلب جوال تواصل)"),
    factoryMobile: tr("plan.imm.factoryMobile", "Contact mobile *", "جوال التواصل *"),
    factoryMobilePlaceholder: t("plan.imm.factoryMobilePlaceholder", "05XXXXXXXX"),
    unverifiedBadge: tr("plan.imm.unverifiedBadge", "Unverified manual entry — pending reconciliation", "إدخال يدوي غير موثّق — بانتظار المطابقة"),
    attachmentRequiredNote: tr("plan.imm.attachmentRequiredNote", "Supporting evidence is required for this visit type — attach it on the visit record after creation.", "الأدلة الداعمة مطلوبة لهذا النوع من الزيارات — أرفقها في سجل الزيارة بعد الإنشاء."),
    temporaryNote: t("plan.imm.temporaryNote", "This creates a flagged temporary entity pending Factory list reconciliation. Only the flag is recorded."),
    urgencyReason: t("plan.imm.urgencyReason", "Urgency reason *"),
    reasonComplaint: t("plan.imm.reasonComplaint", "Complaint received"),
    reasonIncident: tr("plan.imm.reasonIncident", "Incident / accident report", "بلاغ حادث / إصابة"),
    reasonReferral: tr("plan.imm.reasonReferral", "Referral from authority", "إحالة من جهة رسمية"),
    reasonOther: tr("plan.imm.reasonOther", "Other", "أخرى"),
    reasonOtherHint: tr("plan.imm.reasonOtherHint", "Justify “Other” in Notes before dispatch.", "برّر سبب «أخرى» في الملاحظات قبل الإرسال."),
    locationDispatch: t("plan.imm.locationDispatch", "Location (mandatory — )"),
    useOfficialLocation: t("plan.imm.useOfficialLocation", "Use registered official location"),
    latitude: t("plan.imm.latitude", "Latitude *"),
    longitude: t("plan.imm.longitude", "Longitude *"),
    locationSourceOfficial: t("plan.imm.locationSourceOfficial", "Source: official Factory list pin"),
    locationSourceManual: t("plan.imm.locationSourceManual", "Source: manually confirmed by {who} at {when}"),
    locationSourceNone: t("plan.imm.locationSourceNone", "No location entered yet"),
    mapLoading: t("plan.imm.mapLoading", "Loading location map"),
    packageLabel: t("plan.imm.package", "Inspection checklist (optional during planning)"),
    inspector: t("plan.imm.inspector", "Preferred Inspector (optional)"),
    autoAssign: t("plan.imm.autoAssign", "No preference — Supervisor assigns"),
    visitType: t("plan.imm.visitType", "Visit type"),
    windowStart: t("plan.imm.windowStart", "Window start"),
    windowEnd: t("plan.imm.windowEnd", "Window end"),
    windowHint: tr("plan.imm.windowHintExplicit", "Required. Start must be within 24 hours; end must be after start.", "مطلوبة. يجب أن تبدأ خلال 24 ساعة وأن تكون النهاية بعد البداية."),
    priority: t("plan.imm.priority", "Priority (not configured)"),
    priorityPlaceholder: t("plan.imm.priorityPlaceholder", "As set by your dispatch process — optional, free text"),
    notes: t("plan.imm.notes", "Notes"),
    notesPlaceholder: t("plan.imm.notesPlaceholder", "Context for the inspector — appended to the urgency reason"),
    consequenceTitle: t("plan.imm.consequenceTitle", "This will:"),
    consequenceVisit: t("plan.imm.consequenceVisit", "Create an urgent Visit Plan awaiting Supervisor release"),
    consequenceAssign: t("plan.imm.consequenceAssign", "Allow a preferred Inspector, but require a Supervisor to confirm or replace them"),
    consequenceNotify: t("plan.imm.consequenceNotify", "Notify Supervisors to decide within four business hours"),
    consequenceAudit: t("plan.imm.consequenceAudit", "Record every step in the append-only audit log"),
    reviewConfirm: tr("plan.imm.reviewConfirm", "I reviewed the mandatory information and duplicate-active-visit rule", "راجعت المعلومات الإلزامية وقاعدة عدم تكرار الزيارة النشطة"),
    inspectorStartNow: tr("plan.imm.inspectorStartNow", "Inspector-created: assigned to you, no planning window, then start through the standard inspection lifecycle", "إنشاء المفتش: تُسند إليك بلا نافذة تخطيط، ثم تبدأ عبر دورة التفتيش القياسية"),
    blockedTitle: t("plan.imm.blocked", "Cannot create — minimum controls (P01)"),
    create: t("plan.imm.create", "Submit urgent request for supervision"),
    createAndStart: tr("plan.imm.createAndStart", "Submit urgent request for supervision", "إرسال طلب عاجل للإشراف"),
    creating: t("plan.imm.creating", "Submitting…"),
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
    chipPackageLabel: tr("plan.imm.chip.package", "CHECKLIST", "قائمة التفتيش"),
    chipInspectorLabel: tr("plan.imm.chip.inspector", "INSPECTOR", "المفتش"),
    chipWindowLabel: tr("plan.imm.chip.window", "WINDOW", "النافذة"),
    chipAuditLabel: tr("plan.imm.chip.audit", "AUDIT", "التدقيق"),
    chipNotifyLabel: tr("plan.imm.chip.notify", "NOTIFY", "الإشعار"),
    chipAuthorizedDetail: actorMode === "planner"
      ? tr("plan.imm.chipAuthorizedPlanner", "Planner or Supervisor", "المخطط أو المشرف")
      : tr("plan.imm.chipAuthorizedInspector", "Inspector escalation only", "تصعيد المفتش فقط"),
    chipReasonBlocked: tr("plan.imm.chipReasonBlocked", "select an urgency reason", "اختر سببًا للاستعجال"),
    chipReasonOtherBlocked: tr("plan.imm.chipReasonOtherBlocked", "justify Other in Notes", "برّر سبب «أخرى» في الملاحظات"),
    chipIdentityBlocked: tr("plan.imm.chipIdentityBlocked", "enter factory identity", "أدخل هوية المصنع"),
    chipIdentityRegistered: tr("plan.imm.chipIdentityRegistered", "registered factory selected", "تم اختيار مصنع مسجل"),
    chipIdentityTemporary: tr("plan.imm.chipIdentityTemporary", "temporary entity — flagged", "كيان مؤقت — معلّم"),
    chipLocationBlocked: tr("plan.imm.chipLocationBlocked", "enter valid coordinates", "أدخل إحداثيات صالحة"),
    chipLocationOfficial: tr("plan.imm.chipLocationOfficial", "official Factory list pin", "نقطة قائمة المصانع الرسمية"),
    chipLocationManual: tr("plan.imm.chipLocationManual", "manually confirmed pin", "نقطة مؤكدة يدويًا"),
    chipPackageBlocked: tr("plan.imm.chipPackageBlocked", "select an active inspection checklist", "اختر قائمة تفتيش نشطة"),
    chipInspectorAuto: tr("plan.imm.chipInspectorAuto", "auto-assign", "إسناد تلقائي"),
    chipInspectorManual: tr("plan.imm.chipInspectorManual", "manual pick", "اختيار يدوي"),
    chipInspectorBlocked: tr("plan.imm.chipInspectorBlocked", "no inspector available", "لا يوجد مفتش متاح"),
    chipWindowImmediate: tr("plan.imm.chipWindowImmediate", "starts immediately — no planner window", "تبدأ فورًا — بلا نافذة للمخطط"),
    chipWindowSet: tr("plan.imm.chipWindowSet", "custom window set", "تم تحديد نافذة مخصصة"),
    chipWindowBlocked: tr("plan.imm.chipWindowBlocked", "both-or-neither, end after start", "الحقلان معًا أو كلاهما فارغ، والنهاية بعد البداية"),
    chipAuditDetail: tr("plan.imm.chipAuditDetail", "every step recorded, append-only", "تُسجّل كل خطوة في سجل إلحاق فقط"),
    chipNotifyDetail: tr("plan.imm.chipNotifyDetail", "queued — awaiting delivery confirmation", "في قائمة الانتظار مع حالة المزود — دون ادعاء التسليم"),
    enforcementLabel: tr("plan.imm.enforcementLabel", "Recommended enforcement action (optional)", "الإجراء الموصى به (اختياري)"),
    enforcementHint: tr("plan.imm.enforcementHint", "This is a recommendation only — it does not replace Supervisor approval, assignment, or release.", "هذه توصية فقط — لا تحل محل موافقة المشرف أو الإسناد أو الإصدار."),
    enforcementNone: tr("plan.imm.enforcementNone", "No recommendation", "بدون توصية"),
    enforcementFine: tr("plan.imm.enforcementFine", "Financial fine", "غرامة مالية"),
    enforcementCommittee: tr("plan.imm.enforcementCommittee", "Refer to committee", "تحويل للجنة"),
    enforcementWarning: tr("plan.imm.enforcementWarning", "Final warning", "إنذار نهائي"),
    enforcementClosure: tr("plan.imm.enforcementClosure", "Immediate closure", "إغلاق فوري"),
    enforcementNotes: tr("plan.imm.enforcementNotes", "Notes for the Supervisor", "ملاحظات للمشرف"),
    enforcementNotesPlaceholder: tr("plan.imm.enforcementNotesPlaceholder", "What you observed — helps the Supervisor decide", "ما لاحظته — يساعد المشرف على اتخاذ القرار"),
  };
  return (
    <Shell current="/planning" title={t("plan.imm.title", "Create an urgent visit")}
      context={<><span className="sq-lozenge sq-lozenge--warning">{t("plan.imm.context", "urgent request · Supervisor release required")}</span>{sourceCrId && sourceLicenseId ? <span className="sq-lozenge sq-lozenge--info">Factory 360 · CR <bdi>{sourceCrId}</bdi> · License <bdi>{sourceLicenseId}</bdi></span> : null}</>}>
      {safeReturnTo ? <p><Link className="sq-link" href={safeReturnTo}>← {t("f360.actions.return", "Return to selected Factory 360 license")}</Link></p> : null}
      <ImmediateForm
        factories={factoryList as never}
        packages={(pkgs ?? []) as never}
        inspectors={inspectors}
        regionOptions={regionOptions}
        cityOptions={cityOptions}
        cityByRegion={cityByRegion}
        hasInspectorPool={inspectors.length > 0}
        actorName={myProfile?.full_name ?? ""}
        actorMode={actorMode}
        locale={locale}
        manualAllowed={manualAllowed}
        visitTypes={visitTypes}
        manualReasons={manualReasons}
        initialFactoryId={initialFactoryId}
        strings={strings}
      />
    </Shell>
  );
}
