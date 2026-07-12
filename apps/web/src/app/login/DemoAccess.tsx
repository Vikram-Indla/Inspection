"use client";
// Demo-access helper — the platform has no public "admin vs web" toggle (role
// is decided server-side after sign-in), so for evaluation this lists the
// seeded demo identities and which console each one lands on. One click fills
// the form. DEMO ONLY: these are non-production seed credentials; hidden the
// moment real accounts exist. Never render real user credentials here.
import { useState } from "react";

export type DemoAccount = { label: string; dest: string; email: string; password: string };
export type DemoStrings = { title: string; hint: string };

export default function DemoAccess({ accounts, strings: s, onPick }: {
  accounts: DemoAccount[];
  strings: DemoStrings;
  onPick: (email: string, password: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg-demo">
      <button type="button" className="lg-demo__toggle" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {s.title}
        <span className={open ? "lg-demo__chev lg-demo__chev--open" : "lg-demo__chev"} aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="lg-demo__body">
          <p className="lg-demo__hint">{s.hint}</p>
          <ul className="lg-demo__list">
            {accounts.map(a => (
              <li key={a.email}>
                <button type="button" className="lg-demo__item" onClick={() => onPick(a.email, a.password)}>
                  <span className="lg-demo__role">{a.label}</span>
                  <span className="lg-demo__dest">{a.dest}</span>
                  <span className="lg-demo__email">{a.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
