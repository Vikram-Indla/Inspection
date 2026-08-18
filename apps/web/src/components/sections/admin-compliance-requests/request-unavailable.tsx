import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export default function RequestUnavailable({ kind, locale, fromQueue }: {
  kind: "not-found" | "read-failed";
  locale: Locale;
  fromQueue: boolean;
}) {
  const copy = getMessages(locale).adminComplianceRequests;
  const back = fromQueue ? "/admin/compliance-approvals" : "/admin/compliance-requests";
  const notFound = kind === "not-found";

  return (
    <ShellPageFrame
      breadcrumbLabel={copy.breadcrumb.list}
      breadcrumbs={[{ label: copy.breadcrumb.administration, href: "/admin" }, { label: copy.breadcrumb.list, href: back }]}
      title={copy.breadcrumb.list}
    >
      <EmptyState
        icon={notFound ? "search" : "risk"}
        tone={notFound ? "neutral" : "danger"}
        title={notFound ? copy.workspace.notFoundTitle : copy.errorTitle}
        description={notFound ? copy.workspace.notFoundBody : copy.errorBody}
        action={<Button href={back} prefetch={false} variant="secondary" size="sm">{copy.workspace.notFoundBack}</Button>}
      />
    </ShellPageFrame>
  );
}
