export type CachedInspectionPackage = {
  schema: "saqeel-inspection-package-v1";
  cachedAt: string;
  packageVersionId: string;
  packageVersionLabel: string;
  authorityChecksum: string | null;
  localChecksum: string;
  definition: unknown;
};

export type PackageAuthority = {
  packageVersionId: string;
  authorityChecksum: string | null;
};

export type PackageIntegrityResult =
  | { state: "missing" }
  | { state: "legacy_unverified"; definition: unknown }
  | { state: "verified"; package: CachedInspectionPackage }
  | { state: "outdated"; package: CachedInspectionPackage }
  | { state: "corrupt"; package: CachedInspectionPackage };

type UnsignedPackage = Omit<CachedInspectionPackage, "localChecksum">;

export type PackageCacheAdapter = {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
};

export function packageCacheNamespace(userId: string): string {
  const verifiedUserId = userId.trim();
  if (!verifiedUserId) throw new Error("A verified user id is required for offline storage");
  return `mim-field-v1:${verifiedUserId}`;
}

export function canonicalPackageJson(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return '"__undefined__"';
  if (typeof value === "number" && !Number.isFinite(value)) return JSON.stringify(String(value));
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalPackageJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalPackageJson(item)}`)
    .join(",")}}`;
}

async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function unsignedPackage(value: CachedInspectionPackage): UnsignedPackage {
  const { localChecksum: _digest, ...unsigned } = value;
  return unsigned;
}

export async function sealInspectionPackage(input: {
  packageVersionId: string;
  packageVersionLabel: string;
  authorityChecksum: string | null;
  definition: unknown;
  cachedAt?: string;
}): Promise<CachedInspectionPackage> {
  const unsigned: UnsignedPackage = {
    schema: "saqeel-inspection-package-v1",
    cachedAt: input.cachedAt ?? new Date().toISOString(),
    packageVersionId: input.packageVersionId,
    packageVersionLabel: input.packageVersionLabel,
    authorityChecksum: input.authorityChecksum,
    definition: input.definition,
  };
  return { ...unsigned, localChecksum: await sha256Text(canonicalPackageJson(unsigned)) };
}

export async function verifyInspectionPackage(
  value: unknown,
  authority?: PackageAuthority,
): Promise<PackageIntegrityResult> {
  if (value == null) return { state: "missing" };
  const candidate = value as Partial<CachedInspectionPackage>;
  if (
    candidate.schema !== "saqeel-inspection-package-v1"
    || typeof candidate.cachedAt !== "string"
    || typeof candidate.packageVersionId !== "string"
    || typeof candidate.packageVersionLabel !== "string"
    || !(candidate.authorityChecksum === null || typeof candidate.authorityChecksum === "string")
    || typeof candidate.localChecksum !== "string"
    || !("definition" in candidate)
  ) {
    return { state: "legacy_unverified", definition: value };
  }
  const cached = candidate as CachedInspectionPackage;
  const digest = await sha256Text(canonicalPackageJson(unsignedPackage(cached)));
  if (digest !== cached.localChecksum) return { state: "corrupt", package: cached };
  if (
    authority
    && (
      cached.packageVersionId !== authority.packageVersionId
      || cached.authorityChecksum !== authority.authorityChecksum
    )
  ) {
    return { state: "outdated", package: cached };
  }
  return { state: "verified", package: cached };
}

export async function resolveInspectionPackageCache(input: {
  cache: PackageCacheAdapter;
  visitId: string;
  inspectionId: string | null;
  authority: PackageAuthority;
}): Promise<PackageIntegrityResult> {
  const visitKey = `visit:${input.visitId}`;
  const inspectionKey = input.inspectionId ? `inspection:${input.inspectionId}` : null;
  if (inspectionKey) {
    const inspectionValue = await input.cache.get(inspectionKey);
    if (inspectionValue != null) return verifyInspectionPackage(inspectionValue, input.authority);
    const visitValue = await input.cache.get(visitKey);
    const fallback = await verifyInspectionPackage(visitValue, input.authority);
    if (fallback.state === "verified" || fallback.state === "outdated") {
      await input.cache.put(inspectionKey, fallback.package);
    }
    return fallback;
  }
  return verifyInspectionPackage(await input.cache.get(visitKey), input.authority);
}
