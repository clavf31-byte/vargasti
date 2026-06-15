import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  return (
    <div style={{ padding: "2rem", color: "#eaf3f8" }}>
      <h1>Orçamentos - Teste</h1>
      <p>Página carregando...</p>
    </div>
  );
}
