"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { clearBiometricUnlock } from "@/lib/field-biometric-unlock";
import { clearFieldSessionIdentity } from "@/lib/field-auth";

export default function FieldLogoutClient({ message }: { message: string }) {
  useEffect(() => {
    let active = true;
    (async () => {
      const sb = supabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      const userId = session?.user.id;
      if (userId) {
        clearFieldSessionIdentity(userId);
        clearBiometricUnlock(userId);
      } else {
        clearFieldSessionIdentity();
      }
      await sb.auth.signOut();
      if (active) window.location.replace("/login/field?reason=signedout");
    })();
    return () => { active = false; };
  }, []);

  return <main className="fl-root" style={{ display: "grid", placeItems: "center", padding: 24 }}><p role="status">{message}</p></main>;
}
