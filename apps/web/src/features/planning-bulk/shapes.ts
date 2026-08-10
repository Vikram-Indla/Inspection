import type { Shape } from "@/lib/postgrest/shape";

export type LicenceRow = {
  license_type: string | null;
  status: string | null;
  stage: string | null;
  investment_type: string | null;
  investment_size: number | null;
};

export type FactoryRow = {
  id: string;
  factory_code: string | null;
  name: string;
  cr_number: string | null;
  city: string | null;
  region: string | null;
  risk_band: string | null;
  risk_score: number | null;
  activity_class: string | null;
  official_lat: number | null;
  official_lng: number | null;
  source_synced_at: string | null;
  industrial_licenses: LicenceRow[] | null;
  visits: { planning_status: string; visit_type: string }[] | null;
};

export type ViolationRow = { factoryId: string | null };

export type InspectionRow = {
  submitted_at: string | null;
  factoryId: string | null;
  decisions: (string | null)[];
};

const licenceRow: Shape<LicenceRow> = f => ({
  license_type: f.optionalText("license_type"),
  status: f.optionalText("status"),
  stage: f.optionalText("stage"),
  investment_type: f.optionalText("investment_type"),
  investment_size: f.optionalNumber("investment_size"),
});

export const factoryRow: Shape<FactoryRow> = f => ({
  id: f.text("id"),
  factory_code: f.optionalText("factory_code"),
  name: f.text("name"),
  cr_number: f.optionalText("cr_number"),
  city: f.optionalText("city"),
  region: f.optionalText("region"),
  risk_band: f.optionalText("risk_band"),
  risk_score: f.optionalNumber("risk_score"),
  activity_class: f.optionalText("activity_class"),
  official_lat: f.optionalNumber("official_lat"),
  official_lng: f.optionalNumber("official_lng"),
  source_synced_at: f.optionalText("source_synced_at"),
  industrial_licenses: f.optionalToMany("industrial_licenses", licenceRow),
  visits: f.optionalToMany("visits", visit => ({
    planning_status: visit.text("planning_status"),
    visit_type: visit.text("visit_type"),
  })),
});

export const violationRow: Shape<ViolationRow> = f => ({
  factoryId: f.toOne("inspections", inspection =>
    inspection.toOne("visits", visit => visit.optionalText("factory_id"))) ?? null,
});

export const inspectionRow: Shape<InspectionRow> = f => ({
  submitted_at: f.optionalText("submitted_at"),
  factoryId: f.toOne("visits", visit => visit.optionalText("factory_id")) ?? null,
  decisions: f.toMany("reviews", review => review.optionalText("decision")),
});
