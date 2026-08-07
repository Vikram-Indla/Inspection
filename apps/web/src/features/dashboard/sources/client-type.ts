import type { supabaseServer } from "@/lib/supabase-server";

export type DashboardClient = Awaited<ReturnType<typeof supabaseServer>>;

export type SourceBounds = {
  readonly boundIso: string;
  readonly bounded: boolean;
};
