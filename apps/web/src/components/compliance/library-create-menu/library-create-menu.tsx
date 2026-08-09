import Link from "next/link";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import type { Messages } from "@/i18n/messages";
import styles from "./library-create-menu.module.css";

type CreateMessages = Messages["compliance"]["library"]["create"];

const NEW_REQUEST_PATH = "/admin/compliance-requests/new";

type CreateEntry = {
  readonly key: "regulation" | "item" | "violation" | "penalty";
  readonly icon: IconName;
  readonly needsRegulation: boolean;
};

const ENTRIES: readonly CreateEntry[] = [
  { key: "regulation", icon: "library", needsRegulation: false },
  { key: "item", icon: "review", needsRegulation: true },
  { key: "violation", icon: "risk", needsRegulation: true },
  { key: "penalty", icon: "enforcement", needsRegulation: true },
];

const HINTS: Readonly<Record<CreateEntry["key"], keyof CreateMessages>> = {
  regulation: "regulationHint",
  item: "itemHint",
  violation: "violationHint",
  penalty: "penaltyHint",
};

export default function LibraryCreateMenu({ hasSelection, messages }: {
  hasSelection: boolean;
  messages: CreateMessages;
}) {
  return (
    <details className={styles.root}>
      <summary className={styles.trigger}>
        {messages.button}
        <Icon name="disclosure" size="sm" />
      </summary>
      <div className={styles.menu} aria-label={messages.menuLabel}>
        {ENTRIES.map(entry => {
          const blocked = entry.needsRegulation && !hasSelection;
          const hint = blocked ? messages.needsRegulation : messages[HINTS[entry.key]];
          const body = (
            <>
              <span className={styles.itemIcon}><Icon name={entry.icon} size="sm" /></span>
              <span className={styles.itemText}>
                <span className={styles.itemTitle}>{messages[entry.key]}</span>
                <span className={styles.itemHint}>{hint}</span>
              </span>
            </>
          );
          return blocked ? (
            <span className={styles.item} key={entry.key} data-disabled="" aria-disabled="true">{body}</span>
          ) : (
            <Link className={styles.item} key={entry.key} href={NEW_REQUEST_PATH} prefetch={false}>{body}</Link>
          );
        })}
      </div>
    </details>
  );
}
