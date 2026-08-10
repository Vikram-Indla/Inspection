import type { Locale } from "@/lib/i18n";
import type { BulkFormStrings } from "@/components/sections/planning-bulk/bulk-targeting-form/bulk-targeting-form";
import { bulkMessages } from "./strings";

export function buildBulkFormStrings(locale: Locale): BulkFormStrings {
  const bulk = bulkMessages(locale);
  return { ...bulk.form, riskBands: bulk.riskBand, empty: bulk.empty };
}
