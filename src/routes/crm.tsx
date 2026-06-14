import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM · VargasTI Lab" }] }),
  component: CRMLayout,
});

function CRMLayout() {
  return (
    <AppShell>
      <div style={{ padding: "2rem", textAlign: "center", color: "#8da2b4" }}>
        <p>Módulo CRM em desenvolvimento...</p>
      </div>
    </AppShell>
  );
}
