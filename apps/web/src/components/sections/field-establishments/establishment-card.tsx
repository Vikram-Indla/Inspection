import Link from "next/link";
import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { riskLabel, riskTone, type EstablishmentsCopy } from "@/features/field-establishments/labels";
import type { EstablishmentCardRow } from "@/features/field-establishments/rows";
import styles from "./establishments.module.css";

export default function EstablishmentCard({ row, copy }: {
  row: EstablishmentCardRow;
  copy: EstablishmentsCopy;
}) {
  const initial = Array.from(row.name.trim())[0] ?? copy.noValue;
  const band = riskLabel(copy, row.riskBand);

  const inner = (
    <div className={styles.cardBody}>
      <span className={styles.avatar} aria-hidden="true">
        <Text role="bodyStrong" as="span" tone="secondary">{initial}</Text>
      </span>
      <div className={styles.cardContent}>
        <div className={styles.cardHead}>
          <Text role="bodyStrong" as="span" dir="auto" clamp={2}>{row.name}</Text>
          <StatusPill tone={row.isTemporary ? "warning" : "success"} ping={false}>
            {row.isTemporary ? copy.card.unlicensed : copy.card.licensed}
          </StatusPill>
        </div>
        <Mono as="span" tone="secondary">{row.isTemporary ? copy.card.noLicense : (row.licenseText ?? copy.noValue)}</Mono>
        <div className={styles.cardFoot}>
          <Text role="label" tone="secondary" as="span" dir="auto">{row.city ?? copy.noValue}</Text>
          <span className={styles.grow} />
          {band ? <StatusPill tone={riskTone(row.riskBand)} ping={false}>{band}</StatusPill> : null}
        </div>
      </div>
    </div>
  );

  if (row.dossierHref) {
    return (
      <Card as="article" interactive>
        <Link href={row.dossierHref} className={styles.cardLink} aria-label={`${copy.card.open}: ${row.name}`}>
          <CardBody>{inner}</CardBody>
        </Link>
      </Card>
    );
  }

  return (
    <Card as="article">
      <div className={styles.cardStatic} title={copy.card.noDossier}>
        <CardBody>{inner}</CardBody>
      </div>
    </Card>
  );
}
