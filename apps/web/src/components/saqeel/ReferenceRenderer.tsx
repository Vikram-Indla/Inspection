"use client";

import { useState } from "react";
import { Button } from "./actions/Button";
import { Input } from "./inputs/Input";
import { Select } from "./inputs/Select";
import { StatusBadge } from "./data/StatusBadge";
import { StateSurface, type StateSurfaceKind } from "./feedback/StateSurface";

const DESIGN_HASHES = {
  system: "85da98476e91038a150b10ecb9b4e45a7f322564187de4f91d48d32e441f9921",
  states: "9e78eb7ced8d9b43096d2346a8925534feeecd30c748cc48f70a86a17f4b5d9a",
} as const;

export function ReferenceRenderer() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [state, setState] = useState<StateSurfaceKind>("empty");
  return (
    <main
      className="saqeel-reference"
      data-theme={theme}
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
      data-design-system-sha256={DESIGN_HASHES.system}
      data-states-system-sha256={DESIGN_HASHES.states}
    >
      <header className="saqeel-reference__header">
        <div>
          <h1>{locale === "ar" ? "مرجع نظام صقيل" : "SAQEEL foundation reference"}</h1>
          <p className="t-caption">{locale === "ar" ? "مرجع واجهة صقيل" : "SAQEEL interface reference"}</p>
        </div>
        <div className="row" aria-label="Reference controls">
          <div className="seg" aria-label="Theme">
            <button className="seg-opt" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</button>
            <button className="seg-opt" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
          </div>
          <div className="seg" aria-label="Direction">
            <button className="seg-opt" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN · LTR</button>
            <button className="seg-opt" aria-pressed={locale === "ar"} onClick={() => setLocale("ar")}>AR · RTL</button>
          </div>
        </div>
      </header>

      <div className="saqeel-reference__body">
        <section className="panel" aria-labelledby="f0-components-title">
          <div className="panel-header"><h2 id="f0-components-title" className="panel-title">{locale === "ar" ? "المكونات" : "Components"}</h2></div>
          <div className="panel-body stack">
            <div className="row">
              <Button variant="primary">{locale === "ar" ? "إجراء رئيسي" : "Primary action"}</Button>
              <Button>{locale === "ar" ? "إجراء ثانوي" : "Secondary action"}</Button>
              <Button variant="danger">{locale === "ar" ? "إجراء خطير" : "Danger action"}</Button>
            </div>
            <div className="row">
              <StatusBadge status="compliant" />
              <StatusBadge status="pending" />
              <StatusBadge status="critical" />
            </div>
            <div className="saqeel-reference__fields">
              <Input aria-label={locale === "ar" ? "بحث مرجعي" : "Reference search"} placeholder={locale === "ar" ? "بحث" : "Search"} />
              <Select
                aria-label={locale === "ar" ? "خيار مرجعي" : "Reference option"}
                defaultValue="one"
                options={[{ value: "one", label: locale === "ar" ? "الخيار الأول" : "Option one" }]}
              />
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="f0-states-title">
          <div className="panel-header">
            <h2 id="f0-states-title" className="panel-title">{locale === "ar" ? "حالات النظام" : "System states"}</h2>
            <Select
              aria-label="State"
              value={state}
              onChange={event => setState(event.target.value as StateSurfaceKind)}
              options={[
                { value: "empty", label: "Empty" }, { value: "loading", label: "Loading" },
                { value: "error", label: "Error" }, { value: "rls-denied", label: "RLS-denied" },
                { value: "not-yet", label: "Not-yet" }, { value: "provider-unavailable", label: "Provider unavailable" },
                { value: "degraded", label: "Degraded" }, { value: "offline", label: "Offline" }, { value: "stale", label: "Stale" },
                { value: "conflict", label: "Conflict" }, { value: "unauthorized", label: "Unauthorized" },
              ]}
            />
          </div>
          {state === "offline"
            ? <StateSurface kind="provider-unavailable" locale={locale} />
            : <StateSurface kind={state} locale={locale} seam={state === "not-yet" ? "FEATURE_*=off" : undefined} action={state === "error" ? <Button size="sm">{locale === "ar" ? "إعادة المحاولة" : "Try again"}</Button> : undefined} />}
        </section>
      </div>
    </main>
  );
}

export { DESIGN_HASHES as F0_REFERENCE_DESIGN_HASHES };
