"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import type { ShellNavItem } from "@/features/shell/types";
import {
  shellGlobalSearchHref,
  type ShellGlobalSearchResultType,
} from "@/lib/shell-navigation";
import { localeHref } from "@/lib/locale-path";
import styles from "./shell-topbar.module.css";

type SearchResult = {
  id: string;
  type: ShellGlobalSearchResultType;
  label: string;
  detail: string;
  href: string;
};

const RESULT_ICON: Readonly<Record<ShellGlobalSearchResultType, IconName>> = {
  commercial_registration: "organisation",
  industrial_license: "forms",
  plant: "factory",
  factory: "factory",
  visit: "visits",
  inspection: "inspect",
};

type SearchStrings = Readonly<Record<"placeholder" | "results" | "empty" | "loading" | "failed" | "navigation", string>>;

export default function ShellSearch({ isFieldOnly, locale, navigationItems, strings }: {
  isFieldOnly: boolean;
  locale: "ar" | "en";
  navigationItems: readonly ShellNavItem[];
  strings: SearchStrings;
}) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly SearchResult[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      setState("idle");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState("loading");
      try {
        const response = await fetch(`/api/shell/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("shell_search_unavailable");
        const payload = await response.json() as { results?: SearchResult[] };
        setResults((payload.results ?? []).map(result => ({
          ...result,
          href: shellGlobalSearchHref(result, isFieldOnly),
        })));
        setState("ready");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setResults([]);
        setState("failed");
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isFieldOnly, query]);

  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const navigationMatches = normalizedQuery.length < 2
    ? []
    : navigationItems.filter(item => item.enabled && item.label.toLocaleLowerCase(locale).includes(normalizedQuery));
  const isExpanded = isOpen && query.trim().length >= 2;

  function dismiss(): void {
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div className={styles.search} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
    }}>
      <Icon name="search" size="sm" />
      <input
        className={styles.searchInput}
        type="search"
        role="combobox"
        value={query}
        aria-autocomplete="list"
        aria-expanded={isExpanded}
        aria-controls={listboxId}
        aria-label={strings.placeholder}
        placeholder={strings.placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={event => { setQuery(event.target.value); setIsOpen(true); }}
        onKeyDown={event => { if (event.key === "Escape") dismiss(); }}
      />
      {isExpanded ? (
        <div className={styles.searchResults} id={listboxId} role="listbox" aria-label={strings.results}>
          {navigationMatches.map(item => (
            <Link className={styles.searchResult} role="option" aria-selected="false"
              key={`nav-${item.id}`} href={localeHref(locale, item.href)} prefetch={false} data-next-spa="true" onClick={dismiss}>
              <Icon name={item.icon} size="sm" />
              <span><strong>{item.label}</strong><small>{strings.navigation}</small></span>
            </Link>
          ))}
          {results.map(result => (
            <Link className={styles.searchResult} role="option" aria-selected="false"
              key={`${result.type}-${result.id}`} href={localeHref(locale, result.href)} prefetch={false} data-next-spa="true" onClick={dismiss}>
              <Icon name={RESULT_ICON[result.type]} size="sm" />
              <span><strong>{result.label}</strong><small>{result.detail}</small></span>
            </Link>
          ))}
          {state === "loading" ? <p role="status">{strings.loading}</p> : null}
          {state === "failed" ? <p role="alert">{strings.failed}</p> : null}
          {state === "ready" && !results.length && !navigationMatches.length ? <p role="status">{strings.empty}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
