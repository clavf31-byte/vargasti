import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { OrcamentoItensTable } from "@/components/crm/OrcamentoItensTable";
import { OrcamentoItemForm } from "@/components/crm/OrcamentoItemForm";
import { ArrowLeft, ChevronDown, ChevronUp, FileSpreadsheet, Wrench, CreditCard, CheckCircle2, Download, Share2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/orcamentos/unificado/$id")({
  head: () => ({ meta: [{ title: `Orçamento Unificado · CRM ${client.name}` }] }),
  component: OrcamentoUnificadoPage,
});

type Fase = "orcamento" | "os" | "pagamento";

const FASES: { key: Fase; label: string; icon: typeof FileSpreadsheet; cor: string }[] = [
  { key: "orcamento", label: "Orçamento", icon: FileSpreadsheet, cor: "bg-info/10 border-info/30 text-info" },
  { key: "os", label: "OS", icon: Wrench, cor: "bg-brand/10 border-brand/30 text-brand" },
  { key: "pagamento", label: "Pagamento", icon: CreditCard, cor: "bg-select/10 border-select/30 text-select" },
];

function OrcamentoUnificadoPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orcamento, setOrcamento] = useState<any>(null);
  const [os, setOs] = useState<any>(null);
  const [pagamento, setPagamento] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFase, setExpandedFase] = useState<Fase>("orcamento");
  const [showItemForm, setShowItemForm] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: orc } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      setOrcamento(orc);

      if (orc?.cliente_id) {
        const { data: cli } = await supabase
          .from("clientes")
          .select("*")
          .eq("id", orc.cliente_id)
          .single();
        setCliente(cli);
      }

      const { data: items } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", id)
        .order("created_at", { ascending: false });

      setItens(items || []);

      const { data: osData } = await supabase
        .from("ordens_servico")
        .select("*")
        .eq("orcamento_id", id)
        .single();

      if (osData) setOs(osData);

      const { data: pgto } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("orcamento_id", id)
        .single();

      if (pgto) setPagamento(pgto);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(item: any) {
    try {
      const { data } = await supabase
        .from("orcamento_itens")
        .insert([{
          orcamento_id: id,
          user_id: user!.id,
          ...item,
        }])
        .select();

      if (data) {
        setItens([...itens, data[0]]);

        const total = items.reduce((sum, i) => sum + (i.subtotal || 0), 0) + item.subtotal;
        await supabase.from("orcamentos").update({ total }).eq("id", id);
        await loadData();
      }
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
    }
  }

  async function handleApprovar() {
    try {
      await supabase
        .from("orcamentos")
        .update({ status: "aprovado", status_enum: "aprovado" })
        .eq("id", id);
      await loadData();
    } catch (err) {
      console.error("Erro ao aprovar:", err);
    }
  }

  async function handleRejeitarRevert() {
    try {
      await supabase
        .from("orcamentos")
        .update({ status: "rascunho", status_enum: "rascunho" })
        .eq("id", id);
      await loadData();
    } catch (err) {
      console.error("Erro ao reverter:", err);
    }
  }

  if (loading)
    return (
      <AppShell>
        <div className="p-6 text-center">Carregando...</div>
      </AppShell>
    );

  if (!orcamento)
    return (
      <AppShell>
        <div className="p-6 text-center">Orçamento não encontrado</div>
      </AppShell>
    );

  const statusCor = {
    rascunho: "text-muted-foreground",
    enviado: "text-info",
    aprovado: "text-brand",
    rejeitado: "text-destructive",
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate({ to: "/crm/orcamentos/" })} className="p-2 hover:bg-surface-2 rounded-lg transition">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{orcamento.numero_formatado}</h1>
            <p className="text-sm text-muted-foreground">{cliente?.nome}</p>
          </div>
          <div className="ml-auto">
            <span className={cn("text-sm font-semibold", statusCor[orcamento.status_enum || orcamento.status])}>
              {(orcamento.status_enum || orcamento.status).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="card-graphite p-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
            <p className="text-xl font-bold text-brand">R$ {(orcamento.total || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Válido até</p>
            <p className="text-sm">{new Date(orcamento.data_vencimento).toLocaleDateString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Criado em</p>
            <p className="text-sm">{new Date(orcamento.data_criacao).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {orcamento.status_enum === "rascunho" && (
            <>
              <button
                onClick={handleApprovar}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 transition"
              >
                <Check className="size-4" /> Aprovar
              </button>
              <button
                onClick={() => navigate({ to: "/crm/orcamentos/$id", params: { id } })}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-surface-2 transition"
              >
                Editar
              </button>
            </>
          )}

          {orcamento.status_enum !== "rascunho" && (
            <button
              onClick={handleRejeitarRevert}
              className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive rounded-lg text-sm font-semibold hover:bg-destructive/5 transition"
            >
              <X className="size-4" /> Reverter
            </button>
          )}

          <button
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-surface-2 transition"
          >
            <Share2 className="size-4" /> Compartilhar
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-surface-2 transition"
          >
            <Download className="size-4" /> PDF
          </button>
        </div>

        <div className="space-y-3">
          {FASES.map((fase) => (
            <div key={fase.key} className={cn("card-graphite border rounded-lg overflow-hidden", fase.cor)}>
              <button
                onClick={() => setExpandedFase(expandedFase === fase.key ? null : fase.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-2/40 transition"
              >
                <div className="flex items-center gap-3">
                  <fase.icon className="size-5" />
                  <span className="font-semibold">{fase.label}</span>
                  {fase.key === "orcamento" && itens.length > 0 && (
                    <span className="text-xs bg-current/20 px-2 py-1 rounded">{itens.length} itens</span>
                  )}
                  {fase.key === "os" && os && <CheckCircle2 className="size-4 ml-auto text-brand" />}
                  {fase.key === "pagamento" && pagamento && <CheckCircle2 className="size-4 ml-auto text-select" />}
                </div>
                {expandedFase === fase.key ? (
                  <ChevronUp className="size-5" />
                ) : (
                  <ChevronDown className="size-5" />
                )}
              </button>

              {expandedFase === fase.key && (
                <div className="p-4 border-t border-current/20 space-y-4">
                  {fase.key === "orcamento" && (
                    <>
                      {orcamento.descricao && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                          <p className="text-sm">{orcamento.descricao}</p>
                        </div>
                      )}

                      {orcamento.observacoes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Observações</p>
                          <p className="text-sm">{orcamento.observacoes}</p>
                        </div>
                      )}

                      {orcamento.local && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Local</p>
                          <p className="text-sm">{orcamento.local}</p>
                        </div>
                      )}

                      {orcamento.data_agendamento && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Data Agendada</p>
                          <p className="text-sm">{new Date(orcamento.data_agendamento).toLocaleDateString("pt-BR")}</p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-current/20">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-sm">Itens ({itens.length})</p>
                          <button
                            onClick={() => setShowItemForm(true)}
                            className="text-xs font-semibold text-brand hover:text-brand/80 flex items-center gap-1"
                          >
                            + Adicionar
                          </button>
                        </div>

                        {itens.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">Nenhum item adicionado</p>
                        ) : (
                          <div className="space-y-2 text-xs">
                            {itens.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between p-2 bg-surface/50 rounded border border-border/50"
                              >
                                <div>
                                  <p className="font-medium">{item.descricao}</p>
                                  <p className="text-muted-foreground">
                                    {item.quantidade} × R$ {item.preco_unitario.toFixed(2)}
                                  </p>
                                </div>
                                <p className="font-semibold">R$ {item.subtotal.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {fase.key === "os" && (
                    <>
                      {os ? (
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Número OS</p>
                            <p className="font-semibold">{os.numero_formatado}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <p className="font-semibold capitalize">{os.status}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Técnico</p>
                            <p className="font-semibold">{os.tecnico || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Data Início</p>
                            <p>{new Date(os.data_inicio).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          OS será criada automaticamente quando o orçamento for aprovado
                        </p>
                      )}
                    </>
                  )}

                  {fase.key === "pagamento" && (
                    <>
                      {pagamento ? (
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Valor</p>
                            <p className="text-lg font-bold">R$ {(pagamento.valor || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <p className="font-semibold capitalize">{pagamento.status}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Data Pagamento</p>
                            <p>{new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Pagamento será criado automaticamente quando a OS for concluída
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showItemForm && (
        <OrcamentoItemForm
          onAdd={handleAddItem}
          onClose={() => setShowItemForm(false)}
        />
      )}
    </AppShell>
  );
}
