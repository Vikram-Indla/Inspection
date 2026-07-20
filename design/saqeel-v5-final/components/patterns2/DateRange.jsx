import React from "react";
import { DateTime } from "./DateTime.jsx";

export function DateRange({
  from,
  to,
  mode = "datetime",
  locale = "en-GB",
  labels,
  className = "",
}) {
  const arabic = String(locale).toLowerCase().startsWith("ar");
  const copy = labels ?? (arabic ? { from: "من", to: "إلى" } : { from: "From", to: "To" });
  return (
    <span className={className}>
      {copy.from} <DateTime value={from} mode={mode} locale={locale} showZone={false} />{" "}
      {copy.to} <DateTime value={to} mode={mode} locale={locale} />
    </span>
  );
}
