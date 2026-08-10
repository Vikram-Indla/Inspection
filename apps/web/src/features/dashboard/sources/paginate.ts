import { readPages, type PageRequest, type ReadResult } from "@/lib/postgrest/read";
import type { Shape } from "@/lib/postgrest/shape";

export type Collected<T> = ReadResult<T>;

export function collect<T>(shape: Shape<T>, source: string, request: PageRequest): Promise<Collected<T>> {
  return readPages(request, shape, source);
}

export function emptyCollection<T>(): Promise<Collected<T>> {
  return Promise.resolve({ rows: [] as T[], failed: false, reason: null });
}
