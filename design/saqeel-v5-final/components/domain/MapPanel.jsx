import React from "react";
export function MapPanel({ pins = [], geofence, chrome, provider = "Provider abstracted (DEC-008)", height = 260, className = "" }) {
  return <div className={"ax-map " + className} style={{ minBlockSize: height }}>
    {geofence ? <span className="ax-geofence" style={{ insetInlineStart: geofence.x, insetBlockStart: geofence.y, inlineSize: geofence.r * 2, blockSize: geofence.r * 2, translate: "-50% -50%" }}></span> : null}
    {pins.map((p, i) => <span key={i} className={["ax-pin", p.kind && `ax-pin--${p.kind}`].filter(Boolean).join(" ")} style={{ insetInlineStart: p.x, insetBlockStart: p.y }}>
      <span className="ax-pin__dot"></span>{p.label ? <span className="ax-pin__label">{p.label}</span> : null}
    </span>)}
    {chrome ? <div className="ax-map__chrome">{chrome}</div> : null}
    <span className="ax-map__provider">{provider}</span>
  </div>;
}
