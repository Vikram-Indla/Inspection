import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./operations-entry-table.module.css";

export type EntryRow = {
  readonly id: string;
  readonly inspectorName: string | null;
  readonly state: string;
  readonly visitId: string | null;
  readonly factoryName: string;
  readonly region: string | null;
  readonly city: string | null;
  readonly riskScore: string | number | null;
  readonly lastGeoAt: string | null;
  readonly href: string;
};

export type EntryTableStrings = {
  readonly title: string;
  readonly caption: string;
  readonly inspector: string;
  readonly state: string;
  readonly visit: string;
  readonly factory: string;
  readonly location: string;
  readonly risk: string;
  readonly lastUpdate: string;
  readonly actions: string;
  readonly openRecord: string;
  readonly notConfigured: string;
};

const ID_PREVIEW = 8;
const MISSING = "—";

export default function OperationsEntryTable({ rows, strings }: {
  rows: readonly EntryRow[];
  strings: EntryTableStrings;
}) {
  return (
    <Card as="section" labelledBy="operations-entry-table">
      <CardHeader
        level="h2"
        titleId="operations-entry-table"
        title={strings.title}
        description={strings.caption}
      />
      <CardBody>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.head} scope="col">{strings.inspector}</th>
                <th className={styles.head} scope="col">{strings.state}</th>
                <th className={styles.head} scope="col">{strings.visit}</th>
                <th className={styles.head} scope="col">{strings.factory}</th>
                <th className={styles.head} scope="col">{strings.location}</th>
                <th className={styles.head} scope="col">{strings.risk}</th>
                <th className={styles.head} scope="col">{strings.lastUpdate}</th>
                <th className={styles.head} scope="col">{strings.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr className={styles.row} key={row.id}>
                  <th className={styles.rowHead} scope="row" data-label={strings.inspector}>
                    {row.inspectorName ?? MISSING}
                  </th>
                  <td className={styles.cell} data-label={strings.state}>
                    <StatusPill tone="info" size="sm">{row.state}</StatusPill>
                  </td>
                  <td className={styles.cell} data-label={strings.visit}>
                    <bdi className={styles.code}>{row.visitId?.slice(0, ID_PREVIEW) ?? MISSING}</bdi>
                  </td>
                  <td className={styles.cell} data-label={strings.factory}>{row.factoryName}</td>
                  <td className={styles.cell} data-label={strings.location}>
                    {[row.region, row.city].filter(Boolean).join(" · ") || MISSING}
                  </td>
                  <td className={styles.cell} data-label={strings.risk}>
                    {row.riskScore === null
                      ? <StatusPill tone="warning" size="sm" ping>{strings.notConfigured}</StatusPill>
                      : <span className={styles.number}>{row.riskScore}</span>}
                  </td>
                  <td className={styles.cell} data-label={strings.lastUpdate}>
                    <span className={styles.muted}>{row.lastGeoAt ?? MISSING}</span>
                  </td>
                  <td className={styles.cell} data-label={strings.actions}>
                    <Button variant="secondary" size="sm" href={row.href} label={`${strings.openRecord} — ${row.factoryName}`}>
                      {strings.openRecord}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
