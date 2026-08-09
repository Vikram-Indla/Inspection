import DataTable, { CellLink, CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import Toolbar from "@/components/saqeel/toolbar/toolbar";
import LibraryCreateMenu from "@/components/compliance/library-create-menu/library-create-menu";
import { regulationItemCount } from "@/features/compliance/queries";
import { libraryHref } from "@/features/compliance/scope";
import { statusTone } from "@/features/compliance/presentation";
import type { LibraryView, RegulationRow } from "@/features/compliance/types";
import { fill, type Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import styles from "./library-catalogue.module.css";

type LibraryMessages = Messages["compliance"]["library"];

function columns(view: LibraryView, messages: LibraryMessages, locale: Locale): readonly DataColumn<RegulationRow>[] {
  const catalogue = messages.catalogue;
  return [
    {
      key: "regulation",
      header: catalogue.columnRegulation,
      isRowHeader: true,
      cell: row => (
        <CellLink href={libraryHref(view.scope, { libraryId: row.entity_id, tab: null })}>
          <bdi dir="auto">{row.title}</bdi>
        </CellLink>
      ),
    },
    { key: "code", header: catalogue.columnCode, cell: row => <span className={styles.code}>{row.code}</span>, width: "min" },
    {
      key: "authority",
      header: catalogue.columnAuthority,
      cell: row => <CellMuted>{row.issuing_authority ?? catalogue.notRecorded}</CellMuted>,
    },
    {
      key: "items",
      header: catalogue.columnItems,
      align: "end",
      numeric: true,
      cell: row => {
        const count = regulationItemCount(row);
        return count === null ? <CellMuted>{messages.workspace.countUnavailable}</CellMuted> : count;
      },
    },
    {
      key: "status",
      header: catalogue.columnStatus,
      cell: row => (
        <StatusPill tone={statusTone(row.operational_status)} size="sm">
          {humaniseEnum(row.operational_status, locale)}
        </StatusPill>
      ),
    },
    { key: "version", header: catalogue.columnVersion, cell: row => row.version_label, width: "min" },
    {
      key: "published",
      header: catalogue.columnPublished,
      cell: row => row.published_at
        ? <CellMuted>{formatDate(row.published_at, locale)}</CellMuted>
        : <CellMuted>{catalogue.notRecorded}</CellMuted>,
    },
  ];
}

export default function LibraryCatalogue({ view, messages, locale }: {
  view: LibraryView;
  messages: LibraryMessages;
  locale: Locale;
}) {
  const { scope } = view;
  const catalogue = messages.catalogue;
  const hasFilters = !!scope.query || !!scope.authority || !!scope.status;
  const total = scope.authority
    ? view.rows.filter(row => (row.issuing_authority ?? "Other") === scope.authority).length
    : view.rows.length;
  return (
    <section className={styles.root} aria-label={messages.title}>
      <header className={styles.context}>
        <h2 className={styles.heading}>
          <bdi dir="auto">{scope.authority || messages.nav.allRegulations}</bdi>
        </h2>
        <p className={styles.sub}>{fill(catalogue.countOf, { count: view.filtered.length, total })}</p>
      </header>
      <Toolbar
        label={catalogue.statusLabel}
        trailing={<LibraryCreateMenu hasSelection={!!view.selected} messages={messages.create} />}
      >
        <form className={styles.filterForm} action={scope.routeBase} method="get">
          {scope.rawQuery ? <input type="hidden" name="q" value={scope.rawQuery} /> : null}
          {scope.authority ? <input type="hidden" name="authority" value={scope.authority} /> : null}
          <select className={styles.select} name="status" defaultValue={scope.status} aria-label={catalogue.statusLabel}>
            <option value="">{catalogue.statusAny}</option>
            {view.statuses.map(value => <option value={value} key={value}>{humaniseEnum(value, locale)}</option>)}
          </select>
          <button className={styles.chip} type="button" disabled title={catalogue.inspectionTypeHold}>
            {catalogue.inspectionType}
          </button>
          <button className={styles.apply} type="submit">{catalogue.apply}</button>
        </form>
      </Toolbar>
      {scope.status ? (
        <div className={styles.activeFilters}>
          <a className={styles.filterChip} href={libraryHref(scope, { status: null })}>
            {fill(catalogue.statusChip, { status: humaniseEnum(scope.status, locale) })}
          </a>
          <a className={styles.clearAll} href={libraryHref(scope, { q: null, status: null, authority: null })}>
            {catalogue.clearFilters}
          </a>
        </div>
      ) : null}
      {view.readFailed ? (
        <div role="alert">
          <EmptyState
            tone="danger"
            icon="risk"
            title={catalogue.unavailable}
            description={fill(catalogue.unavailableBody, { reference: view.correlationId ?? "" })}
          />
        </div>
      ) : (
        <DataTable
          rows={view.filtered}
          columns={columns(view, messages, locale)}
          getRowId={row => row.entity_id}
          caption={catalogue.caption}
          bleed={false}
          empty={{
            title: hasFilters && view.rows.length > 0 ? catalogue.emptyFiltered : catalogue.empty,
            description: hasFilters && view.rows.length > 0 ? catalogue.emptyFilteredBody : catalogue.emptyBody,
            icon: "library",
          }}
        />
      )}
    </section>
  );
}
