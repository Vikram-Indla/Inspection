import type { supabaseServer } from "@/lib/supabase-server";

export type OperationsClient = Awaited<ReturnType<typeof supabaseServer>>;
