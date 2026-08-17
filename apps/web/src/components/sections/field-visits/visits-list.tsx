"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import {
  isVisitPriority,
  visitSegment,
  visitSegmentCounts,
  type VisitPriority,
  type VisitSegment,
} from "@/app/(app)/field/my-tasks/assignment-task-model";
import { visitCta, type VisitEnumCopy, type VisitsCopy } from "@/features/field-visits/labels";
import type { FieldVisit } from "@/features/field-visits/rows";
import VisitCard from "./visit-card";
import styles from "./visits.module.css";

const SEGMENTS: readonly VisitSegment[] = ["today", "upcoming", "completed"];
const RISKS: readonly (VisitPriority | "all")[] = ["all", "high", "medium", "low"];
const PAGE = 25;
const EARTH_KM = 6371;

type Position = { lat: number; lng: number } | null;

function distanceKm(from: Position, factory: { officialLat: number | null; officialLng: number | null }): number | null {
  if (!from || factory.officialLat === null || factory.officialLng === null) return null;
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(factory.officialLat - from.lat);
  const dLng = rad(factory.officialLng - from.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(from.lat)) * Math.cos(rad(factory.officialLat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function VisitsList({ visits, locale, now, copy, enums }: {
  visits: readonly FieldVisit[];
  locale: "en" | "ar";
  now: number;
  copy: VisitsCopy;
  enums: VisitEnumCopy;
}) {
  const [segment, setSegment] = useState<VisitSegment>("today");
  const [risk, setRisk] = useState<VisitPriority | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const [position, setPosition] = useState<Position>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setPosition(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }, []);

  const editable = [...visits];
  const counts = visitSegmentCounts(editable, now);
  const segmentVisits = useMemo(
    () => editable.filter(visit => visitSegment(visit, now) === segment),
    [editable, now, segment],
  );

  const riskCounts = { all: segmentVisits.length, high: 0, medium: 0, low: 0 };
  for (const visit of segmentVisits) if (isVisitPriority(visit.priority)) riskCounts[visit.priority]++;

  const shown = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return segmentVisits
      .filter(visit => risk === "all" || visit.priority === risk)
      .filter(visit => !needle || [
        visit.visitReference, visit.factory.name, visit.factory.code, visit.factory.crNumber, visit.factory.licenseNumber,
      ].some(field => field?.toLocaleLowerCase(locale).includes(needle)))
      .sort((a, b) => sort === "asc"
        ? a.windowStart.localeCompare(b.windowStart)
        : b.windowStart.localeCompare(a.windowStart));
  }, [segmentVisits, risk, query, locale, sort]);

  useEffect(() => setVisibleCount(PAGE), [segment, risk, query, sort]);

  const timeOf = (iso: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-SA", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
  const distanceOf = (visit: FieldVisit) => {
    const km = distanceKm(position, visit.factory);
    return km === null ? null : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(km)} ${copy.km}`;
  };

  return (
    <div className={styles.list}>
      <div className={styles.segments} role="group" aria-label={copy.segments.aria}>
        {SEGMENTS.map(key => (
          <Button
            key={key}
            variant={segment === key ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSegment(key)}
          >
            {`${copy.segments[key]} · ${counts[key]}`}
          </Button>
        ))}
      </div>

      <div className={styles.controls}>
        <span className={styles.searchField}>
          <TextInput
            type="search"
            value={query}
            onChange={setQuery}
            label={copy.search.label}
            placeholder={copy.search.label}
          />
        </span>
        <div className={styles.segments} role="group" aria-label={copy.search.sortLabel}>
          <Button variant={sort === "asc" ? "primary" : "secondary"} size="sm" onClick={() => setSort("asc")}>{copy.search.soonest}</Button>
          <Button variant={sort === "desc" ? "primary" : "secondary"} size="sm" onClick={() => setSort("desc")}>{copy.search.latest}</Button>
        </div>
      </div>

      <div className={styles.chips} role="group" aria-label={copy.risk.aria}>
        {RISKS.map(key => (
          <Button key={key} variant={risk === key ? "primary" : "secondary"} size="sm" onClick={() => setRisk(key)}>
            {`${copy.risk[key]} · ${riskCounts[key]}`}
          </Button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={styles.empty} role="status">
          <Text role="bodyStrong">{copy.empty.heading}</Text>
          <Text tone="secondary">{copy.empty.body}</Text>
        </div>
      ) : (
        <div className={styles.cards}>
          {shown.slice(0, visibleCount).map(visit => (
            <VisitCard
              key={visit.id}
              visit={visit}
              time={timeOf(visit.windowStart)}
              distance={distanceOf(visit)}
              cta={visitCta(visit, copy)}
              copy={copy}
              enums={enums}
            />
          ))}
          {shown.length > visibleCount ? (
            <Button variant="secondary" onClick={() => setVisibleCount(count => count + PAGE)}>
              {copy.loadMore}
            </Button>
          ) : null}
        </div>
      )}

      <div className={styles.footnote}>
        <Icon name="info" size="sm" />
        <Text role="label" tone="muted" as="span">{copy.twoStates}</Text>
      </div>
    </div>
  );
}
