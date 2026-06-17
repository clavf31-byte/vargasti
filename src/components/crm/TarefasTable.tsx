import { useState } from "react";
import { CheckCircle2, Circle, Trash2, Plus } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Button } from "@/components/ui";
import type { Tarefa } from "@/hooks/useTarefas";

interface TarefasTableProps {
  tarefas: Tarefa[];
  loading?: boolean;
  onAddTarefa: () => void;
  onUpdateTarefa: (id: string, changes: Partial<Omit<Tarefa, "id">>) => void;
  onRemoveTarefa: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

function TarefaRow({
  tarefa,
  onUpdate,
  onRemove,
  onToggle,
}: {
  tarefa: Tarefa;
  onUpdate: (changes: Partial<Omit<Tarefa, "id">>) => void;
  onRemove: () => void;
  onToggle: () => void;
}) {
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [descricao, setDescricao] = useState(tarefa.descricao || "");

  const getPrioridadeColor = (p: string) =>
    ({ alta: colors.error, normal: colors.warning, baixa: colors.info })[p] ?? colors.textSecondary;

  const getStatusColor = (s: string) =>
    ({ concluida: colors.success, em_progresso: colors.warning, aberta: colors.info })[s] ?? colors.textSecondary;

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

  const isVencida = new Date(tarefa.data_vencimento) < new Date();
  const isHoje = tarefa.data_vencimento === new Date().toISOString().split("T")[0];

  return (
    <div
      style={{
        padding: spacing.md,
        background: colors.backgroundSecondary,
        border: `1px solid ${isVencida && tarefa.status !== "concluida" ? colors.error : colors.border}`,
        borderRadius: borderRadius.md,
        opacity: tarefa.status === "concluida" ? 0.6 : 1,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: spacing.md, alignItems: "start" }}>
        <button
          onClick={onToggle}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, marginTop: spacing.xs }}
        >
          {tarefa.status === "concluida"
            ? <CheckCircle2 size={20} color={colors.success} />
            : <Circle size={20} color={colors.border} />}
        </button>

        <div>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onBlur={() => { if (titulo !== tarefa.titulo) onUpdate({ titulo }); }}
            placeholder="Título da tarefa"
            style={{ ...inputStyle, marginBottom: spacing.sm, fontWeight: 600, fontSize: "14px" }}
          />

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            onBlur={() => { if (descricao !== (tarefa.descricao || "")) onUpdate({ descricao }); }}
            placeholder="Descrição (opcional)"
            style={{ ...inputStyle, marginBottom: spacing.sm, minHeight: "60px", fontFamily: "inherit" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing.sm }}>
            <div>
              <label style={{ fontSize: "11px", color: colors.textSecondary, display: "block", marginBottom: "4px" }}>
                Prioridade
              </label>
              <select
                value={tarefa.prioridade}
                onChange={(e) => onUpdate({ prioridade: e.target.value as Tarefa["prioridade"] })}
                style={{ ...inputStyle, color: getPrioridadeColor(tarefa.prioridade) }}
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11px", color: colors.textSecondary, display: "block", marginBottom: "4px" }}>
                Status
              </label>
              <select
                value={tarefa.status}
                onChange={(e) => onUpdate({ status: e.target.value as Tarefa["status"] })}
                style={{ ...inputStyle, color: getStatusColor(tarefa.status) }}
              >
                <option value="aberta">Aberta</option>
                <option value="em_progresso">Em Progresso</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11px", color: colors.textSecondary, display: "block", marginBottom: "4px" }}>
                Vencimento
              </label>
              <input
                type="date"
                value={tarefa.data_vencimento}
                onChange={(e) => onUpdate({ data_vencimento: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onRemove}
          style={{ background: "transparent", border: "none", color: colors.error, cursor: "pointer", padding: 0 }}
          title="Remover tarefa"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm, fontSize: "11px" }}>
        {isVencida && tarefa.status !== "concluida" && (
          <span style={{ color: colors.error, fontWeight: 600 }}>⚠️ Vencida</span>
        )}
        {isHoje && (
          <span style={{ color: colors.warning, fontWeight: 600 }}>📌 Hoje</span>
        )}
        <span style={{ color: getPrioridadeColor(tarefa.prioridade), fontWeight: 600 }}>
          • {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
        </span>
      </div>
    </div>
  );
}

export function TarefasTable({
  tarefas,
  loading,
  onAddTarefa,
  onUpdateTarefa,
  onRemoveTarefa,
  onToggleStatus,
}: TarefasTableProps) {
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

      {loading ? (
        <div style={{ padding: spacing.lg, textAlign: "center", color: colors.textSecondary }}>
          Carregando...
        </div>
      ) : tarefas.length === 0 ? (
        <div style={{
          padding: spacing.lg,
          textAlign: "center",
          color: colors.textSecondary,
          background: colors.backgroundSecondary,
          borderRadius: borderRadius.md,
        }}>
          Nenhuma tarefa criada
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {tarefas.map((tarefa) => (
            <TarefaRow
              key={tarefa.id}
              tarefa={tarefa}
              onUpdate={(changes) => onUpdateTarefa(tarefa.id, changes)}
              onRemove={() => onRemoveTarefa(tarefa.id)}
              onToggle={() => onToggleStatus(tarefa.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
