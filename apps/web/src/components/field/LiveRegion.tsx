"use client";

// SCR-IPAD accessibility — reusable screen-reader announcer. Mirrors the latest
// transient status message (saves, queued-offline, sync failures, blockers) into
// a polite aria-live region so assistive tech announces changes that are
// otherwise only visual. Visually hidden — the visible message keeps rendering
// wherever the journey already places it; this only adds the spoken channel.
import { useEffect, useRef, useState } from "react";

const SR_ONLY: React.CSSProperties = {
  position: "absolute", inlineSize: 1, blockSize: 1, margin: -1, padding: 0,
  overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
};

export default function LiveRegion({ message, assertive = false }: { message: string | null; assertive?: boolean }) {
  const [text, setText] = useState("");
  // A zero-width toggle forces AT to re-announce an identical consecutive
  // message (e.g. two "Saved" in a row) instead of swallowing the duplicate.
  const toggle = useRef(false);
  useEffect(() => {
    if (message == null || message === "") { setText(""); return; }
    toggle.current = !toggle.current;
    setText(toggle.current ? message : message + "​");
  }, [message]);
  return (
    <div
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
      role="status"
      data-testid="field-live-region"
      style={SR_ONLY}
    >
      {text}
    </div>
  );
}
