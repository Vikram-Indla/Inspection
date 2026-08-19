"use client";

import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import { Skeleton } from "@/components/saqeel/skeleton/skeleton";

const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <Skeleton shape="block" width="full" />,
});

export default function FieldMapCanvas({ markers, centre, label }: {
  markers: readonly GeoMarkerData[];
  centre: readonly [number, number];
  label: string;
}) {
  return (
    <GeoMap
      center={[centre[0], centre[1]]}
      zoom={markers.length === 1 ? 12 : 6}
      markers={[...markers]}
      height="100%"
      interactive={false}
      ariaLabel={label}
    />
  );
}
