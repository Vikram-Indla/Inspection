import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./bulk-campaign-summary.module.css";

export type CampaignSummaryStrings = {
  summaryTitle: string;
  summarySelected: string;
  summaryByBand: string;
  summaryByRegion: string;
  summaryEmpty: string;
  riskBands: Record<string, string>;
};

const RISK_TONE: Readonly<Record<string, StatusTone>> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

export default function BulkCampaignSummary({ selectedCount, byBand, byRegion, strings }: {
  selectedCount: number;
  byBand: Record<string, number>;
  byRegion: Record<string, number>;
  strings: CampaignSummaryStrings;
}) {
  return (
    <Card as="section">
      <CardHeader title={strings.summaryTitle} />
      <CardBody gap="tight">
        <div className={styles.groups}>
            <div className={styles.group}>
              <p className={styles.label}>{strings.summarySelected}</p>
              <p className={styles.value}>{selectedCount}</p>
            </div>
            <div className={styles.group}>
              <p className={styles.label}>{strings.summaryByBand}</p>
              <div className={styles.pills}>
                {Object.entries(byBand).map(([band, count]) => (
                  <StatusPill key={band} tone={RISK_TONE[band] ?? "neutral"}>
                    {`${strings.riskBands[band] ?? band} · ${count}`}
                  </StatusPill>
                ))}
              </div>
            </div>
            <div className={styles.group}>
              <p className={styles.label}>{strings.summaryByRegion}</p>
              <div className={styles.pills}>
                {Object.entries(byRegion).map(([region, count]) => (
                  <StatusPill key={region} tone="info">{`${region} · ${count}`}</StatusPill>
                ))}
              </div>
            </div>
          </div>
        <p className={styles.empty}>{selectedCount === 0 ? strings.summaryEmpty : ""}&nbsp;</p>
      </CardBody>
    </Card>
  );
}
