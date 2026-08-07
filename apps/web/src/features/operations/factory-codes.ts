export const CLEAN_FACTORY_CODES: readonly string[] = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
];

const CLEAN_FACTORY_CODE_SET = new Set(CLEAN_FACTORY_CODES);

export function isCleanFactory(factory: { factory_code?: string | null } | null | undefined): boolean {
  return Boolean(factory?.factory_code && CLEAN_FACTORY_CODE_SET.has(factory.factory_code));
}
