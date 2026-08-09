import EnforcementDrawer from "@/components/enforcement/enforcement-drawer/enforcement-drawer";
import EnforcementTable from "@/components/enforcement/enforcement-table/enforcement-table";
import EnforcementToolbar from "@/components/enforcement/enforcement-toolbar/enforcement-toolbar";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import {
  applyEnforcementFilters,
  availableRegions,
  availableStatuses,
  buildEnforcementDetail,
  buildEnforcementRecords,
  type EnforcementRecordStrings,
} from "@/features/enforcement/records";
import {
  enforcementDetailHref,
  enforcementExportHref,
  enforcementListHref,
} from "@/features/enforcement/filters";
import { getEnforcementLibrary } from "@/features/enforcement/queries";
import type { EnforcementFilters } from "@/features/enforcement/types";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import styles from "./enforcement-sections.module.css";

export default async function EnforcementSections({ locale, filters }: {
  locale: Locale;
  filters: EnforcementFilters;
}) {
  const { enforcement } = getMessages(locale);
  const sb = await supabaseServer();
  const verified = await getVerifiedUser(sb);

  if (verified.error || !verified.data.user) {
    return (
      <EmptyState
        icon="restricted"
        title={enforcement.state.unauthorizedTitle}
        description={enforcement.state.unauthorizedBody}
      />
    );
  }

  const read = await getEnforcementLibrary();
  const recordStrings: EnforcementRecordStrings = {
    statuses: enforcement.statuses,
    penaltyNotIssued: enforcement.penalty.notIssued,
    penaltyMultiple: enforcement.penalty.multiple,
    missing: enforcement.missing,
    unavailable: enforcement.unavailable,
  };
  const statusLabel = (value: string) =>
    recordStrings.statuses[value] ?? value.replaceAll("_", " ");
  const visible = applyEnforcementFilters(read.rows, filters, Date.now());
  const records = buildEnforcementRecords(visible, read.penalties, recordStrings);
  const selected = read.rows.find(row => row.id === filters.violation) ?? null;
  const detail = selected
    ? buildEnforcementDetail(selected, read.penalties, recordStrings, enforcement.drawer)
    : null;

  return (
    <div className={styles.stack}>
      <EnforcementToolbar
        filters={filters}
        statuses={availableStatuses(read.rows)}
        statusLabel={statusLabel}
        regions={availableRegions(read.rows)}
        exportHref={enforcementExportHref(filters)}
        strings={enforcement.toolbar}
      />
      {read.failed ? (
        <EmptyState
          icon="risk"
          tone="danger"
          title={enforcement.state.errorTitle}
          description={enforcement.state.errorBody}
        />
      ) : (
        <EnforcementTable
          rows={records}
          detailHref={id => enforcementDetailHref(filters, id)}
          strings={enforcement.table}
        />
      )}
      {filters.violation && !detail && !read.failed ? (
        <EmptyState
          icon="restricted"
          tone="warning"
          variant="inline"
          title={enforcement.drawer.notVisible}
        />
      ) : null}
      {detail ? (
        <EnforcementDrawer
          detail={detail}
          closeHref={enforcementListHref(filters)}
          strings={enforcement.drawer}
        />
      ) : null}
    </div>
  );
}
