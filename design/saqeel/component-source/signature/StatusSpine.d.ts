/** @startingPoint section="Signature" subtitle="Inspection lifecycle spine — vertical & horizontal" viewport="700x300" */
export interface StatusSpineProps {
  stages?: Array<{
    /** canonical stage id (assignment|scheduled|enroute|arrived|inprogress|findings|corrective|review|approved|rejected|closed|onhold|reopened) */
    stage?: string;
    /** localized override of the stage label */
    label?: string;
    state?: "done" | "current" | "pending" | "blocked" | "overdue" | "reopened";
    time?: string; actor?: string; note?: string;
  }>;
  orientation?: "vertical" | "horizontal";
  compact?: boolean;
}
