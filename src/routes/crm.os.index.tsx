import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard, EmptyState, LoadingState, StatusBadge, Btn, InlineFormPanel } from "@/components/shared";
import { Search, Wrench, CheckCircle2, Trash2, Plus, X, Pencil, Eye } from "lucide-react";
import { atualizarStatusOS, atualizarOrdemServico } from "@/hooks/useOrdenServico";
import { OSForm, type OSFormValues } from "@/components/crm/OSForm";
import { TimelineStatus } from "@/components/crm/TimelineStatus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/os/")({
  head: () => ({ meta: [{ title: `Ordens de Serviço · CRM ${client.name}` }] }),
  component: OrdensServicoPage,
});

type OS = {
  id: string;
  numero_formatado: string;
  status: "aberta" | "em_andamento" | "concluida" | "cancelada";
  prioridade: string;
  descricao?: string;
  solucao?: string;
  data_inicio: string;
  data_conclusao?: string;
  tecnico?: string;
  cliente?: { id: string; nome: string } | null;
  orcamento?: { numero_formatado: string } | null;
  orcamento_id?: string;
};

const STATUS_LABELS: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const PRIORIDADE_CLS: Record<string, string> = {
  baixa:  "text-muted-foreground",
  normal: "text-select",
  alta:   "text-destructive",
};

const STATUS_ACTIVE_CLS: Record<string, string> = {
  aberta:       "bg-info text-white border-info",
  em_andamento: "bg-warning text-white border-warning",
  concluida:    "bg-brand text-brand-foreground border-brand",
  cancelada:    "bg-destructive text-destructive-foreground border-destructive",
};

