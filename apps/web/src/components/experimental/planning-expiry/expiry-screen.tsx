import type { PlanningExpiryData } from "@/features/admin-planning-expiry/queries";
import { Heading, Notice, Text, linearTheme } from "@/components/experimental/linear";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import ExpiryRuleSection from "./expiry-rule-section";
import styles from "./expiry-screen.module.css";

export default function ExpiryScreen({ data, locale }: {
  data: PlanningExpiryData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminPlanningExpiry;

  return (
    <div className={linearTheme.root}>
      <div className={styles.page}>
        <div className={styles.band}>
          <header className={styles.header}>
            <Heading level={1} role="headingSm">{copy.title}</Heading>
            <Text role="body" tone="muted">{copy.subtitle}</Text>
          </header>

          <Notice tone="accent">
            <div className={styles.noticeBody}>
              <Text role="caption" tone="strong" weight="medium">{copy.governance.heading}</Text>
              <Text role="caption" tone="muted">{copy.governance.body}</Text>
            </div>
          </Notice>

          {data.readFailed ? (
            <Notice tone="danger" live="alert">
              <div className={styles.noticeBody}>
                <Text role="caption" tone="strong" weight="medium">{copy.error.heading}</Text>
                <Text role="caption" tone="muted">{copy.error.body}</Text>
              </div>
            </Notice>
          ) : null}

          {data.canConfigure ? null : (
            <Notice>
              <div className={styles.noticeBody}>
                <Text role="caption" tone="strong" weight="medium">{copy.readOnly.heading}</Text>
                <Text role="caption" tone="muted">{copy.readOnly.body}</Text>
              </div>
            </Notice>
          )}
        </div>

        <div className={styles.sections}>
          {data.groups.map(group => (
            <ExpiryRuleSection
              key={group.ruleType}
              group={group}
              copy={copy}
              locale={locale}
              canConfigure={data.canConfigure}
            />
          ))}
        </div>

        <Text role="caption" tone="muted">{copy.scheduler.note}</Text>
      </div>
    </div>
  );
}
