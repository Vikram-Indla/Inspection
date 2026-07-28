import AdminDestinationFrame from "../_components/AdminDestinationFrame";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import RiskForm, { type RiskLabels } from "./RiskForm";
import { createAdminRecordDrawerLabels } from "../_components/adminRecordDrawerCopy";

export const dynamic = "force-dynamic";

export default async function RiskStudio() {
  const { t, locale } = await useT();
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const sb = await supabaseServer();
  const { data, error } = await sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "risk").maybeSingle();
  if (error) console.error("[risk studio] load", error);
  const s = data?.settings as { factors: { key: string; weight: number }[]; bands: Record<string, number[]> } | undefined;

  const factors = (s?.factors ?? []).map(f => ({
    ...f,
    name: t(`enum.${f.key}`, f.key.replace(/_/g, " ")),
  }));

  const labels: RiskLabels = {
    factorsTitle: t("admin.risk.factors.title", "Factors & weights (must sum to 1.00)"),
    bandsTitle: t("admin.risk.bands.title", "Bands"),
    lowEnds: t("admin.risk.bands.lowEnds", "Low ends at"),
    mediumEnds: t("admin.risk.bands.mediumEnds", "Medium ends at"),
    high: t("admin.risk.bands.high", "High"),
    sumOk: t("admin.risk.sumOk", "Σ weights = 1.00 ✓"),
    sumBad: t("admin.risk.sumBad", "Σ weights = {sum} — must equal 1.00 before saving"),
    save: t("admin.risk.save", "Save configuration (risk_owner only)"),
    saving: t("admin.risk.saving", "Saving…"),
    saved: t("admin.risk.saved", "saved — effective immediately"),
    savedNote: t("admin.risk.savedNote", "Saving writes factors and bands to engine_settings after the weights-sum check, effective immediately for new score calculations — there is no draft or approval step on this screen."),
    lastUpdated: t("admin.risk.lastUpdated", "last updated"),
    bandLow: t("admin.risk.band.low", "Low"),
    bandMedium: t("admin.risk.band.medium", "Medium"),
    bandHigh: t("admin.risk.band.high", "High"),
    invalidBands: t("admin.risk.bands.invalid", "Bands must use whole numbers and cover 0–100 without gaps."),
    confirmLive: t("admin.risk.confirmLive", "I understand this configuration becomes effective immediately for new score calculations."),
    factorKey: t("admin.recordDrawer.risk.factorKey", copy("Factor key", "مفتاح العامل")),
    weight: t("admin.recordDrawer.risk.weight", copy("Configured weight", "الوزن المهيأ")),
    modelVersion: t("admin.recordDrawer.risk.modelVersion", copy("Settings version", "إصدار الإعدادات")),
    notConfigured: t("common.notConfigured", copy("Not configured", "غير مُهيّأ")),
    drawerSubtitle: t("admin.revamp.hub.risk", copy("Risk & intelligence", "المخاطر والذكاء")),
  };
  const notConfigured = t("common.notConfigured", copy("Not configured", "غير مُهيّأ"));
  const weightTotal = s?.factors
    ? `${Math.round(s.factors.reduce((sum, factor) => sum + factor.weight, 0) * 100)}%`
    : notConfigured;
  const drawerLabels = createAdminRecordDrawerLabels(t, locale);
  const riskGovernance = [
    t("admin.revamp.risk.governance.sum", copy("The stored factor total must equal the engine’s accepted invariant before a save.", "يجب أن يساوي مجموع العوامل المخزنة ثابت المحرك المقبول قبل الحفظ.")),
    t("admin.revamp.risk.governance.rls", copy("Risk-owner authorization and RLS are rechecked on every write.", "يُعاد التحقق من صلاحية مالك المخاطر وأمن الصفوف عند كل كتابة.")),
    t("admin.revamp.risk.governance.trace", copy("Scores remain reproducible from stored inputs and the configuration version.", "تبقى الدرجات قابلة لإعادة الإنتاج من المدخلات المخزنة وإصدار التهيئة.")),
  ];

  return (
    <AdminDestinationFrame
      current="/admin/risk"
      title={t("admin.revamp.risk.title", copy("Risk Configuration", "تهيئة المخاطر"))}
      subtitle={t("admin.revamp.risk.subtitle", copy("Risk factors, evaluation method and weighting", "عوامل المخاطر وطريقة التقييم والأوزان"))}
      hub={t("admin.revamp.hub.risk", copy("Risk & intelligence", "المخاطر والذكاء"))}
      routeLabel="/admin/risk"
      designId="frame-21-admin-risk-configuration"
      drawerLabels={drawerLabels}
      labels={{
        administration: t("navigation.administration", copy("Administration", "الإدارة")),
        breadcrumb: t("common.breadcrumb", copy("Breadcrumb", "مسار التنقل")),
        governance: t("admin.revamp.governance", copy("Governance on this surface", "الحوكمة في هذه الواجهة")),
        reconstruction: t("admin.revamp.reconstruction", copy("Reconstruction note", "ملاحظة إعادة البناء")),
      }}
      metrics={[
        {
          label: t("admin.revamp.risk.metric.total", copy("Configured weight total", "إجمالي الأوزان المهيّأة")),
          value: error ? notConfigured : weightTotal,
          note: t("admin.revamp.risk.metric.total.note", copy("Derived from the stored factor weights", "مشتق من أوزان العوامل المخزنة")),
        },
        {
          label: t("admin.revamp.risk.metric.factors", copy("Factors in current settings", "العوامل في الإعداد الحالي")),
          value: error || !s ? notConfigured : s.factors.length,
          note: t("admin.revamp.risk.metric.factors.note", copy("No prototype factors are added", "لا تتم إضافة عوامل نموذجية")),
        },
        {
          label: t("admin.revamp.risk.metric.version", copy("Configuration version", "إصدار التهيئة")),
          value: error ? notConfigured : (data?.version_label ?? notConfigured),
          note: t("admin.revamp.risk.metric.version.note", copy("Read from engine_settings", "مقروء من engine_settings")),
        },
      ]}
      tabs={[
        { label: t("admin.risk.nav.studio", copy("Risk factors", "عوامل المخاطر")), href: "/admin/risk", current: true },
        { label: t("admin.risk.nav.models", copy("Governed models", "النماذج المحكومة")), href: "/admin/risk/models" },
        { label: t("admin.revamp.risk.tabs.history", copy("Publish history", "سجل النشر")), href: "/admin/risk/models?view=history" },
      ]}
      gate={{
        title: t("admin.revamp.risk.gate.title", copy("The two risk lifecycles remain explicit", "تظل دورتا حياة المخاطر واضحتين")),
        body: t("admin.revamp.risk.gate.body", copy("MVP1 engine settings become effective only through the existing risk-owner action after validation and confirmation. Governed model drafts use the separate maker-checker route. This screen does not pretend the two contracts are one.", "لا تصبح إعدادات محرك MVP1 نافذة إلا عبر إجراء مالك المخاطر الحالي بعد التحقق والتأكيد. تستخدم مسودات النماذج المحكومة مساراً منفصلاً لفصل المُعدّ عن المعتمد. لا تدّعي هذه الشاشة أن العقدين عقد واحد.")),
      }}
      governance={riskGovernance}
      reconstructionNote={t("admin.revamp.risk.note", copy("Prototype weights, bands and recalculation times are intentionally absent. This surface reads the live engine settings, while per-factory score explanation remains on the factory record where its scoring inputs exist.", "تم حذف أوزان النموذج ونطاقاته وأوقات إعادة الحساب عمداً. تقرأ هذه الواجهة إعدادات المحرك الفعلية، بينما يبقى تفسير درجة كل مصنع في سجل المصنع حيث توجد مدخلات الحساب."))}
      context={<><span className="badge badge-info">SCR-ADM-060 · ENG-04</span><span className="id-code">{data?.version_label ?? notConfigured}</span></>}
    >
      <div className="alert"><div><strong>{t("admin.risk.banner.title", "This is the Risk Studio (MVP1 foundation scope).")}</strong> {t("admin.risk.banner.before", "Weights and bands are live configuration in")} <code>engine_settings</code> {t("admin.risk.banner.after", "— scores must be reproducible from stored inputs + this version (EV-004). Writes require the risk_owner role; RLS rejects everyone else. Every save lands in the immutable audit trail.")}</div></div>

      {error && (
        <div className="alert alert-critical" role="alert"><div>
          <strong>{t("admin.risk.error.title", "Couldn’t load risk configuration.")}</strong>{" "}
          {t("admin.risk.error.body", "The existing configuration was not verified. Nothing changed; retry or check your risk-owner access.")}
        </div></div>
      )}

      {!error && !data && (
        <EmptyState glyph="⚖" title={t("admin.risk.empty.title", "No risk model stored")}
          body={t("admin.risk.empty.desc", "No risk configuration exists in your authorized scope. Create it through the governed provisioning process before using this studio.")} />
      )}

      {!error && data && s && (
        <RiskForm
          factors={factors}
          lowMax={s.bands?.low?.[1] ?? 39}
          medMax={s.bands?.medium?.[1] ?? 69}
          updatedAt={data.updated_at}
          modelVersion={data.version_label ?? notConfigured}
          drawerGovernance={riskGovernance}
          labels={labels}
        />
      )}

      {/* Per-factory "why this score" trace needs a selected factory and its
          stored scoring inputs — neither is read on this settings screen. Shown
          as an honest boundary rather than a fabricated worked example. */}
      <div style={{ maxInlineSize: 720 }}>
        <NotYetBoundary
          title={t("admin.risk.trace.title", "Why this factory? — worked calculation trace")}
          consequence={t("admin.risk.trace.desc", "A line-by-line score trace isn’t shown here — this screen configures the model, not individual factories.")}
          seam="NEEDS_FACTORY_SCORING_INPUTS — per-factory trace"
          prerequisites={[
            t("admin.risk.trace.pre1", "A selected factory and its stored scoring inputs"),
            t("admin.risk.trace.pre2", "The per-factor normalized values used at scoring time"),
          ]}
          notAvailableLabel={t("admin.risk.notYet", "Not available yet")}
          detailLabel={t("common.whyPrereq", "Why / prerequisites")}
        />
      </div>
    </AdminDestinationFrame>
  );
}
