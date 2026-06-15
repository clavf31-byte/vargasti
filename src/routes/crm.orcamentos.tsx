import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OrcamentoForm } from "@/components/crm/OrcamentoForm";
import { FileText } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: orcamentos = [], isLoading, refetch } = useQuery({
    queryKey: ["orcamentos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("user_id", user!.id)
        .order("data_criacao", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      rascunho: "#8da2b4",
      enviado: "#04d9ff",
      aprovado: "#66bb6a",
      rejeitado: "#ff6b6b",
    };
    return colors[status] || "#8da2b4";
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0", color: "#eaf3f8", fontSize: "32px" }}>Orçamentos</h1>
          <p style={{ margin: 0, color: "#8da2b4", fontSize: "14px" }}>
            {orcamentos.length} orçamento{orcamentos.length !== 1 ? "s" : ""} no total
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
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
        }}
        userId={user!.id}
        clientes={clientes}
      />

      {isLoading ? (
        <p style={{ color: "#8da2b4" }}>Carregando orçamentos...</p>
      ) : orcamentos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#8da2b4" }}>
          <FileText style={{ width: "48px", height: "48px", opacity: 0.2, margin: "0 auto 1rem" }} />
          <p>Nenhum orçamento cadastrado</p>
          <p style={{ fontSize: "12px" }}>Clique em "+ Novo Orçamento" para começar</p>
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
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  Criado em
                </th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((orc: any) => (
                <tr key={orc.id} style={{ borderBottom: "1px solid rgba(19, 200, 211, 0.08)" }}>
                  <td style={{ padding: "12px 16px", color: "#eaf3f8", fontWeight: 500 }}>{orc.numero}</td>
                  <td style={{ padding: "12px 16px", color: getStatusColor(orc.status), fontWeight: 500 }}>
                    {orc.status}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#66bb6a", fontWeight: 500 }}>
                    R$ {(orc.total || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>
                    {new Date(orc.data_criacao).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
