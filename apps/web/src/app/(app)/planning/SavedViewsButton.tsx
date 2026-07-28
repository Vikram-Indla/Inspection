"use client";

import { useEffect, useState } from "react";

type SavedView = { id: string; name: string; href: string };
const STORAGE_KEY = "saqeel:planning:saved-views";

const readViews = (): SavedView[] => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export default function SavedViewsButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => setViews(readViews()), []);

  const save = () => {
    const name = window.prompt("Name this planning view");
    if (!name?.trim()) return;
    const next = [...views, { id: crypto.randomUUID(), name: name.trim(), href: `${location.pathname}${location.search}` }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setViews(next);
  };
  const remove = (id: string) => {
    const next = views.filter(view => view.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setViews(next);
  };

  return (
    <div>
      <button className="btn btn-secondary" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>{label}</button>
      {open ? (
        <section className="panel" aria-label={label}>
          <header className="panel-header"><strong className="panel-title">{label}</strong><button className="btn btn-secondary btn-sm" type="button" onClick={save}>Save current view</button></header>
          <div className="panel-body">
          {views.length ? views.map(view => (
            <div key={view.id}><a className="btn btn-ghost" href={view.href}>{view.name}</a><button className="btn btn-ghost btn-icon btn-sm" type="button" aria-label={`Delete ${view.name}`} onClick={() => remove(view.id)}>×</button></div>
          )) : <p>No saved views on this device.</p>}
          </div>
        </section>
      ) : null}
    </div>
  );
}
