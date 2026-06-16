import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  obterOrcamentoPorToken,
  aprovarOrcamento,
  rejeitarOrcamento,
} from "@/hooks/useOrcamentoApproval";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/orcamento/approve/$token")({
  head: () => ({ meta: [{ title: "Aprovar Orçamento - VargasTI" }] }),
  component: ApproveOrcamentoPage,
});

function ApproveOrcamentoPage() {
  const { token } = Route.useParams();
  const [orcamento, setOrcamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loaded" | "approved" | "rejected">("loaded");
  const [rejectionMotivo, setRejectionMotivo] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  useEffect(() => {
    const loadOrcamento = async () => {
      try {
        const data = await obterOrcamentoPorToken(token);
        if (!data) {
          setError("Orçamento não encontrado ou link inválido");
        } else {
          setOrcamento(data);
        }
      } catch (err) {
        setError("Erro ao carregar orçamento");
      } finally {
        setLoading(false);
      }
    };

    loadOrcamento();
  }, [token]);

  async function handleAprovar() {
    setProcessing(true);
    try {
      const result = await aprovarOrcamento(token);
      if (result.success) {
        setStatus("approved");
        setError(null);
      } else {
        setError(result.error || "Erro ao aprovar");
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleRejeitar() {
    if (!rejectionMotivo.trim()) {
      setError("Informe um motivo para a rejeição");
      return;
    }

    setProcessing(true);
    try {
      const result = await rejeitarOrcamento(token, rejectionMotivo);
      if (result.success) {
        setStatus("rejected");
        setError(null);
      } else {
        setError(result.error || "Erro ao rejeitar");
      }
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1419 0%, #1a2332 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "#b8c5d6" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
          <div>Carregando orçamento...</div>
        </div>
      </div>
    );
  }

  if (error && !orcamento) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1419 0%, #1a2332 100%)",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            maxWidth: "400px",
            textAlign: "center",
            color: "#ef5350",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h2 style={{ margin: "0 0 12px 0" }}>Erro ao Carregar</h2>
          <p style={{ margin: 0, fontSize: "14px" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1419 0%, #1a2332 100%)",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(102, 187, 106, 0.1)",
            border: "1px solid rgba(102, 187, 106, 0.3)",
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            maxWidth: "500px",
            textAlign: "center",
            color: "#66bb6a",
          }}
        >
          <CheckCircle2 size={64} style={{ margin: "0 auto 16px", display: "block" }} />
          <h2 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>Orçamento Aprovado! ✓</h2>
          <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#b8c5d6" }}>
            Obrigado por aprovar o orçamento <strong>#{orcamento?.numero_formatado}</strong>
          </p>
          <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#8da2b4" }}>
            A equipe da VargasTI entrará em contato em breve para os próximos passos.
          </p>

          <div
            style={{
              background: "rgba(13, 208, 215, 0.1)",
              border: "1px solid rgba(13, 208, 215, 0.2)",
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginTop: spacing.lg,
              textAlign: "left",
              fontSize: "12px",
            }}
          >
            <strong style={{ color: "#0bd0d7" }}>Resumo:</strong>
            <p style={{ margin: "8px 0 0 0", color: "#b8c5d6" }}>
              Orçamento: {orcamento?.numero_formatado}
              <br />
              Cliente: {orcamento?.cliente?.nome}
              <br />
              Valor: R$ {orcamento?.total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1419 0%, #1a2332 100%)",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            maxWidth: "500px",
            textAlign: "center",
            color: "#ef5350",
          }}
        >
          <XCircle size={64} style={{ margin: "0 auto 16px", display: "block" }} />
          <h2 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>Orçamento Rejeitado</h2>
          <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#b8c5d6" }}>
            O orçamento <strong>#{orcamento?.numero_formatado}</strong> foi rejeitado
          </p>
          <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#8da2b4" }}>
            A equipe da VargasTI receberá sua mensagem e entrará em contato em breve.
          </p>

          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginTop: spacing.lg,
              textAlign: "left",
              fontSize: "12px",
            }}
          >
            <strong style={{ color: "#ef5350" }}>Motivo:</strong>
            <p style={{ margin: "8px 0 0 0", color: "#b8c5d6", fontStyle: "italic" }}>
              {rejectionMotivo}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Não aprovado nem rejeitado (carregado)
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f1419 0%, #1a2332 100%)",
        padding: spacing.xl,
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: spacing.xl,
            paddingBottom: spacing.lg,
            borderBottom: `1px solid rgba(19, 200, 211, 0.16)`,
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💼</div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", color: "#eaf3f8", fontWeight: 600 }}>
            Revisar Orçamento
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#8da2b4" }}>
            Orçamento #{orcamento?.numero_formatado} de {orcamento?.cliente?.nome}
          </p>
        </div>

        {/* Orçamento Summary */}
        <div
          style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            marginBottom: spacing.xl,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", margin: "0 0 4px 0" }}>Cliente</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#eaf3f8", margin: 0 }}>
                {orcamento?.cliente?.nome}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#8da2b4", margin: "0 0 4px 0" }}>
                Valor Total
              </p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#0bd0d7", margin: 0 }}>
                R$ {orcamento?.total.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Itens */}
          {orcamento?.itens && orcamento.itens.length > 0 && (
            <div style={{ borderTop: `1px solid rgba(19, 200, 211, 0.16)`, paddingTop: spacing.lg }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#eaf3f8" }}>Itens</h3>
              {orcamento.itens.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "13px",
                    color: "#b8c5d6",
                  }}
                >
                  <span>{item.descricao}</span>
                  <span style={{ fontWeight: 600 }}>
                    {item.quantidade}x = R$ {item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              color: "#ef5350",
              fontSize: "14px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Formulário de Rejeição */}
        {showRejectionForm && (
          <div
            style={{
              background: "rgba(6, 34, 53, 0.6)",
              border: "1px solid rgba(19, 200, 211, 0.16)",
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: "#8da2b4",
                marginBottom: spacing.sm,
                fontWeight: 600,
              }}
            >
              Motivo da Rejeição
            </label>
            <textarea
              value={rejectionMotivo}
              onChange={(e) => setRejectionMotivo(e.target.value)}
              placeholder="Explique brevemente por que está rejeitando..."
              style={{
                width: "100%",
                padding: spacing.lg,
                background: "#0f1419",
                border: "1px solid rgba(19, 200, 211, 0.16)",
                borderRadius: borderRadius.md,
                color: "#eaf3f8",
                fontSize: "14px",
                fontFamily: "inherit",
                minHeight: "80px",
                boxSizing: "border-box",
                marginBottom: spacing.lg,
              }}
            />
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: "flex", gap: spacing.lg }}>
          {showRejectionForm ? (
            <>
              <button
                onClick={() => setShowRejectionForm(false)}
                style={{
                  flex: 1,
                  padding: spacing.lg,
                  background: "transparent",
                  border: `1px solid rgba(19, 200, 211, 0.16)`,
                  borderRadius: borderRadius.md,
                  color: "#8da2b4",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                ← Voltar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: spacing.lg,
                  background: "#ef5350",
                  border: "none",
                  borderRadius: borderRadius.md,
                  color: "#fff",
                  cursor: processing ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  opacity: processing ? 0.6 : 1,
                }}
              >
                {processing ? "Rejeitando..." : "❌ Rejeitar Orçamento"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRejectionForm(true)}
                style={{
                  flex: 1,
                  padding: spacing.lg,
                  background: "transparent",
                  border: `1px solid rgba(19, 200, 211, 0.16)`,
                  borderRadius: borderRadius.md,
                  color: "#ef5350",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                ❌ Rejeitar
              </button>
              <button
                onClick={handleAprovar}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: spacing.lg,
                  background: "#0bd0d7",
                  border: "none",
                  borderRadius: borderRadius.md,
                  color: "#000",
                  cursor: processing ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  opacity: processing ? 0.6 : 1,
                }}
              >
                {processing ? "Aprovando..." : "✓ Aprovar Orçamento"}
              </button>
            </>
          )}
        </div>

        {/* Info Footer */}
        <div
          style={{
            marginTop: spacing.xl,
            paddingTop: spacing.lg,
            borderTop: `1px solid rgba(19, 200, 211, 0.16)`,
            fontSize: "12px",
            color: "#8da2b4",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0 }}>
            Dúvidas? Entre em contato: suporte.vargasti@gmail.com ou (51) 99880-8343
          </p>
        </div>
      </div>
    </div>
  );
}
