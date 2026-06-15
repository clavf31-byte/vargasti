import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamentos").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div style={{ padding: "2rem", color: "#eaf3f8" }}>
      <h1>Orçamentos</h1>
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          <p>Total: {orcamentos.length} orçamento(s)</p>
          {orcamentos.length === 0 ? (
            <p>Nenhum orçamento encontrado.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #04d9ff" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Número</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map((orc: any) => (
                  <tr key={orc.id} style={{ borderBottom: "1px solid #2d3f52" }}>
                    <td style={{ padding: "0.5rem" }}>{orc.numero}</td>
                    <td style={{ padding: "0.5rem" }}>{orc.status}</td>
                    <td style={{ padding: "0.5rem" }}>R$ {orc.total?.toFixed(2) || "0.00"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
