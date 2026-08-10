import type { Locale } from "@/lib/i18n";
import type { BulkFormStrings } from "@/app/(app)/planning/bulk/BulkForm";
import { bulkMessages } from "./strings";

export function buildBulkFormStrings(locale: Locale): BulkFormStrings {
  const bulk = bulkMessages(locale);
  return { ...bulk.form, riskBands: bulk.riskBand };
}
