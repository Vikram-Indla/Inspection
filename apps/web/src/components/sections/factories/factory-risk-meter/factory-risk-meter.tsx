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

/**
 * The factory's risk score against its governed band scale.
 *
 * The number alone cannot say how far into a band a factory sits — 81.5 reads
 * the same whether it just crossed the threshold or is near the ceiling. The arc
 * says it at a glance.
 *
 * `bands` is required and nullable on purpose: the ceiling is configuration
 * (`engine_settings.risk`), never an assumption. With no governed bands there is
 * no scale, so this renders nothing and the caller's plain numeral stands.
 */
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
