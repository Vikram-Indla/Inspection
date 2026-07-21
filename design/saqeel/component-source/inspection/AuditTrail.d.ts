export interface AuditTrailProps {
  entries?: Array<{ action: string; detail?: string; actor?: string; time?: string; tone?: string; accent?: boolean }>;
}
