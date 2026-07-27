import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import AdminDestinationFrame from "../_components/AdminDestinationFrame";

export const dynamic = "force-dynamic";

function rawLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function IntegrationsPage() {
  const [{ t, locale }, sb] = await Promise.all([useT(), supabaseServer()]);
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [endpointsRead, eventsRead, exportsRead] = await Promise.all([
    sb.from("mvp3_integration_endpoints").select("id,endpoint_key,display_name,endpoint_kind,contract_version,status,updated_at").order("display_name"),
    sb.from("mvp3_api_events").select("id,event_kind,direction,outcome,correlation_id,occurred_at").order("occurred_at", { ascending: false }).limit(20),
    sb.from("mvp3_export_jobs").select("id,export_kind,purpose,status,artifact_hash,requested_at,completed_at").order("requested_at", { ascending: false }).limit(20),
  ]);
  const endpoints = endpointsRead.data ?? [];
  const events = eventsRead.data ?? [];
  const exports = exportsRead.data ?? [];

  const statusLabel = (value: string) =>
    t(`mvp3.integrations.status.${value}`, rawLabel(value));
  const kindLabel = (value: string) =>
    t(`mvp3.integrations.kind.${value}`, rawLabel(value));
  const notConfigured = t("common.notConfigured", copy("Not configured", "غير مُهيّأ"));
  const configuredEndpoints = endpoints.filter(row => row.status === "configured").length;

  return (
    <AdminDestinationFrame
      current="/admin/integrations"
      title={t("admin.revamp.integration.title", copy("Integration Management", "إدارة التكاملات"))}
      subtitle={t("admin.revamp.integration.subtitle", copy("External data sources and connected systems", "مصادر البيانات الخارجية والأنظمة المتصلة"))}
      hub={t("admin.revamp.hub.connections", copy("Connections & geography", "التكاملات والجغرافيا"))}
      routeLabel="/admin/integrations"
      designId="frame-24-admin-integration-management"
      labels={{
        administration: t("navigation.administration", copy("Administration", "الإدارة")),
        breadcrumb: t("common.breadcrumb", copy("Breadcrumb", "مسار التنقل")),
        governance: t("admin.revamp.governance", copy("Governance on this surface", "الحوكمة في هذه الواجهة")),
        reconstruction: t("admin.revamp.reconstruction", copy("Reconstruction note", "ملاحظة إعادة البناء")),
      }}
      metrics={[
        {
          label: t("admin.revamp.integration.metric.registered", copy("Registered endpoints", "نقاط التكامل المسجلة")),
          value: endpointsRead.error ? notConfigured : endpoints.length,
          note: t("admin.revamp.integration.metric.registered.note", copy("Read from the governed endpoint registry", "مقروءة من سجل نقاط التكامل المحكوم")),
        },
        {
          label: t("admin.revamp.integration.metric.configured", copy("Configured endpoints", "نقاط التكامل المهيّأة")),
          value: endpointsRead.error ? notConfigured : configuredEndpoints,
          note: t("admin.revamp.integration.metric.configured.note", copy("Contract and runtime address recorded", "العقد وعنوان التشغيل مسجلان")),
        },
        {
          label: t("admin.revamp.integration.metric.events", copy("Recent API events", "أحداث واجهة البرمجة الأخيرة")),
          value: eventsRead.error ? notConfigured : events.length,
          note: t("admin.revamp.integration.metric.events.note", copy("Bounded append-only read", "قراءة محدودة من سجل إلحاقي")),
        },
      ]}
      tabs={[
        { label: t("admin.revamp.integration.tabs.connections", copy("Connections", "الاتصالات")), href: "/admin/integrations", current: true },
        { label: t("mvp3.integrations.senaiData", copy("SENAI data", "بيانات صناعي")), href: "/admin/integrations/senai-data" },
        { label: t("mvp3.integrations.factoryData", copy("Factory data", "بيانات المصانع")), href: "/admin/integrations/factory-data" },
        { label: t("admin.revamp.integration.tabs.history", copy("Sync history", "سجل المزامنة")), href: "/admin/integrations#integration-events" },
      ]}
      governance={[
        t("admin.revamp.integration.governance.truth", copy("Configuration, connectivity and delivery are distinct truth states.", "التهيئة والاتصال والتسليم حالات حقيقة منفصلة.")),
        t("admin.revamp.integration.governance.secrets", copy("Secrets are never rendered; only governed contract and runtime state is shown.", "لا تُعرض الأسرار؛ ويُعرض فقط العقد المحكوم وحالة التشغيل.")),
        t("admin.revamp.integration.governance.degrade", copy("Unavailable providers fail closed and dependent features disclose the boundary.", "تفشل الجهات المزودة غير المتاحة بأمان وتوضح الميزات المعتمدة عليها هذا الحد.")),
      ]}
      reconstructionNote={t("admin.revamp.integration.note", copy("Prototype provider names, sync times and health labels are not copied. The register, event stream and export jobs below are RLS-scoped backend reads; missing tables or rows remain unavailable or verified-empty states.", "لا تُنسخ أسماء الجهات المزودة أو أوقات المزامنة أو تسميات الصحة النموذجية. سجل التكامل وتدفق الأحداث ومهام التصدير أدناه قراءات خلفية محكومة بأمن الصفوف؛ وتبقى الجداول أو الصفوف المفقودة حالات غير متاحة أو فارغة تم التحقق منها."))}
      context={<span className="badge badge-info">M3-00 · CD-050</span>}
    >
      <div className="sq-banner"><div><strong>{t("mvp3.integrations.truth", "Configuration is not connectivity.")}</strong> {t("mvp3.integrations.truthBody", "An endpoint becomes configured only with an approved contract and runtime address. Secrets are never displayed here.")}</div></div>
      <div className="row" style={{ marginBlock: "var(--space-4)", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Link className="btn btn-secondary btn-touch" href="/admin/integrations/senai-data">{t("mvp3.integrations.senaiData", "SENAI data management")}</Link>
        <Link className="btn btn-secondary btn-touch" href="/admin/integrations/factory-data">{t("mvp3.integrations.factoryData", "Factory data integration and import")}</Link>
      </div>
      <section className="panel stack" style={{ padding: "var(--space-6)" }} aria-labelledby="integration-registry">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}><div><h3 id="integration-registry">{t("mvp3.integrations.registry", "Governed endpoint registry")}</h3><p className="t-caption">{t("mvp3.integrations.registryHelp", "Contract version, runtime state and dependency truth—not secret material.")}</p></div><span className="badge">{(endpoints ?? []).length} endpoints</span></div>
        {endpointsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("mvp3.integrations.registryError", "The endpoint registry could not be read. Event and export data below may still be available.")}</div> : null}
        <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.version", "Contract")}</th><th scope="col">{t("common.status", "Truth status")}</th></tr></thead><tbody>
          {endpoints.map(row => <tr key={row.id}><th scope="row">{row.display_name}<div className="t-caption"><bdi dir="ltr">{row.endpoint_key}</bdi></div></th><td>{kindLabel(row.endpoint_kind)}<div className="t-caption"><bdi dir="ltr">{row.endpoint_kind}</bdi></div></td><td><span className="sq-version"><bdi dir="ltr">{row.contract_version}</bdi></span></td><td><span className={`sq-lozenge ${row.status === "configured" ? "sq-lozenge--success" : "sq-lozenge--warning"}`}>{statusLabel(row.status)}</span><div className="t-caption"><bdi dir="ltr">{row.status}</bdi> · {t("mvp3.integrations.updated", "recorded")} <time dateTime={row.updated_at}>{new Date(row.updated_at).toLocaleString()}</time></div></td></tr>)}
          {!endpointsRead.error && endpoints.length === 0 ? <tr><td colSpan={4}>{t("mvp3.integrations.empty", "No endpoints are registered. This is a verified empty read.")}</td></tr> : null}
        </tbody></table></div>
      </section>
      <div className="sq-grid" id="integration-events" style={{ marginBlockStart: "var(--space-4)" }}>
        <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }}><h3>{t("mvp3.integrations.events", "API and rule events")}</h3><p className="t-caption">{t("mvp3.integrations.eventsHelp", "Append-only outcomes linked by correlation ID.")}</p>{eventsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("mvp3.integrations.eventsError", "API events could not be read. This is unavailable data, not an empty event history.")}</div> : null}{events.slice(0, 8).map(e => <div className="row" key={e.id} style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", overflowWrap: "anywhere" }}><span><strong>{kindLabel(e.event_kind)}</strong><small className="t-caption"> · {kindLabel(e.direction)}</small><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.event_kind}</bdi> · <bdi dir="ltr">{e.direction}</bdi> · <time dateTime={e.occurred_at}>{new Date(e.occurred_at).toLocaleString()}</time></small></span><span><span className="badge">{statusLabel(e.outcome)}</span><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.outcome}</bdi></small></span></div>)}{!eventsRead.error && events.length === 0 ? <p className="t-caption">{t("mvp3.integrations.noEvents", "No RLS-visible events. This is a verified empty read.")}</p> : null}</section>
        <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }}><h3>{t("mvp3.integrations.exports", "Data-sharing exports")}</h3><p className="t-caption">{t("mvp3.integrations.exportsHelp", "Prepared is not delivered. Delivery requires an artifact hash and receipt.")}</p>{exportsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("mvp3.integrations.exportsError", "Export jobs could not be read. This is unavailable data, not an empty export history.")}</div> : null}{exports.slice(0, 8).map(e => <div className="row" key={e.id} style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", overflowWrap: "anywhere" }}><span><strong>{kindLabel(e.export_kind)}</strong><small className="t-caption"> · {e.purpose}</small><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.export_kind}</bdi> · <time dateTime={e.requested_at}>{new Date(e.requested_at).toLocaleString()}</time></small></span><span><span className="badge">{statusLabel(e.status)}</span><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.status}</bdi></small></span></div>)}{!exportsRead.error && exports.length === 0 ? <p className="t-caption">{t("mvp3.integrations.noExports", "No RLS-visible export jobs. This is a verified empty read.")}</p> : null}</section>
      </div>
    </AdminDestinationFrame>
  );
}
