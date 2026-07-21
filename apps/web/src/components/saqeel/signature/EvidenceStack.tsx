"use client";
import React from "react";

export interface EvidenceStackItem {
  kind?: "photo" | "video" | "document" | "signature" | "comment";
  src?: string;
  caption?: string;
  time?: string;
  inspector?: string;
  /** LTR-embedded coordinate string */
  coords?: string;
  finding?: string;
  violation?: string;
  verification?: "verified" | "unverified" | "rejected";
  /** audit provenance line (device, hash, chain) */
  provenance?: string;
}

export interface EvidenceStackProps {
  items?: EvidenceStackItem[];
  variant?: "list" | "grid" | "compact" | "detailed";
  onOpen?: (item: EvidenceStackItem) => void;
}

/* SAQEEL signature: Evidence Stack — evidence + provenance as one object:
   media, capture time, coordinates, inspector, linked finding, verification. */
export function EvidenceStack({ items = [], variant = "list", onOpen }: EvidenceStackProps) {
  const ver = (v?: string) =>
    v === "verified" ? (
      <span className="exc exc-compliant">
        <i className="exc-mark" aria-hidden="true" />
        Verified
      </span>
    ) : v === "rejected" ? (
      <span className="exc exc-critical">
        <i className="exc-mark" aria-hidden="true" />
        Rejected
      </span>
    ) : (
      <span className="exc exc-pending">
        <i className="exc-mark" aria-hidden="true" />
        Unverified
      </span>
    );
  const thumb = (it: EvidenceStackItem, size: number) => (
    <span
      style={{
        width: size,
        aspectRatio: "4/3",
        flex: "none",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-sunken)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-muted)",
        overflow: "hidden",
      }}
    >
      {it.src ? (
        <img src={it.src} alt={it.caption || "Evidence"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          {it.kind === "document" ? (
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
          ) : it.kind === "signature" ? (
            <path d="M3 17c3-6 5 2 8-4s4 2 7-2M3 21h18" />
          ) : it.kind === "video" ? (
            <>
              <rect x="2" y="5" width="14" height="14" rx="1" />
              <path d="m16 10 6-3v10l-6-3" />
            </>
          ) : (
            <>
              <rect x="3" y="5" width="18" height="14" rx="1" />
              <circle cx="12" cy="12" r="3.5" />
            </>
          )}
        </svg>
      )}
    </span>
  );
  if (variant === "grid" || variant === "compact") {
    const w = variant === "compact" ? 84 : 128;
    return (
      <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-2)", alignItems: "flex-start" }}>
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => onOpen && onOpen(it)}
            style={{ border: 0, background: "none", padding: 0, cursor: "pointer", width: w, textAlign: "start", font: "inherit" }}
          >
            {thumb(it, w)}
            {variant !== "compact" && (
              <span className="t-caption" style={{ display: "block", marginBlockStart: 3 }}>
                {it.caption}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 0 }}>
      {items.map((it, i) => (
        <div
          key={i}
          className="row"
          style={{ alignItems: "flex-start", gap: "var(--space-3)", paddingBlock: "var(--space-3)", borderBlockEnd: "1px solid var(--border-subtle)" }}
        >
          {thumb(it, variant === "detailed" ? 120 : 72)}
          <div className="stack grow" style={{ gap: 2 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500, fontSize: "var(--type-compact-size)" }}>{it.caption || "Evidence item"}</span>
              {ver(it.verification)}
            </div>
            <span className="t-caption">{[it.time, it.inspector].filter(Boolean).join(" · ")}</span>
            {it.coords && (
              <span className="id-code" style={{ fontSize: 11 }}>
                {it.coords}
              </span>
            )}
            {(it.finding || it.violation) && (
              <span className="t-caption">
                Linked:{" "}
                <span className="id-code" style={{ fontSize: 11 }}>
                  {it.finding || it.violation}
                </span>
              </span>
            )}
            {variant === "detailed" && it.provenance && (
              <span className="t-caption" style={{ color: "var(--text-disabled)" }}>
                {it.provenance}
              </span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onOpen && onOpen(it)}>
            {it.kind === "document" ? "Preview" : "View"}
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="empty" style={{ padding: "var(--space-5)" }}>
          <div className="empty-title">No evidence attached</div>
        </div>
      )}
    </div>
  );
}
