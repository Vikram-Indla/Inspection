export type SaqeelTheme = "light" | "dark";

export const SAQEEL_THEME_STORAGE_KEY = "saqeel-theme";

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Establishes the authenticated-shell default after a successful sign-in.
 *
 * Dark is the product default, but an explicit light/dark choice belongs to
 * the user and must survive later sessions. Storage failures (for example,
 * private browsing restrictions) remain harmless because ThemeScript has the
 * same dark fallback before first paint.
 */
export function establishAuthenticatedThemeDefault(storage: ThemeStorage): SaqeelTheme {
  try {
    const persisted = storage.getItem(SAQEEL_THEME_STORAGE_KEY);
    if (persisted === "light" || persisted === "dark") return persisted;
    storage.setItem(SAQEEL_THEME_STORAGE_KEY, "dark");
  } catch {
    // ThemeScript still applies the dark fallback when persistence is blocked.
  }
  return "dark";
}
