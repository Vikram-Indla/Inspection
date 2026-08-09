import { useT } from "@/lib/i18n";
import { Card, CardBody } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { OperationsData } from "@/features/operations/queries";
import OverrideQueue, { type OverrideQueueStrings } from "../OverrideQueue";
import CancellationQueue, { type CancellationQueueStrings } from "../CancellationQueue";

export default async function QueuesSection({ data }: { data: OperationsData }) {
  const { t, locale } = await useT();
  const mayManageOperations = data.routeRoleKeys.includes("supervisor");
  if (!mayManageOperations) {
    return (
      <Card as="section">
        <CardBody>
          <EmptyState
            icon="restricted"
            title={t("ops.decisions.readOnly", "These decisions are read-only for your role")}
            description={t("ops.decisions.readOnlyBody", "Only an authorized Operations supervisor can decide location exceptions or active-session cancellations.")}
          />
        </CardBody>
      </Card>
    );
  }
  const overrideQueueStrings: OverrideQueueStrings = {
    heading: t("ops.override.heading", "Location exception requests"),
    caption: t("ops.override.caption", "Approve only the exact captured arrival attempt. The requester cannot decide; a pending request expires after 30 minutes or when the visit closes."),
    emptyTitle: t("ops.override.empty.title", "No location exceptions pending"),
    emptyDesc: t("ops.override.empty.desc", "Location exception requests with their evidence appear here for Operations review."),
    factory: t("ops.override.factory", "Factory"), inspector: t("ops.override.inspector", "Inspector"),
    captured: t("ops.override.captured", "Captured"), accuracy: t("ops.override.accuracy", "Accuracy"),
    distance: t("ops.override.distance", "Distance"), evidence: t("ops.override.evidence", "Photo evidence"),
    safetyException: t("ops.override.safetyException", "Safety/security photo exception declared"), expires: t("ops.override.expires", "Expires"),
    viewEvidence: t("ops.override.viewEvidence", "View photo"), evidenceUnavailable: t("ops.override.evidenceUnavailable", "photo link unavailable"),
    approve: t("ops.override.approve", "Approve exception"), reject: t("ops.override.reject", "Reject"),
    rejectReason: t("ops.override.rejectReason", "Rejection reason (mandatory to reject)"),
    deciding: t("ops.override.deciding", "Saving decision…"), decided: t("ops.override.decided", "Decision saved and the queue will refresh."),
    failure: t("ops.override.failure", "The decision could not be saved. Nothing changed."),
  };
  const cancellationQueueStrings: CancellationQueueStrings = {
    heading: t("ops.cancellation.heading", "Cancellation requests"),
    caption: t("ops.cancellation.caption", "Active-session cancellation requests from inspectors. Approval is terminal: the visit is cancelled, captured responses, evidence and location history are preserved for audit, and the assignment is freed. The requester cannot decide their own request."),
    emptyTitle: t("ops.cancellation.empty.title", "No cancellation requests pending"),
    emptyDesc: t("ops.cancellation.empty.desc", "Cancellation requests filed during a journey or inspection appear here for Operations review."),
    factory: t("ops.cancellation.factory", "Factory"), inspector: t("ops.cancellation.inspector", "Inspector"),
    phase: t("ops.cancellation.phase", "Phase"), requested: t("ops.cancellation.requested", "Requested"),
    evidence: t("ops.cancellation.evidence", "Evidence"), viewEvidence: t("ops.cancellation.viewEvidence", "View"),
    approve: t("ops.cancellation.approve", "Approve cancellation"), reject: t("ops.cancellation.reject", "Reject"),
    rejectReason: t("ops.cancellation.rejectReason", "Rejection reason (mandatory to reject)"),
    confirmTitle: t("ops.cancellation.confirmTitle", "Approve this cancellation?"),
    confirmBody: t("ops.cancellation.confirmBody", "This is terminal: the visit is cancelled and cannot be reopened. Everything captured so far is preserved for audit."),
    confirmApprove: t("ops.cancellation.confirmApprove", "Confirm — cancel the visit"),
    confirmBack: t("ops.cancellation.confirmBack", "Back"),
    deciding: t("ops.cancellation.deciding", "Saving decision…"),
    decided: t("ops.cancellation.decided", "Decision saved and the queue will refresh."),
    failure: t("ops.cancellation.failure", "The decision could not be saved. Nothing changed."),
  };
  return (
    <>
      <OverrideQueue rows={data.overrideQueueRows} strings={overrideQueueStrings} locale={locale} />
      <CancellationQueue rows={data.cancellationQueueRows} strings={cancellationQueueStrings} locale={locale} />
    </>
  );
}
