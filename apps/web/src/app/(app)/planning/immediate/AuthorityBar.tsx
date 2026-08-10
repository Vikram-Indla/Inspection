/* @retiring 2026-08-10 · replaced-by components/sections/planning-immediate/authority-bar · pending cd-023-immediate-authority-bar.spec.ts · delete-when 0-imports */
"use client";
// CD-023 (SCR-WEB-130, frames 3a/3g/3h/3i) — Minimum Viable Authority Bar.
// Nine protection chips derived ENTIRELY from ImmediateForm's existing
// validation state (no new policy objects). Chip states are glyph+text,
// never color alone (MVP1-FND-011): "satisfied" = evidence named, "blocking" =
// Enter jumps to the owning control, "truth" = an honest system statement that
// cannot be toggled (e.g. audit is always recorded; notification is always
// queued-not-delivered). This is never a progress meter or percentage — chips
// are independent, not sequential steps.
import { useEffect, useRef, useState } from "react";

export type ChipState = "satisfied" | "blocking" | "truth";
export type Chip = { id: string; label: string; state: ChipState; detail: string; controlId?: string };
export type AuthorityBarStrings = {
  groupLabel: string; satisfied: string; blocking: string; truth: string;
  allSatisfied: string; blockedAnnouncement: string;
};

const GLYPH: Record<ChipState, string> = { satisfied: "✓", blocking: "✕", truth: "◌" };

export default function AuthorityBar({ chips, strings }: { chips: Chip[]; strings: AuthorityBarStrings }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevBlocking = useRef<string>("");
  const [announce, setAnnounce] = useState("");

  // Roving tabindex stays valid as chip count/order is stable across renders.
  useEffect(() => { if (activeIdx >= chips.length) setActiveIdx(0); }, [chips.length, activeIdx]);

  // Assertive announcement ONLY when the set of blocking chips actually
  // changes (not on every keystroke) — e.g. filling in the urgency reason
  // clears REASON from the blocking set.
  useEffect(() => {
    const blockingIds = chips.filter(c => c.state === "blocking").map(c => c.id).join(",");
    if (blockingIds !== prevBlocking.current) {
      const blocked = chips.filter(c => c.state === "blocking");
      setAnnounce(blocked.length === 0
        ? strings.allSatisfied
        : blocked.map(c => strings.blockedAnnouncement.replace("{label}", c.label).replace("{detail}", c.detail)).join(". "));
      prevBlocking.current = blockingIds;
    }
  }, [chips, strings]);

  const focusChip = (idx: number) => { setActiveIdx(idx); btnRefs.current[idx]?.focus(); };
  const activate = (chip: Chip) => {
    if (!chip.controlId) return;
    const el = document.getElementById(chip.controlId);
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const n = chips.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); focusChip((idx + 1) % n); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); focusChip((idx - 1 + n) % n); }
    else if (e.key === "Home") { e.preventDefault(); focusChip(0); }
    else if (e.key === "End") { e.preventDefault(); focusChip(n - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(chips[idx]); }
  };

  const firstBlocking = chips.find(c => c.state === "blocking");

  return (
    <section className="panel" aria-label={strings.groupLabel}>
      <div className="panel-body stack">
      <div className="filter-bar" role="group" aria-label={strings.groupLabel}>
        {chips.map((chip, i) => (
          <button
            key={chip.id}
            type="button"
            ref={el => { btnRefs.current[i] = el; }}
            className={`filter-chip ${chip.state === "satisfied" ? "is-set" : ""}`}
            tabIndex={i === activeIdx ? 0 : -1}
            aria-label={`${chip.label} — ${chip.state === "satisfied" ? strings.satisfied : chip.state === "blocking" ? strings.blocking : strings.truth} — ${chip.detail}`}
            onFocus={() => setActiveIdx(i)}
            onClick={() => activate(chip)}
            onKeyDown={e => onKeyDown(e, i)}
          >
            <span aria-hidden="true">{GLYPH[chip.state]}</span>
            <bdi>{chip.label}</bdi>
            <span className="t-caption">{chip.detail}</span>
          </button>
        ))}
      </div>
      {/* Narrow-viewport companion (420px 9-dot strip): the currently-blocking
          chip's full text stays visible without requiring a tap on each dot. */}
      {firstBlocking && (
        <div className="alert alert-critical" role="status">
          <div><strong>{firstBlocking.label}</strong> — {firstBlocking.detail}</div>
        </div>
      )}
      <div className="sr-only" role="alert" aria-live="assertive">{announce}</div>
      </div>
    </section>
  );
}
