import client from "@/config/client";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { gerarLinkAprovacao } from "@/hooks/useOrcamentoApproval";
import { criarOrdenServicoDoOrcamento } from "@/hooks/useOrdenServico";
import { criarNotaFiscal } from "@/hooks/useNotaFiscal";
import { enviarOrcamentoPorEmail } from "@/hooks/useOrcamentoEmail";
import { ChevronLeft, Mail, Share2, Zap, DollarSign, Download, CheckCircle2, XCircle, Clock, Edit } from "lucide-react";
import { OrcamentoCompartilhamento } from "@/components/crm/OrcamentoCompartilhamento";
import { OSForm, type OSFormValues } from "@/components/crm/OSForm";
import { baixarPDFOrcamento } from "@/lib/pdf-generator";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/orcamentos/$id")({
  head: () => ({ meta: [{ title: `Orçamento · CRM ${client.name}` }] }),
  component: OrcamentoDetalhePage,
});

type Orcamento = {
  id: string;
  numero_formatado: string;
  cliente_id: string;
  status_enum: string;
  total: number;
  desconto?: number;
  impostos?: number;
  data_vencimento: string;
  notas: string;
  data_criacao: string;
  approval_token?: string;
  approval_status?: string;
  approved_at?: string;
};

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
};

function OrcamentoDetalhePage() {
  const { user } = useAuth();
  const { id } = useParams({ from: "/crm/orcamentos/$id" });
  const navigate = useNavigate();

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConverterOS, setShowConverterOS] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    loadOrcamento();
  }, [user, id]);

  async function loadOrcamento() {
    setLoading(true);
    try {
      const { data: orc, error: orcError } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (orcError) throw orcError;
      setOrcamento(orc as Orcamento);

      const { data: cli, error: cliError } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", orc.cliente_id)
        .single();

      if (cliError) throw cliError;
      setCliente(cli as Cliente);
    } catch (e) {
      console.error("Erro ao carregar orçamento:", e);
      setMessage("Erro ao carregar orçamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviarComEmail() {
    if (!orcamento || !cliente || !user) return;

    setActionLoading(true);
    setMessage("");

    try {
      // Gerar link de aprovação
      const linkResult = await gerarLinkAprovacao(orcamento.id);
      if (!linkResult.success) throw new Error("Erro ao gerar link");

      setApprovalUrl(linkResult.approval_url);

      // Enviar email
      const emailResult = await enviarOrcamentoPorEmail({
        cliente_email: cliente.email,
        cliente_nome: cliente.nome,
        orcamento_numero: orcamento.numero_formatado,
        orcamento_total: orcamento.total,
        approval_url: linkResult.approval_url,
        user_name: user.user_metadata?.name || client.name,
        user_email: user.email,
      });

      if (!emailResult.success) throw new Error(emailResult.error || "Erro ao enviar email");

      // Atualizar status
      const { error: updateError } = await supabase
        .from("orcamentos")
        .update({
          status_enum: "enviado",
          approval_token: linkResult.token,
        })
        .eq("id", orcamento.id);

      if (updateError) throw updateError;

      setOrcamento({
        ...orcamento,
        status_enum: "enviado",
        approval_token: linkResult.token,
      });

      setMessage("Orçamento enviado com sucesso!"); setMessageOk(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao enviar";
      setMessage(errorMsg); setMessageOk(false);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConverterOS(values: OSFormValues) {
    if (!orcamento || !cliente || !user) return;

    setActionLoading(true);
    setMessage("");

    try {
      const result = await criarOrdenServicoDoOrcamento({
        orcamento_id: orcamento.id,
        cliente_id: cliente.id,
        user_id: user.id,
        descricao: values.descricao || orcamento.notas,
        solucao: values.solucao || undefined,
        prioridade: values.prioridade,
        data_inicio: values.data_inicio,
        tecnico: values.tecnico || undefined,
      });

      if (!result.success) throw new Error(result.error);

      setShowConverterOS(false);
      setOrcamento({ ...orcamento, status_enum: "faturado" });
      setMessage(`Ordem de Serviço criada: ${result.os?.numero_formatado}`); setMessageOk(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao criar OS";
      setMessage(errorMsg); setMessageOk(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGerarNF() {
    if (!orcamento || !cliente || !user) return;

    setActionLoading(true);
    setMessage("");

    try {
      const result = await criarNotaFiscal({
        orcamento_id: orcamento.id,
        cliente_id: cliente.id,
        user_id: user.id,
        valor_subtotal: orcamento.total - (orcamento.desconto || 0),
        valor_desconto: orcamento.desconto || 0,
        valor_impostos: orcamento.impostos || 0,
        valor_total: orcamento.total,
      });

      if (!result.success) throw new Error(result.error);

      setOrcamento({ ...orcamento, status_enum: "faturado" });
      setMessage(`Nota Fiscal criada: ${result.nf?.numero_nfe}`); setMessageOk(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao criar NF";
      setMessage(errorMsg); setMessageOk(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!orcamento || !cliente) return;

    try {
      const { data: itens } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orcamento.id);

      const endereco = [cliente.endereco, cliente.cidade, cliente.estado]
        .filter(Boolean)
        .join(" - ");

      baixarPDFOrcamento({
        numero: orcamento.numero_formatado,
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone,
        cliente_endereco: endereco || undefined,
        data_criacao: orcamento.data_criacao,
        data_vencimento: orcamento.data_vencimento,
        itens: itens || [],
        total: orcamento.total,
        status: orcamento.status_enum,
        desconto: orcamento.desconto,
        impostos: orcamento.impostos,
        approval_url: approvalUrl || undefined,
      });

      setMessage("PDF baixado com sucesso!"); setMessageOk(true);
    } catch (e) {
      setMessage("Erro ao gerar PDF"); setMessageOk(false);
      console.error(e);
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; color: string; icon: React.ReactElement; label: string } } = {
      rascunho: {
        bg: "rgba(139, 92, 246, 0.1)",
        color: "#8b5cf6",
        icon: <Clock size={16} />,
        label: "Rascunho",
      },
      enviado: {
        bg: "rgba(59, 130, 246, 0.1)",
        color: "#3b82f6",
        icon: <Mail size={16} />,
        label: "Enviado",
      },
      aprovado: {
        bg: "rgba(34, 197, 94, 0.1)",
        color: "#22c55e",
        icon: <CheckCircle2 size={16} />,
        label: "Aprovado",
      },
      rejeitado: {
        bg: "rgba(239, 68, 68, 0.1)",
        color: "#ef4444",
        icon: <XCircle size={16} />,
        label: "Rejeitado",
      },
      faturado: {
        bg: "rgba(13, 208, 215, 0.1)",
        color: "#0bd0d7",
        icon: <CheckCircle2 size={16} />,
        label: "Faturado",
      },
    };

    const badge = badges[status] || badges.rascunho;

    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          background: badge.bg,
          color: badge.color,
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        {badge.icon}
        {badge.label}
      </div>
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: "2rem" }}>Carregando...</div>
      </AppShell>
    );
  }

  if (!orcamento || !cliente) {
    return (
      <AppShell>
        <div style={{ padding: "2rem" }}>Orçamento não encontrado</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={() => navigate({ to: "/crm/orcamentos" })}
          style={{
            background: "none",
            border: "none",
            color: "#13c8d3",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            fontSize: "14px",
          }}
        >
          <ChevronLeft size={18} /> Voltar
        </button>

        <PageHeader
          title={`Orçamento ${orcamento.numero_formatado}`}
          subtitle={`Cliente: ${cliente.nome}`}
        />

        {message && (
          <div
            style={{
              background: messageOk ? "rgba(76, 175, 80, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: messageOk ? "1px solid rgba(76, 175, 80, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "1.5rem",
              color: messageOk ? "#66bb6a" : "#ef5350",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>Status</p>
              {getStatusBadge(orcamento.status_enum)}
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>Valor Total</p>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#66bb6a" }}>
                R$ {orcamento.total.toFixed(2)}
              </p>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Válido até
              </p>
              <p style={{ fontSize: "14px", color: "#eaf3f8" }}>
                {orcamento.data_vencimento
                  ? new Date(orcamento.data_vencimento).toLocaleDateString("pt-BR")
                  : "7 dias a partir da criação"}
              </p>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>Email do Cliente</p>
              <p style={{ fontSize: "14px", color: "#eaf3f8" }}>{cliente.email || "Não cadastrado"}</p>
            </div>
          </div>

          {orcamento.notas && (
            <div style={{ borderTop: "1px solid rgba(19, 200, 211, 0.16)", paddingTop: "1.5rem" }}>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>Observações</p>
              <p style={{ fontSize: "14px", color: "#eaf3f8", whiteSpace: "pre-wrap" }}>
                {orcamento.notas}
              </p>
            </div>
          )}

          {orcamento.approval_status && (
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid rgba(19, 200, 211, 0.16)",
              }}
            >
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>Status de Aprovação</p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                {orcamento.approval_status === "approved" && (
                  <>
                    <CheckCircle2 size={16} style={{ color: "#66bb6a" }} />
                    <span style={{ color: "#66bb6a" }}>
                      Aprovado em{" "}
                      {orcamento.approved_at ? new Date(orcamento.approved_at).toLocaleDateString("pt-BR") : ""}
                    </span>
                  </>
                )}
                {orcamento.approval_status === "pending" && (
                  <>
                    <Clock size={16} style={{ color: "#0bd0d7" }} />
                    <span style={{ color: "#0bd0d7" }}>Aguardando aprovação</span>
                  </>
                )}
                {orcamento.approval_status === "rejected" && (
                  <>
                    <XCircle size={16} style={{ color: "#ef5350" }} />
                    <span style={{ color: "#ef5350" }}>Rejeitado</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
          <button
            onClick={() => navigate({ to: `/crm/orcamentos/editar/${id}` })}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "12px 16px",
              background: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "6px",
              color: "#a855f7",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Edit size={16} />
            Editar
          </button>

          {["rascunho", "enviado", "rejeitado"].includes(orcamento.status_enum) && (
            <button
              onClick={async () => {
                setActionLoading(true);
                setMessage("");
                try {
                  const linkResult = await gerarLinkAprovacao(orcamento.id);
                  if (!linkResult.success) throw new Error("Erro ao gerar link");
                  setApprovalUrl(linkResult.approval_url);
                  setShowShareModal(true);
                } catch (err) {
                  const errorMsg = err instanceof Error ? err.message : "Erro ao gerar link";
                  setMessage(errorMsg);
                  setMessageOk(false);
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "12px 16px",
                background: "linear-gradient(135deg, #0bd0d7, #08718b)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                cursor: actionLoading ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              <Share2 size={16} />
              {actionLoading ? "Gerando..." : "Compartilhar"}
            </button>
          )}

          {["rascunho", "enviado", "rejeitado"].includes(orcamento.status_enum) && (
            <button
              onClick={handleEnviarComEmail}
              disabled={actionLoading || !cliente.email}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "12px 16px",
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "6px",
                color: "#3b82f6",
                cursor: actionLoading || !cliente.email ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading || !cliente.email ? 0.6 : 1,
              }}
            >
              <Mail size={16} />
              {actionLoading ? "Enviando..." : "Email"}
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "12px 16px",
              background: "rgba(13, 208, 215, 0.2)",
              border: "1px solid rgba(13, 208, 215, 0.4)",
              borderRadius: "6px",
              color: "#0bd0d7",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Download size={16} />
            Gerar PDF
          </button>

          {orcamento.status_enum === "aprovado" && (
            <button
              onClick={() => setShowConverterOS((v) => !v)}
              disabled={actionLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "12px 16px",
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                borderRadius: "6px",
                color: "#22c55e",
                cursor: actionLoading ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              <Zap size={16} />
              {showConverterOS ? "Fechar" : "Converter em OS"}
            </button>
          )}

          {orcamento.status_enum === "aprovado" && (
            <button
              onClick={handleGerarNF}
              disabled={actionLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "12px 16px",
                background: "rgba(139, 92, 246, 0.2)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                borderRadius: "6px",
                color: "#a855f7",
                cursor: actionLoading ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              <DollarSign size={16} />
              {actionLoading ? "Gerando..." : "Gerar Nota Fiscal"}
            </button>
          )}
        </div>

        {showConverterOS && orcamento.status_enum === "aprovado" && (
          <div
            style={{
              background: "rgba(6, 34, 53, 0.6)",
              border: "1px solid rgba(19, 200, 211, 0.16)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#eaf3f8", marginBottom: "1rem" }}>
              Converter em Ordem de Serviço
            </p>
            <OSForm
              initial={{ descricao: orcamento.notas }}
              submitLabel="Criar OS"
              saving={actionLoading}
              onSubmit={handleConverterOS}
              onCancel={() => setShowConverterOS(false)}
            />
          </div>
        )}

        {showShareModal && approvalUrl && cliente && orcamento && (
          <OrcamentoCompartilhamento
            orcamento={orcamento}
            cliente={cliente}
            approvalUrl={approvalUrl}
            onClose={() => setShowShareModal(false)}
            onCompartilhado={(canal) => {
              setMessage(`Orçamento compartilhado via ${canal} com sucesso!`);
              setMessageOk(true);
              setTimeout(() => setShowShareModal(false), 1000);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
