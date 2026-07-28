"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

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

export default function SavedViewsButton({ label, strings }: {
  label: string;
  strings: {
    saveCurrent: string;
    nameTitle: string;
    nameLabel: string;
    cancel: string;
    save: string;
    close: string;
    empty: string;
    deleteLabel: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => setViews(readViews()), []);

  const save = () => {
    if (!name.trim()) return;
    const next = [...views, { id: crypto.randomUUID(), name: name.trim(), href: `${location.pathname}${location.search}` }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setViews(next);
    setName("");
    setNaming(false);
  };
  const remove = (id: string) => {
    const next = views.filter(view => view.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setViews(next);
  };

  return (
    <div className="sq-saved-views">
      <button className="sq-btn sq-btn--secondary" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>{label}</button>
      {open ? (
        <section className="sq-saved-views__menu" aria-label={label}>
          <header><strong>{label}</strong><button type="button" onClick={() => setNaming(true)}>{strings.saveCurrent}</button></header>
          {views.length ? views.map(view => (
            <div key={view.id}><a href={view.href}>{view.name}</a><button type="button" aria-label={strings.deleteLabel.replace("{name}", view.name)} onClick={() => remove(view.id)}>×</button></div>
          )) : <p>{strings.empty}</p>}
        </section>
      ) : null}
      <Modal
        open={naming}
        onClose={() => { setNaming(false); setName(""); }}
        titleId="planning-saved-view-title"
        title={strings.nameTitle}
        closeLabel={strings.close}
        footer={<>
          <button className="sq-btn sq-btn--secondary" type="button" onClick={() => { setNaming(false); setName(""); }}>{strings.cancel}</button>
          <button className="sq-btn" type="submit" form="planning-saved-view-form" disabled={!name.trim()}>{strings.save}</button>
        </>}
      >
        <form id="planning-saved-view-form" onSubmit={event => { event.preventDefault(); save(); }}>
          <div className="sq-field">
            <label className="sq-field__label" htmlFor="planning-saved-view-name">{strings.nameLabel}</label>
            <input className="sq-input" id="planning-saved-view-name" value={name} onChange={event => setName(event.target.value)} autoFocus />
          </div>
        </form>
      </Modal>
    </div>
  );
}
