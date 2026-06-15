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
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrcamentos = async () => {
      try {
        const { data } = await supabase
          .from("orcamentos")
          .select("*")
          .eq("user_id", user.id)
          .order("data_criacao", { ascending: false });

        setOrcamentos(data || []);
      } catch (e) {
        console.error("Erro:", e);
      } finally {
        setLoading(false);
      }
    };

    loadOrcamentos();
  }, [user]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0", color: "#eaf3f8", fontSize: "32px" }}>Orçamentos</h1>
          <p style={{ margin: 0, color: "#8da2b4", fontSize: "14px" }}>
            {orcamentos.length} orçamento{orcamentos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          style={{
            padding: "10px 20px",
            background: "#13c8d3",
            color: "#061b2a",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          + Novo Orçamento
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#8da2b4" }}>Carregando...</p>
      ) : orcamentos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#8da2b4" }}>
          <p>Nenhum orçamento cadastrado</p>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "rgba(19, 200, 211, 0.08)", borderBottom: "1px solid rgba(19, 200, 211, 0.16)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  Número
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((orc) => (
                <tr key={orc.id} style={{ borderBottom: "1px solid rgba(19, 200, 211, 0.08)" }}>
                  <td style={{ padding: "12px 16px", color: "#eaf3f8" }}>{orc.numero}</td>
                  <td style={{ padding: "12px 16px", color: "#13c8d3" }}>{orc.status}</td>
                  <td style={{ padding: "12px 16px", color: "#66bb6a" }}>R$ {(orc.total || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
