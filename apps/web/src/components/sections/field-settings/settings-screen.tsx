import Button from "@/components/saqeel/button/button";
import { Heading } from "@/components/saqeel/type";
import type { FieldSettingsData } from "@/features/field-settings/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import SettingsPanels from "./settings-panels";
import styles from "./settings.module.css";

export default function SettingsScreen({ data, locale }: {
  data: FieldSettingsData;
  locale: Locale;
}) {
  const copy = getMessages(locale).fieldSettings;

  return (
    <>
      <header className={styles.header}>
        <Button href="/field/account" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
          {copy.back}
        </Button>
        <Heading level={1} visual="subheading">{copy.title}</Heading>
      </header>
      <SettingsPanels userId={data.userId} appVersion={data.appVersion} locale={locale === "ar" ? "ar" : "en"} copy={copy} />
    </>
  );
}
