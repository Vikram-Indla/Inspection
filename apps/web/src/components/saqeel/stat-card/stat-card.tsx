import Link from "next/link";
import { type ReactNode } from "react";
import { Card, CardBody, CardValue, CardValueSlot } from "@/components/saqeel/card/card";
import styles from "./stat-card.module.css";

export default function StatCard({ label, value, status, sub, action, href, valueSize = "md" }: {
  label: string;
  value?: ReactNode;
  status?: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  href?: string;
  valueSize?: "md" | "lg";
}) {
  return (
    <Card as="article" interactive={Boolean(href)}>
      <CardBody gap="tight">
        <p className={styles.label}>
          {href ? <Link className={styles.link} href={href} prefetch={false}>{label}</Link> : label}
        </p>
        <CardValueSlot>
          {status ?? <CardValue size={valueSize}>{value}</CardValue>}
        </CardValueSlot>
        {sub || action ? (
          <span className={styles.foot}>
            {sub ? <p className={styles.sub}>{sub}</p> : null}
            {action ? <span className={styles.action}>{action}</span> : null}
          </span>
        ) : null}
      </CardBody>
    </Card>
  );
}
