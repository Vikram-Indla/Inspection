export type ClauseOption = { id: string; label: string };

export type CatalogueRow = {
  id: string;
  code: string;
  title: string;
  clauseId: string;
  clauseLabel: string | null;
  clauseRegId: string | null;
  active: boolean;
  scoreWeight: number | null;
  responses: string[];
  ncTarget: string | null;
  evidenceMandatory: boolean;
  evidenceType: string | null;
  scoreExcluded: string[];
  requirement: string | null;
  conditionalVisibleWhen: string | null;
  scoringOff: boolean;
  usage: { packages: number; versions: number } | null;
  guidance: string | null;
  version: number;
};

export type PreviewItem = {
  id: string;
  code: string;
  title: string;
  active: boolean;
  responses: string[];
  ncTarget: string | null;
  evidence: { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
  requirement: string;
  conditionalRule: string | null;
  mandatoryWhenVisible: boolean;
  scoringEnabled: boolean;
  guidance: string | null;
  scoreWeight: number | null;
  scoreExcludedOn: string[];
};

export type AuditEvent = { id: number; action: string; actorName: string | null; occurredAt: string };

export type AdminItemsRead = {
  error: boolean;
  clauseUnavailable: boolean;
  clauseOptions: readonly ClauseOption[];
  rows: readonly CatalogueRow[];
  previewItems: readonly PreviewItem[];
  isWriter: boolean;
  roleError: boolean;
  readAt: string;
  audit: {
    itemId: string | null;
    item: CatalogueRow | null;
    error: boolean;
    events: readonly AuditEvent[];
  };
};
