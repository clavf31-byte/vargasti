import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useChamado, type ChamadoStatus, type ChamadoPrioridade } from "@/hooks/useChamados";
import {
  ArrowLeft, MessageCircle, Search, Wrench, CheckCircle2,
  Circle, Clock, AlertTriangle, Calendar, User, Save, Loader2,
  Send, Info,
} from "lucide-react";

export const Route = createFileRoute("/crm/chamados/$id")({
  head: () => ({ meta: [{ title: "Chamado · VargasTI" }] }),
  component: ChamadoPage,
});

const STEPS: { key: ChamadoStatus; label: string; sublabel: string; icon: typeof Circle }[] = [
  { key: "aberto",       label: "Aberto",        sublabel: "Chamado registrado",     icon: MessageCircle },
  { key: "em_triagem",   label: "Em Triagem",    sublabel: "Analisando o problema",  icon: Search },
  { key: "em_andamento", label: "Em Andamento",  sublabel: "Técnico atuando",        icon: Wrench },
  { key: "concluido",    label: "Concluído",     sublabel: "Problema resolvido",     icon: CheckCircle2 },
];

const STATUS_ORDER: ChamadoStatus[] = ["aberto", "em_triagem", "em_andamento", "concluido"];

const PRIO_CFG: Record<ChamadoPrioridade, { label: string; cls: string; icon: typeof AlertTriangle | null }> = {
  alta:   { label: "Alta",   cls: "text-destructive bg-destructive/10 border-destructive/25", icon: AlertTriangle },
  normal: { label: "Média",  cls: "text-warning bg-warning/10 border-warning/25",             icon: null },
  baixa:  { label: "Baixa",  cls: "text-muted-foreground bg-surface-2 border-border",         icon: null },
};

