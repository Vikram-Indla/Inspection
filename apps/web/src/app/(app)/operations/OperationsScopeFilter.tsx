"use client";

import { useRouter } from "next/navigation";

export default function OperationsScopeFilter({
  view,
  region,
  city,
  regions,
  cities,
  labels,
}: {
  view: "map" | "performance";
  region: string;
  city: string;
  regions: string[];
  cities: string[];
  labels: {
    region: string;
    city: string;
    allRegions: string;
    allCities: string;
  };
}) {
  const router = useRouter();
  const apply = (nextRegion: string, nextCity: string) => {
    const params = new URLSearchParams();
    if (view === "performance") params.set("view", "performance");
    if (nextRegion) params.set("region", nextRegion);
    if (nextCity) params.set("city", nextCity);
    const query = params.toString();
    router.replace(query ? `/operations?${query}` : "/operations");
  };

  return (
    <div className="sq-row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--space-4)" }}>
      <div className="sq-field">
        <label className="sq-field__label" htmlFor="operations-region">{labels.region}</label>
        <select
          className="sq-select"
          id="operations-region"
          value={region}
          onChange={event => apply(event.target.value, "")}
        >
          <option value="">{labels.allRegions}</option>
          {regions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      <div className="sq-field">
        <label className="sq-field__label" htmlFor="operations-city">{labels.city}</label>
        <select
          className="sq-select"
          id="operations-city"
          value={city}
          onChange={event => apply(region, event.target.value)}
        >
          <option value="">{labels.allCities}</option>
          {cities.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    </div>
  );
}
