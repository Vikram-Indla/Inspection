import type { Locale } from "@/lib/i18n";
import { FIELD_REGISTRY } from "@/app/(app)/planning/bulk/criteria";
import type { BuilderField, CriteriaBuilderStrings } from "@/app/(app)/planning/bulk/CriteriaBuilder";
import { bulkMessages } from "./strings";

export function buildBuilderFields(locale: Locale): BuilderField[] {
  const bulk = bulkMessages(locale);
  const labels: Record<string, string> = bulk.field;
  const operators: Record<string, string> = bulk.operator;
  const reasons: Record<string, string> = bulk.notSupplied;
  return FIELD_REGISTRY.map(definition => ({
    key: definition.key,
    label: labels[definition.key] ?? definition.key,
    type: definition.type,
    operators: definition.operators.map(op => ({ op, label: operators[op] ?? op })),
    supplied: definition.supplied,
    reason: definition.supplied ? undefined : reasons[definition.key],
  }));
}

export function buildCriteriaStrings(locale: Locale): CriteriaBuilderStrings {
  return bulkMessages(locale).criteria;
}
