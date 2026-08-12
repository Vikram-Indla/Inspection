"use client";

import { useEffect, useState } from "react";
import Button from "@/components/saqeel/button/button";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import { Text } from "@/components/saqeel/type";
import Modal from "@/components/Modal";
import styles from "./saved-views-menu.module.css";

export type SavedViewsStrings = {
  label: string;
  saveCurrent: string;
  nameTitle: string;
  nameLabel: string;
  cancel: string;
  save: string;
  close: string;
  empty: string;
  deleteLabel: string;
};

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

export default function SavedViewsMenu({ strings }: { strings: SavedViewsStrings }) {
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => setViews(readViews()), []);

  const persist = (next: SavedView[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setViews(next);
  };
  const save = () => {
    if (!name.trim()) return;
    persist([...views, { id: crypto.randomUUID(), name: name.trim(), href: `${location.pathname}${location.search}` }]);
    setName("");
    setNaming(false);
  };

  return (
    <div className={styles.root}>
      <Button icon="savedViews" iconEnd="disclosure" expanded={open} onClick={() => setOpen(value => !value)}>
        {strings.label}
      </Button>
      {open ? (
        <section className={styles.menu} aria-label={strings.label}>
          <header className={styles.menuHead}>
            <Text as="strong" role="label">{strings.label}</Text>
            <Button size="sm" variant="tertiary" onClick={() => setNaming(true)}>{strings.saveCurrent}</Button>
          </header>
          {views.length ? views.map(view => (
            <div className={styles.row} key={view.id}>
              <a className={styles.rowLink} href={view.href}><Text as="span" tone="inherit">{view.name}</Text></a>
              <IconButton
                icon="dismiss"
                size="sm"
                label={strings.deleteLabel.replace("{name}", view.name)}
                onClick={() => persist(views.filter(entry => entry.id !== view.id))}
              />
            </div>
          )) : <div className={styles.empty}><Text tone="muted">{strings.empty}</Text></div>}
        </section>
      ) : null}
      <Modal
        open={naming}
        onClose={() => { setNaming(false); setName(""); }}
        titleId="planning-saved-view-title"
        title={strings.nameTitle}
        closeLabel={strings.close}
        footer={<>
          <Button onClick={() => { setNaming(false); setName(""); }}>{strings.cancel}</Button>
          <Button variant="primary" type="submit" disabled={!name.trim()} onClick={save}>{strings.save}</Button>
        </>}
      >
        <form id="planning-saved-view-form" onSubmit={event => { event.preventDefault(); save(); }}>
          <label className={styles.fieldLabel} htmlFor="planning-saved-view-name">
            <Text as="span" role="label" tone="secondary">{strings.nameLabel}</Text>
          </label>
          <input
            className={styles.input}
            id="planning-saved-view-name"
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
