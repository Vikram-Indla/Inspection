"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import Kbd from "@/components/saqeel/kbd/kbd";
import { Text } from "@/components/saqeel/type";
import type { ShellNavItem } from "@/features/shell/types";
import { formatCount } from "@/i18n/numbers";
import { localeHref } from "@/lib/locale-path";
import styles from "./shell-topbar.module.css";

type PaletteStrings = Readonly<Record<
  "open" | "title" | "search" | "empty" | "close" | "resultsOne" | "resultsOther",
  string
>>;

export default function ShellAdminPalette({ items, locale, strings }: {
  items: readonly ShellNavItem[];
  locale: "ar" | "en";
  strings: PaletteStrings;
}) {
  const dialogId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLocaleLowerCase() !== "k") return;
      event.preventDefault();
      setIsOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      setQuery("");
      trigger?.focus();
    };
  }, [isOpen]);

  const normalized = query.trim().toLocaleLowerCase(locale);
  const matches = normalized
    ? items.filter(item => item.label.toLocaleLowerCase(locale).includes(normalized))
    : items;

  return (
    <>
      <button className={styles.paletteTrigger} type="button" ref={triggerRef}
        aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={dialogId}
        onClick={() => setIsOpen(true)}>
        <Icon name="commandPalette" size="sm" />
        <Text as="span" role="label" tone="inherit">{strings.open}</Text>
        <Kbd keys="⌘K" />
      </button>

      {isOpen ? (
        <div className={styles.palette} id={dialogId}>
          <button className={styles.paletteScrim} type="button"
            aria-label={strings.close} onClick={() => setIsOpen(false)} />
          <div className={styles.paletteDialog} role="dialog" aria-modal="true" aria-label={strings.title}>
            <input
              className={styles.paletteInput}
              type="search"
              ref={inputRef}
              value={query}
              placeholder={strings.search}
              aria-label={strings.search}
              aria-describedby={`${dialogId}-count`}
              onChange={event => setQuery(event.target.value)}
            />
            <Text id={`${dialogId}-count`} live="status" tone="muted">
              {(matches.length === 1 ? strings.resultsOne : strings.resultsOther)
                .replace("{count}", formatCount(matches.length, locale))}
            </Text>
            <div className={styles.paletteResults} role="listbox" aria-label={strings.title}>
              {matches.map(item => (
                <Link className={styles.paletteResult} role="option" aria-selected="false"
                  key={item.id} href={localeHref(locale, item.href)} prefetch={false} data-next-spa="true"
                  onClick={() => setIsOpen(false)}>
                  <Icon name={item.icon} size="sm" />
                  <Text as="span" role="label" tone="inherit">{item.label}</Text>
                </Link>
              ))}
              {!matches.length ? <Text tone="muted">{strings.empty}</Text> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
