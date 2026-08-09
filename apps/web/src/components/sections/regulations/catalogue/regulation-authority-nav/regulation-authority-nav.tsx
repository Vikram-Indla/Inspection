import Link from "next/link";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import type { RegulationAuthority } from "@/features/regulations/rows";
import styles from "./regulation-authority-nav.module.css";

export type RegulationAuthorityStrings = {
  readonly heading: string;
  readonly all: string;
  readonly notRecorded: string;
  readonly caption: string;
};

export default function RegulationAuthorityNav({ authorities, total, current, hrefFor, strings }: {
  authorities: readonly RegulationAuthority[];
  total: number;
  current: string;
  hrefFor: (authority: string) => string;
  strings: RegulationAuthorityStrings;
}) {
  return (
    <nav aria-labelledby="regulation-authorities">
      <Card as="div">
      <CardHeader level="h2" titleId="regulation-authorities" title={strings.heading} />
      <CardBody gap="tight">
        <ul className={styles.list}>
          <li>
            <Link className={styles.entry} href={hrefFor("")} aria-current={current ? undefined : "true"}>
              <span className={styles.label}>{strings.all}</span>
              <CountBadge tone="neutral" value={total} />
            </Link>
          </li>
          {authorities.map(authority => (
            <li key={authority.key}>
              <Link
                className={styles.entry}
                href={hrefFor(authority.key)}
                aria-current={current === authority.key ? "true" : undefined}
                data-unrecorded={authority.label === null ? "" : undefined}
              >
                <span className={styles.label}>{authority.label ?? strings.notRecorded}</span>
                <CountBadge tone="neutral" value={authority.count} />
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.caption}>{strings.caption}</p>
      </CardBody>
      </Card>
    </nav>
  );
}
