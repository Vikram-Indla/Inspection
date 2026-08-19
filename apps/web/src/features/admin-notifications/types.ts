export type NotificationRuleRow = {
  readonly id: string;
  readonly event_key: string;
  readonly channel: string;
  readonly recipient_role: string;
  readonly template: string;
  readonly sla_minutes: number | null;
  readonly escalation_role: string | null;
  readonly status: string;
  readonly version_label: string;
  readonly created_at: string;
  readonly deactivation_reason: string | null;
};

export type RoleOption = {
  readonly role_key: string;
  readonly title: string;
};

export type NotificationsView = {
  readonly rules: readonly NotificationRuleRow[];
  readonly roles: readonly RoleOption[];
  readonly isWriter: boolean;
  readonly rolesAvailable: boolean;
  readonly permissionsFailed: boolean;
  readonly rulesFailed: boolean;
};
