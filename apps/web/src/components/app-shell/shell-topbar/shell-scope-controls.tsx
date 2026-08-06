"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/saqeel/icon/icon";
import type { ShellScope } from "@/features/shell/types";
import styles from "./shell-topbar.module.css";

type ScopeStrings = Readonly<Record<
  "dateScope" | "last30Days" | "from" | "to" | "apply" | "regionScope" | "allRegions" | "notApplicable",
  string
>>;

export default function ShellScopeControls({ scope, regions, initialFrom, initialTo, initialRegion, strings }: {
  scope: ShellScope;
  regions: readonly string[];
  initialFrom: string;
  initialTo: string;
  initialRegion: string;
  strings: ScopeStrings;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [region, setRegion] = useState(initialRegion);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFrom(params.get("from") ?? initialFrom);
    setTo(params.get("to") ?? initialTo);
    setRegion(params.get("region") ?? initialRegion);
  }, [initialFrom, initialRegion, initialTo]);

  function replaceScope(updates: Readonly<Record<string, string>>): void {
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }

  const regionEnabled = scope.region && regions.length > 0;

  return (
    <div className={styles.scope}>
      {scope.date ? (
        <details className={styles.scopeDate}>
          <summary aria-label={strings.dateScope} title={strings.dateScope}>
            <Icon name="dateScope" size="sm" />
            <span>{strings.last30Days}</span>
          </summary>
          <div className={styles.scopePanel}>
            <label>
              {strings.from}
              <input type="date" value={from} onChange={event => setFrom(event.target.value)} />
            </label>
            <label>
              {strings.to}
              <input type="date" value={to} onChange={event => setTo(event.target.value)} />
            </label>
            <button type="button" onClick={() => replaceScope({ from, to })}>{strings.apply}</button>
          </div>
        </details>
      ) : (
        <button className={styles.scopeDate} type="button" disabled
          title={strings.notApplicable} aria-label={`${strings.dateScope}: ${strings.notApplicable}`}>
          <Icon name="dateScope" size="sm" />
          <span>{strings.last30Days}</span>
        </button>
      )}

      <label className={styles.scopeRegion} data-disabled={regionEnabled ? undefined : ""}
        title={scope.region ? undefined : strings.notApplicable}>
        <span className="sqx-visually-hidden">{strings.regionScope}</span>
        <Icon name="regionScope" size="sm" />
        <select
          aria-label={strings.regionScope}
          value={region}
          disabled={!regionEnabled}
          onChange={event => { setRegion(event.target.value); replaceScope({ region: event.target.value }); }}
        >
          <option value="">{strings.allRegions}</option>
          {regions.map(name => <option value={name} key={name}>{name}</option>)}
        </select>
      </label>
    </div>
  );
}
