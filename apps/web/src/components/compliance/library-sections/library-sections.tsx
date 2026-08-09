import LibraryCatalogue from "@/components/compliance/library-catalogue/library-catalogue";
import LibraryNav, { type AuthorityEntry } from "@/components/compliance/library-nav/library-nav";
import LibraryWorkspace from "@/components/compliance/library-workspace/library-workspace";
import { getLibraryView } from "@/features/compliance/queries";
import type { LibraryScope, LibraryView } from "@/features/compliance/types";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./library-sections.module.css";

function authorityEntries(view: LibraryView, otherLabel: string): readonly AuthorityEntry[] {
  return view.authorities.map(name => ({
    name,
    label: name === "Other" ? otherLabel : name,
    count: view.rows.filter(row => (row.issuing_authority ?? "Other") === name).length,
  }));
}

export default async function LibrarySections({ locale, scope }: {
  locale: Locale;
  scope: LibraryScope;
}) {
  const view = await getLibraryView(scope);
  const messages = getMessages(locale).compliance.library;
  return (
    <div
      className={styles.shell}
      data-screen-id="CMP-S01"
      data-workspace={view.selected ? "" : undefined}
    >
      <LibraryNav
        scope={view.scope}
        total={view.rows.length}
        authorities={authorityEntries(view, messages.nav.otherAuthority)}
        selected={view.selected}
        messages={messages}
      />
      <LibraryCatalogue view={view} messages={messages} locale={locale} />
      {view.selected ? (
        <LibraryWorkspace view={view} selected={view.selected} messages={messages} locale={locale} />
      ) : null}
    </div>
  );
}
