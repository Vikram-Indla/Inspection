import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { PackagesData } from "@/features/admin-packages/queries";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";

export default function PackagesNotices({ data, strings }: {
  data: PackagesData;
  strings: AdminPackagesMessages;
}) {
  return (
    <>
      {data.permissionUnknown ? (
        <EmptyState
          description={strings.notices.permissionUnknownBody}
          icon="risk"
          title={strings.notices.permissionUnknownTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      {!data.canWrite && !data.permissionUnknown ? (
        <EmptyState
          description={strings.notices.readOnlyBody}
          icon="restricted"
          title={strings.notices.readOnlyTitle}
          tone="info"
          variant="inline"
        />
      ) : null}

      {data.itemBankUnavailable ? (
        <EmptyState
          description={strings.notices.itemBankBody}
          icon="risk"
          title={strings.notices.itemBankTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      {data.templatesUnavailable ? (
        <EmptyState
          description={strings.notices.templatesBody}
          icon="risk"
          title={strings.notices.templatesTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}
    </>
  );
}
