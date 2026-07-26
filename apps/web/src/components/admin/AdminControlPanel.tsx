"use client";

import { useEffect, useMemo, useState } from "react";

export type AdminControlTool = {
  id: string;
  href: string;
  label: string;
};

export type AdminControlHub = {
  id: string;
  label: string;
  tools: AdminControlTool[];
};

type StoredPreferences = {
  favorites: string[];
  recents: string[];
};

type Props = {
  hubs: AdminControlHub[];
  locale: "en" | "ar";
  preferenceOwner: string;
  unavailableSources: number;
};

const MAX_PREFERENCES = 5;

function uniqueAuthorized(ids: unknown, authorized: Set<string>) {
  if (!Array.isArray(ids)) return [];
  return ids
    .filter((id): id is string => typeof id === "string" && authorized.has(id))
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, MAX_PREFERENCES);
}

export default function AdminControlPanel({
  hubs,
  locale,
  preferenceOwner,
  unavailableSources,
}: Props) {
  const ar = locale === "ar";
  const tools = useMemo(() => hubs.flatMap(hub => hub.tools), [hubs]);
  const toolById = useMemo(() => new Map(tools.map(tool => [tool.id, tool])), [tools]);
  const authorizedIds = useMemo(() => new Set(toolById.keys()), [toolById]);
  const storageKey = `saqeel.admin-control.preferences.v1.${preferenceOwner}`;
  const [preferences, setPreferences] = useState<StoredPreferences>({ favorites: [], recents: [] });
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
        setPreferences({
          favorites: uniqueAuthorized(parsed.favorites, authorizedIds),
          recents: uniqueAuthorized(parsed.recents, authorizedIds),
        });
      }
    } catch {
      // Preferences are optional. A corrupt or blocked device store stays empty.
    } finally {
      setLoaded(true);
    }
  }, [authorizedIds, storageKey]);

  function save(next: StoredPreferences) {
    setPreferences(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Navigation remains fully usable when device-local persistence is blocked.
    }
  }

  function toggleFavorite(id: string) {
    if (!authorizedIds.has(id)) return;
    const exists = preferences.favorites.includes(id);
    const favorites = exists
      ? preferences.favorites.filter(candidate => candidate !== id)
      : [id, ...preferences.favorites].slice(0, MAX_PREFERENCES);
    save({ ...preferences, favorites });
  }

  function recordRecent(id: string) {
    if (!authorizedIds.has(id)) return;
    save({
      ...preferences,
      recents: [id, ...preferences.recents.filter(candidate => candidate !== id)].slice(
        0,
        MAX_PREFERENCES,
      ),
    });
  }

  const favoriteTools = preferences.favorites.flatMap(id => {
    const tool = toolById.get(id);
    return tool ? [tool] : [];
  });
  const recentTools = preferences.recents.flatMap(id => {
    const tool = toolById.get(id);
    return tool ? [tool] : [];
  });

  const toolList = (items: AdminControlTool[], mode: "favorite" | "recent" | "all") => (
    <ul className="admin-tool-list">
      {items.map(tool => (
        <li key={`${mode}-${tool.id}`}>
          <a href={tool.href} onClick={() => recordRecent(tool.id)}>
            {tool.label}
          </a>
          {mode !== "recent" ? (
            <button
              type="button"
              className={`admin-favorite${preferences.favorites.includes(tool.id) ? " is-active" : ""}`}
              onClick={() => toggleFavorite(tool.id)}
              aria-label={
                preferences.favorites.includes(tool.id)
                  ? `${ar ? "إزالة من المفضلة" : "Remove from favorites"}: ${tool.label}`
                  : `${ar ? "إضافة إلى المفضلة" : "Add to favorites"}: ${tool.label}`
              }
              aria-pressed={preferences.favorites.includes(tool.id)}
              title={ar ? "المفضلة على هذا الجهاز" : "Favorite on this device"}
            >
              <span aria-hidden="true">{preferences.favorites.includes(tool.id) ? "★" : "☆"}</span>
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <section
      className="admin-control-panel"
      aria-labelledby="admin-control-panel-heading"
      data-saqeel-design="WA-DES-020"
    >
      <header className="admin-control-panel__intro">
        <div>
          <h3 id="admin-control-panel-heading">
            {ar ? "إعدادات المنصة" : "Platform configuration"}
          </h3>
          <p className="t-caption">
            {ar
              ? "سبعة محاور واضحة تعرض الأدوات المصرّح لك بها فقط."
              : "Seven focused hubs show only the tools you are authorized to use."}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-touch"
          aria-expanded={showAll}
          aria-controls="admin-authorized-tools"
          onClick={() => setShowAll(value => !value)}
        >
          {showAll
            ? ar ? "إخفاء جميع الأدوات" : "Hide all tools"
            : ar ? "عرض جميع الأدوات المصرّح بها" : "View all authorized tools"}
        </button>
      </header>

      <div className="admin-hub-grid">
        {hubs.map(hub => (
          <details
            className="panel admin-hub-summary"
            key={hub.id}
            data-control-card
            data-control-hub={hub.id}
          >
            <summary>
              <span>
                <strong>{hub.label}</strong>
                <small>
                  {ar
                    ? `${hub.tools.length.toLocaleString("ar-SA")} أدوات مصرّح بها`
                    : `${hub.tools.length.toLocaleString("en-US")} authorized ${hub.tools.length === 1 ? "tool" : "tools"}`}
                </small>
              </span>
              <span aria-hidden="true" className="admin-hub-summary__chevron">⌄</span>
            </summary>
            {hub.tools.length ? toolList(hub.tools, "all") : (
              <p className="t-caption admin-empty">
                {ar ? "لا توجد أدوات مصرّح بها في هذا المحور." : "No tools are authorized in this hub."}
              </p>
            )}
          </details>
        ))}
      </div>

      {showAll ? (
        <section id="admin-authorized-tools" className="panel admin-all-tools" aria-live="polite">
          <h4>{ar ? "جميع الأدوات المصرّح بها" : "All authorized tools"}</h4>
          {tools.length ? toolList(tools, "all") : (
            <p className="t-caption">{ar ? "لا توجد أدوات مصرّح بها." : "No tools are authorized."}</p>
          )}
        </section>
      ) : null}

      <div className="admin-personal-grid">
        <section className="panel admin-personal-card" aria-labelledby="admin-needs-attention">
          <h4 id="admin-needs-attention">{ar ? "يتطلب الانتباه" : "Needs attention"}</h4>
          {unavailableSources > 0 ? (
            <p className="t-caption" role="status">
              {ar
                ? `تعذّرت قراءة ${unavailableSources.toLocaleString("ar-SA")} من مصادر التهيئة. العدد غير معروف وليس صفراً.`
                : `${unavailableSources.toLocaleString("en-US")} configuration ${unavailableSources === 1 ? "source is" : "sources are"} unavailable. Counts are unknown, not zero.`}
            </p>
          ) : (
            <p className="t-caption">
              {ar
                ? "لم تكشف قراءات التهيئة الست عن مشكلة. هذا ليس حكماً على سلامة المنصة."
                : "The six configuration reads found no source issue. This is not a platform-health verdict."}
            </p>
          )}
        </section>

        <section className="panel admin-personal-card" aria-labelledby="admin-favorites">
          <h4 id="admin-favorites">{ar ? "المفضلة" : "Favorites"}</h4>
          <p className="admin-local-note">
            {ar ? "حتى ٥ عناصر محفوظة على هذا الجهاز فقط." : "Up to 5 items, saved on this device only."}
          </p>
          {!loaded || favoriteTools.length === 0 ? (
            <p className="t-caption admin-empty">
              {ar ? "لم تُضف أي أدوات إلى المفضلة على هذا الجهاز." : "No favorites have been saved on this device."}
            </p>
          ) : toolList(favoriteTools, "favorite")}
        </section>

        <section className="panel admin-personal-card" aria-labelledby="admin-recents">
          <h4 id="admin-recents">{ar ? "الأخيرة" : "Recent areas"}</h4>
          <p className="admin-local-note">
            {ar ? "حتى ٥ عناصر محفوظة على هذا الجهاز فقط." : "Up to 5 items, saved on this device only."}
          </p>
          {!loaded || recentTools.length === 0 ? (
            <p className="t-caption admin-empty">
              {ar ? "لم تُفتح أي أدوات من هذه الصفحة على هذا الجهاز." : "No tools have been opened from this page on this device."}
            </p>
          ) : toolList(recentTools, "recent")}
        </section>
      </div>
    </section>
  );
}
