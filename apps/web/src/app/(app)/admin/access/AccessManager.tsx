"use client";
// TASK-EXECUTION-MODULE-001 · Phase 2B — governed access management panel.
// security_admin only (the page gates rendering; the RPCs re-check). Shows a
// selected user's role grants with provenance, their effective capability set
// (role-derived vs direct grants, labelled — the effective-access explainer),
// and grant/revoke controls that call the four guarded RPCs via ./actions.
// Revokes and is_admin role grants require an explicit confirmation step.
import { useState, useTransition } from "react";
import { grantCapability, grantRole, revokeCapability, revokeRole, type AccessActionResult } from "./actions";

export type AccessUser = { userId: string; name: string; email: string | null };
export type RoleInfo = { roleKey: string; title: string; isAdmin: boolean };
export type CapabilityInfo = { capabilityKey: string; description: string };
export type RoleGrant = { roleKey: string; grantedBy: string | null; grantedAt: string };
export type CapabilityGrant = { capabilityKey: string; grantedBy: string | null; grantedAt: string };
export type EffectiveCapability = { capabilityKey: string; viaRoles: string[]; direct: boolean };
export type UserAccess = {
  userId: string;
  roles: RoleGrant[];
  directGrants: CapabilityGrant[];
  effective: EffectiveCapability[];
};

export type AccessManagerLabels = {
  panelTitle: string;
  panelIntro: string;
  selectUser: string;
  rolesTitle: string;
  grantedAt: string;
  grantRole: string;
  revoke: string;
  confirmRevokeRole: string;
  confirmGrantAdminRole: string;
  confirmRevokeCapability: string;
  confirm: string;
  cancel: string;
  capabilitiesTitle: string;
  capabilitiesHint: string;
  viaRole: string;
  directGrant: string;
  grantCapability: string;
  noCapabilities: string;
  selfTarget: string;
  effectNote: string;
  working: string;
  saved: string;
};

type PendingChange =
  | { kind: "revoke_role"; key: string }
  | { kind: "grant_admin_role"; key: string }
  | { kind: "revoke_capability"; key: string };

