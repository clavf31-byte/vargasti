import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM · VargasTI Lab" }] }),
  component: CRMLayout,
});

function CRMLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para orçamentos automaticamente
    navigate({ to: "/crm/orcamentos" });
  }, [navigate]);

  return (
    <AppShell>
      <div style={{ padding: "2rem", textAlign: "center", color: "#8da2b4" }}>
        <p>Redirecionando para Orçamentos...</p>
      </div>
    </AppShell>
  );
}
