import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OrcamentoForm } from "@/components/crm/OrcamentoForm";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [orcRes, clientRes] = await Promise.all([
          supabase.from("orcamentos").select("*").eq("user_id", user.id).order("data_criacao", { ascending: false }),
          supabase.from("clientes").select("id, nome").eq("user_id", user.id),
        ]);

        setOrcamentos(orcRes.data || []);
        setClientes(clientRes.data || []);
      } catch (e) {
        console.error("Erro ao carregar:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSuccess = async () => {
    if (!user) return;
    const { data } = await supabase.from("orcamentos").select("*").eq("user_id", user.id).order("data_criacao", { ascending: false });
    setOrcamentos(data || []);
    setIsFormOpen(false);
  };

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
          onClick={() => setIsFormOpen(true)}
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

      <OrcamentoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
        userId={user!.id}
        clientes={clientes}
      />

      {loading ? (
        <p style={{ color: "#8da2b4" }}>Carregando...</p>
      ) : orcamentos.length === 0 ? (
        <p style={{ color: "#8da2b4" }}>Nenhum orçamento encontrado.</p>
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
