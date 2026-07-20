import { failed, forwardUnavailable } from "../errors";
import { parseTaskList } from "../schemas";
import type { DomainResult, SenaeiClient, SenaeiTaskSummary } from "../types";

export async function listTasks(client: SenaeiClient): Promise<DomainResult<SenaeiTaskSummary[]>> {
  const result = await client.requestJson("/api/inspection/tasks");
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseTaskList(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei tasks did not match the documented contract."); }
}
