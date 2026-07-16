// PostgREST projects commonly cap each response at 1,000 rows. Registry and
// operations reads that promise complete counts/options must page explicitly;
// otherwise the UI silently turns the provider cap into false business truth.

export type PostgrestPageError = { message: string; code?: string };
export type PostgrestPage<T> = { data: T[] | null; error: PostgrestPageError | null };

export async function collectPostgrestPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PostgrestPage<T>>,
  pageSize = 1000,
): Promise<PostgrestPage<T>> {
  const data: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    if (page.error) return { data: null, error: page.error };
    const rows = page.data ?? [];
    data.push(...rows);
    if (rows.length < pageSize) return { data, error: null };
  }
}
