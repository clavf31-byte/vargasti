import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useChamados, type ChamadoStatus, type ChamadoPrioridade } from "@/hooks/useChamados";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Search, ChevronRight, Loader2, Clock,
} from "lucide-react";

export const Route = createFileRoute("/crm/chamados/")({
  head: () => ({ meta: [{ title: "Chamados · VargasTI" }] }),
  component: ChamadosPage,
});

const STATUS_CFG: Record<ChamadoStatus, { label: string; cls: string; dot: string }> = {
  aberto:       { label: "Aberto",        cls: "text-slate-400 bg-slate-400/10 border-slate-400/25",   dot: "bg-slate-400" },
  em_triagem:   { label: "Em triagem",    cls: "text-cyan-400 bg-cyan-400/10 border-cyan-400/25",       dot: "bg-cyan-400" },
  em_andamento: { label: "Em andamento",  cls: "text-warning bg-warning/10 border-warning/25",          dot: "bg-warning" },
  concluido:    { label: "Concluído",     cls: "text-success bg-success/10 border-success/25",          dot: "bg-success" },
};

const PRIO_CFG: Record<ChamadoPrioridade, { label: string; cls: string }> = {
  alta:   { label: "Alta",   cls: "text-destructive" },
  normal: { label: "Normal", cls: "text-warning" },
  baixa:  { label: "Baixa",  cls: "text-muted-foreground" },
};

function slaElapsed(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function NovoChamadoModal({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { titulo: string; descricao?: string; cliente_id?: string; prioridade: ChamadoPrioridade }) => Promise<void>;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [prioridade, setPrioridade] = useState<ChamadoPrioridade>("normal");
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useState(() => {
    (supabase as any).from("clientes").select("id, nome").order("nome").then(({ data }: any) => {
      if (data) setClientes(data);
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    await onCreate({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      cliente_id: clienteId || undefined,
      prioridade,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface-1 border border-border rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-base font-bold text-foreground">Novo Chamado</h2>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Título</label>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Descreva brevemente o problema..."
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Descrição (opcional)</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Detalhes adicionais..."
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/50 resize-none placeholder:text-muted-foreground/30"
          />
        </div>

        {clientes.length > 0 && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Cliente (opcional)</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/50"
            >
              <option value="">Sem cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</label>
          <div className="flex gap-2">
            {(["alta", "normal", "baixa"] as ChamadoPrioridade[]).map((p) => (
              <button
                key={p} type="button"
                onClick={() => setPrioridade(p)}
                className={`flex-1 py-2 rounded-lg border text-[11px] font-bold transition-all ${
                  prioridade === p
                    ? p === "alta" ? "bg-destructive/20 border-destructive text-destructive"
                      : p === "normal" ? "bg-warning/20 border-warning text-warning"
                      : "bg-surface-2 border-border text-foreground"
                    : "border-border text-muted-foreground/40 hover:border-brand/30"
                }`}
              >
                {PRIO_CFG[p].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button
            type="submit" disabled={!titulo.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Abrir Chamado
          </button>
        </div>
      </form>
    </div>
  );
}

function ChamadosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chamados, loading, createChamado } = useChamados(user?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ChamadoStatus | "todos">("todos");
  const [prioFilter, setPrioFilter] = useState<ChamadoPrioridade | "todas">("todas");
  const [search, setSearch] = useState("");

  const filtered = chamados.filter((c) => {
    if (statusFilter !== "todos" && c.status !== statusFilter) return false;
    if (prioFilter !== "todas" && c.prioridade !== prioFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.titulo.toLowerCase().includes(q) ||
        (c.numero_formatado ?? "").toLowerCase().includes(q) ||
        (c.cliente_nome ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts: Record<ChamadoStatus, number> = {
    aberto: 0, em_triagem: 0, em_andamento: 0, concluido: 0,
  };
  for (const c of chamados) counts[c.status]++;

  const handleCreate = async (data: Parameters<typeof createChamado>[0]) => {
    const c = await createChamado(data);
    if (c) navigate({ to: "/crm/chamados/$id", params: { id: c.id } });
  };

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chamados</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{chamados.length} no total</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors"
          >
            <Plus className="size-4" /> Novo Chamado
          </button>
        </div>

        {/* STATUS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(STATUS_CFG) as ChamadoStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "todos" : s)}
              className={`card-selectable p-4 text-left transition-all ${statusFilter === s ? "ring-1 ring-brand/40" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`size-2 rounded-full ${STATUS_CFG[s].dot}`} />
                <span className="text-[10px] text-muted-foreground">{STATUS_CFG[s].label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{counts[s]}</p>
            </button>
          ))}
        </div>

        {/* SEARCH + FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, número ou cliente..."
              className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/30"
            />
          </div>
          <div className="flex gap-1.5">
            {(["todas", "alta", "normal", "baixa"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPrioFilter(p)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                  prioFilter === p
                    ? "bg-brand/20 border-brand text-brand"
                    : "border-border text-muted-foreground/50 hover:border-brand/30 hover:text-muted-foreground"
                }`}
              >
                {p === "todas" ? "Todas" : PRIO_CFG[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {chamados.length === 0 ? "Nenhum chamado ainda. Abra o primeiro!" : "Nenhum chamado encontrado."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const sc = STATUS_CFG[c.status];
              const pc = PRIO_CFG[c.prioridade];
              return (
                <button
                  key={c.id}
                  onClick={() => navigate({ to: "/crm/chamados/$id", params: { id: c.id } })}
                  className="w-full card-selectable p-4 flex items-center gap-4 text-left hover:ring-1 hover:ring-brand/20 transition-all group"
                >
                  <span className={`size-2 rounded-full shrink-0 ${sc.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {c.numero_formatado && (
                        <span className="text-[10px] font-mono text-muted-foreground/50">{c.numero_formatado}</span>
                      )}
                      <span className={`text-[10px] font-bold ${pc.cls}`}>{pc.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{c.titulo}</p>
                    <p className="text-xs text-muted-foreground">{c.cliente_nome}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                        {sc.label}
                      </span>
                      {c.status !== "concluido" && (
                        <p className="text-[10px] text-muted-foreground/50 flex items-center justify-end gap-1 mt-1">
                          <Clock className="size-2.5" /> {slaElapsed(c.created_at)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <NovoChamadoModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />
      )}
    </AppShell>
  );
}
