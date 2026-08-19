export type EstablishmentCardRow = {
  id: string;
  name: string;
  factoryCode: string | null;
  city: string | null;
  riskBand: string | null;
  isTemporary: boolean;
  licenseText: string | null;
  dossierHref: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

type LicenseLink = { id: string; commercialRegistrationId: string | null; licenseNumber: string | null };

function toLicense(value: unknown): LicenseLink | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (id === null) return null;
  return {
    id,
    commercialRegistrationId: asString(value.commercial_registration_id),
    licenseNumber: asString(value.license_number),
  };
}

function licensesOf(value: unknown): readonly LicenseLink[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw.map(toLicense).filter((item): item is LicenseLink => item !== null);
}

export function toCardRow(value: unknown): EstablishmentCardRow | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  if (id === null || name === null) return null;

  const isTemporary = value.is_temporary === true;
  const licenses = licensesOf(value.industrial_licenses);
  const linked = licenses.find(item => item.commercialRegistrationId !== null) ?? null;
  const dossierHref = linked?.commercialRegistrationId
    ? `/field/factory-360/${linked.commercialRegistrationId}?license=${linked.id}`
    : null;

  return {
    id,
    name,
    factoryCode: asString(value.factory_code),
    city: asString(value.city),
    riskBand: asString(value.risk_band),
    isTemporary,
    licenseText: isTemporary
      ? null
      : (linked?.licenseNumber ?? asString(value.license_number)),
    dossierHref,
  };
}

export function toCardRows(value: unknown): readonly EstablishmentCardRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(toCardRow).filter((row): row is EstablishmentCardRow => row !== null);
}