export default function AccessManager({
  users,
  roles,
  capabilities,
  access,
  currentUserId,
  labels,
}: {
  users: AccessUser[];
  roles: RoleInfo[];
  capabilities: CapabilityInfo[];
  access: UserAccess[];
  currentUserId: string;
  labels: AccessManagerLabels;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [confirming, setConfirming] = useState<PendingChange | null>(null);
  const [feedback, setFeedback] = useState<AccessActionResult>({});
  const [pending, startTransition] = useTransition();

  const selected = access.find(a => a.userId === selectedUserId) ?? null;
  const isSelf = selectedUserId !== "" && selectedUserId === currentUserId;

  const run = (action: (fd: FormData) => Promise<AccessActionResult>, fd: FormData) => {
    setConfirming(null);
    setFeedback({});
    startTransition(async () => {
      setFeedback(await action(fd));
    });
  };

  const fdFor = (field: "role_key" | "capability_key", key: string) => {
    const fd = new FormData();
    fd.set("user_id", selectedUserId);
    fd.set(field, key);
    return fd;
  };

  const requestRevokeRole = (roleKey: string) => setConfirming({ kind: "revoke_role", key: roleKey });
  const requestGrantRole = (roleKey: string) => {
    const role = roles.find(r => r.roleKey === roleKey);
    if (role?.isAdmin) setConfirming({ kind: "grant_admin_role", key: roleKey });
    else run(grantRole, fdFor("role_key", roleKey));
  };
  const confirmPending = () => {
    if (!confirming) return;
    if (confirming.kind === "revoke_role") run(revokeRole, fdFor("role_key", confirming.key));
    else if (confirming.kind === "grant_admin_role") run(grantRole, fdFor("role_key", confirming.key));
    else run(revokeCapability, fdFor("capability_key", confirming.key));
  };

  const heldRoles = new Set(selected?.roles.map(r => r.roleKey) ?? []);
  const heldGrants = new Set(selected?.directGrants.map(g => g.capabilityKey) ?? []);
  const grantableRoles = roles.filter(r => !heldRoles.has(r.roleKey));
  const grantableCapabilities = capabilities.filter(c => !heldGrants.has(c.capabilityKey));

  const confirmText = confirming?.kind === "revoke_role"
    ? labels.confirmRevokeRole.replace("{key}", confirming.key)
    : confirming?.kind === "grant_admin_role"
      ? labels.confirmGrantAdminRole.replace("{key}", confirming.key)
      : confirming?.kind === "revoke_capability"
        ? labels.confirmRevokeCapability.replace("{key}", confirming.key)
        : "";

  const disabled = pending || isSelf;

  return (
    <section className="ax-surface" style={{ padding: "var(--ax-space-400)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }} aria-labelledby="access-manager-h">
      <h3 id="access-manager-h" style={{ margin: 0 }}>{labels.panelTitle}</h3>
      <p className="ax-caption" style={{ margin: 0 }}>{labels.panelIntro}</p>

      <div className="ax-field" style={{ maxInlineSize: 420 }}>
        <label className="ax-field__label" htmlFor="access-user-select">{labels.selectUser}</label>
        <select
          className="ax-input"
          id="access-user-select"
          value={selectedUserId}
          onChange={e => { setSelectedUserId(e.target.value); setConfirming(null); setFeedback({}); }}
        >
          <option value="">—</option>
          {users.map(u => (
            <option key={u.userId} value={u.userId}>{u.name}{u.email ? ` · ${u.email}` : ""}</option>
          ))}
        </select>
      </div>

      {isSelf && (
        <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{labels.selfTarget}</strong></div></div>
      )}

      {selected && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
            <h4 style={{ margin: 0 }}>{labels.rolesTitle}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ax-space-150)", alignItems: "center" }}>
              {selected.roles.map(grant => {
                const role = roles.find(r => r.roleKey === grant.roleKey);
                return (
                  <span key={grant.roleKey} className={`ax-lozenge ${role?.isAdmin ? "ax-lozenge--warning" : "ax-lozenge--info"}`}>
                    {grant.roleKey}
                    <span className="ax-caption" style={{ marginInlineStart: 6 }}>
                      {labels.grantedAt} {new Date(grant.grantedAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      className="ax-btn"
                      style={{ marginInlineStart: 6, padding: "0 var(--ax-space-100)" }}
                      disabled={disabled}
                      onClick={() => requestRevokeRole(grant.roleKey)}
                    >{labels.revoke}</button>
                  </span>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "var(--ax-space-150)", alignItems: "center" }}>
              <select className="ax-input" id="access-role-grant-select" style={{ maxInlineSize: 280 }} disabled={disabled}>
                {grantableRoles.map(r => (
                  <option key={r.roleKey} value={r.roleKey}>{r.roleKey}{r.isAdmin ? " (admin)" : ""}</option>
                ))}
              </select>
              <button
                type="button"
                className="ax-btn ax-btn--prominent"
                disabled={disabled || grantableRoles.length === 0}
                onClick={() => {
                  const select = document.getElementById("access-role-grant-select") as HTMLSelectElement | null;
                  if (select?.value) requestGrantRole(select.value);
                }}
              >{labels.grantRole}</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
            <h4 style={{ margin: 0 }}>{labels.capabilitiesTitle}</h4>
            <p className="ax-caption" style={{ margin: 0 }}>{labels.capabilitiesHint}</p>
            {selected.effective.length === 0 ? (
              <p className="ax-caption" style={{ margin: 0 }}>{labels.noCapabilities}</p>
            ) : (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr>
                  <th scope="col">Capability</th>
                  <th scope="col">Source</th>
                  <th scope="col">Actions</th>
                </tr></thead>
                <tbody>
                  {selected.effective.map(cap => (
                    <tr key={cap.capabilityKey}>
                      <td><strong>{cap.capabilityKey}</strong></td>
                      <td>
                        {cap.viaRoles.map(role => (
                          <span key={role} className="ax-lozenge ax-lozenge--info" style={{ marginInlineEnd: 6 }}>
                            {labels.viaRole} {role}
                          </span>
                        ))}
                        {cap.direct && <span className="ax-lozenge ax-lozenge--warning">{labels.directGrant}</span>}
                      </td>
                      <td>
                        {cap.direct && (
                          <button
                            type="button"
                            className="ax-btn"
                            disabled={disabled}
                            onClick={() => setConfirming({ kind: "revoke_capability", key: cap.capabilityKey })}
                          >{labels.revoke}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
            <div style={{ display: "flex", gap: "var(--ax-space-150)", alignItems: "center" }}>
              <select className="ax-input" id="access-capability-grant-select" style={{ maxInlineSize: 360 }} disabled={disabled}>
                {grantableCapabilities.map(c => (
                  <option key={c.capabilityKey} value={c.capabilityKey}>{c.capabilityKey}</option>
                ))}
              </select>
              <button
                type="button"
                className="ax-btn ax-btn--prominent"
                disabled={disabled || grantableCapabilities.length === 0}
                onClick={() => {
                  const select = document.getElementById("access-capability-grant-select") as HTMLSelectElement | null;
                  if (select?.value) run(grantCapability, fdFor("capability_key", select.value));
                }}
              >{labels.grantCapability}</button>
            </div>
          </div>

          <p className="ax-caption" style={{ margin: 0 }}>{labels.effectNote}</p>
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

      {feedback.ok && !pending && <span className="ax-lozenge ax-lozenge--success">{labels.saved}</span>}
      {feedback.error && <p className="ax-caption" role="alert" style={{ color: "var(--ax-color-critical-strong)", margin: 0 }}>{feedback.error}</p>}
    </section>
  );
}
