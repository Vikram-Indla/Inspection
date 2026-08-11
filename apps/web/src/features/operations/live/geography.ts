import { resolveRegionId } from "@/lib/ksa-regions";

export type GeographyFilter = (region: string | null, city: string | null) => boolean;

export function buildGeographyFilter(authorizedScope: string): GeographyFilter {
  const authorizedRegionId = resolveRegionId(authorizedScope || null);
  return (region, city) => {
    if (!authorizedScope) return true;
    if (authorizedRegionId) return resolveRegionId(region) === authorizedRegionId;
    const normalized = authorizedScope.toLocaleLowerCase("en");
    return [region, city].some(value => value?.trim().toLocaleLowerCase("en") === normalized);
  };
}
