import { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export function CRMLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
