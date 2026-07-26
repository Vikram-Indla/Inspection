"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./search.module.css";

const STORAGE_KEY = "saqeel-field-search-recents";
const MAX_RECENTS = 3;

function readRecents(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, MAX_RECENTS)
      : [];
  } catch {
    return [];
  }
}

export default function SearchRecents({
  query,
  recentLabel,
  emptyLabel,
}: {
  query: string;
  recentLabel: string;
  emptyLabel: string;
}) {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    const stored = readRecents();
    if (!query) {
      setRecents(stored);
      return;
    }

    const next = [query, ...stored.filter(item => item.toLocaleLowerCase() !== query.toLocaleLowerCase())].slice(0, MAX_RECENTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Search remains fully usable when storage is unavailable.
    }
  }, [query]);

  if (query) return null;

  return (
    <section aria-labelledby="field-search-recents">
      <div id="field-search-recents" className={`t-label ${styles.recentLabel}`}>{recentLabel}</div>
      {recents.length === 0 ? (
        <div className={styles.recentEmpty} role="status">{emptyLabel}</div>
      ) : recents.map(item => (
        <Link
          key={item}
          href={`/field/search?q=${encodeURIComponent(item)}`}
          prefetch={false}
          className={styles.row}
        >
          <span className={`${styles.icn} ${styles.recentIconBox}`}>
            <svg className={styles.recentIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <span className={styles.recentText}><bdi>{item}</bdi></span>
        </Link>
      ))}
    </section>
  );
}
