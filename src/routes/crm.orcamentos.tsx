import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { OrcamentoForm } from "@/components/crm/OrcamentoForm";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { obterAlertas } from "@/lib/crm/alertService";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

type Orcamento = {
  id: string;
  numero: string;
  cliente_id: string;
  status: string;
  total: number;
  data_criacao: string;
  created_at: string;
};

function OrcamentosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadOrcamentos();
  }, [user]);

  async function loadOrcamentos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("user_id", user!.id)
        .order("data_criacao", { ascending: false });

      if (error) throw error;
      setOrcamentos((data as Orcamento[]) || []);

      const alerts = await obterAlertas();
      setAlertas(alerts);
    } catch (e) {
      console.error("Erro ao carregar orçamentos:", e);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      rascunho: "rgba(109, 135, 156, 0.2)",
      enviado: "rgba(33, 150, 243, 0.2)",
      aprovado: "rgba(76, 175, 80, 0.2)",
      pago: "rgba(76, 175, 80, 0.25)",
      nf_gerada: "rgba(168, 85, 247, 0.2)",
    };
    return colors[status] || "rgba(109, 135, 156, 0.2)";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      enviado: "Enviado",
      aprovado: "Aprovado",
      pago: "Pago",
      nf_gerada: "NF Gerada",
    };
    return labels[status] || status;
  };

  return (
    <AppShell>
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Orçamentos"
          subtitle={`${orcamentos.length} orçamento${orcamentos.length !== 1 ? "s" : ""} registrado${orcamentos.length !== 1 ? "s" : ""}`}
          action={<button onClick={() => setIsFormOpen(true)} style={{ padding: "8px 16px", background: "#13c8d3", color: "#07111c", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>+ Novo Orçamento</button>}
        />

        {/* OrcamentoForm removido temporariamente para diagnóstico */}

        {alertas.length > 0 && (
          <div style={{
            background: "rgba(255, 152, 0, 0.1)",
            border: "1px solid rgba(255, 152, 0, 0.3)",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "2rem"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <AlertCircle size={20} style={{ color: "#ffb74d", marginTop: "2px" }} />
              <div>
                <p style={{ color: "#ffb74d", fontWeight: 600, marginBottom: "0.5rem" }}>
                  ⚠️ {alertas.length} alerta{alertas.length > 1 ? "s" : ""} de vencimento
                </p>
                {alertas.map((alerta) => (
                  <p key={alerta.id} style={{ fontSize: "13px", color: "#ffd89b", marginBottom: "0.25rem" }}>
                    • {alerta.mensagem}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: "#8da2b4" }}>Carregando orçamentos...</p>
        ) : orcamentos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#8da2b4" }}>
            <FileSpreadsheet style={{ width: "48px", height: "48px", opacity: 0.2, margin: "0 auto 1rem" }} />
            <p>Nenhum orçamento cadastrado</p>
            <p style={{ fontSize: "12px" }}>Clique em "+ Novo Orçamento" para começar</p>
          </div>
        ) : (
          <div style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            overflow: "hidden",
            marginTop: "2rem"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "rgba(19, 200, 211, 0.08)", borderBottom: "1px solid rgba(19, 200, 211, 0.16)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Número</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Valor</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map((orcamento) => (
                  <tr key={orcamento.id} style={{ borderBottom: "1px solid rgba(19, 200, 211, 0.08)" }}>
                    <td style={{ padding: "12px 16px", color: "#13c8d3", fontWeight: 600 }}>{orcamento.numero}</td>
                    <td style={{ padding: "12px 16px", color: "#eaf3f8" }}>—</td>
                    <td style={{ padding: "12px 16px", color: "#66bb6a", fontWeight: 500 }}>R$ {(orcamento.total || 0).toFixed(2)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: getStatusColor(orcamento.status),
                        color: "#eaf3f8"
                      }}>
                        {getStatusLabel(orcamento.status)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => navigate({ to: `/crm/orcamentos/${orcamento.id}` })}
                        style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(19, 200, 211, 0.1)", border: "1px solid rgba(19, 200, 211, 0.3)", color: "#13c8d3", borderRadius: "4px", cursor: "pointer" }}>
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
