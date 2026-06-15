import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadOrcamentos = async () => {
      try {
        const { data, error } = await supabase
          .from("orcamentos")
          .select("*")
          .eq("user_id", user.id)
          .order("data_criacao", { ascending: false });

        if (error) {
          console.error("Erro:", error);
          return;
        }

        setOrcamentos(data || []);
      } catch (e) {
        console.error("Erro ao carregar:", e);
      } finally {
        setLoading(false);
      }
    };

    loadOrcamentos();
  }, [user]);

  return (
    <div style={{ padding: "2rem", color: "#eaf3f8" }}>
      <h1>Orçamentos</h1>
      {loading ? (
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
                {orcamentos.map((orc) => (
                  <tr key={orc.id} style={{ borderBottom: "1px solid #2d3f52" }}>
                    <td style={{ padding: "0.5rem" }}>{orc.numero}</td>
                    <td style={{ padding: "0.5rem" }}>{orc.status}</td>
                    <td style={{ padding: "0.5rem" }}>R$ {(orc.total || 0).toFixed(2)}</td>
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
