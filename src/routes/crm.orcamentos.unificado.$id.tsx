import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { OrcamentoItensTable } from "@/components/crm/OrcamentoItensTable";
import { OrcamentoItemForm } from "@/components/crm/OrcamentoItemForm";
import { OrcamentoCompartilhamento } from "@/components/crm/OrcamentoCompartilhamento";
import { gerarLinkAprovacao } from "@/hooks/useOrcamentoApproval";
import { enviarOrcamentoPorEmail } from "@/hooks/useOrcamentoEmail";
import { salvarOrcamentoComoModelo } from "@/hooks/useOrcamentoModelos";
import { obterAvaliacao } from "@/hooks/useAvaliacao";
import { baixarPDFOrcamento } from "@/lib/pdf-generator";
import { ArrowLeft, ChevronDown, ChevronUp, FileSpreadsheet, Wrench, CreditCard, CheckCircle2, Download, Share2, Check, X, Mail, Copy, Edit2, Star } from "lucide-react";
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
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFase, setExpandedFase] = useState<Fase | null>("orcamento");
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCompartilhamento, setShowCompartilhamento] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState<string>("");
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const [editandoResumo, setEditandoResumo] = useState(false);
  const [showSalvarComoModelo, setShowSalvarComoModelo] = useState(false);
  const [modeloForm, setModeloForm] = useState({ nome: "", descricao: "" });
  const [salvandoModelo, setSalvandoModelo] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formEdicao, setFormEdicao] = useState({
    descricao: "",
    observacoes: "",
    resumo_executivo: "",
    desconto: 0,
    impostos: 0,
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    try {
      setLoading(true);

      const { data: orc } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      setOrcamento(orc);

      if (orc) {
        try {
          const result = await gerarLinkAprovacao(orc.id);
          console.log("gerarLinkAprovacao result:", result);

          // Extrair URL corretamente - pode ser string ou objeto
          let url = "";
          if (typeof result === "string") {
            url = result;
          } else if (result?.approval_url) {
            url = result.approval_url;
          }

          if (url) {
            setApprovalUrl(url);
            console.log("ApprovalUrl gerada:", url);
          }
        } catch (err) {
          console.error("Erro ao gerar link de aprovação:", err);
        }
      }

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
        .eq("orcamento_id", id);

      if (osData && osData.length > 0) setOs(osData[0]);

      const { data: pgto } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("orcamento_id", id);

      if (pgto && pgto.length > 0) setPagamento(pgto[0]);

      // Carregar avaliação
      const avaliacaoData = await obterAvaliacao(id);
      if (avaliacaoData) {
        setAvaliacao(avaliacaoData);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(item: any) {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("orcamento_itens")
        .insert([{
          orcamento_id: id,
          user_id: user.id,
          ...item,
        }])
        .select();

      if (data) {
        setItens([...itens, data[0]]);

        const total = itens.reduce((sum, currentItem) => sum + (currentItem.subtotal || 0), 0) + item.subtotal;
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

  async function handleEnviarEmail() {
    console.log("🔴 handleEnviarEmail iniciado", { orcamento: orcamento?.id, cliente: cliente?.email });

    if (!orcamento || !cliente || !user) {
      console.error("Dados faltando:", { orcamento: !!orcamento, cliente: !!cliente, user: !!user });
      return;
    }
    if (!cliente?.email) {
      alert("Cliente não possui email cadastrado");
      return;
    }

    try {
      console.log("Gerando link de aprovação para:", orcamento.id);
      const linkResult = await gerarLinkAprovacao(orcamento.id);
      console.log("Link resultado:", linkResult);

      if (!linkResult.success) throw new Error("Erro ao gerar link");

      console.log("Enviando email...");
      const emailResult = await enviarOrcamentoPorEmail({
        cliente_email: cliente.email,
        cliente_nome: cliente.nome,
        orcamento_numero: orcamento.numero_formatado,
        orcamento_total: orcamento.total,
        approval_url: linkResult.approval_url,
        user_name: user.user_metadata?.name || client.name,
        user_email: user.email,
      });

      console.log("Email resultado:", emailResult);
      if (!emailResult.success) throw new Error(emailResult.error || "Erro ao enviar email");

      await supabase
        .from("orcamentos")
        .update({
          status_enum: "enviado",
          approval_token: linkResult.token,
        })
        .eq("id", orcamento.id);

      await loadData();
      alert("Orçamento enviado com sucesso!");
    } catch (err) {
      console.error("❌ Erro completo:", err);
      alert("Erro ao enviar email: " + (err instanceof Error ? err.message : "Desconhecido"));
    }
  }

  async function handleGerarPDF() {
    if (!orcamento || !cliente || !itens) {
      alert("Dados incompletos para gerar PDF");
      return;
    }

    try {
      // Carregar tarefas para cada item de serviço
      const itensComTarefas = await Promise.all(
        itens.map(async (item) => {
          if (item.tipo === "servico" && item.servico_id) {
            const { data: tarefas } = await supabase
              .from("servico_tarefas")
              .select("descricao")
              .eq("servico_id", item.servico_id)
              .order("ordem", { ascending: true });
            return { ...item, tarefas: tarefas || [] };
          }
          return item;
        })
      );

      const pdfData = {
        numero: orcamento.numero_formatado || orcamento.numero,
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone,
        cliente_endereco: cliente.endereco,
        data_criacao: orcamento.data_criacao,
        data_vencimento: orcamento.data_vencimento,
        itens: itensComTarefas,
        total: orcamento.total,
        status: orcamento.status_enum || orcamento.status,
        desconto: orcamento.desconto,
        impostos: orcamento.impostos,
        approval_url: approvalUrl,
      };

      console.log("Gerando PDF com dados:", pdfData);
      await baixarPDFOrcamento(pdfData);
      console.log("PDF gerado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF: " + (err instanceof Error ? err.message : "Desconhecido"));
    }
  }

  function abrirEdicao() {
    setFormEdicao({
      descricao: orcamento?.descricao || "",
      observacoes: orcamento?.observacoes || "",
      resumo_executivo: orcamento?.resumo_executivo || "",
      desconto: orcamento?.desconto || 0,
      impostos: orcamento?.impostos || 0,
    });
    setShowEditModal(true);
  }

  async function handleSalvarEdicao() {
    try {
      await supabase
        .from("orcamentos")
        .update({
          descricao: formEdicao.descricao,
          observacoes: formEdicao.observacoes,
          resumo_executivo: formEdicao.resumo_executivo,
          desconto: formEdicao.desconto,
          impostos: formEdicao.impostos,
        })
        .eq("id", id);

      setOrcamento({
        ...orcamento,
        descricao: formEdicao.descricao,
        observacoes: formEdicao.observacoes,
        resumo_executivo: formEdicao.resumo_executivo,
        desconto: formEdicao.desconto,
        impostos: formEdicao.impostos,
      });
      setShowEditModal(false);
    } catch (err) {
      console.error("Erro ao salvar orçamento:", err);
      alert("Erro ao salvar");
    }
  }

  async function handleSalvarResumo(novoResumo: string) {
    try {
      await supabase
        .from("orcamentos")
        .update({ resumo_executivo: novoResumo })
        .eq("id", id);

      setOrcamento({ ...orcamento, resumo_executivo: novoResumo });
      setEditandoResumo(false);
      console.log("Resumo salvo com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar resumo:", err);
      alert("Erro ao salvar resumo");
    }
  }

  async function handleSalvarComoModelo() {
    if (!user || !modeloForm.nome.trim()) {
      alert("Preencha o nome do modelo");
      return;
    }

    setSalvandoModelo(true);
    try {
      const result = await salvarOrcamentoComoModelo(
        user.id,
        modeloForm.nome,
        modeloForm.descricao,
        itens
      );

      if (result.success) {
        alert("✅ Modelo salvo com sucesso!");
        setShowSalvarComoModelo(false);
        setModeloForm({ nome: "", descricao: "" });
      } else {
        alert("Erro ao salvar modelo: " + result.error);
      }
    } catch (err) {
      alert("Erro: " + (err instanceof Error ? err.message : "Desconhecido"));
    } finally {
      setSalvandoModelo(false);
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
          <button onClick={() => navigate({ to: "/crm/orcamentos" })} className="p-2 hover:bg-surface-2 rounded-lg transition">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{orcamento.numero_formatado}</h1>
            <p className="text-sm text-muted-foreground">{cliente?.nome}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {avaliacao && (
              <button
                onClick={() => setShowAvaliacaoModal(true)}
                className={cn(
                  "relative p-2 rounded-lg transition",
                  avaliacao ? "animate-pulse bg-select/20 text-select hover:bg-select/30" : "text-muted-foreground"
                )}
                title="Ver avaliação do cliente"
              >
                <Star className="size-5 fill-current" />
              </button>
            )}
            <span className={cn("text-sm font-semibold", statusCor[(orcamento.status_enum || orcamento.status) as keyof typeof statusCor] ?? "text-muted-foreground")}>
              {String(orcamento.status_enum || orcamento.status || "rascunho").toUpperCase()}
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
                onClick={abrirEdicao}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-surface-2 transition"
              >
                <Edit2 className="size-4" /> Editar
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
            onClick={() => {
              console.log("Compartilhar clicado", { orcamento: orcamento?.id, cliente: cliente?.id, approvalUrl });
              setShowCompartilhamento(true);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-select/30 text-select bg-select/10 rounded-lg text-sm font-semibold hover:bg-select/20 transition"
          >
            <Share2 className="size-4" /> Compartilhar
          </button>

          <button
            onClick={handleEnviarEmail}
            className="flex items-center gap-2 px-4 py-2 border border-info/30 text-info bg-info/10 rounded-lg text-sm font-semibold hover:bg-info/20 transition"
          >
            <Mail className="size-4" /> Email
          </button>

          <button
            onClick={handleGerarPDF}
            className="flex items-center gap-2 px-4 py-2 border border-brand/30 text-brand bg-brand/10 rounded-lg text-sm font-semibold hover:bg-brand/20 transition"
          >
            <Download className="size-4" /> PDF
          </button>

          <button
            onClick={() => setShowSalvarComoModelo(true)}
            className="flex items-center gap-2 px-4 py-2 border border-purple-500/30 text-purple-400 bg-purple-500/10 rounded-lg text-sm font-semibold hover:bg-purple-500/20 transition"
          >
            <Copy className="size-4" /> Salvar como Modelo
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

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold text-muted-foreground">Resumo Executivo (tela de aprovação)</p>
                          <button
                            onClick={() => setEditandoResumo(!editandoResumo)}
                            className="text-xs font-semibold text-brand hover:text-brand/80"
                          >
                            {editandoResumo ? "Cancelar" : "Editar"}
                          </button>
                        </div>
                        {editandoResumo ? (
                          <div className="space-y-2">
                            <textarea
                              defaultValue={orcamento.resumo_executivo || ""}
                              placeholder="Ex: Seu notebook vai funcionar novamente. Vamos reparar o carregador danificado e fazer testes."
                              rows={2}
                              className="input-base w-full resize-y text-xs"
                              id="resumoInput"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById("resumoInput") as HTMLTextAreaElement;
                                if (input) handleSalvarResumo(input.value);
                              }}
                              className="text-xs font-semibold text-brand bg-brand/10 px-3 py-1.5 rounded hover:bg-brand/20 transition"
                            >
                              Salvar
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground bg-surface/50 p-2 rounded">
                            {orcamento.resumo_executivo || "Vazio"}
                          </p>
                        )}
                      </div>

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

      {showCompartilhamento && orcamento && cliente && approvalUrl && (
        <OrcamentoCompartilhamento
          orcamento={orcamento}
          cliente={cliente}
          approvalUrl={approvalUrl}
          onClose={() => setShowCompartilhamento(false)}
        />
      )}

      {showSalvarComoModelo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSalvarComoModelo(false)}
        >
          <div
            className="card-graphite p-6 w-full max-w-500px"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Salvar como Modelo
              </h2>
              <button
                onClick={() => setShowSalvarComoModelo(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSalvarComoModelo(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  value={modeloForm.nome}
                  onChange={(e) => setModeloForm({ ...modeloForm, nome: e.target.value })}
                  placeholder="Ex: Formatação Padrão"
                  className="input-base w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={modeloForm.descricao}
                  onChange={(e) => setModeloForm({ ...modeloForm, descricao: e.target.value })}
                  placeholder="Ex: Formatação completa com backup..."
                  rows={2}
                  className="input-base w-full resize-y"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Os {itens.length} itens deste orçamento serão salvos no modelo.
              </p>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSalvarComoModelo(false)}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoModelo}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {salvandoModelo ? "Salvando..." : "Salvar Modelo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-graphite w-full max-w-600px max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Editar Orçamento</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição do Problema</label>
                <textarea
                  value={formEdicao.descricao}
                  onChange={(e) => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                  rows={3}
                  className="input-base w-full resize-y"
                  placeholder="Descreva o problema..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Observações</label>
                <textarea
                  value={formEdicao.observacoes}
                  onChange={(e) => setFormEdicao({ ...formEdicao, observacoes: e.target.value })}
                  rows={2}
                  className="input-base w-full resize-y"
                  placeholder="Notas adicionais..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Resumo Executivo</label>
                <textarea
                  value={formEdicao.resumo_executivo}
                  onChange={(e) => setFormEdicao({ ...formEdicao, resumo_executivo: e.target.value })}
                  rows={2}
                  className="input-base w-full resize-y"
                  placeholder="Resumo executivo (aparece na tela de aprovação)..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Desconto (R$)</label>
                  <input
                    type="number"
                    value={formEdicao.desconto}
                    onChange={(e) => setFormEdicao({ ...formEdicao, desconto: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Impostos (R$)</label>
                  <input
                    type="number"
                    value={formEdicao.impostos}
                    onChange={(e) => setFormEdicao({ ...formEdicao, impostos: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="input-base w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarEdicao}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-brand text-brand-foreground font-semibold hover:bg-brand/90 transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliação */}
      {showAvaliacaoModal && avaliacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Avaliação do Cliente</h2>
              <button onClick={() => setShowAvaliacaoModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="bg-select/10 border border-select/30 rounded-lg p-4 mb-4 text-center">
              <div className="text-3xl mb-2">{Array(avaliacao.rating).fill("⭐").join("")}</div>
              <div className="font-semibold text-select">{avaliacao.rating} de 5 - {["Péssimo", "Ruim", "Regular", "Bom", "Excelente"][avaliacao.rating - 1]}</div>
            </div>

            {avaliacao.comentario && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Comentário</label>
                <div className="bg-surface-2 border border-border rounded-lg p-3 text-sm text-foreground">
                  {avaliacao.comentario}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground mb-4">
              Avaliado em {new Date(avaliacao.created_at).toLocaleDateString("pt-BR")} às {new Date(avaliacao.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>

            <button
              onClick={() => setShowAvaliacaoModal(false)}
              className="w-full px-4 py-2 bg-brand text-brand-foreground font-semibold rounded-lg hover:bg-brand/90 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
