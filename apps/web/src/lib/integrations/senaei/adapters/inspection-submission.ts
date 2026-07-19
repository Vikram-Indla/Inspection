import { failed, forwardUnavailable } from "../errors";
import { parseOperation } from "../schemas";
import type { DomainResult, GovernedInspectionSubmission, SenaeiClient, SenaeiOperationResult } from "../types";

const segment = (value: string) => encodeURIComponent(value.trim());
export async function submitInspection(client: SenaeiClient, submission: GovernedInspectionSubmission): Promise<DomainResult<SenaeiOperationResult>> {
  if (!submission.taskId.trim() || !submission.governanceRef.trim()) return failed("SENAEI_REQUEST_INVALID", "Inspection submission requires task and governance references.");
  if (!(submission.formData instanceof FormData)) return failed("SENAEI_REQUEST_INVALID", "Inspection submission requires caller-provided FormData.");
  if (!submission.formData.has("inspection_type") || !submission.formData.has("is_distrupted")) return failed("SENAEI_REQUEST_INVALID", "Inspection submission is missing documented control fields.");
  const result = await client.requestJson(`/api/inspection/tasks/submit-inspection/${segment(submission.taskId)}`, { method: "POST", bodyKind: "multipart_form_data", body: submission.formData });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseOperation(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei inspection submission did not match the documented contract."); }
}
