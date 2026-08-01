import { useT } from "@/lib/i18n";

export default async function ApprovalQueueLoading() {
  const { t } = await useT();
  return (
    <main className="sq-content" data-saqeel-screen="APQ-S01">
      <section className="panel" aria-live="polite" aria-busy="true">
        <div className="panel-header">
          <h1 className="panel-title">{t("approval.queue.loading", "Loading Awaiting Approval")}</h1>
          <span className="badge badge-pending">{t("common.loading", "Loading")}</span>
        </div>
        <div className="panel-body stack">
          <div className="skeleton" />
          <div className="skeleton" />
          <p>{t("approval.queue.loadingBody", "Reading requests, objects, decisions, and final receipts within your access scope.")}</p>
        </div>
      </section>
    </main>
  );
}
