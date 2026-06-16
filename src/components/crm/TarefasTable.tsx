import { CheckCircle2, Circle, Trash2, Plus, Calendar } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Button } from "@/components/ui";

interface Tarefa {
  id?: string;
  titulo: string;
  descricao?: string;
  status: "aberta" | "em_progresso" | "concluida";
  prioridade: "baixa" | "normal" | "alta";
  data_vencimento: string;
  cliente_id?: string;
  cliente_nome?: string;
}

interface TarefasTableProps {
  tarefas: Tarefa[];
  onAddTarefa: () => void;
  onUpdateTarefa: (index: number, tarefa: Tarefa) => void;
  onRemoveTarefa: (index: number) => void;
  onToggleStatus: (index: number) => void;
}

export function TarefasTable({
  tarefas,
  onAddTarefa,
  onUpdateTarefa,
  onRemoveTarefa,
  onToggleStatus,
}: TarefasTableProps) {
  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return colors.error;
      case "normal":
        return colors.warning;
      case "baixa":
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida":
        return colors.success;
      case "em_progresso":
        return colors.warning;
      case "aberta":
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "concluida":
        return "Concluída";
      case "em_progresso":
        return "Em Progresso";
      case "aberta":
        return "Aberta";
      default:
        return status;
    }
  };

  const inputStyle = {
    width: "100%",
    padding: spacing.sm,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.sm,
    color: colors.text,
    fontSize: "13px",
    boxSizing: "border-box" as const,
  };

  const isVencida = (data: string) => new Date(data) < new Date() && data;
  const isHoje = (data: string) => {
    const hoje = new Date().toISOString().split("T")[0];
    return data === hoje;
  };

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <div style={{ marginBottom: spacing.md, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: colors.text, fontWeight: 600 }}>
          Tarefas & Follow-ups
        </h3>
        <Button variant="primary" size="sm" onClick={onAddTarefa}>
          <Plus size={16} /> Nova Tarefa
        </Button>
      </div>

      {tarefas.length === 0 ? (
        <div
          style={{
            padding: spacing.lg,
            textAlign: "center",
            color: colors.textSecondary,
            background: colors.backgroundSecondary,
            borderRadius: borderRadius.md,
          }}
        >
          Nenhuma tarefa criada
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {tarefas.map((tarefa, idx) => (
            <div
              key={idx}
              style={{
                padding: spacing.md,
                background: colors.backgroundSecondary,
                border: `1px solid ${isVencida(tarefa.data_vencimento) ? colors.error : colors.border}`,
                borderRadius: borderRadius.md,
                opacity: tarefa.status === "concluida" ? 0.6 : 1,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: spacing.md, alignItems: "start" }}>
                {/* Checkbox de status */}
                <button
                  onClick={() => onToggleStatus(idx)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginTop: spacing.xs,
                  }}
                >
                  {tarefa.status === "concluida" ? (
                    <CheckCircle2 size={20} color={colors.success} />
                  ) : (
                    <Circle size={20} color={colors.border} />
                  )}
                </button>

                {/* Conteúdo */}
                <div>
                  <input
                    type="text"
                    value={tarefa.titulo}
                    onChange={(e) => onUpdateTarefa(idx, { ...tarefa, titulo: e.target.value })}
                    placeholder="Título da tarefa"
                    style={{
                      ...inputStyle,
                      marginBottom: spacing.sm,
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  />

                  <textarea
                    value={tarefa.descricao || ""}
                    onChange={(e) => onUpdateTarefa(idx, { ...tarefa, descricao: e.target.value })}
                    placeholder="Descrição (opcional)"
                    style={{
                      ...inputStyle,
                      marginBottom: spacing.sm,
                      minHeight: "60px",
                      fontFamily: "inherit",
                    }}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing.sm }}>
                    {/* Prioridade */}
                    <div>
                      <label style={{ fontSize: "11px", color: colors.textSecondary, display: "block", marginBottom: "4px" }}>
                        Prioridade
                      </label>
                      <select
                        value={tarefa.prioridade}
                        onChange={(e) => onUpdateTarefa(idx, { ...tarefa, prioridade: e.target.value as any })}
                        style={{
                          ...inputStyle,
                          color: getPrioridadeColor(tarefa.prioridade),
                        }}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label style={{ fontSize: "11px", color: colors.textSecondary, display: "block", marginBottom: "4px" }}>
                        Status
                      </label>
                      <select
                        value={tarefa.status}
                        onChange={(e) => onUpdateTarefa(idx, { ...tarefa, status: e.target.value as any })}
                        style={{
                          ...inputStyle,
                          color: getStatusColor(tarefa.status),
                        }}
                      >
                        <option value="aberta">Aberta</option>
                        <option value="em_progresso">Em Progresso</option>
                        <option value="concluida">Concluída</option>
                      </select>
                    </div>

                    {/* Data de Vencimento */}
                    <div>
                      <label style={{ fontSize: "11px", color: colors.textSecondary, display: "block", marginBottom: "4px" }}>
                        Vencimento
                      </label>
                      <input
                        type="date"
                        value={tarefa.data_vencimento}
                        onChange={(e) => onUpdateTarefa(idx, { ...tarefa, data_vencimento: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Botão Remover */}
                <button
                  onClick={() => onRemoveTarefa(idx)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: colors.error,
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Remover tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Indicadores */}
              <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm, fontSize: "11px" }}>
                {isVencida(tarefa.data_vencimento) && (
                  <span style={{ color: colors.error, fontWeight: 600 }}>⚠️ Vencida</span>
                )}
                {isHoje(tarefa.data_vencimento) && (
                  <span style={{ color: colors.warning, fontWeight: 600 }}>📌 Hoje</span>
                )}
                <span style={{ color: getPrioridadeColor(tarefa.prioridade), fontWeight: 600 }}>
                  • {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
