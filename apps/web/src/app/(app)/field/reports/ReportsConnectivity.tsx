"use client";

import FieldConnectivityBanner from "@/components/field/FieldConnectivityBanner";

export default function ReportsConnectivity({
  offline,
  weak,
}: {
  offline: string;
  weak: string;
}) {
  return <FieldConnectivityBanner offline={offline} weak={weak} />;
}
