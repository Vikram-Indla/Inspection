"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type P = { id: string; display_name: string; role: string; joined_at: string | null; verified_at: string | null };
type S = { id: string; state: string; visit_id: string; visits: { package_versions: { id: string }; inspections: { id: string; status: string }[] }; virtual_participants: P[] };

export default function Room({ session }: { session: S }) {
  const router = useRouter();
  const [parts, setParts] = useState<P[]>(session.virtual_participants);
  const [otpInfo, setOtpInfo] = useState<Record<string, { dev_code?: string; msg: string }>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const sb = supabaseBrowser();

  async function requestOtp(p: P) {
    setBusy(true);
    const { data } = await sb.rpc("vp_request_otp", { p_participant: p.id });
    setBusy(false);
    const d = data as { status: string; dev_code?: string; retry_after_s?: number; resends_left?: number };
    setOtpInfo(o => ({ ...o, [p.id]: { dev_code: d.dev_code, msg: d.status === "sent" ? `sent · DEV provider shows code (release: Unifonic) · ${d.resends_left} resends left` : d.status === "cooldown" ? `cooldown — retry in ${d.retry_after_s}s (DEC-007)` : d.status } }));
  }
  async function verify(p: P) {
    setBusy(true);
    const { data } = await sb.rpc("vp_verify_otp", { p_participant: p.id, p_code: codes[p.id] ?? "" });
    setBusy(false);
    const d = data as { status: string; attempts_left?: number };
    if (d.status === "verified") {
      setParts(ps => ps.map(x => x.id === p.id ? { ...x, verified_at: new Date().toISOString() } : x));
      await sb.from("virtual_sessions").update({ state: "verified" }).eq("id", session.id);
      setOtpInfo(o => ({ ...o, [p.id]: { msg: "verified ✓ — bound to session (STM-VIR-002)" } }));
    } else {
      setOtpInfo(o => ({ ...o, [p.id]: { ...o[p.id], msg: d.status === "wrong" ? `wrong — ${d.attempts_left} attempts left, then lock (no bypass)` : d.status } }));
    }
  }
  async function begin() {
    setBusy(true);
    const existing = session.visits.inspections[0];
    if (existing) { router.push(`/field/inspection/${existing.id}`); return; }
    const { data, error } = await sb.from("inspections").insert({
      visit_id: session.visit_id, status: "in_progress", package_version_id: session.visits.package_versions.id, started_at: new Date().toISOString(),
    }).select().single();
    setBusy(false);
    if (error || !data) return;
    await sb.from("virtual_sessions").update({ state: "in_progress" }).eq("id", session.id);
    router.push(`/field/inspection/${data.id}`);  // same workspace + submission flow as physical (contract handoff)
  }
  const allVerified = parts.filter(p => p.role === "factory_rep").every(p => p.verified_at);
  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", minBlockSize: 180, background: "var(--ax-color-text)", borderRadius: "var(--ax-radius-large)", display: "grid", placeItems: "center", color: "var(--ax-color-inverse-text)" }}>
        <p className="ax-caption" style={{ color: "inherit", opacity: .7 }}>secure session room — video provider adapter (release integration); capture controls overlay here</p>
      </div>
      {parts.map(p => (
        <div key={p.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <strong>{p.display_name} · {p.role.replace(/_/g, " ")}</strong>
            {p.verified_at ? <span className="ax-lozenge ax-lozenge--success">verified</span> : <span className="ax-lozenge ax-lozenge--virtual ax-lozenge--info">joined — awaiting verification</span>}
          </div>
          {!p.verified_at && (
            <div className="ax-row" style={{ alignItems: "flex-end" }}>
              <button className="ax-btn ax-btn--secondary" onClick={() => requestOtp(p)} disabled={busy}>Send OTP</button>
              {otpInfo[p.id]?.dev_code && <span className="ax-lozenge ax-lozenge--warning">DEV code: {otpInfo[p.id].dev_code}</span>}
              <div className="ax-field" style={{ maxInlineSize: 160 }}><label className="ax-field__label">Code</label>
                <input className="ax-input ax-numeric" value={codes[p.id] ?? ""} onChange={e => setCodes(c => ({ ...c, [p.id]: e.target.value }))} maxLength={6} /></div>
              <button className="ax-btn" onClick={() => verify(p)} disabled={busy}>Verify</button>
            </div>
          )}
          {otpInfo[p.id]?.msg && <p className="ax-caption">{otpInfo[p.id].msg}</p>}
        </div>
      ))}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent ax-btn--field" onClick={begin} disabled={!allVerified || busy}>
          {allVerified ? "Begin remote inspection → same workspace & submission flow" : "Verification gates execution (no bypass)"}
        </button>
      </div>
    </div>
  );
}
