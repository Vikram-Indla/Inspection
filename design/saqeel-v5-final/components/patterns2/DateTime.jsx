import React from "react";

const RIYADH = "Asia/Riyadh";
const DAY_MS = 86_400_000;

function formatter(locale, options) {
  return new Intl.DateTimeFormat(locale || "en-GB", {
    timeZone: RIYADH,
    calendar: "gregory",
    ...options,
  });
}

function riyadhDateSerial(value) {
  const parts = formatter("en-GB-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day));
}

function defaultLabels(locale) {
  const arabic = String(locale || "").toLowerCase().startsWith("ar");
  return arabic
    ? {
        zone: "الرياض",
        overdue: days => `متأخر ${days} يوم`,
        today: "مستحق اليوم",
        inDays: days => `مستحق خلال ${days} يوم`,
      }
    : {
        zone: "Riyadh",
        overdue: days => `${days} days overdue`,
        today: "due today",
        inDays: days => `due in ${days} days`,
      };
}

export function DateTime({
  value,
  mode = "date",
  locale = "en-GB",
  showZone,
  now = Date.now(),
  labels,
  className = "",
}) {
  if (!value) return <span className={className}>—</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className={className}>—</span>;

  const copy = { ...defaultLabels(locale), ...labels };
  const includeTime = mode === "datetime";
  const text = formatter(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }).format(date);

  let relative = null;
  if (mode === "due") {
    const days = Math.round((riyadhDateSerial(date) - riyadhDateSerial(now)) / DAY_MS);
    relative = days < 0 ? copy.overdue(Math.abs(days)) : days === 0 ? copy.today : copy.inDays(days);
  }

  return (
    <span className={`ax-numeric ${className}`}>
      <bdi>{text}</bdi>
      {(showZone || includeTime) ? ` (${copy.zone})` : ""}
      {relative ? <> · <span>{relative}</span></> : null}
    </span>
  );
}
