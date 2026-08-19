import Shell from "@/components/Shell";
import ReviewWorkspaceScreen from "@/components/sections/review-detail/review-workspace/review-workspace";
import { loadReviewDetail } from "@/features/reviews/detail";
import { buildReviewsStrings } from "@/features/reviews/strings";
import { getLocale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";

export default async function ReviewWorkspacePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = await getLocale();
  const strings = buildReviewsStrings(locale);
  const loaded = await loadReviewDetail(await supabaseServer(), id, strings.detail, locale);

  return (
    <Shell current="/reviews" title="">
      <ReviewWorkspaceScreen loaded={loaded} query={query} strings={strings.detail} locale={locale} />
    </Shell>
  );
}
