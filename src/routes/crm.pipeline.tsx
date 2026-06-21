import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CRMLayout } from "@/components/crm/CRMLayout";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { PageHeader } from "@/components/ui";
import { useOportunidades } from "@/hooks/useOportunidades";

export const Route = createFileRoute("/crm/pipeline")({
  head: () => ({ meta: [{ title: `Pipeline de Vendas · CRM ${client.name}` }] }),
  component: PipelinePage,
});

function PipelinePage() {
  const { user } = useAuth();
  const { oportunidades, loading, updateOportunidadeStatus, deleteOportunidade, addOportunidade } = useOportunidades(user?.id);
  const [clientes, setClientes] = useState<any[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newOp, setNewOp] = useState({ titulo: "", clienteId: "", status: "lead" });

  useEffect(() => {
    if (!user?.id) return;
    loadClientes();
  }, [user?.id]);

  async function loadClientes() {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("user_id", user.id)
        .order("nome");

      setClientes(data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  }

  async function handleAddOportunidade(status: string) {
    setNewOp((prev) => ({ ...prev, status }));
    setShowNewForm(true);
  }

  async function handleCreateOportunidade() {
    if (!newOp.titulo || !newOp.clienteId) return;

    try {
      await addOportunidade(newOp.titulo, newOp.clienteId, newOp.status);
      setNewOp({ titulo: "", clienteId: "", status: "lead" });
      setShowNewForm(false);
    } catch (err) {
      console.error("Erro:", err);
    }
  }

  if (loading) {
    return (
      <CRMLayout>
        <div style={{ padding: "20px", textAlign: "center", color: "#b8c5d6" }}>
          Carregando pipeline...
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
        <PageHeader
          title="Pipeline de Vendas"
          subtitle={`${oportunidades.length} oportunidades em andamento`}
          icon={<TrendingUp size={32} />}
        />

        {showNewForm && (
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              background: "#1a2332",
              border: "1px solid #2a3f56",
              borderRadius: "8px",
            }}
          >
            <div style={{ marginBottom: "12px", fontWeight: 600, color: "#e8f0f8" }}>
              Nova Oportunidade
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px" }}>
              <input
                type="text"
                placeholder="Título"
                value={newOp.titulo}
                onChange={(e) => setNewOp((prev) => ({ ...prev, titulo: e.target.value }))}
                style={{
                  padding: "8px 12px",
                  background: "#0f1419",
                  border: "1px solid #2a3f56",
                  borderRadius: "6px",
                  color: "#e8f0f8",
                  fontSize: "13px",
                }}
              />
              <select
                value={newOp.clienteId}
                onChange={(e) => setNewOp((prev) => ({ ...prev, clienteId: e.target.value }))}
                style={{
                  padding: "8px 12px",
                  background: "#0f1419",
                  border: "1px solid #2a3f56",
                  borderRadius: "6px",
                  color: "#e8f0f8",
                  fontSize: "13px",
                }}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <select
                value={newOp.status}
                onChange={(e) => setNewOp((prev) => ({ ...prev, status: e.target.value }))}
                style={{
                  padding: "8px 12px",
                  background: "#0f1419",
                  border: "1px solid #2a3f56",
                  borderRadius: "6px",
                  color: "#e8f0f8",
                  fontSize: "13px",
                }}
              >
                <option value="lead">Lead</option>
                <option value="qualificado">Qualificado</option>
                <option value="proposta">Proposta</option>
              </select>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleCreateOportunidade}
                  style={{
                    padding: "8px 16px",
                    background: "#0bd0d7",
                    border: "none",
                    borderRadius: "6px",
                    color: "#000",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "1px solid #2a3f56",
                    borderRadius: "6px",
                    color: "#b8c5d6",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <PipelineKanban
          oportunidades={oportunidades}
          onAddOportunidade={handleAddOportunidade}
          onUpdateOportunidade={() => {}}
          onRemoveOportunidade={deleteOportunidade}
          onDragCard={updateOportunidadeStatus}
        />
      </div>
    </CRMLayout>
  );
}
