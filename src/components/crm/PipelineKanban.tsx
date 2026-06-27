import { GripVertical, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  { id: "lead",        label: "Lead",        colorClass: "bg-info" },
  { id: "qualificado", label: "Qualificado",  colorClass: "bg-[#8b5cf6]" },
  { id: "proposta",    label: "Proposta",     colorClass: "bg-warning" },
  { id: "ganho",       label: "Ganho",        colorClass: "bg-brand" },
  { id: "perdido",     label: "Perdido",      colorClass: "bg-destructive" },
];

export function PipelineKanban({ oportunidades, onAddOportunidade, onRemoveOportunidade, onDragCard }: PipelineKanbanProps) {
  const getOps = (status: string) => oportunidades.filter((o) => o.status === status);

  const totalPipeline = oportunidades
    .filter((o) => o.status !== "ganho" && o.status !== "perdido")
    .reduce((sum, o) => sum + (o.valor || 0), 0);

  const ganhos = oportunidades
    .filter((o) => o.status === "ganho")
    .reduce((sum, o) => sum + (o.valor || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-lg p-3 text-center border border-border">
          <div className="text-xs text-muted-foreground mb-1">Pipeline</div>
          <div className="text-lg font-bold text-foreground">R$ {totalPipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center border border-border">
          <div className="text-xs text-muted-foreground mb-1">Ganho</div>
          <div className="text-lg font-bold text-brand">R$ {ganhos.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center border border-border">
          <div className="text-xs text-muted-foreground mb-1">Oportunidades</div>
          <div className="text-lg font-bold text-foreground">{oportunidades.length}</div>
        </div>
      </div>

      <div className="grid gap-4 overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${COLUNAS.length}, minmax(280px, 1fr))` }}>
        {COLUNAS.map((col) => {
          const cards = getOps(col.id);
          const total = cards.reduce((sum, o) => sum + (o.valor || 0), 0);

          return (
            <div key={col.id} className="flex flex-col min-h-96">
              <div className={cn("px-3 py-2.5 rounded-lg text-white mb-3", col.colorClass)}>
                <div className="text-sm font-semibold">{col.label}</div>
                <div className="text-xs opacity-90">{cards.length} oportunidade{cards.length !== 1 ? "s" : ""}</div>
                <div className="text-sm font-bold mt-0.5">R$ {total.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
              </div>

              <div
                className="flex-1 flex flex-col gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("opportunityId");
                  if (id) onDragCard(id, col.id);
                }}
              >
                {cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("opportunityId", card.id || "")}
                    className="card-graphite p-3 cursor-grab hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm break-words">{card.titulo}</div>
                        <div className="text-xs text-muted-foreground">{card.cliente_nome}</div>
                      </div>
                      <button
                        onClick={() => card.id && onRemoveOportunidade(card.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors shrink-0"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <div className="text-muted-foreground">Valor</div>
                        <div className="font-semibold text-foreground">R$ {card.valor?.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Prob.</div>
                        <div className={cn("font-semibold", col.colorClass.replace("bg-", "text-"))}>{card.probabilidade}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onAddOportunidade(col.id)}
                className="mt-3 py-2.5 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-select/40 hover:text-select flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="size-4" /> Adicionar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
