import client from "@/config/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCRMMetrics } from "@/hooks/useCRMMetrics";
import { useEffect, useState } from "react";
import {
  Users, FileText, Banknote, Plus, TrendingUp, ScrollText,
  Clock, CheckCircle2, Mail, FileEdit, ChevronRight,
  FileSignature, AlertTriangle, CalendarClock, ListTodo, NotebookPen,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: `Dashboard · ${client.name}` }] }),
  component: Dashboard,
});

const ORC_STATUS: Record<string, { label: string; icon: typeof CheckCircle2; dotClass: string; pill: string }> = {
  aprovado:  { label: "Aprovado",  icon: CheckCircle2, dotClass: "bg-brand",             pill: "bg-brand/15 text-brand" },
  enviado:   { label: "Enviado",   icon: Mail,         dotClass: "bg-info",              pill: "bg-select/15 text-select" },
  rascunho:  { label: "Rascunho",  icon: FileEdit,     dotClass: "bg-muted-foreground",  pill: "bg-surface-2 text-muted-foreground" },
  rejeitado: { label: "Rejeitado", icon: FileEdit,     dotClass: "bg-destructive",       pill: "bg-destructive/15 text-destructive" },
};

const PRIORIDADE_CLS: Record<string, string> = {
  alta:   "text-destructive bg-destructive/10 border-destructive/20",
  media:  "text-warning bg-warning/10 border-warning/20",
  baixa:  "text-muted-foreground bg-surface-2 border-border",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  alta: "Alta", media: "Média", baixa: "Baixa",
};

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return `hoje ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff === 1) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmtVencimento(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d atrasada`;
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function Dashboard() {
  const { user } = useAuth();
  const metrics = useCRMMetrics();

  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "user";

  const hour = time.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const {
    orcamentosCount, orcamentosStatus, orcamentosTotalAberto,
    clientesCount, clientesComOrcamento,
    pagamentosCount, pagamentosTotal,
    contratosCount, contratosStatus,
    tarefasPendentes, tarefasAtrasadas, tarefasHoje,
    recentes,
  } = metrics;

  const orcAprovadosPct = orcamentosCount > 0
    ? Math.round((orcamentosStatus.aprovado / orcamentosCount) * 100) : 0;
  const clientesConvPct = clientesCount > 0
    ? Math.round((clientesComOrcamento / clientesCount) * 100) : 0;
  const contratosAssPct = contratosCount > 0
    ? Math.round((contratosStatus.assinado / contratosCount) * 100) : 0;

  const actions = [
    { to: "/crm/clientes",   icon: Users,          label: "Novo Cliente",   desc: "Cadastrar cliente",   cls: "bg-brand/10 border-brand/20 text-brand" },
    { to: "/crm/orcamentos", icon: FileText,        label: "Novo Orçamento", desc: "Criar orçamento",     cls: "bg-info/10 border-info/20 text-info" },
    { to: "/crm/contratos",  icon: ScrollText,      label: "Novo Contrato",  desc: "Criar contrato",      cls: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
    { to: "/crm/pagamentos", icon: Banknote,        label: "Reg. Pagamento", desc: "Adicionar pagamento", cls: "bg-warning/10 border-warning/20 text-warning" },
    { to: "/crm/tarefas",    icon: ListTodo,        label: "Nova Tarefa",    desc: "Criar tarefa",        cls: "bg-teal-500/10 border-teal-500/20 text-teal-400" },
    { to: "/anotacoes",      icon: NotebookPen,     label: "Nova Anotação",  desc: "Criar anotação",      cls: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
    { to: "/crm",            icon: TrendingUp,      label: "CRM Dashboard",  desc: "Ver métricas",        cls: "bg-surface-2 border-border text-muted-foreground" },
  ];

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              {time.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">
              {greeting}, <span className="text-brand">{firstName}</span>
            </h1>
          </div>
          <div className="text-right shrink-0">
            <div className="text-5xl md:text-6xl font-light text-brand font-mono tabular-nums leading-none">
              {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3">
              <span className="size-1.5 bg-brand rounded-full status-pulse" />
              <span className="text-xs text-brand font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* KPI CARDS — 4 cards */}
        <section className="space-y-3.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-select" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Métricas Principais</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Clientes"
              value={String(clientesCount).padStart(2, "0")}
              icon={Users}
              to="/crm/clientes"
              gradient="blue"
              badge={clientesCount > 0 ? { text: `${clientesComOrcamento} com orç.`, variant: "up" } : undefined}
              breakdown={[
                { val: String(clientesCount), lbl: "Total", colorClass: "text-info" },
                { val: String(clientesComOrcamento), lbl: "Com orçam." },
                { val: String(clientesCount - clientesComOrcamento), lbl: "Sem orçam.", colorClass: "text-muted-foreground" },
              ]}
              footer={{ label: "Taxa de conversão", value: `${clientesConvPct}%` }}
              progress={clientesConvPct}
            />
            <KpiCard
              label="Orçamentos"
              value={String(orcamentosCount).padStart(2, "0")}
              icon={FileText}
              to="/crm/orcamentos"
              gradient="purple"
              badge={orcamentosStatus.enviado > 0
                ? { text: `${orcamentosStatus.enviado} pendente${orcamentosStatus.enviado > 1 ? "s" : ""}`, variant: "warn" }
                : undefined}
              breakdown={[
                { val: String(orcamentosStatus.aprovado), lbl: "Aprovados", colorClass: "text-brand" },
                { val: String(orcamentosStatus.enviado),  lbl: "Enviados",  colorClass: "text-info" },
                { val: String(orcamentosStatus.rascunho), lbl: "Rascunho",  colorClass: "text-muted-foreground" },
              ]}
              footer={{ label: "Total em aberto", value: fmtBRL(orcamentosTotalAberto) }}
              progress={orcAprovadosPct}
            />
            <KpiCard
              label="Contratos"
              value={String(contratosCount).padStart(2, "0")}
              icon={FileSignature}
              to="/crm/contratos"
              gradient="amber"
              badge={contratosStatus.enviado > 0
                ? { text: `${contratosStatus.enviado} ag. assinatura`, variant: "warn" }
                : undefined}
              breakdown={[
                { val: String(contratosStatus.assinado), lbl: "Assinados",  colorClass: "text-brand" },
                { val: String(contratosStatus.enviado),  lbl: "Enviados",   colorClass: "text-info" },
                { val: String(contratosStatus.rascunho), lbl: "Rascunho",   colorClass: "text-muted-foreground" },
              ]}
              footer={{ label: "Taxa de assinatura", value: `${contratosAssPct}%` }}
              progress={contratosAssPct}
            />
            <KpiCard
              label="Pagamentos"
              value={String(pagamentosCount).padStart(2, "0")}
              icon={Banknote}
              to="/crm/pagamentos"
              gradient="blue"
              breakdown={[
                { val: fmtBRL(pagamentosTotal), lbl: "Total recebido", colorClass: "text-brand" },
                { val: String(pagamentosCount), lbl: "Registros" },
                { val: "—", lbl: "Pendentes", colorClass: "text-muted-foreground" },
              ]}
              footer={{ label: "Receita registrada", value: fmtBRL(pagamentosTotal) }}
              progress={pagamentosTotal > 0 ? Math.min(100, (pagamentosTotal / 10000) * 100) : 0}
            />
          </div>
        </section>

        {/* TAREFAS PENDENTES */}
        {(tarefasPendentes.length > 0 || tarefasAtrasadas > 0) && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-select" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Tarefas Pendentes</p>
                {tarefasAtrasadas > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-2 py-0.5">
                    <AlertTriangle className="size-2.5" />
                    {tarefasAtrasadas} atrasada{tarefasAtrasadas > 1 ? "s" : ""}
                  </span>
                )}
                {tarefasHoje > 0 && (
                  <span className="text-[10px] font-semibold text-warning bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5">
                    {tarefasHoje} para hoje
                  </span>
                )}
              </div>
              <Link to="/crm/tarefas" className="text-[10px] text-brand hover:underline font-medium">
                Ver todas
              </Link>
            </div>
            <div className="card-selectable divide-y divide-white/[0.04] overflow-hidden">
              {tarefasPendentes.map((t) => (
                <Link
                  key={t.id}
                  to="/crm/tarefas"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className={`size-1.5 rounded-full shrink-0 ${t.atrasada ? "bg-destructive" : t.data_vencimento === new Date().toISOString().split("T")[0] ? "bg-warning" : "bg-muted-foreground/40"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.titulo}</p>
                    <p className={`text-[10px] font-medium ${t.atrasada ? "text-destructive" : "text-muted-foreground"}`}>
                      {fmtVencimento(t.data_vencimento)}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${PRIORIDADE_CLS[t.prioridade] ?? PRIORIDADE_CLS.baixa}`}>
                    {PRIORIDADE_LABEL[t.prioridade] ?? t.prioridade}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* BOTTOM: AÇÕES + RECENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">

          {/* AÇÕES RÁPIDAS */}
          <section className="space-y-3.5">
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-select" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ações Rápidas</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {actions.map(({ to, icon: Icon, label, desc, cls }) => (
                <Link
                  key={to + label}
                  to={to}
                  className="card-selectable hover:card-selectable-hover p-3 flex items-center gap-2.5"
                >
                  <div className={`size-8 rounded-xl border ${cls} grid place-items-center shrink-0`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ORÇAMENTOS RECENTES */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-select" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Orçamentos Recentes</p>
              </div>
              <Link to="/crm/orcamentos" className="text-[10px] text-brand hover:underline font-medium">
                Ver todos
              </Link>
            </div>

            <div className="card-selectable divide-y divide-white/[0.04] overflow-hidden">
              {recentes.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum orçamento criado ainda
                </div>
              ) : (
                recentes.map((o) => {
                  const cfg = ORC_STATUS[o.status_enum] ?? ORC_STATUS.rascunho;
                  return (
                    <Link
                      key={o.id}
                      to={`/crm/orcamentos/${o.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className={`size-2 rounded-full shrink-0 ${cfg.dotClass}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{o.cliente_nome}</p>
                        <p className="text-[10px] text-muted-foreground">{o.numero_formatado} · {fmtDate(o.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{fmtBRL(o.total)}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.pill}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

        </div>

      </div>
    </AppShell>
  );
}
