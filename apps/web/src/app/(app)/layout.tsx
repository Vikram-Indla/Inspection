import { type ReactNode } from "react";
import AppShell from "@/components/app-shell/app-shell";

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
