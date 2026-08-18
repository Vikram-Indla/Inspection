import Link from "next/link";
import { Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import styles from "./risk-models.module.css";

export default function RiskSectionNav({ current, labels }: {
  current: "/admin/risk" | "/admin/risk/models";
  labels: Messages["adminRiskModels"]["nav"];
}) {
  const items = [
    { href: "/admin/risk" as const, title: labels.studio, hint: labels.studioHint },
    { href: "/admin/risk/models" as const, title: labels.models, hint: labels.modelsHint },
  ];

  return (
    <nav className={styles.sectionNav} aria-label={labels.label}>
      {items.map(item => {
        const active = current === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={styles.sectionTab}
            data-active={active ? "" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <Text role="label" as="span">{item.title}</Text>
            <Text role="label" tone="muted" as="span">{item.hint}</Text>
          </Link>
        );
      })}
    </nav>
  );
}
