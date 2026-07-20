import { failed, forwardUnavailable } from "../errors";
import { parseRegulationDetail, parseRegulationList } from "../schemas";
import type { DomainResult, Regulation, SenaeiClient } from "../types";

const segment = (value: string) => encodeURIComponent(value.trim());
export async function listRegulations(client: SenaeiClient): Promise<DomainResult<Regulation[]>> { const result = await client.requestJson("/api/inspection/regulations"); if (result.status !== "available") return forwardUnavailable(result); try { return { status: "available", data: parseRegulationList(result.data), source: "senaei", fetchedAt: result.fetchedAt }; } catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei regulations did not match the documented contract."); } }
export async function getRegulation(client: SenaeiClient, regulationId: string): Promise<DomainResult<Regulation>> { if (!regulationId.trim()) return failed("SENAEI_INVALID_RESPONSE", "A Senaei regulation id is required."); const result = await client.requestJson(`/api/inspection/regulations/${segment(regulationId)}`); if (result.status !== "available") return forwardUnavailable(result); try { return { status: "available", data: parseRegulationDetail(result.data), source: "senaei", fetchedAt: result.fetchedAt }; } catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei regulation detail did not match the documented contract."); } }
