import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTarefas, type Tarefa } from "@/hooks/useTarefas";
import {
  CheckCircle2, Circle, Trash2, Plus, ListTodo,
  AlertTriangle, Calendar, Clock, Filter,
} from "lucide-react";

export const Route = createFileRoute("/crm/tarefas")({
  head: () => ({ meta: [{ title: `Tarefas · ${client.name}` }] }),
  component: TarefasPage,
});

const STATUS_CFG = {
  aberta:       { label: "Aberta",       cls: "text-select bg-select/10 border-select/20" },
  em_progresso: { label: "Em Progresso", cls: "text-warning bg-warning/10 border-warning/20" },
  concluida:    { label: "Concluída",    cls: "text-success bg-success/10 border-success/20" },
} as const;

const PRIO_CFG = {
  alta:   { label: "Alta",   cls: "text-destructive bg-destructive/10 border-destructive/20", bar: "bg-destructive" },
  normal: { label: "Média",  cls: "text-warning bg-warning/10 border-warning/20",             bar: "bg-warning" },
  baixa:  { label: "Baixa",  cls: "text-muted-foreground bg-surface-2 border-border",         bar: "bg-muted-foreground/40" },
} as const;

function getVencimentoLabel(dateStr: string, status: string) {
  if (status === "concluida") return null;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d atrasada`, cls: "text-destructive" };
  if (diff === 0) return { label: "vence hoje", cls: "text-warning" };
  if (diff === 1) return { label: "vence amanhã", cls: "text-muted-foreground" };
  return { label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), cls: "text-muted-foreground" };
}

function TarefaCard({
  tarefa,
  onUpdate,
  onRemove,
  onToggle,
  autoFocus,
}: {
  tarefa: Tarefa;
  onUpdate: (changes: Partial<Omit<Tarefa, "id">>) => void;
  onRemove: () => void;
  onToggle: () => void;
  autoFocus?: boolean;
}) {
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [descricao, setDescricao] = useState(tarefa.descricao ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  const prio = PRIO_CFG[tarefa.prioridade] ?? PRIO_CFG.normal;
  const venc = getVencimentoLabel(tarefa.data_vencimento, tarefa.status);
  const concluida = tarefa.status === "concluida";

  return (
    <div className={`card-selectable overflow-hidden border-l-2 ${concluida ? "border-l-success/40 opacity-60" : prio.bar === "bg-destructive" ? "border-l-destructive" : prio.bar === "bg-warning" ? "border-l-warning" : "border-l-border"}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status toggle */}
          <button
            onClick={onToggle}
            className="mt-0.5 shrink-0 text-muted-foreground/40 hover:text-success transition-colors"
            title="Alternar status"
          >
            {concluida
              ? <CheckCircle2 className="size-5 text-success" />
              : tarefa.status === "em_progresso"
                ? <Clock className="size-5 text-warning" />
                : <Circle className="size-5" />
            }
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <input
              ref={titleRef}
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={() => { if (titulo !== tarefa.titulo) onUpdate({ titulo }); }}
              placeholder="Título da tarefa"
              className={`w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none placeholder:text-muted-foreground/40 ${concluida ? "line-through" : ""}`}
            />
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onBlur={() => { if (descricao !== (tarefa.descricao ?? "")) onUpdate({ descricao: descricao || null }); }}
              placeholder="Descrição (opcional)"
              rows={1}
              className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none resize-none placeholder:text-muted-foreground/30 leading-relaxed"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }}
            />

            {/* Metadata row */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Status */}
              <select
                value={tarefa.status}
                onChange={(e) => onUpdate({ status: e.target.value as Tarefa["status"] })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer bg-transparent appearance-none ${STATUS_CFG[tarefa.status]?.cls ?? ""}`}
              >
                <option value="aberta">Aberta</option>
                <option value="em_progresso">Em Progresso</option>
                <option value="concluida">Concluída</option>
              </select>

              {/* Prioridade */}
              <select
                value={tarefa.prioridade}
                onChange={(e) => onUpdate({ prioridade: e.target.value as Tarefa["prioridade"] })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer bg-transparent appearance-none ${prio.cls}`}
              >
                <option value="alta">Alta</option>
                <option value="normal">Média</option>
                <option value="baixa">Baixa</option>
              </select>

              {/* Vencimento */}
              <div className="flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground" />
                <span className={`text-[10px] ${venc?.cls ?? "text-muted-foreground"}`}>{venc?.label ?? tarefa.data_vencimento}</span>
                <input
                  type="date"
                  value={tarefa.data_vencimento}
                  onChange={(e) => onUpdate({ data_vencimento: e.target.value })}
                  className="bg-transparent border border-border rounded px-1 text-[10px] text-muted-foreground focus:outline-none focus:border-brand/50 cursor-pointer w-28"
                />
              </div>

              {venc && venc.cls === "text-destructive" && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-destructive">
                  <AlertTriangle className="size-2.5" />
                  atrasada
                </span>
              )}
            </div>
          </div>

          {/* Delete */}
          <div className="shrink-0">
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Excluir?</span>
                <button onClick={onRemove} className="text-[10px] font-bold text-destructive hover:underline">Sim</button>
                <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-muted-foreground hover:underline">Não</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TarefasPage() {
  const { user } = useAuth();
  const { tarefas, loading, addTarefa, updateTarefa, removeTarefa, toggleStatus } = useTarefas(user?.id);

  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const knownIds = useRef(new Set(tarefas.map((t) => t.id)));

  const tarefasFiltradas = tarefas.filter((t) => {
    if (filtroStatus && t.status !== filtroStatus) return false;
    if (filtroPrioridade && t.prioridade !== filtroPrioridade) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const atrasadas = tarefas.filter((t) => t.status !== "concluida" && t.data_vencimento < todayStr).length;
  const hoje = tarefas.filter((t) => t.status !== "concluida" && t.data_vencimento === todayStr).length;
  const concluidas = tarefas.filter((t) => t.status === "concluida").length;

  useEffect(() => {
    const newTarefa = tarefas.find((t) => !knownIds.current.has(t.id));
    if (newTarefa) {
      setNewId(newTarefa.id);
      tarefas.forEach((t) => knownIds.current.add(t.id));
    }
  }, [tarefas]);

  const handleAdd = () => { addTarefa(); };

  const STATUS_FILTERS = [
    { value: null,          label: "Todos" },
    { value: "aberta",      label: "Aberta" },
    { value: "em_progresso",label: "Em Progresso" },
    { value: "concluida",   label: "Concluída" },
  ];

  const PRIO_FILTERS = [
    { value: null,    label: "Todas" },
    { value: "alta",  label: "Alta" },
    { value: "normal",label: "Média" },
    { value: "baixa", label: "Baixa" },
  ];

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-teal-500/10 border border-teal-500/20 grid place-items-center">
              <ListTodo className="size-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tarefas</h1>
              <p className="text-xs text-muted-foreground">{tarefas.length} tarefa{tarefas.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors"
          >
            <Plus className="size-4" />
            Nova Tarefa
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total",      value: tarefas.length,   cls: "text-foreground" },
            { label: "Atrasadas",  value: atrasadas,        cls: atrasadas > 0 ? "text-destructive" : "text-foreground" },
            { label: "Hoje",       value: hoje,             cls: hoje > 0 ? "text-warning" : "text-foreground" },
            { label: "Concluídas", value: concluidas,       cls: "text-success" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="card-selectable p-3 text-center">
              <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setFiltroStatus(value)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${filtroStatus === value ? "bg-brand text-white border-brand" : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-1.5 flex-wrap">
            {PRIO_FILTERS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setFiltroPrioridade(value)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${filtroPrioridade === value ? "bg-brand text-white border-brand" : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="card-selectable p-10 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : tarefasFiltradas.length === 0 ? (
          <div className="card-selectable p-12 text-center">
            <ListTodo className="size-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {tarefas.length === 0 ? "Nenhuma tarefa criada" : "Nenhuma tarefa corresponde aos filtros"}
            </p>
            {tarefas.length === 0 && (
              <button
                onClick={handleAdd}
                className="mt-4 text-xs text-brand hover:underline font-medium"
              >
                Criar primeira tarefa
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tarefasFiltradas.map((t) => (
              <TarefaCard
                key={t.id}
                tarefa={t}
                onUpdate={(changes) => updateTarefa(t.id, changes)}
                onRemove={() => removeTarefa(t.id)}
                onToggle={() => toggleStatus(t.id)}
                autoFocus={t.id === newId}
              />
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
}
