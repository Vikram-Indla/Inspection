import Icon from "@/components/saqeel/icon/icon";
import { Heading, Text } from "@/components/saqeel/type";
import type { EnforcementTrend } from "@/features/dashboard/enforcement-trend";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./executive-brief.module.css";

const HEADING_ID = "dashboard-executive-brief";

export type ExecutiveBriefStrings = {
  readonly title: string;
  readonly completed: string;
  readonly critical: string;
  readonly penaltiesUp: string;
  readonly penaltiesDown: string;
  readonly penaltiesSame: string;
  readonly penaltiesUnknown: string;
  readonly coverage: string;
  readonly caveat: string;
};

export type ExecutiveBriefFacts = {
  readonly completedInspections: number;
  readonly criticalFactories: number;
  readonly factories: number;
  readonly hasAnnualTarget: boolean;
};

function penaltyLine(trend: EnforcementTrend, s: ExecutiveBriefStrings, locale: Locale): string {
  if (!trend.readable || trend.change == null) return s.penaltiesUnknown;
  const current = trend.periods.find(p => p.key === "current")?.count ?? 0;
  const counts = { count: formatCount(current, locale), change: formatCount(Math.abs(trend.change), locale) };
  if (trend.change > 0) return fill(s.penaltiesUp, counts);
  if (trend.change < 0) return fill(s.penaltiesDown, counts);
  return fill(s.penaltiesSame, counts);
}

export default function ExecutiveBrief({ locale, facts, trend, strings: s }: {
  locale: Locale;
  facts: ExecutiveBriefFacts;
  trend: EnforcementTrend;
  strings: ExecutiveBriefStrings;
}) {
  const lines = [
    fill(s.completed, { count: formatCount(facts.completedInspections, locale) }),
    fill(s.critical, {
      count: formatCount(facts.criticalFactories, locale),
      total: formatCount(facts.factories, locale),
    }),
    penaltyLine(trend, s, locale),
    facts.hasAnnualTarget ? null : s.coverage,
    s.caveat,
  ].filter((line): line is string => Boolean(line));

  return (
    <section className={styles.root} aria-labelledby={HEADING_ID}>
      <span className={styles.headline}>
        <Icon name="ai" size="sm" />
        <Heading level={2} tone="accent" id={HEADING_ID}>{s.title}</Heading>
      </span>
      <ul className={styles.list}>
        {lines.map(line => (
          <li key={line}><Text tone="secondary" as="span" dir="auto">{line}</Text></li>
        ))}
      </ul>
    </section>
  );
}
