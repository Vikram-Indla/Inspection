import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";

export default async function AccessNotice() {
  const { t } = await useT();
  return (
    <Shell current="/operations" title={t("ops.title", "Operations Center")}>
      <EmptyState
        icon="restricted"
        tone="warning"
        title={t("ops.unauthorized.title", "Operations access required")}
        description={t("ops.unauthorized.body", "This page is not turned on for your account, so no data has loaded.")}
        action={
          <Button variant="secondary" href="/launch" label={t("ops.unauthorized.return", "Return to my area")}>
            {t("ops.unauthorized.return", "Return to my area")}
          </Button>
        }
      />
    </Shell>
  );
}
