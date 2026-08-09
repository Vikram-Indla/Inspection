import { getServerUser, supabaseServer } from "@/lib/supabase-server";

export type DossierItem = { id: string; code: string | null };

export type DossierClause = {
  id: string;
  clause_ref: string | null;
  title: string | null;
  applicability: string | null;
  legal_source: string | null;
  inspection_items: DossierItem[] | null;
};

export type DossierAttachment = {
  id: string;
  file_name: string;
  storage_path: string;
  media_type: string | null;
};

export type DossierRow = {
  entity_id: string;
  code: string | null;
  title: string | null;
  issuing_authority: string | null;
  version_label: string | null;
  operational_status: string;
  release_date: string | null;
  deactivation_reason: string | null;
  clauses: DossierClause[] | null;
  clauses_status: "verified" | "verified_unknown";
  attachments: DossierAttachment[] | null;
  attachments_status: "verified" | "verified_unknown";
};

export type DossierAuditEvent = {
  id: number;
  actor: string | null;
  action: string;
  occurred_at: string;
};

export type RegulationDossierSource = {
  readonly regulation: DossierRow | null;
  readonly lineage: readonly DossierRow[];
  readonly attachmentUrls: Readonly<Record<string, string>>;
  readonly auditEvents: readonly DossierAuditEvent[];
  readonly auditFailed: boolean;
  readonly isWriter: boolean;
};

const WRITER_ROLES = ["admin", "compliance_admin", "form_admin"];
const SIGNED_URL_TTL_SECONDS = 600;

const COLUMNS =
  "entity_id,code,title,issuing_authority,version_label,operational_status,release_date,deactivation_reason,clauses,clauses_status,attachments,attachments_status";

/**
 * Everything the superseded dossier renders, in one read so the component stays
 * presentational until T-037 rebuilds it on SAQEEL primitives.
 */
export async function readRegulationDossier(detailId: string): Promise<RegulationDossierSource> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  const { data: roleRows } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[] };
  const roles = new Set((roleRows ?? []).map(row => row.role_key));
  const isWriter = WRITER_ROLES.some(role => roles.has(role));

  const { data } = await sb.from("compliance_regulation_library").select(COLUMNS).order("code");
  const rows = (data ?? []) as unknown as DossierRow[];
  const regulation = rows.find(row => row.entity_id === detailId) ?? null;
  if (!regulation) {
    return { regulation: null, lineage: [], attachmentUrls: {}, auditEvents: [], auditFailed: false, isWriter };
  }

  const attachments = Array.isArray(regulation.attachments) ? regulation.attachments : [];
  const signed = await Promise.all(attachments.map(async attachment => {
    const { data: url } = await sb.storage
      .from("regulation-documents")
      .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS);
    return [attachment.id, url?.signedUrl ?? ""] as const;
  }));

  const { data: auditData, error: auditError } = isWriter
    ? await sb.rpc("compliance_regulation_audit", { p_entity_id: regulation.entity_id })
    : { data: null, error: null };

  return {
    regulation,
    lineage: rows
      .filter(candidate => candidate.code === regulation.code)
      .sort((a, b) => (a.release_date ?? "").localeCompare(b.release_date ?? "")),
    attachmentUrls: Object.fromEntries(signed.filter(([, url]) => url)),
    auditEvents: Array.isArray(auditData) ? auditData as DossierAuditEvent[] : [],
    auditFailed: Boolean(auditError),
    isWriter,
  };
}
