import Link from "next/link";
import { type ReactNode } from "react";
import Icon from "@/components/saqeel/icon/icon";
import { Heading, Text } from "@/components/saqeel/type";
import styles from "./settings.module.css";

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <Heading level={2} visual="label">{label}</Heading>
      <div className={styles.card}>{children}</div>
    </section>
  );
}

export function SettingRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>
        <Text role="label" as="span" dir="auto">{label}</Text>
      </span>
      {children ? <span className={styles.trailing}>{children}</span> : null}
    </div>
  );
}

export function GovernedRow({ label, note }: { label: string; note: string }) {
  return (
    <SettingRow label={label}>
      <Text role="label" tone="muted" as="span">{note}</Text>
    </SettingRow>
  );
}

export function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} prefetch={false} className={styles.link}>
      <span className={styles.rowLabel}>
        <Text role="label" as="span" dir="auto">{label}</Text>
      </span>
      <span className={styles.chevron}>
        <Icon name="nextPage" size="sm" mirrored />
      </span>
    </Link>
  );
}
