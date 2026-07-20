import { failed, forwardUnavailable } from "../errors";
import { parseTaskDetail } from "../schemas";
import type { DomainResult, InspectionTaskDetail, SenaeiClient } from "../types";

const segment = (value: string) => encodeURIComponent(value.trim());
export async function getTaskDetail(client: SenaeiClient, taskId: string): Promise<DomainResult<InspectionTaskDetail>> {
  if (!taskId.trim()) return failed("SENAEI_INVALID_RESPONSE", "A Senaei task id is required.");
  const result = await client.requestJson(`/api/inspection/tasks/${segment(taskId)}`);
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseTaskDetail(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei task detail did not match the documented contract."); }
}
