"use client";
import { useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "./actions";

// TASK-MVP2-M2-02 notification delivery, push channel.
// The permission prompt fires only on this explicit user tap (browsers require
// a user gesture; auto-prompting on load is both blocked and hostile UX).
// NEXT_PUBLIC_VAPID_PUBLIC_KEY is a PUBLIC key by design (RFC 8292) — safe to
// ship to the browser, the private key never leaves the server.

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushOptIn({ strings: s }: { strings: { enable: string; enabling: string; enabled: string; unsupported: string; denied: string } }) {
  const [state, setState] = useState<"idle" | "working" | "on" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function enable() {
    setState("working"); setMsg(null);
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("error"); setMsg(s.unsupported); return;
    }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) { setState("error"); setMsg("Push is not configured for this environment."); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("error"); setMsg(s.denied); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("incomplete subscription");
      const res = await subscribeToPush({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
      if (res.error) { setState("error"); setMsg(res.error); return; }
      setState("on"); setMsg(s.enabled);
    } catch {
      setState("error"); setMsg(s.unsupported);
    }
  }

  return (
    <div className="row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
      <button className="btn btn-primary btn-touch" onClick={enable} disabled={state === "working" || state === "on"}>
        {state === "working" ? s.enabling : state === "on" ? s.enabled : s.enable}
      </button>
      {msg && <span className="t-caption" role={state === "error" ? "alert" : "status"} style={state === "error" ? { color: "var(--ax-color-critical)" } : undefined}>{msg}</span>}
    </div>
  );
}

export { unsubscribeFromPush };
