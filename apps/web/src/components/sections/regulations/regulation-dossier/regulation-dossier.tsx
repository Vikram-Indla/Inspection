/* @retiring 2026-08-09 · replaced-by components/sections/regulations/regulation-dossier (T-037 rebuild) · pending overview/items/violations/penalties/versions/audit tabs · delete-when 0-imports */
import Link from "next/link";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import { RegulationLifecycleControl } from "@/app/(app)/admin/regulations/Controls";
import { readRegulationDossier } from "@/features/regulations/dossier-source";

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(String(value)), template);

export default async function RegulationDossier({ detailId }: { detailId: string }) {
  const { t, locale } = await useT();
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const source = await readRegulationDossier(detailId);
  const reg = source.regulation;
  const isWriter = source.isWriter;

  if (!reg) {
    return (
      <EmptyState
        role="status"
        title={t("admin.reg.r1.detail.notFound.title", "Regulation not found")}
        body={t("admin.reg.r1.detail.notFound.body", "No regulation has this identifier. It may have been removed.")}
      />
    );
  }

  const clauses = Array.isArray(reg.clauses) ? reg.clauses : [];
  const attachments = Array.isArray(reg.attachments) ? reg.attachments : [];
  const unmappedClauses = clauses.filter(clause => !Array.isArray(clause.inspection_items) || clause.inspection_items.length === 0).length;
  const attachmentUrls = source.attachmentUrls;

  const statusLabel = reg.operational_status === "active"
    ? t("admin.reg.r1.status.active", copy("Active", "فعال"))
    : reg.operational_status === "deactivated"
      ? t("admin.reg.status.deactivated", "Deactivated")
      : t("admin.reg.r1.status.scheduled", copy("Scheduled", "مجدول"));

  return (
    <>
      <p className="t-caption">
        <Link className="sq-link" href="/admin/regulations">{t("admin.reg.r1.backToRegister", "Back to list")}</Link>
      </p>

      <section className="panel stack" aria-labelledby="reg-dossier-h">
        <h2 id="reg-dossier-h">
          <bdi dir="ltr" className="numeric">{reg.code}</bdi> — {reg.title}
        </h2>
        <p className="t-caption">
          {reg.issuing_authority || "—"}
          {reg.release_date ? <> · <bdi dir="ltr" className="numeric">{reg.release_date.slice(0, 10)}</bdi></> : null}
          {" · "}<bdi dir="ltr" className="numeric">{reg.version_label}</bdi>
          {" · "}{statusLabel}
        </p>
      </section>

      <section className="panel stack" aria-labelledby="reg-attachments-h">
        <h3 id="reg-attachments-h">{t("admin.reg.attachments.heading", "Source attachments")}</h3>
        {reg.attachments_status === "verified_unknown" ? (
          <p className="t-caption" role="status">{t("admin.reg.attachments.unknown", "Attachment footprint is unknown for this canonical version; no zero claim is made.")}</p>
        ) : attachments.length === 0 ? (
          <p className="t-caption" role="status">{t("admin.reg.attachments.empty", "No attachment metadata recorded — verified zero.")}</p>
        ) : (
          <ul className="stack">
            {attachments.map(attachment => (
              <li key={attachment.id}>
                {attachmentUrls[attachment.id]
                  ? <a className="sq-link" href={attachmentUrls[attachment.id]} target="_blank" rel="noreferrer">{attachment.file_name}</a>
                  : <strong>{attachment.file_name}</strong>}
                {attachment.media_type ? ` · ${attachment.media_type}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel stack" aria-labelledby="reg-clauses-h">
        <h3 id="reg-clauses-h">{t("admin.reg.r1.detail.clauses.heading", "Clauses & mapped inspection items")}</h3>
        {clauses.length === 0 ? (
          <p className="t-caption" role="status">{t("admin.reg.r1.detail.clauses.empty.body", "This regulation has no clauses.")}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t("admin.reg.r1.detail.clauses.heading", "Clauses & mapped inspection items")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("admin.reg.r1.detail.col.clause", "Clause")}</th>
                  <th scope="col">{t("admin.reg.form.title", "Title")}</th>
                  <th scope="col">{t("admin.reg.clause.applicability", "Applicability")}</th>
                  <th scope="col">{t("admin.reg.clause.legalSource", "Legal source")}</th>
                  <th scope="col">{t("admin.reg.r1.detail.col.mappedItems", "Mapped items")}</th>
                </tr>
              </thead>
              <tbody>
                {clauses.map(clause => {
                  const items = Array.isArray(clause.inspection_items) ? clause.inspection_items : null;
                  return (
                    <tr key={clause.id}>
                      <th scope="row" className="numeric"><bdi dir="ltr">{clause.clause_ref ?? "—"}</bdi></th>
                      <td>{clause.title ?? "—"}</td>
                      <td className="t-caption">{clause.applicability ?? "—"}</td>
                      <td className="t-caption">{clause.legal_source ?? "—"}</td>
                      <td>
                        {items === null
                          ? t("admin.reg.r1.rail.items.unknown", "mapped-item read failed — impact unknown, not zero")
                          : items.length === 0
                            ? t("admin.reg.r1.rail.items.zero", "no mapped items (verified zero)")
                            : items.map(item => <bdi dir="ltr" className="badge badge-info" key={item.id}>{item.code}</bdi>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isWriter ? (
        <section className="panel stack" aria-labelledby="reg-actions-h">
          <h3 id="reg-actions-h">{t("admin.reg.r1.detail.actions.heading", "Configuration")}</h3>
          <p>{t("admin.reg.requestOnly.body", copy("To create or change clauses, attachments, release dates, or new versions, you must submit a Compliance Configuration Request.", "لإنشاء أو تعديل البنود أو المرفقات أو تواريخ الإصدار أو الإصدارات الجديدة، يجب تقديم طلب تهيئة الامتثال."))}</p>
          <p>
            <Link className="btn btn-primary btn-touch" href="/admin/compliance-requests/new">
              {t("admin.reg.requestOnly.create", copy("Create configuration request", "إنشاء طلب تهيئة"))}
            </Link>
          </p>
          {reg.operational_status !== "deactivated" ? (
            <p role={unmappedClauses > 0 || clauses.length === 0 ? "alert" : "status"}>
              {clauses.length === 0
                ? t("admin.reg.r1.detail.validation.noClauses", "Blocked: at least one clause is needed.")
                : unmappedClauses > 0
                  ? fill(t("admin.reg.r1.detail.validation.unmapped", "Blocked: {n} clause(s) have no mapped inspection item."), { n: unmappedClauses })
                  : t("admin.reg.r1.detail.validation.ready", "Every clause has at least one mapped inspection item.")}
            </p>
          ) : null}
          <RegulationLifecycleControl
            entityId={reg.entity_id}
            operationalStatus={reg.operational_status}
            labels={{
              activationReason: t("admin.reg.lifecycle.activationReason", copy("Activation reason", "سبب التفعيل")),
              deactivationReason: t("admin.reg.lifecycle.deactivationReason", copy("Deactivation reason", "سبب إلغاء التفعيل")),
              applying: t("admin.reg.lifecycle.applying", copy("Applying…", "جارٍ التطبيق…")),
              activate: t("admin.reg.lifecycle.activate", copy("Activate regulation", "تفعيل اللائحة")),
              deactivate: t("admin.reg.lifecycle.deactivate", copy("Deactivate regulation", "إلغاء تفعيل اللائحة")),
              alreadyMatched: t("admin.reg.lifecycle.alreadyMatched", copy("State already matched.", "الحالة مطابقة بالفعل.")),
              changedTo: t("admin.reg.lifecycle.changedTo", copy("Lifecycle changed to {status}.", "تم تغيير دورة الحياة إلى {status}.")),
              cascaded: t("admin.reg.lifecycle.cascaded", copy("Cascaded: {items} items, {violations} violations, {penalties} penalties.", "تم تطبيق التغيير على: {items} بنود، {violations} مخالفات، {penalties} جزاءات.")),
              childrenNotReactivated: t("admin.reg.lifecycle.childrenNotReactivated", copy("Child configurations were not reactivated.", "لم تتم إعادة تفعيل التهيئات التابعة.")),
              missingReference: t("admin.reg.lifecycle.missingReference", copy("Missing regulation reference.", "مرجع اللائحة مفقود.")),
              reasonRequired: t("admin.reg.lifecycle.reasonRequired", copy("A lifecycle reason is required.", "سبب تغيير دورة الحياة مطلوب.")),
              denied: t("admin.reg.lifecycle.denied", copy("You are not authorized to change regulation lifecycle state.", "ليست لديك صلاحية تغيير حالة دورة حياة اللائحة.")),
              notFound: t("admin.reg.lifecycle.notFound", copy("The regulation no longer exists or is outside your scope.", "اللائحة غير موجودة أو خارج نطاق صلاحيتك.")),
              providerError: t("admin.reg.lifecycle.providerError", copy("The lifecycle change could not be completed. Retry safely.", "تعذر إكمال تغيير دورة الحياة. أعد المحاولة بأمان.")),
            }}
          />
        </section>
      ) : null}

      <section className="panel stack" aria-labelledby="reg-audit-h">
        <h3 id="reg-audit-h">{t("admin.reg.audit.heading", "Change history")}</h3>
        {!isWriter
          ? <p className="t-caption">{t("admin.reg.audit.readonly", "This history is only available to configuration writers; your read-only role is not granted that access.")}</p>
          : source.auditFailed
            ? <p role="alert">{t("admin.reg.audit.error", "The change history couldn't load. Reload to retry — this does not mean the history is empty.")}</p>
            : source.auditEvents.length === 0
              ? <p className="t-caption" role="status">{t("admin.reg.audit.empty", "No activity found for this record.")}</p>
              : <ol className="stack">{source.auditEvents.map(event => (
                  <li key={event.id}>
                    <strong>{event.action}</strong> · <bdi dir="ltr" className="numeric">{event.occurred_at}</bdi>
                    {event.actor ? <> · <bdi dir="ltr">{event.actor}</bdi></> : null}
                  </li>
                ))}</ol>}
      </section>

      <section className="panel stack" aria-labelledby="reg-lineage-h">
        <h3 id="reg-lineage-h">{t("admin.reg.lineage.heading", "Version history")}</h3>
        <ol className="stack">
          {source.lineage.map(version => (
            <li key={version.entity_id}>
              <Link className="sq-link" href={`/admin/regulations?id=${encodeURIComponent(version.entity_id)}`}>
                <bdi dir="ltr" className="numeric">{version.version_label}</bdi>
              </Link>
              {" · "}{version.operational_status}
              {version.release_date ? <> · <bdi dir="ltr" className="numeric">{version.release_date.slice(0, 10)}</bdi></> : null}
              {version.deactivation_reason ? <div className="t-caption">{version.deactivation_reason}</div> : null}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
