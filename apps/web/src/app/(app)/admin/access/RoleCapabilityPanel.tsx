"use client";
// M9 / PLN-REQ-004 — role capability editor (role_permissions). security_admin
// surface (the page gates rendering on admin.access.manage; the server actions
// re-check and carry the self-escalation guards). Per-change honest feedback —
// never a blanket success. Revokes and admin.access.manage grants require an
// explicit confirmation step, same pattern as AccessManager.
import { useState, useTransition } from "react";
import { grantRoleCapability, revokeRoleCapability, type RoleCapabilityResult } from "./role-capability-actions";

export type RoleCapRole = { roleKey: string; title: string; isAdmin: boolean };
export type RoleCapPermission = { permissionKey: string; title: string; description: string };
export type RoleCapGrant = { roleKey: string; permissionKey: string; grantedAt: string };

export type RoleCapabilityLabels = {
  panelTitle: string;
  panelIntro: string;
  selectRole: string;
  grantedTitle: string;
  noGrants: string;
  revoke: string;
  grantCapability: string;
  confirmRevoke: string;      // "{role}" "{permission}"
  confirmGrantSod: string;    // "{role}" — admin.access.manage grant
  confirm: string;
  cancel: string;
  working: string;
  auditNote: string;
};

type Pending =
  | { kind: "revoke"; permissionKey: string }
  | { kind: "grant_sod"; permissionKey: string };

export default function RoleCapabilityPanel({ roles, permissions, grants, labels }: {
  roles: RoleCapRole[];
  permissions: RoleCapPermission[];
  grants: RoleCapGrant[];
  labels: RoleCapabilityLabels;
}) {
  const [roleKey, setRoleKey] = useState<string>("");
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [feedback, setFeedback] = useState<RoleCapabilityResult>({});
  const [pending, startTransition] = useTransition();

  const held = new Set(grants.filter(g => g.roleKey === roleKey).map(g => g.permissionKey));
  const grantable = permissions.filter(p => !held.has(p.permissionKey));

  const run = (action: (fd: FormData) => Promise<RoleCapabilityResult>, permissionKey: string) => {
    const fd = new FormData();
    fd.set("role_key", roleKey);
    fd.set("permission_key", permissionKey);
    setConfirming(null);
    setFeedback({});
    startTransition(async () => setFeedback(await action(fd)));
  };

  const requestGrant = (permissionKey: string) => {
    if (permissionKey === "admin.access.manage") setConfirming({ kind: "grant_sod", permissionKey });
    else run(grantRoleCapability, permissionKey);
  };
  const confirmPending = () => {
    if (!confirming) return;
    if (confirming.kind === "revoke") run(revokeRoleCapability, confirming.permissionKey);
    else run(grantRoleCapability, confirming.permissionKey);
  };

  const confirmText = confirming?.kind === "revoke"
    ? labels.confirmRevoke.replace("{role}", roleKey).replace("{permission}", confirming.permissionKey)
    : confirming?.kind === "grant_sod"
      ? labels.confirmGrantSod.replace("{role}", roleKey)
      : "";

  return (
    <section className="ax-surface" style={{ padding: "var(--ax-space-400)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }} aria-labelledby="role-cap-h">
      <h3 id="role-cap-h" style={{ margin: 0 }}>{labels.panelTitle}</h3>
      <p className="ax-caption" style={{ margin: 0 }}>{labels.panelIntro}</p>

      <div className="ax-field" style={{ maxInlineSize: 420 }}>
        <label className="ax-field__label" htmlFor="role-cap-role-select">{labels.selectRole}</label>
        <select className="ax-input" id="role-cap-role-select" value={roleKey}
          onChange={e => { setRoleKey(e.target.value); setConfirming(null); setFeedback({}); }}>
          <option value="">—</option>
          {roles.map(r => <option key={r.roleKey} value={r.roleKey}>{r.roleKey}{r.isAdmin ? " (admin)" : ""}</option>)}
        </select>
      </div>

      {roleKey && (
        <>
          <h4 style={{ margin: 0 }}>{labels.grantedTitle}</h4>
          {held.size === 0 ? (
            <p className="ax-caption" style={{ margin: 0 }}>{labels.noGrants}</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ax-space-150)", alignItems: "center" }}>
              {grants.filter(g => g.roleKey === roleKey).map(g => (
                <span key={g.permissionKey} className={`ax-lozenge ${g.permissionKey === "admin.access.manage" ? "ax-lozenge--warning" : "ax-lozenge--info"}`}>
                  {g.permissionKey}
                  <button type="button" className="ax-btn" style={{ marginInlineStart: 6, padding: "0 var(--ax-space-100)" }}
                    disabled={pending}
                    onClick={() => setConfirming({ kind: "revoke", permissionKey: g.permissionKey })}>{labels.revoke}</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "var(--ax-space-150)", alignItems: "center" }}>
            <select className="ax-input" id="role-cap-grant-select" style={{ maxInlineSize: 420 }} disabled={pending}>
              {grantable.map(p => <option key={p.permissionKey} value={p.permissionKey}>{p.permissionKey} — {p.title}</option>)}
            </select>
            <button type="button" className="ax-btn ax-btn--prominent" disabled={pending || grantable.length === 0}
              onClick={() => {
                const select = document.getElementById("role-cap-grant-select") as HTMLSelectElement | null;
                if (select?.value) requestGrant(select.value);
              }}>{labels.grantCapability}</button>
          </div>
          <p className="ax-caption" style={{ margin: 0 }}>{labels.auditNote}</p>
        </>
      )}

      {confirming && (
        <div className="ax-banner ax-banner--critical" role="alert" style={{ display: "flex", gap: "var(--ax-space-150)", alignItems: "center", justifyContent: "space-between" }}>
          <div><strong>{confirmText}</strong></div>
          <div style={{ display: "flex", gap: "var(--ax-space-100)" }}>
            <button type="button" className="ax-btn ax-btn--prominent" disabled={pending} onClick={confirmPending}>
              {pending ? labels.working : labels.confirm}
            </button>
            <button type="button" className="ax-btn" disabled={pending} onClick={() => setConfirming(null)}>{labels.cancel}</button>
          </div>
        </div>
      )}

      {feedback.ok && !pending && <div className="ax-banner ax-banner--success" role="status"><div>{feedback.ok}</div></div>}
      {feedback.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{feedback.error}</div></div>}
    </section>
  );
}
