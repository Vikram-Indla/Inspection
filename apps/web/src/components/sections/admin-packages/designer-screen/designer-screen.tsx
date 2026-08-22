import type { ReactNode } from "react";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono } from "@/components/saqeel/type";
import type { PackagesData } from "@/features/admin-packages/queries";
import { adminPackagesMessages } from "@/features/admin-packages/strings";
import {
  availableTabs,
  isEditableDraft,
  registerHref,
  resolveTab,
  type PackageSelection,
  type PackagesQuery,
  type PackagesTab,
  type VersionRow,
} from "@/features/admin-packages/view";
import type { Locale } from "@/lib/i18n";
import DesignerTabs from "../designer-tabs/designer-tabs";
import PackagesNotices from "../packages-notices/packages-notices";
import VersionList from "../version-list/version-list";
import styles from "./designer-screen.module.css";

const TONE: Readonly<Record<string, StatusTone>> = {
  published: "success",
  locked: "info",
  draft: "warning",
};

const VERSIONS_ONLY: readonly PackagesTab[] = ["versions"];

export default function DesignerScreen({
  data, selection, query, locale, designer, preview, impact, deactivateFor, newDraftForm,
}: {
  data: PackagesData;
  selection: PackageSelection;
  query: PackagesQuery;
  locale: Locale;
  designer: ReactNode;
  preview: ReactNode;
  impact: ReactNode;
  deactivateFor: (version: VersionRow) => ReactNode;
  newDraftForm: ReactNode;
}) {
  const strings = adminPackagesMessages(locale);
  const { pkg, version } = selection;
  const canDesign = isEditableDraft(version, data.canWrite) && !data.itemBankUnavailable;
  const tabs = version ? availableTabs(canDesign) : VERSIONS_ONLY;
  const tab = version ? resolveTab(query, canDesign) : "versions";

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
        { label: strings.title, href: registerHref(query) },
        { label: pkg.title },
      ]}
      description={pkg.scope ?? strings.register.noScope}
      title={pkg.title}
    >
      <Mono tone="muted">{pkg.code}</Mono>

      <PackagesNotices data={data} strings={strings} />

      <Card>
        <CardHeader
          level="h2"
          title={version ? <Mono tone="primary">{version.version_label}</Mono> : strings.states.empty}
          trailing={version ? (
            <StatusPill ping={false} tone={TONE[version.status] ?? "neutral"}>
              {strings.states[version.status as keyof typeof strings.states] ?? version.status}
            </StatusPill>
          ) : null}
        />
        <CardBody>
          <DesignerTabs
            active={tab}
            query={query}
            strings={strings}
            tabs={tabs}
            versionId={version?.id ?? ""}
          />

          {version && !canDesign ? (
            <EmptyState
              description={version.status === "draft" ? strings.workbench.readOnlyBody : strings.workbench.immutableBody}
              icon="restricted"
              title={version.status === "draft" ? strings.workbench.readOnlyTitle : strings.workbench.immutableTitle}
              tone="info"
              variant="inline"
            />
          ) : null}

          <div className={styles.panel}>
            {tab === "designer" ? designer : null}

            {tab === "preview" ? (
              data.itemBankUnavailable
                ? (
                  <EmptyState
                    description={strings.notices.itemBankBody}
                    icon="risk"
                    title={strings.notices.itemBankTitle}
                    tone="warning"
                    variant="inline"
                  />
                )
                : preview
            ) : null}

            {tab === "impact" ? impact : null}

            {tab === "versions" ? (
              <>
                {version ? null : (
                  <EmptyState
                    description={strings.workbench.noVersionBody}
                    icon="forms"
                    title={strings.workbench.noVersionTitle}
                    variant="inline"
                  />
                )}
                <VersionList
                  canWrite={data.canWrite}
                  deactivateFor={deactivateFor}
                  locale={locale}
                  newDraftForm={newDraftForm}
                  pkg={pkg}
                  query={query}
                  selectedId={version?.id ?? null}
                  strings={strings}
                />
              </>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </ShellPageFrame>
  );
}
