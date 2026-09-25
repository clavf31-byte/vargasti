import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard, EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Search, Trash2, Banknote, CheckCircle2, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { createEvento } from "@/lib/api/agenda.functions";

export const Route = createFileRoute("/crm/pagamentos")({
  head: () => ({ meta: [{ title: `Pagamentos · CRM ${client.name}` }] }),
  component: PagamentosPage,
});

type Pagamento = {
  id: string;
  orcamento_id: string;
  valor: number;
  data_pagamento: string;
  metodo?: string | null;
  referencia?: string | null;
  status: "pendente" | "pago" | "cancelado";
  agenda_evento_id?: string | null;
};

function ModalAgendarPagamento({ pag, onClose, onConfirm }: {
  pag: Pagamento;
  onClose: () => void;
  onConfirm: (dataAgendamento: string) => Promise<void>;
}) {
  const [dataAgendamento, setDataAgendamento] = useState<string>(() => {
    const d = new Date(pag.data_pagamento);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card-graphite w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Agendar Pagamento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="bg-surface rounded-lg p-3 space-y-1">
          <p className="text-[11px] text-muted-foreground">Referência</p>
          <p className="text-sm font-semibold text-foreground">{pag.referencia || "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Valor</p>
          <p className="text-xl font-bold text-select">R$ {pag.valor.toFixed(2)}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">📅 Data do Agendamento</label>
          <input
            type="date"
            value={dataAgendamento}
            onChange={(e) => setDataAgendamento(e.target.value)}
            className="input-base w-full"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Será adicionado à sua Agenda nessa data</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-surface-2 transition-colors">
            Cancelar
          </button>
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); await onConfirm(dataAgendamento); }}
            className="flex-1 py-2.5 rounded-lg bg-select text-select-foreground text-sm font-bold hover:bg-select/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Agendando..." : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalPagamento({ pag, onClose, onConfirm }: {
  pag: Pagamento;
  onClose: () => void;
  onConfirm: (valorPago: number) => Promise<void>;
}) {
  const [valorPago, setValorPago] = useState(pag.valor.toFixed(2));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = parseFloat(valorPago) || 0;
  const saldo = Math.max(0, pag.valor - parsed);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card-graphite w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Registrar Pagamento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="bg-surface rounded-lg p-3 space-y-1">
          <p className="text-[11px] text-muted-foreground">Referência</p>
          <p className="text-sm font-semibold text-foreground">{pag.referencia || "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Valor total</p>
          <p className="text-xl font-bold text-select">R$ {pag.valor.toFixed(2)}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Valor pago</label>
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            min="0.01"
            max={pag.valor}
            value={valorPago}
            onChange={(e) => setValorPago(e.target.value)}
            className="input-base w-full text-lg font-bold"
          />
        </div>

        {saldo > 0.009 && (
          <div className="rounded-lg p-3 bg-warning/10 border border-warning/30">
            <p className="text-xs font-semibold text-warning">Saldo restante a quitar</p>
            <p className="text-lg font-bold text-warning">R$ {saldo.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Um novo registro pendente será criado pelo saldo.</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-surface-2 transition-colors">
            Cancelar
          </button>
          <button
            disabled={saving || parsed <= 0}
            onClick={async () => { setSaving(true); await onConfirm(parsed); }}
            className="flex-1 py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PagamentosPage() {
  const { user } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [filtrados, setFiltrados] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [modalPag, setModalPag] = useState<Pagamento | null>(null);
  const [modalAgendar, setModalAgendar] = useState<Pagamento | null>(null);

  const loadPagamentos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("user_id", user.id)
      .order("data_pagamento", { ascending: false });
    setPagamentos((data as Pagamento[]) || []);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadPagamentos().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    let r = pagamentos;
    if (statusFilter) r = r.filter((p) => p.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter((p) =>
        (p.referencia ?? "").toLowerCase().includes(q) ||
        (p.metodo ?? "").toLowerCase().includes(q)
      );
    }
    setFiltrados(r);
  }, [pagamentos, searchTerm, statusFilter]);

  async function confirmarPagamento(pag: Pagamento, valorPago: number) {
    const hoje = new Date().toISOString().split("T")[0];
    const saldo = Math.round((pag.valor - valorPago) * 100) / 100;

    await supabase
      .from("pagamentos")
      .update({ status: "pago", valor: valorPago, data_pagamento: hoje })
      .eq("id", pag.id);

    if (saldo > 0.009) {
      await (supabase as any).from("pagamentos").insert({
        orcamento_id: pag.orcamento_id,
        user_id: user!.id,
        valor: saldo,
        status: "pendente",
        data_pagamento: hoje,
        referencia: pag.referencia ? `${pag.referencia} (saldo)` : null,
      });
    }

    const { data: existingOS } = await (supabase as any)
      .from("ordens_servico")
      .select("id")
      .eq("orcamento_id", pag.orcamento_id)
      .maybeSingle();

    if (!existingOS) {
      const { data: orc } = await supabase
        .from("orcamentos")
        .select("cliente_id, notas, numero_formatado")
        .eq("id", pag.orcamento_id)
        .single();

      if (orc) {
        const year = new Date().getFullYear();
        const { count } = await (supabase as any)
          .from("ordens_servico")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id);
        const seq = String((count ?? 0) + 1).padStart(6, "0");

        await (supabase as any).from("ordens_servico").insert({
          user_id: user!.id,
          cliente_id: (orc as any).cliente_id,
          orcamento_id: pag.orcamento_id,
          numero_formatado: `OS-${year}-${seq}`,
          descricao: (orc as any).notas ?? (orc as any).numero_formatado,
          status: "aberta",
          prioridade: "normal",
          data_inicio: hoje,
        });
      }
    }

    setModalPag(null);
    loadPagamentos();
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este pagamento?")) return;
    await supabase.from("pagamentos").delete().eq("id", id);
    loadPagamentos();
  };

  const handleAgendarPagamento = async (pag: Pagamento, dataAgendamento: string) => {
    try {
      const titulo = `💰 Receber R$ ${pag.valor.toFixed(2)} - ${pag.referencia || pag.orcamento_id.slice(0, 8)}`;
      const evento = await createEvento({
        data: {
          titulo,
          descricao: null,
          tipo: "lembrete" as const,
          data_inicio: `${dataAgendamento}T09:00:00`,
          data_fim: null,
          dia_inteiro: true,
          local: null,
          status: "agendado" as const,
          prioridade: "normal" as const,
          cliente_id: null,
          chamado_id: null,
          os_id: null,
          notificar_whatsapp: false,
          notificar_numero: null,
          notificar_minutos_antes: 30,
        }
      });

      // Vincular evento à pagamento
      if (evento?.id) {
        await supabase
          .from("pagamentos")
          .update({ agenda_evento_id: evento.id })
          .eq("id", pag.id);
      }

      setModalAgendar(null);
      loadPagamentos();
    } catch (err: any) {
      console.error("Erro ao agendar:", err);
      alert(`Erro ao agendar: ${err?.message || "Tente novamente."}`);
    }
  };

  const totalPago     = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + (p.valor || 0), 0);
  const totalPendente = pagamentos.filter((p) => p.status === "pendente").reduce((s, p) => s + (p.valor || 0), 0);
  const qtdPendente   = pagamentos.filter((p) => p.status === "pendente").length;

  const statuses = ["pendente", "pago", "cancelado"];

  const STATUS_ACTIVE_CLS: Record<string, string> = {
    pendente:  "bg-warning text-white border-warning",
    pago:      "bg-brand text-brand-foreground border-brand",
    cancelado: "bg-destructive text-destructive-foreground border-destructive",
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Pagamentos"
          icon={Banknote}
          iconClass="text-brand"
          subtitle={`${pagamentos.length} total · ${filtrados.length} exibindo`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Recebido" value={`R$ ${totalPago.toFixed(2)}`} colorClass="text-brand" />
          <StatCard label="A Receber" value={`R$ ${totalPendente.toFixed(2)}`} colorClass="text-warning" />
          <StatCard label="Pendentes" value={qtdPendente} colorClass="text-warning" />
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por referência ou método..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface/60 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-select/60 focus:ring-2 focus:ring-select/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
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
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title={pagamentos.length === 0 ? "Nenhum pagamento registrado" : "Nenhum pagamento encontrado"}
          />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {["Referência", "Valor", "Status", "Data", "Método", "Agendamento", "Ações"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 6 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((pag) => (
                  <tr key={pag.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-select">
                      {pag.referencia || pag.orcamento_id.slice(0, 8) + "..."}
                    </td>
                    <td className={cn("px-4 py-3 font-semibold", pag.status === "pago" ? "text-brand" : "text-warning")}>
                      R$ {pag.valor.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pag.status ?? "pendente"} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(pag.data_pagamento).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{pag.metodo || "—"}</td>
                    <td className="px-4 py-3">
                      {pag.agenda_evento_id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-select">
                          <Calendar className="size-3.5" />
                          Agendado
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {pag.status === "pendente" && (
                          <>
                            <button
                              onClick={() => setModalAgendar(pag)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-select/40 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                              title="Adicionar à agenda"
                            >
                              <Calendar className="size-3.5" />
                              Agendar
                            </button>
                            <button
                              onClick={() => setModalPag(pag)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-brand/40 text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
                              title="Registrar pagamento recebido"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Pago
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(pag.id)}
                          className="inline-flex items-center justify-center p-2 border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
                          title="Deletar pagamento"
                        >
                          <Trash2 className="size-4" />
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

      {modalPag && (
        <ModalPagamento
          pag={modalPag}
          onClose={() => setModalPag(null)}
          onConfirm={(valor) => confirmarPagamento(modalPag, valor)}
        />
      )}

      {modalAgendar && (
        <ModalAgendarPagamento
          pag={modalAgendar}
          onClose={() => setModalAgendar(null)}
          onConfirm={(data) => handleAgendarPagamento(modalAgendar, data)}
        />
      )}
    </AppShell>
  );
}
