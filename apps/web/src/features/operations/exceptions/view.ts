import { getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { groupExceptions, type ExceptionCategory, type ExceptionSource } from "@/lib/operations/exceptions";

const DRILL_HREF: Partial<Record<ExceptionCategory, string>> = {
  review_overdue: "/reviews",
  correction_overdue: "/execution",
};

export type ExceptionGroupView = {
  readonly category: ExceptionCategory;
  readonly label: string;
  readonly count: string;
  readonly mostRecent: string;
  readonly href: string | null;
  readonly action: string | null;
};

export function buildExceptionGroups(sources: ExceptionSource[], locale: Locale): ExceptionGroupView[] {
  const { board } = getMessages(locale).operations;
  const { state } = getMessages(locale).common;
  return groupExceptions(sources).map(group => {
    const href = DRILL_HREF[group.category] ?? null;
    const newest = group.items[0]?.occurredAt;
    return {
      category: group.category,
      label: board.category[group.category],
      count: String(group.count),
      mostRecent: newest
        ? `${board.mostRecent} ${formatDateTime(newest, locale)}`
        : state.notConfigured,
      href,
      action: href ? board.action[group.category as keyof typeof board.action] : null,
    };
  });
}
