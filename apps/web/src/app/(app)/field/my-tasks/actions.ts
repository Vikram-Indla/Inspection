"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedUser } from "@/lib/verified-user";
import { supabaseServer } from "@/lib/supabase-server";

export type AssignmentPrepareResult = {
  status: "idle" | "success" | "error";
  message?: string;
  visitId?: string;
};

export async function acceptPrepareAssignment(
  _previous: AssignmentPrepareResult,
  formData: FormData,
): Promise<AssignmentPrepareResult> {
  const visitId = String(formData.get("visit_id") ?? "").trim();
  if (!visitId) return { status: "error", message: "Missing assignment." };

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) {
    return { status: "error", message: "Session expired — sign in again." };
  }

  const { data, error } = await sb.rpc("accept_prepare_assignment", { p_visit: visitId });
  if (error) {
    console.error("[field accept prepare]", error.message, error.code);
    return {
      status: "error",
      message: error.message.includes("ASSIGNMENT_PREPARE_STATE")
        ? "This assignment is no longer available to prepare. Refresh the list."
        : "The assignment could not be prepared. Nothing changed — refresh and try again.",
    };
  }

  const result = data as { visit_id?: string; status?: string } | null;
  if (result?.visit_id !== visitId || result.status !== "preparing") {
    return { status: "error", message: "The assignment transition could not be verified. Refresh the list." };
  }

  revalidatePath("/field");
  revalidatePath("/field/my-tasks");
  revalidatePath(`/field/${visitId}`);
  return { status: "success", visitId };
}
