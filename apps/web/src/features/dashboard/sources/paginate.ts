export type SourcePage<T> = { data: T[] | null; error: { message: string } | null };
export type Collected<T> = { rows: T[]; failed: boolean };
export type PageLoader<T> = (from: number, to: number) => PromiseLike<SourcePage<T>>;

const PAGE_SIZE = 1000;

async function readFrom<T>(load: PageLoader<T>, from: number, acc: readonly T[]): Promise<Collected<T>> {
  const result = await load(from, from + PAGE_SIZE - 1);
  if (result.error) return { rows: [], failed: true };
  const page = result.data ?? [];
  const rows = [...acc, ...page];
  return page.length < PAGE_SIZE ? { rows, failed: false } : readFrom(load, from + PAGE_SIZE, rows);
}

export function collect<T>(load: PageLoader<T>): Promise<Collected<T>> {
  return readFrom(load, 0, []);
}

export function emptyCollection<T>(): Promise<Collected<T>> {
  return Promise.resolve({ rows: [] as T[], failed: false });
}
