"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }  // ERR-AUTH-001: deny with safe message
    router.push("/admin"); router.refresh();
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <form onSubmit={signIn} className="ax-surface ax-panel" style={{ padding: "var(--ax-space-600)", inlineSize: "min(420px, 92vw)", display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
        <div className="ax-shell__brand" style={{ padding: 0 }}>
          <span className="ax-shell__brand-mark">AX</span> MIM Inspection Platform
        </div>
        <div className="ax-field" style={{ maxInlineSize: "none" }}>
          <label className="ax-field__label" htmlFor="email">Email</label>
          <input id="email" className="ax-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
        </div>
        <div className="ax-field" style={{ maxInlineSize: "none" }}>
          <label className="ax-field__label" htmlFor="pw">Password</label>
          <input id="pw" className="ax-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <div className="ax-banner ax-banner--critical"><div>{error}</div></div>}
        <button className="ax-btn ax-btn--prominent" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="ax-caption">Access is role-scoped (RBAC-001..014). Every session action is audited (ENG-12).</p>
      </form>
    </main>
  );
}
