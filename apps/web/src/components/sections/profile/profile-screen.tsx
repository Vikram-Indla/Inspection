import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationPrefsForm from "@/app/(app)/profile/NotificationPrefsForm";
import { PushOptIn } from "@/app/push/PushOptIn";
import type { ProfileData } from "@/features/profile/queries";
import { formatDateTime } from "@/lib/dates";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./profile.module.css";

export default function ProfileScreen({ data, locale, strings }: {
  data: ProfileData;
  locale: Locale;
  strings: Messages["profile"];
}) {
  const fmt = (ms: number | null) => (ms != null ? formatDateTime(ms, locale) : strings.empty);
  const ltr = (value: string | null) => <bdi dir="ltr">{value ?? strings.empty}</bdi>;
  const languageHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const languageLabel = locale === "ar" ? strings.appearance.toEnglish : strings.appearance.toArabic;

  const details = [
    { label: strings.details.name, value: ltr(data.fullName) },
    { label: strings.details.email, value: ltr(data.email) },
    { label: strings.details.region, value: ltr(data.region) },
    { label: strings.details.roles, value: <bdi dir="ltr">{data.roles.length ? data.roles.join(", ") : strings.empty}</bdi> },
  ];
  const session = [
    { label: strings.session.issued, value: <bdi dir="ltr">{fmt(data.issuedAtMs)}</bdi> },
    { label: strings.session.expires, value: <bdi dir="ltr">{fmt(data.expiresAtMs)}</bdi> },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Heading level={1}>{strings.title}</Heading>
        <StatusPill tone="info">{strings.badge}</StatusPill>
      </div>

      <div className={styles.grid}>
        <Card as="section">
          <CardHeader level="h2" title={strings.details.heading} />
          <CardBody gap="default">
            <DefinitionList items={details} columns="two" />
            <Text tone="muted">{strings.details.editNote}</Text>
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader level="h2" title={strings.appearance.heading} />
          <CardBody gap="default">
            <div className={styles.row}>
              <Text as="span" role="label" tone="muted">{strings.appearance.languageLabel}</Text>
              <Button variant="secondary" size="sm" href={languageHref} label={languageLabel}>{languageLabel}</Button>
            </div>
            <div className={styles.row}>
              <Text as="span" role="label" tone="muted">{strings.appearance.themeLabel}</Text>
              <ThemeToggle className={styles.themeButton}
                labels={{ toLight: strings.appearance.toLight, toDark: strings.appearance.toDark }} />
            </div>
            <Text tone="muted">{strings.appearance.themeNote}</Text>
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader level="h2" title={strings.notif.heading} />
          <CardBody gap="default">
            <NotificationPrefsForm push={data.prefs.push} sms={data.prefs.sms} email={data.prefs.email}
              l={{
                heading: strings.notif.heading, push: strings.notif.push, sms: strings.notif.sms,
                email: strings.notif.email, inappNote: strings.notif.inappNote, save: strings.notif.save,
                saving: strings.notif.saving, saved: strings.notif.saved,
              }} />
            <Text tone="muted">{strings.notif.pushOptInNote}</Text>
            <PushOptIn strings={{
              enable: strings.notif.pushEnable, enabling: strings.notif.pushEnabling,
              enabled: strings.notif.pushEnabled, unsupported: strings.notif.pushUnsupported,
              denied: strings.notif.pushDenied,
            }} />
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader level="h2" title={strings.session.heading} />
          <CardBody gap="default">
            <DefinitionList items={session} columns="two" />
            <Button variant="tertiary" size="sm" href="/signout" label={strings.session.signOut}>{strings.session.signOut}</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