function NovaOSForm({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("clientes").select("id, nome").eq("user_id", userId).order("nome").then(({ data }) => setClientes(data || []));
  }, [userId]);

  const handleSubmit = async (values: OSFormValues) => {
    if (!clienteId) return;
    setSaving(true);
    try {
      const { data: numero, error: numErr } = await supabase.rpc("gerar_numero_os", { _user_id: userId });
      if (numErr) throw numErr;
      const { error } = await supabase.from("ordens_servico").insert([{
        user_id: userId,
        cliente_id: clienteId,
        numero_formatado: numero,
        descricao: values.descricao || null,
        solucao: values.solucao || null,
        prioridade: values.prioridade,
        tecnico: values.tecnico || null,
        data_inicio: values.data_inicio,
        status: "aberta",
      }]);
      if (error) throw error;
      onCreated();
      onClose();
    } catch (err) {
      alert("Erro ao criar OS: " + (err instanceof Error ? err.message : "Erro"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-graphite p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Nova Ordem de Serviço</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="size-5" /></button>
      </div>
      <OSForm canSubmit={!!clienteId} saving={saving} submitLabel="Criar OS" onSubmit={handleSubmit} onCancel={onClose}>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cliente *</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input-base w-full" required>
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </OSForm>
    </div>
  );
}

type OSDetailed = OS & {
  orcamento_data?: { numero_formatado: string; status_enum: string; data_criacao: string; total: number } | null;
  pagamento?: { status: string; data_pagamento?: string; valor: number } | null;
};

function OrdensServicoPage() {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [filtradas, setFiltradas] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<OS | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewing, setViewing] = useState<OSDetailed | null>(null);

  const loadOrdens = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ordens_servico")
      .select("*, cliente:cliente_id(id, nome), orcamento:orcamento_id(numero_formatado)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrdens((data as OS[]) || []);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadOrdens().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    let r = ordens;
    if (statusFilter) r = r.filter((o) => o.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter((o) =>
        (o.numero_formatado ?? "").toLowerCase().includes(q) ||
        (o.cliente?.nome ?? "").toLowerCase().includes(q) ||
        (o.tecnico ?? "").toLowerCase().includes(q)
      );
    }
    setFiltradas(r);
  }, [ordens, searchTerm, statusFilter]);

  async function handleStatus(id: string, novoStatus: OS["status"]) {
    await atualizarStatusOS(id, novoStatus);
    loadOrdens();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza?")) return;
    await supabase.from("ordens_servico").delete().eq("id", id);
    loadOrdens();
  }

  async function handleEdit(values: OSFormValues) {
    if (!editing) return;
    setSavingEdit(true);
    const res = await atualizarOrdemServico(editing.id, {
      descricao: values.descricao || null,
      solucao: values.solucao || null,
      prioridade: values.prioridade,
      data_inicio: values.data_inicio,
      tecnico: values.tecnico || null,
    });
    setSavingEdit(false);
    if (res.success) {
      setEditing(null);
      loadOrdens();
    } else {
      alert("Erro ao salvar: " + res.error);
    }
  }

  async function handleViewDetails(os: OS) {
    if (!user || !os.orcamento_id) return;
    const { data: orcData } = await supabase
      .from("orcamentos")
      .select("numero_formatado, status_enum, data_criacao, total")
      .eq("id", os.orcamento_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: pagData } = await supabase
      .from("pagamentos")
      .select("status, data_pagamento, valor")
      .eq("orcamento_id", os.orcamento_id)
      .eq("user_id", user.id)
      .maybeSingle();

    setViewing({
      ...os,
      orcamento_data: orcData,
      pagamento: pagData,
    } as OSDetailed);
  }

  function buildTimelineEtapas(detailed: OSDetailed) {
    const etapas: Array<{ label: string; data: string; status: "concluido" | "em_progresso" | "aguardando" }> = [];
    let etapaAtual = 0;

    // Orçamento
    const orcStatus = detailed.orcamento_data?.status_enum || "rascunho";
    const orcData = detailed.orcamento_data?.data_criacao ? new Date(detailed.orcamento_data.data_criacao).toLocaleDateString("pt-BR") : "—";
    etapas.push({
      label: "Orçamento",
      data: orcData,
      status: orcStatus === "aprovado" ? "concluido" : orcStatus === "rascunho" || orcStatus === "enviado" ? "em_progresso" : "aguardando",
    });
    if (orcStatus === "aprovado") etapaAtual = 1;

    // OS
    const osStatus = detailed.status;
    const osData = new Date(detailed.data_inicio).toLocaleDateString("pt-BR");
    etapas.push({
      label: "OS",
      data: osData,
      status: osStatus === "concluida" ? "concluido" : osStatus === "aberta" || osStatus === "em_andamento" ? "em_progresso" : "aguardando",
    });
    if (osStatus === "concluida") etapaAtual = 2;
    else if (osStatus === "aberta" || osStatus === "em_andamento") etapaAtual = 1;

    // Pagamento
    const pagData = detailed.pagamento?.data_pagamento ? new Date(detailed.pagamento.data_pagamento).toLocaleDateString("pt-BR") : "—";
    etapas.push({
      label: "Pagamento",
      data: pagData,
      status: detailed.pagamento?.status === "pago" ? "concluido" : detailed.pagamento?.status === "pendente" ? "em_progresso" : "aguardando",
    });
    if (detailed.pagamento?.status === "pago") etapaAtual = 3;
    else if (detailed.pagamento?.status === "pendente") etapaAtual = 2;

    return { etapas, etapaAtual: Math.min(etapaAtual, etapas.length - 1) };
  }

  const qtdAberta    = ordens.filter((o) => o.status === "aberta").length;
  const qtdAndamento = ordens.filter((o) => o.status === "em_andamento").length;
  const qtdConcluida = ordens.filter((o) => o.status === "concluida").length;

  const statuses = ["aberta", "em_andamento", "concluida", "cancelada"] as const;

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Ordens de Serviço"
          icon={Wrench}
          iconClass="text-select"
          subtitle={`${ordens.length} total · ${filtradas.length} exibindo`}
          actions={
            <Btn variant="primary" onClick={() => setIsFormOpen((v) => !v)}>
              <Plus className="size-4" /> {isFormOpen ? "Cancelar" : "Nova OS"}
            </Btn>
          }
        />

        <InlineFormPanel open={isFormOpen}>
          <NovaOSForm userId={user!.id} onClose={() => setIsFormOpen(false)} onCreated={loadOrdens} />
        </InlineFormPanel>

        <InlineFormPanel open={!!editing}>
          {editing && (
            <div className="card-graphite p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  Editar {editing.numero_formatado || "OS"}
                </h2>
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="size-5" /></button>
              </div>
              <OSForm
                initial={{
                  descricao: editing.descricao ?? "",
                  solucao: editing.solucao ?? "",
                  prioridade: (editing.prioridade as OSFormValues["prioridade"]) || "normal",
                  data_inicio: editing.data_inicio ? editing.data_inicio.split("T")[0] : undefined,
                  tecnico: editing.tecnico ?? "",
                }}
                submitLabel="Salvar"
                saving={savingEdit}
                onSubmit={handleEdit}
                onCancel={() => setEditing(null)}
              />
            </div>
          )}
        </InlineFormPanel>

        <InlineFormPanel open={!!viewing}>
          {viewing && (() => {
            const { etapas, etapaAtual } = buildTimelineEtapas(viewing);
            return (
              <div className="card-graphite p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">
                    {viewing.numero_formatado || "OS"}
                  </h2>
                  <button onClick={() => setViewing(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="size-5" /></button>
                </div>

                <TimelineStatus etapas={etapas} etapaAtual={etapaAtual} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                    <p className="text-sm text-foreground">{viewing.cliente?.nome || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <StatusBadge status={viewing.status} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prioridade</p>
                    <p className={cn("text-sm font-semibold capitalize", PRIORIDADE_CLS[viewing.prioridade])}>{viewing.prioridade}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Técnico</p>
                    <p className="text-sm text-foreground">{viewing.tecnico || "—"}</p>
                  </div>
                  {viewing.descricao && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{viewing.descricao}</p>
                    </div>
                  )}
                  {viewing.solucao && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Solução</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{viewing.solucao}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </InlineFormPanel>

        <div className={`space-y-5 transition-opacity duration-300 ${isFormOpen || editing ? "opacity-40 pointer-events-none select-none" : ""}`}>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Abertas" value={qtdAberta} colorClass="text-info" />
          <StatCard label="Em Andamento" value={qtdAndamento} colorClass="text-warning" />
          <StatCard label="Concluídas" value={qtdConcluida} colorClass="text-brand" />
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface/60 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-select/60 focus:ring-2 focus:ring-select/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full border capitalize transition-colors",
                  statusFilter === s
                    ? STATUS_ACTIVE_CLS[s]
                    : "text-muted-foreground border-border hover:border-muted-foreground/40"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={ordens.length === 0 ? "Nenhuma OS criada. Converta um orçamento aprovado em OS." : "Nenhuma OS encontrada"}
          />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {["Número", "Cliente", "Status", "Prioridade", "Orçamento", "Data", "Técnico", "Ações"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 7 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((os) => (
                  <tr key={os.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-select">{os.numero_formatado || os.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-foreground">{os.cliente?.nome || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={os.status} /></td>
                    <td className={cn("px-4 py-3 text-xs font-semibold capitalize", PRIORIDADE_CLS[os.prioridade])}>
                      {os.prioridade}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{os.orcamento?.numero_formatado || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(os.data_inicio).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{os.tecnico || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {os.status === "aberta" && (
                          <button onClick={() => handleStatus(os.id, "em_andamento")}
                            className="px-2 py-1 text-xs font-semibold border border-warning/30 text-warning bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors">
                            Iniciar
                          </button>
                        )}
                        {os.status === "em_andamento" && (
                          <button onClick={() => handleStatus(os.id, "concluida")}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border border-brand/30 text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors">
                            <CheckCircle2 className="size-3" /> Concluir
                          </button>
                        )}
                        <button onClick={() => handleViewDetails(os)}
                          className="inline-flex items-center justify-center p-1.5 border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                          title="Ver detalhes">
                          <Eye className="size-3.5" />
                        </button>
                        <button onClick={() => setEditing(os)}
                          className="inline-flex items-center justify-center p-1.5 border border-border text-muted-foreground bg-surface-2/40 rounded-lg hover:text-foreground hover:border-muted-foreground/40 transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDelete(os.id)}
                          className="inline-flex items-center justify-center p-1.5 border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </AppShell>
  );
}
