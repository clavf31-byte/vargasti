import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useAtendimento, type AtendimentoStatus, type AtendimentoPrioridade } from "@/hooks/useChamados";
import { AtendimentoUnificado } from "@/components/crm/AtendimentoUnificado";
import { AtendimentoProximosEventos } from "@/components/crm/AtendimentoProximosEventos";
import { OrcamentoFormInline } from "@/components/crm/OrcamentoFormInline";
import { InlineFormPanel } from "@/components/shared";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, MessageCircle, Search, Wrench, CheckCircle2,
  Circle, Clock, AlertTriangle, Calendar, User, Save, Loader2,
  Send, Info, FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/crm/atendimentos/$id")({
  head: () => ({ meta: [{ title: `Atendimento · ${client.name}` }] }),
  component: AtendimentoPage,
});

const STEPS: { key: AtendimentoStatus; label: string; sublabel: string; icon: typeof Circle }[] = [
  { key: "aberto",       label: "Aberto",        sublabel: "Atendimento registrado",     icon: MessageCircle },
  { key: "em_triagem",   label: "Em Triagem",    sublabel: "Analisando o problema",  icon: Search },
  { key: "em_andamento", label: "Em Andamento",  sublabel: "Técnico atuando",        icon: Wrench },
  { key: "concluido",    label: "Concluído",     sublabel: "Problema resolvido",     icon: CheckCircle2 },
];

const STATUS_ORDER: AtendimentoStatus[] = ["aberto", "em_triagem", "em_andamento", "concluido"];

const PRIO_CFG: Record<AtendimentoPrioridade, { label: string; cls: string; icon: typeof AlertTriangle | null }> = {
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

function AtendimentoPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { atendimento, loading, comentarios, loadingComentarios, update, addComentario } = useAtendimento(id, user?.id);

  const [anotacoes, setAnotacoes] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [sendingComent, setSendingComent] = useState(false);
  const [isOrcamentoFormOpen, setIsOrcamentoFormOpen] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const comentariosEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("clientes").select("id, nome").eq("user_id", user.id).order("nome").then(({ data }: any) => {
      if (data) setClientes(data);
    });
  }, [user]);

  useEffect(() => {
    comentariosEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comentarios.length]);

  const anotacoesValue = anotacoes ?? atendimento?.anotacoes ?? "";
  const currentStepIdx = STATUS_ORDER.indexOf(atendimento?.status ?? "aberto");

  const STATUS_LABELS: Record<AtendimentoStatus, string> = {
    aberto: "Aberto", em_triagem: "Em triagem", em_andamento: "Em andamento", concluido: "Concluído",
  };

  const handleStatusChange = async (status: AtendimentoStatus) => {
    const changes: Record<string, unknown> = { status };
    if (status === "em_andamento" && !atendimento?.data_inicio) {
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

  if (!atendimento) {
    return (
      <AppShell>
        <div className="p-8 text-center text-muted-foreground">Atendimento não encontrado.</div>
      </AppShell>
    );
  }

  const prio = PRIO_CFG[atendimento.prioridade] ?? PRIO_CFG.normal;
  const PrioIcon = prio.icon;

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">

        {/* BACK + HEADER */}
        <div className="space-y-4">
          <button
            onClick={() => navigate({ to: "/crm/atendimentos" })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Voltar para Atendimentos
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {atendimento.numero_formatado && (
                <span className="text-xs font-mono text-muted-foreground/60 bg-surface-2 border border-border px-2 py-0.5 rounded">
                  {atendimento.numero_formatado}
                </span>
              )}
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${prio.cls}`}>
                {PrioIcon && <PrioIcon className="size-2.5" />}
                {prio.label}
              </span>
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <Clock className="size-2.5" />
                {atendimento.status === "concluido" ? "Resolvido em " : "Aberto há "}
                {slaElapsed(atendimento.created_at, atendimento.data_conclusao)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{atendimento.titulo}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" /> {fmtDate(atendimento.created_at)}
              {atendimento.cliente_nome && atendimento.cliente_nome !== "—" && (
                <> · <User className="size-3" /> {atendimento.cliente_nome}</>
              )}
            </p>
          </div>
        </div>

        {/* PRÓXIMOS EVENTOS */}
        <AtendimentoProximosEventos atendimentoId={atendimento.id} dataAgendamento={atendimento.data_agendamento} />

        {/* CRIAR ORÇAMENTO */}
        <div className="card-graphite p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-muted-foreground" />
            <div>
              <h3 className="text-xs font-semibold text-foreground">Orçamento</h3>
              <p className="text-xs text-muted-foreground/70">{atendimento.orcamento_id ? "Vinculado" : "Nenhum orçamento ainda"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOrcamentoFormOpen(true)}
            className="px-3 py-1.5 bg-info/20 text-info hover:bg-info/30 border border-info/30 rounded-lg text-xs font-semibold transition-colors"
          >
            + Criar Orçamento
          </button>
        </div>

        <InlineFormPanel open={isOrcamentoFormOpen}>
          <OrcamentoFormInline
            userId={user!.id}
            clientes={clientes}
            onSuccess={() => { setIsOrcamentoFormOpen(false); }}
            isOpen={isOrcamentoFormOpen}
            onClose={() => setIsOrcamentoFormOpen(false)}
            atendimento_id={atendimento.id}
            cliente_id_pre={atendimento.cliente_id}
          />
        </InlineFormPanel>

        {/* UNIFIED VIEW - SINGLE MODE */}
        <AtendimentoUnificado
          atendimento={atendimento}
          clientes={clientes}
          onNavigateBack={() => navigate({ to: "/crm/atendimentos" })}
        />
      </div>
    </AppShell>
  );
}
