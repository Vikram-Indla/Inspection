import { configurationMissing, failed, forwardUnavailable } from "../errors";
import { parseProductionLinePage } from "../schemas";
import type { DomainResult, ProductionLinePage, SenaeiClient, SenaeiProductionLineType } from "../types";

const TYPES = new Set<SenaeiProductionLineType>(["product", "raw-material", "spare-part", "machine"]);
export type ProductionLineQuery = { plantId: string; type: SenaeiProductionLineType; q?: string; page?: number; perPage?: number };
export async function getProductionLine(client: SenaeiClient, query: ProductionLineQuery): Promise<DomainResult<ProductionLinePage>> {
  if (client.productionLineMode !== "get_query") return configurationMissing("SENAEI_PRODUCTION_LINE_METHOD_UNCONFIRMED", "plant production line", "Senaei production-line access is disabled until SENAEI_PRODUCTION_LINE_MODE=get_query explicitly confirms the documented GET contract.");
  if (!query.plantId.trim() || !TYPES.has(query.type)) return failed("SENAEI_INVALID_RESPONSE", "A valid plant id and production-line type are required.");
  const result = await client.requestJson("/api/inspection/tasks/production-line", { method: "GET", query: { plant_id: query.plantId, type: query.type, q: query.q, page: query.page, per_page: query.perPage } });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseProductionLinePage(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei production-line data did not match the documented contract."); }
}
