import type { SupabaseClient } from "@supabase/supabase-js";

export type FactoryContact = {
  readonly name: string;
  readonly role: string | null;
  readonly phone: string | null;
};

export type FactoryMediaCounts = {
  readonly official: number;
  readonly inspection: number;
};

export type FactoryProfileRecord = {
  readonly contact: FactoryContact | null;
  readonly media: FactoryMediaCounts;
};

export const OFFICIAL_MEDIA_CATEGORIES = ["official_factory_image", "factory_profile_image"] as const;
export const INSPECTION_MEDIA_CATEGORY = "inspection_evidence";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data.filter(isRecord) : [];

const text = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

/**
 * The primary active representative and the recorded media counts per factory.
 * Counts, not thumbnails: `factory_media_assets.storage_path` needs a signed
 * retrieval surface that does not exist on this screen, and an `<img>` with no
 * working source is a broken image, not a placeholder (WEB-003).
 */
export async function queryFactoryProfiles(
  sb: SupabaseClient,
  factoryIds: readonly string[],
): Promise<ReadonlyMap<string, FactoryProfileRecord>> {
  if (factoryIds.length === 0) return new Map();

  const ids = [...factoryIds];
  const [contactRead, mediaRead] = await Promise.all([
    sb.from("factory_representatives")
      .select("factory_id, full_name, role_title, phone, is_primary")
      .in("factory_id", ids)
      .eq("active", true)
      .order("is_primary", { ascending: false }),
    sb.from("factory_media_assets").select("factory_id, category").in("factory_id", ids),
  ]);

  if (contactRead.error) console.error(`[factories.profile] contacts failed: ${contactRead.error.message}`);
  if (mediaRead.error) console.error(`[factories.profile] media failed: ${mediaRead.error.message}`);

  const contactOf = new Map<string, FactoryContact>();
  for (const row of rows(contactRead.data)) {
    const factoryId = text(row, "factory_id");
    const name = text(row, "full_name");
    if (!factoryId || !name || contactOf.has(factoryId)) continue;
    contactOf.set(factoryId, { name, role: text(row, "role_title"), phone: text(row, "phone") });
  }

  const mediaOf = new Map<string, { official: number; inspection: number }>();
  for (const row of rows(mediaRead.data)) {
    const factoryId = text(row, "factory_id");
    const category = text(row, "category");
    if (!factoryId || !category) continue;
    const held = mediaOf.get(factoryId) ?? { official: 0, inspection: 0 };
    if ((OFFICIAL_MEDIA_CATEGORIES as readonly string[]).includes(category)) held.official += 1;
    else if (category === INSPECTION_MEDIA_CATEGORY) held.inspection += 1;
    mediaOf.set(factoryId, held);
  }

  const profiles = new Map<string, FactoryProfileRecord>();
  for (const factoryId of ids) {
    profiles.set(factoryId, {
      contact: contactOf.get(factoryId) ?? null,
      media: mediaOf.get(factoryId) ?? { official: 0, inspection: 0 },
    });
  }
  return profiles;
}
