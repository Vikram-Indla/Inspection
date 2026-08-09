import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import LibraryPanels from "@/components/compliance/library-panels/library-panels";
import { libraryHref } from "@/features/compliance/scope";
import { statusTone } from "@/features/compliance/presentation";
import { LIBRARY_TABS, type LibraryTab, type LibraryView, type RegulationRow } from "@/features/compliance/types";
import type { Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import styles from "./library-workspace.module.css";

type LibraryMessages = Messages["compliance"]["library"];

function metaChips(selected: RegulationRow, messages: LibraryMessages, locale: Locale) {
  const workspace = messages.workspace;
  return [
    { label: workspace.versionLabel, value: selected.version_label },
    {
      label: workspace.releaseDate,
      value: selected.release_date ? formatDate(selected.release_date, locale) : messages.panels.notRecorded,
    },
    {
      label: workspace.published,
      value: selected.published_at ? formatDate(selected.published_at, locale) : messages.panels.notRecorded,
    },
  ];
}

export default function LibraryWorkspace({ view, selected, messages, locale }: {
  view: LibraryView;
  selected: RegulationRow;
  messages: LibraryMessages;
  locale: Locale;
}) {
  const workspace = messages.workspace;
  return (
    <section className={styles.root} aria-label={workspace.tabsLabel}>
      <header className={styles.header}>
        <div className={styles.headline}>
          <p className={styles.type}>{workspace.typeLabel}</p>
          <h2 className={styles.title}><bdi dir="auto">{selected.title}</bdi></h2>
          <p className={styles.sub}>
            <span className={styles.code}>{selected.code}</span>
            {" · "}
            <bdi dir="auto">{selected.issuing_authority ?? messages.overview.authorityNotRecorded}</bdi>
          </p>
        </div>
        <StatusPill tone={statusTone(selected.operational_status)}>
          {humaniseEnum(selected.operational_status, locale)}
        </StatusPill>
      </header>
      <div className={styles.chips}>
        {metaChips(selected, messages, locale).map(chip => (
          <span className={styles.chip} key={chip.label}>
            {chip.label} <b className={styles.chipValue}>{chip.value}</b>
          </span>
        ))}
      </div>
      <div className={styles.actions}>
        <Button href={`/admin/regulations?id=${selected.entity_id}`} size="sm" prefetch={false}>
          {workspace.openFullRecord}
        </Button>
        {selected.request_id ? (
          <Button href={`/admin/compliance-requests/${selected.request_id}`} size="sm" variant="tertiary" prefetch={false}>
            {workspace.viewRequest}
          </Button>
        ) : null}
        <Button
          href={`/admin/compliance-requests/new?request_type=modify&target_entity_id=${selected.entity_id}`}
          size="sm"
          variant="tertiary"
          prefetch={false}
        >
          {workspace.modifyThroughRequest}
        </Button>
      </div>
      <p className={styles.readonlyNote}>
        <Icon name="restricted" size="sm" />
        {workspace.readonlyNote}
      </p>
      <nav className={styles.tabs} aria-label={workspace.tabsLabel}>
        {LIBRARY_TABS.map((tab: LibraryTab) => (
          <a
            className={styles.tab}
            key={tab}
            href={libraryHref(view.scope, { tab: tab === "overview" ? null : tab })}
            aria-current={view.scope.tab === tab ? "page" : undefined}
          >
            {messages.tabs[tab]}
          </a>
        ))}
      </nav>
      <LibraryPanels view={view} selected={selected} messages={messages} locale={locale} />
    </section>
  );
}
