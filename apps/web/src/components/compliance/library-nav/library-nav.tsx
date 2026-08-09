import Icon from "@/components/saqeel/icon/icon";
import { libraryHref } from "@/features/compliance/scope";
import type { LibraryScope, RegulationRow } from "@/features/compliance/types";
import type { Messages } from "@/i18n/messages";
import styles from "./library-nav.module.css";

type LibraryMessages = Messages["compliance"]["library"];

export type AuthorityEntry = {
  readonly name: string;
  readonly label: string;
  readonly count: number;
};

export default function LibraryNav({ scope, total, authorities, selected, messages }: {
  scope: LibraryScope;
  total: number;
  authorities: readonly AuthorityEntry[];
  selected: RegulationRow | null;
  messages: LibraryMessages;
}) {
  return (
    <nav className={styles.root} aria-label={messages.nav.label}>
      <form className={styles.search} action={scope.routeBase} method="get" role="search">
        {scope.authority ? <input type="hidden" name="authority" value={scope.authority} /> : null}
        {scope.status ? <input type="hidden" name="status" value={scope.status} /> : null}
        <Icon name="search" size="sm" />
        <input
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={scope.rawQuery}
          placeholder={messages.catalogue.search}
          aria-label={messages.catalogue.searchLabel}
        />
      </form>
      <a
        className={styles.item}
        href={libraryHref(scope, { authority: null, libraryId: null, tab: null })}
        aria-current={scope.authority ? undefined : "true"}
      >
        <Icon name="library" size="sm" />
        <span className={styles.itemName}>{messages.nav.allRegulations}</span>
        <span className={styles.count}>{total}</span>
      </a>
      <p className={styles.sectionLabel}>{messages.nav.authorities}</p>
      {authorities.map(authority => (
        <a
          className={styles.item}
          key={authority.name}
          href={libraryHref(scope, { authority: authority.name, libraryId: null, tab: null })}
          aria-current={scope.authority === authority.name ? "true" : undefined}
        >
          <Icon name="admin" size="sm" />
          <span className={styles.itemName}><bdi dir="auto">{authority.label}</bdi></span>
          <span className={styles.count}>{authority.count}</span>
        </a>
      ))}
      <p className={styles.sectionLabel}>{messages.nav.recentlyOpened}</p>
      {selected ? (
        <a
          className={styles.subItem}
          href={libraryHref(scope, { libraryId: selected.entity_id })}
          aria-current="true"
        >
          <bdi dir="auto">{selected.title}</bdi>
        </a>
      ) : (
        <p className={styles.emptyHint}>{messages.nav.recentlyOpenedEmpty}</p>
      )}
      <p className={styles.sectionLabel}>{messages.nav.favorites}</p>
      <p className={styles.emptyHint}>{messages.nav.favoritesEmpty}</p>
    </nav>
  );
}