function fmtDate(iso?: string | null, withTime = true) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function slaElapsed(createdAt: string, conclusao?: string | null) {
  const end = conclusao ? new Date(conclusao).getTime() : Date.now();
  const ms = end - new Date(createdAt).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}d ${rh}h`;
}

function ChamadoPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chamado, loading, comentarios, loadingComentarios, update, addComentario } = useChamado(id, user?.id);

  const [anotacoes, setAnotacoes] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [sendingComent, setSendingComent] = useState(false);
  const comentariosEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    comentariosEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comentarios.length]);

  const anotacoesValue = anotacoes ?? chamado?.anotacoes ?? "";
  const currentStepIdx = STATUS_ORDER.indexOf(chamado?.status ?? "aberto");

  const STATUS_LABELS: Record<ChamadoStatus, string> = {
    aberto: "Aberto", em_triagem: "Em triagem", em_andamento: "Em andamento", concluido: "Concluído",
  };

  const handleStatusChange = async (status: ChamadoStatus) => {
    const changes: Record<string, unknown> = { status };
    if (status === "em_andamento" && !chamado?.data_inicio) {
      changes.data_inicio = new Date().toISOString().split("T")[0];
    }
    if (status === "concluido") {
      changes.data_conclusao = new Date().toISOString().split("T")[0];
    }
    const logMsg = `Status alterado para "${STATUS_LABELS[status]}"`;
    await update(changes as Parameters<typeof update>[0], logMsg);
  };

  const handleSaveAnotacoes = async () => {
    setSaving(true);
    await update({ anotacoes: anotacoesValue });
    setSaving(false);
  };

  const handleSendComentario = async () => {
    if (!novoComentario.trim()) return;
    setSendingComent(true);
    await addComentario(novoComentario);
    setNovoComentario("");
    setSendingComent(false);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!chamado) {
    return (
      <AppShell>
        <div className="p-8 text-center text-muted-foreground">Chamado não encontrado.</div>
      </AppShell>
    );
  }

  const prio = PRIO_CFG[chamado.prioridade] ?? PRIO_CFG.normal;
  const PrioIcon = prio.icon;

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">

        {/* BACK + HEADER */}
        <div className="space-y-4">
          <button
            onClick={() => navigate({ to: "/crm/chamados" })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Voltar para Chamados
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {chamado.numero_formatado && (
                <span className="text-xs font-mono text-muted-foreground/60 bg-surface-2 border border-border px-2 py-0.5 rounded">
                  {chamado.numero_formatado}
                </span>
              )}
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${prio.cls}`}>
                {PrioIcon && <PrioIcon className="size-2.5" />}
                {prio.label}
              </span>
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <Clock className="size-2.5" />
                {chamado.status === "concluido" ? "Resolvido em " : "Aberto há "}
                {slaElapsed(chamado.created_at, chamado.data_conclusao)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{chamado.titulo}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" /> {fmtDate(chamado.created_at)}
              {chamado.cliente_nome && chamado.cliente_nome !== "—" && (
                <> · <User className="size-3" /> {chamado.cliente_nome}</>
              )}
            </p>
          </div>
        </div>

        {/* PROGRESS STEPS */}
        <div className="card-selectable p-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Progresso</p>
          <div className="relative">
            <div className="absolute top-6 left-6 right-6 h-px bg-border" />
            <div
              className="absolute top-6 left-6 h-px bg-gradient-to-r from-brand to-cyan-400 transition-all duration-500"
              style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * (100 - 12)}%` }}
            />
            <div className="relative grid grid-cols-4 gap-2">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done = idx <= currentStepIdx;
                const current = idx === currentStepIdx;
                return (
                  <button
                    key={step.key}
                    onClick={() => handleStatusChange(step.key)}
                    disabled={idx === currentStepIdx}
                    className="flex flex-col items-center gap-2 text-center group"
                  >
                    <div className={`relative z-10 grid place-items-center size-12 rounded-full border-2 transition-all ${
                      current
                        ? "bg-brand border-brand shadow-[0_0_20px_rgba(0,213,230,0.4)] scale-110"
                        : done
                          ? "bg-brand/20 border-brand/60 text-brand"
                          : "bg-surface-2 border-border text-muted-foreground/40 group-hover:border-brand/30 group-hover:text-muted-foreground"
                    }`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className={`text-[11px] font-bold ${done ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {step.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground/40 hidden sm:block">{step.sublabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

          {/* Left: descrição + anotações + comentários */}
          <div className="space-y-5">

            {chamado.descricao && (
              <div className="card-selectable p-5 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descrição</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{chamado.descricao}</p>
              </div>
            )}

            {/* Anotações internas */}
            <div className="card-selectable p-5 space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Anotações internas</p>
              <textarea
                value={anotacoesValue}
                onChange={(e) => setAnotacoes(e.target.value)}
                rows={4}
                placeholder="Diagnósticos, ações realizadas, observações..."
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/50 resize-none placeholder:text-muted-foreground/30"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAnotacoes}
                  disabled={saving || anotacoesValue === (chamado.anotacoes ?? "")}
                  className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-40"
                >
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Salvar
                </button>
              </div>
            </div>

            {/* Timeline de comentários */}
            <div className="card-selectable p-5 space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Histórico e comentários</p>

              {loadingComentarios ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : comentarios.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 text-center py-4">Nenhum comentário ainda.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {comentarios.map((c) => (
                    <div key={c.id} className={`flex gap-2.5 ${c.tipo === "sistema" ? "opacity-70" : ""}`}>
                      <div className={`shrink-0 size-6 rounded-full grid place-items-center mt-0.5 ${
                        c.tipo === "sistema" ? "bg-surface-2" : "bg-brand/20"
                      }`}>
                        {c.tipo === "sistema"
                          ? <Info className="size-3 text-muted-foreground" />
                          : <User className="size-3 text-brand" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold text-foreground">
                            {c.tipo === "sistema" ? "Sistema" : c.autor_nome}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {fmtDate(c.created_at)}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${c.tipo === "sistema" ? "text-muted-foreground italic" : "text-foreground"}`}>
                          {c.conteudo}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={comentariosEndRef} />
                </div>
              )}

              {/* Input novo comentário */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <input
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComentario(); } }}
                  placeholder="Adicionar comentário..."
                  className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/30"
                />
                <button
                  onClick={handleSendComentario}
                  disabled={!novoComentario.trim() || sendingComent}
                  className="px-3 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40"
                >
                  {sendingComent ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card-selectable p-5 space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Detalhes</p>
              <div className="space-y-3 text-xs">
                {chamado.cliente_nome && chamado.cliente_nome !== "—" && (
                  <div className="flex items-start gap-2">
                    <User className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Cliente</p>
                      <p className="font-semibold text-foreground">{chamado.cliente_nome}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Clock className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Abertura</p>
                    <p className="font-semibold text-foreground">{fmtDate(chamado.created_at)}</p>
                  </div>
                </div>
                {chamado.data_inicio && (
                  <div className="flex items-start gap-2">
                    <Wrench className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Início atendimento</p>
                      <p className="font-semibold text-foreground">{fmtDate(chamado.data_inicio, false)}</p>
                    </div>
                  </div>
                )}
                {chamado.data_conclusao && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Conclusão</p>
                      <p className="font-semibold text-foreground">{fmtDate(chamado.data_conclusao, false)}</p>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground mb-1">Tempo total</p>
                  <p className="text-lg font-bold text-brand">{slaElapsed(chamado.created_at, chamado.data_conclusao)}</p>
                </div>
              </div>
            </div>

            {/* Prioridade */}
            <div className="card-selectable p-5 space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Prioridade</p>
              <div className="space-y-1.5">
                {(["alta", "normal", "baixa"] as ChamadoPrioridade[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => update({ prioridade: p }, `Prioridade alterada para "${PRIO_CFG[p].label}"`)}
                    className={`w-full py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                      chamado.prioridade === p
                        ? PRIO_CFG[p].cls
                        : "border-border text-muted-foreground/50 hover:border-brand/30 hover:text-muted-foreground"
                    }`}
                  >
                    {PRIO_CFG[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
