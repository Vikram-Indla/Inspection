import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import { SERIES_ROLE } from "@/components/saqeel/charts/chart-palette";
import { Text } from "@/components/saqeel/type";
import { makeEnumLabel } from "@/i18n/enum-label";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";

export type OperationsStatesStrings = {
  readonly title: string;
  readonly description: string;
  readonly aria: string;
  readonly total: string;
};

const MIN_DISTINCT_STATES = 2;

/**
 * The operational-state split behind the summary tiles.
 *
 * The tiles above already carry the two states an operations lead acts on. This
 * card exists for the other five, which the model computes and nothing renders.
 *
 * It removes itself when fewer than two states carry a visit: a chart of one bar
 * beside six zeros says less than the tile that already shows the number, and an
 * empty plot reads as a broken one.
 */
export default function OperationsStates({ counts, locale, strings }: {
  counts: Readonly<Record<string, number>>;
  locale: Locale;
  strings: OperationsStatesStrings;
}) {
  const enumLabel = makeEnumLabel(locale);
  const ranked = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((first, second) => second[1] - first[1]);

  if (ranked.length < MIN_DISTINCT_STATES) return null;

  const total = ranked.reduce((sum, [, value]) => sum + value, 0);
  const points: readonly BarPoint[] = ranked.map(([state, value]) => ({
    key: state,
    label: enumLabel(state),
    value,
    display: formatCount(value, locale),
  }));

  return (
    <Card as="section" labelledBy="operations-states">
      <CardHeader
        level="h2"
        titleId="operations-states"
        title={strings.title}
        description={strings.description}
      />
      <CardBody gap="tight">
        <BarSeries
          points={points}
          domainMax={Math.max(...ranked.map(([, value]) => value), 1)}
          ariaLabel={strings.aria}
          series={SERIES_ROLE.volume}
        />
        <Text tone="muted">{fill(strings.total, { total: formatCount(total, locale) })}</Text>
      </CardBody>
    </Card>
  );
}
