import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { enviarOrcamentoPorEmail } from "@/lib/crm/emailService";
import { gerarNotaFiscal, obterNotaFiscal } from "@/lib/crm/nfService";
import { ChevronLeft, Mail, FileText, DollarSign, Download } from "lucide-react";
import { baixarPDFOrcamento } from "@/lib/pdf-generator";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/orcamentos/$id")({
  head: () => ({ meta: [{ title: "Orçamento · CRM VargasTI" }] }),
  component: OrcamentoDetalhePage,
});

type Orcamento = {
  id: string;
  numero: string;
  cliente_id: string;
  status: string;
  total: number;
  data_vencimento: string;
  notas: string;
  data_criacao: string;
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
  const [notaFiscal, setNotaFiscal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

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

      const nf = await obterNotaFiscal(orc.id);
      setNotaFiscal(nf);
    } catch (e) {
      console.error("Erro ao carregar orçamento:", e);
      setMessage("Erro ao carregar orçamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviarOrcamento() {
    if (!orcamento || !cliente) return;

    setActionLoading(true);
    setMessage("");

    try {
      const envioEmail = await enviarOrcamentoPorEmail(
        orcamento.id,
        cliente.email || "cliente@exemplo.com",
        cliente.nome,
        orcamento.numero,
        orcamento.total
      );

      if (!envioEmail.success) throw new Error("Erro ao enviar email");

      const { error: updateError } = await supabase
        .from("orcamentos")
        .update({ status: "enviado" })
        .eq("id", orcamento.id);

      if (updateError) throw updateError;

      setOrcamento({ ...orcamento, status: "enviado" });
      setMessage("✅ Orçamento enviado com sucesso!");
    } catch (e) {
      setMessage("❌ Erro ao enviar orçamento");
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRegistrarPagamento() {
    if (!orcamento || !cliente) return;

    setActionLoading(true);
    setMessage("");

    try {
      const result = await gerarNotaFiscal(
        orcamento.id,
        cliente.id,
        cliente.nome,
        orcamento.total,
        new Date().toISOString().split("T")[0]
      );

      if (!result.success) throw new Error("Erro ao gerar NF");

      const { error: updateError } = await supabase
        .from("orcamentos")
        .update({ status: "pago" })
        .eq("id", orcamento.id);

      if (updateError) throw updateError;

      setOrcamento({ ...orcamento, status: "pago" });
      const nf = await obterNotaFiscal(orcamento.id);
      setNotaFiscal(nf);
      setMessage(`✅ Pagamento registrado! NF: ${result.numeroNF}`);
    } catch (e) {
      setMessage("❌ Erro ao registrar pagamento");
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAprovado() {
    if (!orcamento) return;

    setActionLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: "aprovado" })
        .eq("id", orcamento.id);

      if (error) throw error;

      setOrcamento({ ...orcamento, status: "aprovado" });
      setMessage("✅ Orçamento marcado como aprovado!");
    } catch (e) {
      setMessage("❌ Erro ao atualizar status");
      console.error(e);
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
        numero: orcamento.numero,
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone,
        cliente_endereco: endereco || undefined,
        data_criacao: orcamento.data_criacao,
        data_vencimento: orcamento.data_vencimento,
        itens: itens || [],
        total: orcamento.total,
        status: orcamento.status,
      });

      setMessage("✅ PDF baixado com sucesso!");
    } catch (e) {
      setMessage("❌ Erro ao gerar PDF");
      console.error(e);
    }
  }

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

  const statusColor: Record<string, string> = {
    rascunho: "#6d879c",
    enviado: "#2196f3",
    aprovado: "#4caf50",
    pago: "#4caf50",
  };

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
          title={`Orçamento ${orcamento.numero}`}
          subtitle={`Cliente: ${cliente.nome}`}
        />

        {message && (
          <div
            style={{
              background: message.startsWith("✅")
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              border: message.startsWith("✅")
                ? "1px solid rgba(76, 175, 80, 0.3)"
                : "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "1.5rem",
              color: message.startsWith("✅") ? "#66bb6a" : "#ef5350",
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
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Status
              </p>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: `${statusColor[orcamento.status]}33`,
                  color: statusColor[orcamento.status],
                }}
              >
                {orcamento.status.charAt(0).toUpperCase() + orcamento.status.slice(1)}
              </div>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Valor Total
              </p>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#66bb6a" }}>
                R$ {orcamento.total.toFixed(2)}
              </p>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Data de Vencimento
              </p>
              <p style={{ fontSize: "14px", color: "#eaf3f8" }}>
                {orcamento.data_vencimento
                  ? new Date(orcamento.data_vencimento).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Email do Cliente
              </p>
              <p style={{ fontSize: "14px", color: "#eaf3f8" }}>
                {cliente.email || "Não cadastrado"}
              </p>
            </div>
          </div>

          {orcamento.notas && (
            <div style={{ borderTop: "1px solid rgba(19, 200, 211, 0.16)", paddingTop: "1.5rem" }}>
              <p style={{ fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Notas
              </p>
              <p style={{ fontSize: "14px", color: "#eaf3f8", whiteSpace: "pre-wrap" }}>
                {orcamento.notas}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
          {orcamento.status === "rascunho" && (
            <button
              onClick={handleEnviarOrcamento}
              disabled={actionLoading || !cliente.email}
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
                cursor: actionLoading || !cliente.email ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading || !cliente.email ? 0.6 : 1,
              }}
            >
              <Mail size={16} />
              {actionLoading ? "Enviando..." : "Enviar Orçamento"}
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

          {orcamento.status === "enviado" && (
            <button
              onClick={handleAprovado}
              disabled={actionLoading}
              style={{
                padding: "12px 16px",
                background: "rgba(76, 175, 80, 0.2)",
                border: "1px solid rgba(76, 175, 80, 0.4)",
                borderRadius: "6px",
                color: "#66bb6a",
                cursor: actionLoading ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading ? "Atualizando..." : "Marcar como Aprovado"}
            </button>
          )}

          {orcamento.status === "aprovado" && (
            <button
              onClick={handleRegistrarPagamento}
              disabled={actionLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "12px 16px",
                background: "rgba(102, 187, 106, 0.2)",
                border: "1px solid rgba(102, 187, 106, 0.4)",
                borderRadius: "6px",
                color: "#66bb6a",
                cursor: actionLoading ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              <DollarSign size={16} />
              {actionLoading ? "Processando..." : "Registrar Pagamento"}
            </button>
          )}

          {notaFiscal && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "12px 16px",
                background: "rgba(168, 85, 247, 0.1)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "6px",
                color: "#ba68c8",
                fontWeight: 600,
              }}
            >
              <FileText size={16} />
              NF: {notaFiscal.numero}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
