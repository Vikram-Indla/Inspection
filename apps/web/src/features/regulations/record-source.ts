import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { readSingle } from "@/lib/postgrest/read";
import { recordRegulationRow } from "./shapes";

export type RecordItem = { id: string; code: string };

export type RecordClause = {
  id: string;
  clause_ref: string | null;
  title: string | null;
  applicability: string | null;
  legal_source: string | null;
  inspection_items: RecordItem[] | null;
};

export type RecordAttachment = {
  id: string;
  file_name: string;
  storage_path: string;
  media_type: string | null;
  sha256: string | null;
  signedUrl: string | null;
};

export type RecordRegulation = {
  entity_id: string;
  code: string | null;
  title: string | null;
  issuing_authority: string | null;
  version_label: string | null;
  operational_status: string;
  release_date: string | null;
  deactivation_reason: string | null;
  clauses_status: "verified" | "verified_unknown";
  attachments_status: "verified" | "verified_unknown";
};

export type RegulationRecord = {
  readonly regulation: RecordRegulation | null;
  readonly clauses: readonly RecordClause[];
  readonly clausesUnknown: boolean;
  readonly attachments: readonly RecordAttachment[];
  readonly attachmentsUnknown: boolean;
  readonly isWriter: boolean;
};

type RawRecord = RecordRegulation & {
  clauses: RecordClause[] | null;
  attachments: Omit<RecordAttachment, "signedUrl">[] | null;
};

const WRITER_ROLES = ["admin", "compliance_admin", "form_admin"];
const SIGNED_URL_TTL_SECONDS = 600;

const COLUMNS =
  "entity_id,code,title,issuing_authority,version_label,operational_status,release_date,deactivation_reason,clauses,clauses_status,attachments,attachments_status";

/**
 * The full governed record for one regulation.
 *
 * Attachment links are short-lived signed URLs minted per request; a file whose
 * URL could not be minted still lists, without a link, rather than disappearing
 * from a table that claims to be the custody record.
 */
export async function readRegulationRecord(entityId: string): Promise<RegulationRecord | null> {
  if (!entityId) return null;
  const sb = await supabaseServer();

  const { data: { user } } = await getServerUser();
  const { data: roleRows } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[] };
  const roles = new Set((roleRows ?? []).map(row => row.role_key));
  const isWriter = WRITER_ROLES.some(role => roles.has(role));

  const response = await sb.from("compliance_regulation_library").select(COLUMNS).eq("entity_id", entityId).maybeSingle();
  const raw: RawRecord | null = readSingle(response, recordRegulationRow, "regulations.record").row;
  if (!raw) return { regulation: null, clauses: [], clausesUnknown: false, attachments: [], attachmentsUnknown: false, isWriter };

  const attachments = Array.isArray(raw.attachments) ? raw.attachments : [];
  const signed = await Promise.all(attachments.map(async attachment => {
    const { data: url } = await sb.storage
      .from("regulation-documents")
      .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS);
    return { ...attachment, signedUrl: url?.signedUrl ?? null };
  }));

  return {
    regulation: raw,
    clauses: Array.isArray(raw.clauses) ? raw.clauses : [],
    clausesUnknown: raw.clauses_status === "verified_unknown",
    attachments: signed,
    attachmentsUnknown: raw.attachments_status === "verified_unknown",
    isWriter,
  };
}
