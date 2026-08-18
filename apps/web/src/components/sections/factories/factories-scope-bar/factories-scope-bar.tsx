"use client";
import { formatCount } from "@/i18n/numbers";

import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import { fill, getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./factories-scope-bar.module.css";

export default function FactoriesScopeBar({ locale, options, value, shown, total }: {
  locale: Locale;
  options: readonly SelectOption[];
  value: string;
  shown: number;
  total: number;
}) {
  const { factories } = getMessages(locale);
  const [pending, setPending] = useState(value);

  return (
    <form className={styles.root} method="get" aria-label={factories.scope.portfolio}>
      <input type="hidden" name="scope" value={pending} />
      <div className={styles.controls}>
        <Field label={factories.scope.portfolio}>
          <SaqeelSelect
            options={options}
            value={pending}
            onChange={setPending}
            label={factories.scope.portfolio}
          />
        </Field>
        <Button type="submit" variant="secondary" label={factories.scope.dossier}>
          {factories.scope.dossier}
        </Button>
      </div>
      <p className={styles.count}>
        <CountBadge value={formatCount(shown, locale)} label={factories.scope.shown} />
        <span>{fill(factories.scope.total, { total: formatCount(total, locale) })}</span>
      </p>
    </form>
  );
}
