import Gauge from "@/components/saqeel/charts/gauge/gauge";
import { SERIES_ROLE } from "@/components/saqeel/charts/chart-palette";
import { fill } from "@/i18n/messages";
import { formatDecimal } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import type { RiskBands } from "@/features/factories/risk-bands";

export type FactoryRiskMeterStrings = {
  readonly label: string;
  readonly caption: string;
  readonly aria: string;
};

export default function FactoryRiskMeter({ score, bands, locale, strings }: {
  score: number | null;
  bands: RiskBands | null;
  locale: Locale;
  strings: FactoryRiskMeterStrings;
}) {
  if (score === null || !bands || bands.ceiling <= 0) return null;

  const percent = Math.max(0, Math.min(100, (score / bands.ceiling) * 100));
  const numbers = {
    score: formatDecimal(score, locale),
    ceiling: formatDecimal(bands.ceiling, locale),
  };

  return (
    <Gauge
      percent={percent}
      display={numbers.score}
      label={strings.label}
      caption={fill(strings.caption, numbers)}
      ariaLabel={fill(strings.aria, numbers)}
      series={SERIES_ROLE.rate}
      size="sm"
    />
  );
}
