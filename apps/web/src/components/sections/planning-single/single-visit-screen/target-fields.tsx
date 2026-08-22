"use client";
import type { PublishTarget } from "@/features/planning-single/target";

export default function TargetFields({ target, sourceChannel, resumeId, reselected, submissionToken }: {
  target: PublishTarget | null;
  sourceChannel: string;
  resumeId: string;
  reselected: boolean;
  submissionToken: string;
}) {
  return (
    <>
      <input type="hidden" name="target_factory_id" value={target?.factoryId ?? ""} />
      <input
        type="hidden"
        name="target_license_number"
        value={target ? (target.factoryLicenseNumber ?? target.canonicalLicenseNumber ?? "") : ""}
      />
      <input type="hidden" name="target_cr_number" value={target?.crNumber ?? ""} />
      <input type="hidden" name="target_canonical_license_number" value={target?.canonicalLicenseNumber ?? ""} />
      <input type="hidden" name="target_plant_number" value={target?.plantNumber ?? ""} />
      <input type="hidden" name="target_source" value={target?.kind ?? ""} />
      <input type="hidden" name="source_channel" value={sourceChannel} />
      <input type="hidden" name="resume_visit_plan_id" value={resumeId} />
      <input type="hidden" name="target_reselected" value={reselected ? "1" : "0"} />
      <input type="hidden" name="submission_token" value={submissionToken} />
    </>
  );
}
