import { GripVertical, X, Plus } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";

interface Oportunidade {
  id?: string;
  titulo: string;
  cliente_nome: string;
  valor: number;
  probabilidade: number;
  status: "lead" | "qualificado" | "proposta" | "ganho" | "perdido";
}

interface PipelineKanbanProps {
  oportunidades: Oportunidade[];
  onAddOportunidade: (status: string) => void;
  onUpdateOportunidade: (id: string, oportunidade: Oportunidade) => void;
  onRemoveOportunidade: (id: string) => void;
  onDragCard: (id: string, newStatus: string) => void;
}

const COLUNAS = [
  { id: "lead", label: "Lead", color: "#3b82f6" },
  { id: "qualificado", label: "Qualificado", color: "#8b5cf6" },
  { id: "proposta", label: "Proposta", color: "#f59e0b" },
  { id: "ganho", label: "Ganho", color: "#10b981" },
  { id: "perdido", label: "Perdido", color: "#ef4444" },
];

export function PipelineKanban({
  oportunidades,
  onAddOportunidade,
  onRemoveOportunidade,
  onDragCard,
}: PipelineKanbanProps) {
  const getOportunidadesPorStatus = (status: string) =>
    oportunidades.filter((o) => o.status === status);

  const totalPipeline = oportunidades
    .filter((o) => o.status !== "ganho" && o.status !== "perdido")
    .reduce((sum, o) => sum + (o.valor || 0), 0);

  const ganhos = oportunidades
    .filter((o) => o.status === "ganho")
    .reduce((sum, o) => sum + (o.valor || 0), 0);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: spacing.md, marginBottom: spacing.lg }}>
        <div style={{ padding: spacing.md, background: colors.backgroundSecondary, borderRadius: borderRadius.md, textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>
            Pipeline
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: colors.text }}>
            R$ {totalPipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div style={{ padding: spacing.md, background: colors.backgroundSecondary, borderRadius: borderRadius.md, textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>
            Ganho
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: colors.success }}>
            R$ {ganhos.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div style={{ padding: spacing.md, background: colors.backgroundSecondary, borderRadius: borderRadius.md, textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>
            Oportunidades
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: colors.text }}>
            {oportunidades.length}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLUNAS.length}, minmax(300px, 1fr))`,
          gap: spacing.lg,
          overflowX: "auto",
          paddingBottom: spacing.lg,
        }}
      >
        {COLUNAS.map((coluna) => {
          const cards = getOportunidadesPorStatus(coluna.id);
          const total = cards.reduce((sum, o) => sum + (o.valor || 0), 0);

          return (
            <div key={coluna.id} style={{ display: "flex", flexDirection: "column", minHeight: "600px" }}>
              {/* Header */}
              <div
                style={{
                  padding: spacing.md,
                  background: coluna.color,
                  color: "#fff",
                  borderRadius: borderRadius.md,
                  marginBottom: spacing.md,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>
                  {coluna.label}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: spacing.sm }}>
                  {cards.length} oportunidade{cards.length !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>
                  R$ {total.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Cards */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing.sm,
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("opportunityId");
                  if (id) onDragCard(id, coluna.id);
                }}
              >
                {cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("opportunityId", card.id || "")}
                    style={{
                      padding: spacing.md,
                      background: colors.backgroundSecondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: borderRadius.md,
                      cursor: "grab",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${coluna.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "start", gap: spacing.sm, marginBottom: spacing.sm }}>
                      <GripVertical size={16} style={{ color: colors.textSecondary, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: colors.text, marginBottom: "2px", wordBreak: "break-word" }}>
                          {card.titulo}
                        </div>
                        <div style={{ fontSize: "12px", color: colors.textSecondary }}>
                          {card.cliente_nome}
                        </div>
                      </div>
                      <button
                        onClick={() => card.id && onRemoveOportunidade(card.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: colors.error,
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.sm }}>
                      <div style={{ fontSize: "11px" }}>
                        <div style={{ color: colors.textSecondary }}>Valor</div>
                        <div style={{ fontWeight: 600, color: colors.text }}>
                          R$ {card.valor?.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div style={{ fontSize: "11px" }}>
                        <div style={{ color: colors.textSecondary }}>Probabilidade</div>
                        <div style={{ fontWeight: 600, color: coluna.color }}>
                          {card.probabilidade}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Button */}
              <button
                onClick={() => onAddOportunidade(coluna.id)}
                style={{
                  marginTop: spacing.md,
                  padding: spacing.md,
                  background: "transparent",
                  border: `2px dashed ${colors.border}`,
                  borderRadius: borderRadius.md,
                  color: colors.textSecondary,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = coluna.color;
                  (e.currentTarget as HTMLElement).style.color = coluna.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                  (e.currentTarget as HTMLElement).style.color = colors.textSecondary;
                }}
              >
                <Plus size={16} /> Adicionar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
