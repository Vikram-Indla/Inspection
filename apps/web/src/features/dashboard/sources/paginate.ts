import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";

export type SourcePage<T> = PostgrestPage<T>;
export type Collected<T> = { rows: T[]; failed: boolean };
export type PageLoader<T> = (from: number, to: number) => PromiseLike<SourcePage<T>>;

export async function collect<T>(load: PageLoader<T>): Promise<Collected<T>> {
  const page = await collectPostgrestPages(load);
  return page.error ? { rows: [], failed: true } : { rows: page.data ?? [], failed: false };
}

export function emptyCollection<T>(): Promise<Collected<T>> {
  return Promise.resolve({ rows: [] as T[], failed: false });
}
