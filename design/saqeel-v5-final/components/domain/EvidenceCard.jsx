import React from "react";
import { Icon } from "../icons/Icon.jsx";

export function EvidenceCard({
  icon,
  kind = "image",
  state,
  linked,
  meta = [],
  className = "",
}) {
  const visual = icon ?? <Icon name={kind === "video" ? "video" : "image"} size={28} />;
  return (
    <figure
      className={[
        "ax-evidence",
        state === "unsynced" && "is-unsynced",
        state === "quarantined" && "is-quarantined",
        className,
      ].filter(Boolean).join(" ")}
      style={{ margin: 0 }}
    >
      <div className="ax-evidence__thumb">
        <span aria-hidden="true">{visual}</span>
        {linked ? <span className="ax-evidence__link ax-chip ax-chip--info-tone">{linked}</span> : null}
      </div>
      <figcaption className="ax-evidence__meta">
        {meta.map((line, index) => <span key={index}>{line}</span>)}
      </figcaption>
    </figure>
  );
}
