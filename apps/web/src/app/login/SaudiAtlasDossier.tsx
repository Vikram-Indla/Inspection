"use client";
// CD-001 V7 Atlas — dossier (Layer 4). One at a time, hover/focus opens it and
// click/tap locks it (role=dialog when locked, with a close control that
// returns focus to the marker). Layout variant is driven purely by CSS from the frame size:
// floating card (desktop) → side panel (landscape) → bottom sheet (portrait).
import { useEffect, useRef } from "react";
import type { AtlasNode } from "./saudi-atlas-locations";
import { haloToken } from "./saudi-atlas-locations";

export type DossierStrings = {
  industry: string; // field label
  state: string;    // field label
  close: string;    // close button aria-label
  mapLabel: string; // accessible name for the hotspot layer
};

export default function SaudiAtlasDossier({ node, locked, locale, strings: t, onClose, placement = "right" }: {
  node: AtlasNode | null;
  locked: boolean;
  locale: "ar" | "en";
  strings: DossierStrings;
  onClose: () => void;
  placement?: "left" | "right";
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // When it locks, move focus to the close control so Esc/Tab are captured.
  useEffect(() => { if (locked) closeRef.current?.focus(); }, [locked, node?.id]);

  if (!node) return null;
  const tone = `var(${haloToken(node.halo)})`;

  return (
    <div
      className={`lg-atlas3d__dossier lg-atlas3d__dossier--${placement}${locked ? " lg-atlas3d__dossier--locked" : ""}`}
      role={locked ? "dialog" : "group"}
      aria-modal={undefined}
      aria-label={`${node.name[locale]} — ${node.industry[locale]}`}
      onKeyDown={e => { if (e.key === "Escape" && locked) { e.stopPropagation(); onClose(); } }}
    >
      <div className="lg-atlas3d__dossier-head">
        <span className="lg-atlas3d__dossier-dot" style={{ background: tone }} aria-hidden="true" />
        <span className="lg-atlas3d__dossier-name">{node.name[locale]}</span>
        {locked && (
          <button ref={closeRef} type="button" className="lg-atlas3d__dossier-close"
            aria-label={t.close} onClick={onClose}>✕</button>
        )}
      </div>
      <dl className="lg-atlas3d__dossier-body">
        <div className="lg-atlas3d__dossier-row">
          <dt>{t.industry}</dt><dd>{node.industry[locale]}</dd>
        </div>
        <div className="lg-atlas3d__dossier-row">
          <dt>{t.state}</dt>
          <dd><span className="lg-atlas3d__dossier-state" style={{ color: tone }}>{node.sampleState[locale]}</span></dd>
        </div>
      </dl>
    </div>
  );
}
