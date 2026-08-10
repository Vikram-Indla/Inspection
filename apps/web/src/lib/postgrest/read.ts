import { applyShape, ShapeMismatch, type Shape } from "./shape";

export type ReadFailure = { message: string; code?: string };
export type RawResponse = { data: unknown; error: ReadFailure | null };
export type PageRequest = (from: number, to: number) => PromiseLike<RawResponse>;
export type ReadResult<T> = { rows: T[]; failed: boolean; reason: string | null };
export type SingleResult<T> = { row: T | null; failed: boolean; reason: string | null };

const PAGE_SIZE = 1000;

function report<R>(source: string, reason: string, empty: R): R & { failed: true; reason: string } {
  console.error(`[postgrest] ${source} unreadable — ${reason}`);
  return { ...empty, failed: true, reason };
}

function narrowRows<T>(data: unknown, shape: Shape<T>, source: string): ReadResult<T> {
  if (!Array.isArray(data)) {
    return report(source, "the response carried no row array", { rows: [] as T[] });
  }
  try {
    return { rows: data.map((row, index) => applyShape(row, shape, `${source}[${index}]`)), failed: false, reason: null };
  } catch (error) {
    if (!(error instanceof ShapeMismatch)) throw error;
    return report(source, error.message, { rows: [] as T[] });
  }
}

export function readRows<T>(response: RawResponse, shape: Shape<T>, source: string): ReadResult<T> {
  if (response.error) return report(source, response.error.message, { rows: [] as T[] });
  return narrowRows(response.data ?? [], shape, source);
}

export function readSingle<T>(response: RawResponse, shape: Shape<T>, source: string): SingleResult<T> {
  if (response.error) return report(source, response.error.message, { row: null as T | null });
  if (response.data === null || response.data === undefined) return { row: null, failed: false, reason: null };
  try {
    return { row: applyShape(response.data, shape, source), failed: false, reason: null };
  } catch (error) {
    if (!(error instanceof ShapeMismatch)) throw error;
    return report(source, error.message, { row: null as T | null });
  }
}

export async function readPages<T>(request: PageRequest, shape: Shape<T>, source: string): Promise<ReadResult<T>> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await request(from, from + PAGE_SIZE - 1);
    if (page.error) return report(source, page.error.message, { rows: [] as T[] });
    const received = Array.isArray(page.data) ? page.data : [];
    const narrowed = narrowRows(received, shape, source);
    if (narrowed.failed) return narrowed;
    rows.push(...narrowed.rows);
    if (received.length < PAGE_SIZE) return { rows, failed: false, reason: null };
  }
}

export function emptyResult<T>(): ReadResult<T> {
  return { rows: [], failed: false, reason: null };
}
