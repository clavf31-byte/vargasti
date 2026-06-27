import { useState } from "react";
import { CheckCircle2, Circle, Trash2, Plus } from "lucide-react";
import type { Tarefa } from "@/hooks/useTarefas";
import { cn } from "@/lib/utils";

interface TarefasTableProps {
  tarefas: Tarefa[];
  loading?: boolean;
  onAddTarefa: () => void;
  onUpdateTarefa: (id: string, changes: Partial<Omit<Tarefa, "id">>) => void;
  onRemoveTarefa: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const PRIORIDADE_CLS: Record<string, string> = {
  alta:   "text-destructive",
  normal: "text-warning",
  baixa:  "text-info",
};
const STATUS_CLS: Record<string, string> = {
  concluida:    "text-brand",
  em_progresso: "text-warning",
  aberta:       "text-info",
};

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

  const isVencida = new Date(tarefa.data_vencimento) < new Date();
  const isHoje = tarefa.data_vencimento === new Date().toISOString().split("T")[0];
  const concluida = tarefa.status === "concluida";

  return (
    <div className={cn(
      "p-4 card-graphite",
      isVencida && !concluida && "border-destructive/50",
      concluida && "opacity-60"
    )}>
      <div className="grid gap-3" style={{ gridTemplateColumns: "auto 1fr auto" }}>
        <button onClick={onToggle} className="mt-0.5">
          {concluida
            ? <CheckCircle2 className="size-5 text-brand" />
            : <Circle className="size-5 text-border" />}
        </button>

        <div className="space-y-2">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onBlur={() => { if (titulo !== tarefa.titulo) onUpdate({ titulo }); }}
            placeholder="Título da tarefa"
            className="input-base w-full font-semibold text-sm"
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            onBlur={() => { if (descricao !== (tarefa.descricao || "")) onUpdate({ descricao }); }}
            placeholder="Descrição (opcional)"
            className="input-base w-full text-xs resize-none min-h-14 font-normal"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Prioridade</label>
              <select
                value={tarefa.prioridade}
                onChange={(e) => onUpdate({ prioridade: e.target.value as Tarefa["prioridade"] })}
                className={cn("input-base w-full text-xs", PRIORIDADE_CLS[tarefa.prioridade])}
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Status</label>
              <select
                value={tarefa.status}
                onChange={(e) => onUpdate({ status: e.target.value as Tarefa["status"] })}
                className={cn("input-base w-full text-xs", STATUS_CLS[tarefa.status])}
              >
                <option value="aberta">Aberta</option>
                <option value="em_progresso">Em Progresso</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Vencimento</label>
              <input
                type="date"
                value={tarefa.data_vencimento}
                onChange={(e) => onUpdate({ data_vencimento: e.target.value })}
                className="input-base w-full text-xs"
              />
            </div>
          </div>
        </div>

        <button onClick={onRemove} className="text-destructive hover:text-destructive/80 transition-colors mt-0.5" title="Remover tarefa">
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-2 text-[11px]">
        {isVencida && !concluida && <span className="text-destructive font-semibold">Vencida</span>}
        {isHoje && <span className="text-warning font-semibold">Hoje</span>}
        <span className={cn("font-semibold", PRIORIDADE_CLS[tarefa.prioridade])}>
          • {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
        </span>
      </div>
    </div>
  );
}

export function TarefasTable({ tarefas, loading, onAddTarefa, onUpdateTarefa, onRemoveTarefa, onToggleStatus }: TarefasTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tarefas & Follow-ups</h3>
        <button
          onClick={onAddTarefa}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus className="size-3.5" /> Nova Tarefa
        </button>
      </div>

      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-6">Carregando...</div>
      ) : tarefas.length === 0 ? (
        <div className="card-graphite border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma tarefa criada
        </div>
      ) : (
        <div className="space-y-2">
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
