export type WorkflowVersion = {
  id: string;
  version_label: string;
  status: string;
  payload: unknown;
  object: string | null;
  created_at: string | null;
  proposedByName: string | null;
  approvedByName: string | null;
  isOwnDraft: boolean;
};

export type SlaCalendar = {
  id: string;
  name: string;
  version_label: string | null;
  timezone: string | null;
  working_days: number[] | null;
  working_start: string | null;
  working_end: string | null;
  activation_authorized: boolean;
};

export type WorkflowsView = {
  versions: readonly WorkflowVersion[];
  calendars: readonly SlaCalendar[];
  loadError: boolean;
  calError: boolean;
};
