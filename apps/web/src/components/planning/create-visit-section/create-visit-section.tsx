import Icon from "@/components/saqeel/icon/icon";
import { Text } from "@/components/saqeel/type";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import styles from "./create-visit-section.module.css";

export type CreateVisitStrings = {
  button: string;
  menuLabel: string;
  single: { title: string; desc: string };
  bulk: { title: string; desc: string };
  immediate: { title: string; desc: string };
};

type MethodEntry = { href: string; icon: IconName; title: string; desc: string };

export default function CreateVisitSection({ strings, canCreate }: {
  strings: CreateVisitStrings;
  canCreate: boolean;
}) {
  if (!canCreate) return null;
  const methods: MethodEntry[] = [
    { href: "/planning/single", icon: "calendar", title: strings.single.title, desc: strings.single.desc },
    { href: "/planning/bulk", icon: "visits", title: strings.bulk.title, desc: strings.bulk.desc },
    { href: "/planning/immediate", icon: "workflow", title: strings.immediate.title, desc: strings.immediate.desc },
  ];
  return (
    <details className={styles.root}>
      <summary className={styles.trigger}>
        <Text as="span" role="label" tone="inherit">{strings.button}</Text>
        <Icon name="disclosure" size="sm" />
      </summary>
      <nav className={styles.menu} aria-label={strings.menuLabel}>
        {methods.map(method => (
          <a className={styles.item} href={method.href} key={method.href}>
            <span className={styles.itemIcon} aria-hidden="true">
              <Icon name={method.icon} size="md" />
            </span>
            <span className={styles.itemText}>
              <Text as="span" role="label">{method.title}</Text>
              <Text as="span" tone="muted">{method.desc}</Text>
            </span>
          </a>
        ))}
      </nav>
    </details>
  );
}
