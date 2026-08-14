"use client";

import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import styles from "./location-map.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export default function LocationMap({ lat, lng, label }: {
  lat: number;
  lng: number;
  label: string;
}) {
  const markers: GeoMarkerData[] = [{ id: "official", lat, lng, label, tone: "neutral" }];
  return (
    <div className={styles.frame} dir="ltr">
      <GeoMap center={[lat, lng]} zoom={15} markers={markers} height="100%" />
    </div>
  );
}
