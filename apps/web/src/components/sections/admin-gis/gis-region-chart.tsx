import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import type { AdminGisMessages } from "@/features/admin-gis/strings";
import type { GisFactory } from "@/features/admin-gis/types";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";

const TOP_N = 8;

export default function GisRegionChart({ factories, strings, locale }: {
  factories: readonly GisFactory[];
  strings: AdminGisMessages;
  locale: Locale;
}) {
  const counts = new Map<string, number>();
  for (const factory of factories) {
    if (factory.region) counts.set(factory.region, (counts.get(factory.region) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_N);
  if (ranked.length === 0) return null;

  const points: readonly BarPoint[] = ranked.map(([region, count]) => ({
    key: region,
    label: humaniseEnum(region, locale),
    value: count,
    display: String(count),
  }));

  return (
    <Card as="section">
      <CardHeader level="h2" title={strings.regionChart.title} description={strings.regionChart.help} />
      <CardBody>
        <BarSeries points={points} domainMax={ranked[0][1]} ariaLabel={strings.regionChart.ariaLabel} rtl={locale === "ar"} />
      </CardBody>
    </Card>
  );
}
