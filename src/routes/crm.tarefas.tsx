import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CRMLayout } from "@/components/crm/CRMLayout";
import { TarefasTable } from "@/components/crm/TarefasTable";
import { PageHeader } from "@/components/ui";
import { useTarefas } from "@/hooks/useTarefas";
import { colors, spacing, borderRadius } from "@/lib/colors";

export const Route = createFileRoute("/crm/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas · CRM VargasTI" }] }),
  component: TarefasPage,
});

function TarefasPage() {
  const { user } = useAuth();
  const { tarefas, loading, addTarefa, updateTarefa, removeTarefa, toggleStatus } = useTarefas(user?.id);

  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);

  const tarefasFiltradas = tarefas.filter((t) => {
    if (filtroStatus && t.status !== filtroStatus) return false;
    if (filtroPrioridade && t.prioridade !== filtroPrioridade) return false;
    return true;
  });

  const selectStyle = {
    padding: "8px 12px",
    background: "#1a2332",
    border: "1px solid #2a3f56",
    borderRadius: "6px",
    color: "#b8c5d6",
    cursor: "pointer",
    fontSize: "13px",
  };

  return (
    <CRMLayout>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Tarefas & Follow-ups"
          subtitle={`${tarefas.length} tarefas`}
          icon={<CheckCircle2 size={32} />}
        />

        <div style={{ marginTop: "20px", marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={filtroStatus || ""}
            onChange={(e) => setFiltroStatus(e.target.value || null)}
            style={selectStyle}
          >
            <option value="">Todos os Status</option>
            <option value="aberta">Aberta</option>
            <option value="em_progresso">Em Progresso</option>
            <option value="concluida">Concluída</option>
          </select>

          <select
            value={filtroPrioridade || ""}
            onChange={(e) => setFiltroPrioridade(e.target.value || null)}
            style={selectStyle}
          >
            <option value="">Todas as Prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
          </select>

          {(filtroStatus || filtroPrioridade) && (
            <button
              onClick={() => { setFiltroStatus(null); setFiltroPrioridade(null); }}
              style={{
                padding: "8px 12px",
                background: "transparent",
                border: `1px solid ${colors.error}`,
                borderRadius: borderRadius.sm,
                color: colors.error,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ✕ Limpar Filtros
            </button>
          )}
        </div>

        <div style={{ marginTop: "20px" }}>
          <TarefasTable
            tarefas={tarefasFiltradas}
            loading={loading}
            onAddTarefa={addTarefa}
            onUpdateTarefa={updateTarefa}
            onRemoveTarefa={removeTarefa}
            onToggleStatus={toggleStatus}
          />
        </div>
      </div>
    </CRMLayout>
  );
}
