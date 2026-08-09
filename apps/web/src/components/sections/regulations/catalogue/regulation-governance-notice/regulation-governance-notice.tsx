import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { RegulationAccess } from "@/features/regulations/access";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./regulation-governance-notice.module.css";

export type RegulationNoticeStrings = {
  readonly governance: {
    readonly title: string;
    readonly body: string;
    readonly create: string;
    readonly requests: string;
  };
  readonly access: {
    readonly reviewerTitle: string;
    readonly title: string;
    readonly body: string;
    readonly unverifiedTitle: string;
    readonly unverifiedBody: string;
  };
};

/**
 * Writers are told how to change the library; everyone else is told why they
 * cannot. `unverified` is deliberately not folded into read-only: the roles
 * failed to read, so the screen states that rather than describing a role it
 * never resolved.
 */
export default function RegulationGovernanceNotice({ locale, access, strings }: {
  locale: Locale;
  access: RegulationAccess;
  strings: RegulationNoticeStrings;
}) {
  if (access.kind === "writer") {
    return (
      <Card as="section" labelledBy="regulation-governance">
        <CardHeader level="h2" titleId="regulation-governance" title={strings.governance.title} />
        <CardBody gap="tight">
          <p className={styles.text}>{strings.governance.body}</p>
        </CardBody>
        <CardFooter>
          <Button
            variant="primary"
            size="sm"
            href={localeHref(locale, "/admin/compliance-requests/new")}
            label={strings.governance.create}
          >
            {strings.governance.create}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            href={localeHref(locale, "/admin/compliance-requests")}
            label={strings.governance.requests}
          >
            {strings.governance.requests}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const unverified = access.kind === "unverified";
  return (
    <Card as="section" labelledBy="regulation-governance">
      <CardHeader
        level="h2"
        titleId="regulation-governance"
        title={unverified
          ? strings.access.unverifiedTitle
          : access.kind === "reviewer" ? strings.access.reviewerTitle : strings.access.title}
        trailing={<StatusPill tone={unverified ? "warning" : "info"}>{strings.governance.title}</StatusPill>}
      />
      <CardBody gap="tight">
        <p className={styles.text}>{unverified ? strings.access.unverifiedBody : strings.access.body}</p>
      </CardBody>
    </Card>
  );
}
