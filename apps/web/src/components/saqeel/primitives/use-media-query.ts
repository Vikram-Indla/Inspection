"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query without an effect.
 *
 * `useSyncExternalStore` is the whole point: a layout that depends on viewport
 * width is external state, and reading it through an effect means the first
 * paint is always wrong and then corrects itself. The server snapshot is
 * `false`, so the narrow branch is what renders before hydration — pick the
 * query so that the safe layout is the one `false` selects.
 *
 * A component that only needs a breakpoint for *styling* should use a CSS
 * media query instead; this exists for the cases CSS cannot reach, such as a
 * numeric prop handed to a chart library.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
