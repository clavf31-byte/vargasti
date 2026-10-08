import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { obterAvaliacao, salvarAvaliacao } from "@/hooks/useAvaliacao";
import vargasLogo from "@/assets/vargasti-icon.png";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/orcamento/acompanhamento/$id")({
  head: () => ({
    meta: [
      { title: `Acompanhamento de Orçamento · ${client.name}` },
      { name: "og:title", content: `Acompanhamento de Orçamento · ${client.name}` },
      { name: "og:description", content: "Acompanhe o status do seu equipamento" },
      { name: "og:type", content: "website" },
    ]
  }),
  component: AcompanhamentoPage,
});

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function AcompanhamentoPage() {
  const { id } = Route.useParams();
  const [orcamento, setOrcamento] = useState<any>(null);
  const [os, setOs] = useState<any>(null);
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [savingAvaliacao, setSavingAvaliacao] = useState(false);
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      // Carregar orçamento
      const { data: orcData, error: orcError } = await supabase
        .from("orcamentos")
        .select("*, clientes(nome, telefone)")
        .eq("id", id)
        .single();

      if (orcError) throw new Error("Orçamento não encontrado");
      setOrcamento(orcData);

      // Carregar OS vinculada
      const { data: osData } = await supabase
        .from("ordens_servico")
        .select("*")
        .eq("orcamento_id", id)
        .single();

      if (osData) setOs(osData);

      // Carregar avaliação se existir
      const avalData = await obterAvaliacao(id);
      if (avalData) {
        setAvaliacao(avalData);
        setRating(avalData.rating);
        setComentario(avalData.comentario || "");
        setAvaliacaoEnviada(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviarAvaliacao() {
    if (rating === 0) {
      alert("Por favor, selecione uma avaliação com estrelas");
      return;
    }

    if (!orcamento || !os) {
      alert("Dados incompletos");
      return;
    }

    setSavingAvaliacao(true);
    try {
      const result = await salvarAvaliacao(
        orcamento.id,
        orcamento.cliente_id,
        orcamento.user_id,
        rating,
        comentario.trim()
      );

      if (result.success) {
        setAvaliacaoEnviada(true);
        setAvaliacao(result.data);
        alert("✅ Avaliação enviada com sucesso! Obrigado pelo feedback.");
      } else {
        alert("Erro ao enviar avaliação: " + result.error);
      }
    } catch (err) {
      alert("Erro: " + (err instanceof Error ? err.message : "Desconhecido"));
    } finally {
      setSavingAvaliacao(false);
    }
  }

  const statusOs = os?.status || "pendente";
  const statusLabel = {
    aberta: "👷 Em Andamento",
    concluida: "✅ Concluída",
    cancelada: "❌ Cancelada",
    pendente: "⏳ Aguardando Início",
  }[statusOs] || "? Status Desconhecido";

  const statusColor = {
    aberta: "#3b82f6",
    concluida: "#22c55e",
    cancelada: "#ef4444",
    pendente: "#f59e0b",
  }[statusOs] || "#6b7280";

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#0bd0d7", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          Carregando acompanhamento...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", color: "#dc2626" }}>
          <AlertCircle size={48} style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "16px 0" }}>Erro</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          Orçamento não encontrado
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .star { cursor: pointer; font-size: 32px; margin: 0 4px; transition: all 0.2s; }
        .star:hover, .star.active { transform: scale(1.2); color: #fbbf24; }
      `}</style>

      <div style={styles.header}>
        <img src={vargasLogo} alt="VargasTI" style={{ height: 40, marginBottom: 16 }} />
        <h1 style={styles.title}>Acompanhe Seu Equipamento</h1>
        <p style={styles.subtitle}>Orçamento #{orcamento.numero_formatado}</p>
      </div>

      <div style={styles.card}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Cliente
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{orcamento.clientes?.nome || "—"}</div>
        </div>

        {/* STATUS DO EQUIPAMENTO */}
        {os && (
          <div style={{
            background: "#f0f9ff",
            border: `2px solid ${statusColor}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, fontWeight: 600 }}>
              STATUS DO EQUIPAMENTO
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: statusColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 20
              }}>
                {statusOs === "concluida" ? "✓" : statusOs === "aberta" ? "🔧" : "⏳"}
              </div>
              <div>
                <div style={{ fontSize: 14, color: "#64748b" }}>Status Atual:</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: statusColor }}>
                  {statusLabel}
                </div>
              </div>
            </div>

            {os.tecnico && (
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                👷 Técnico: <strong>{os.tecnico}</strong>
              </div>
            )}

            {os.data_inicio && (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                📅 Iniciado em: <strong>{fmtDate(os.data_inicio)}</strong>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO DE AVALIAÇÃO */}
        {os && statusOs === "concluida" && (
          <div style={{
            background: "#f0fdf4",
            border: "2px solid #22c55e",
            borderRadius: 8,
            padding: 16,
            marginTop: 24
          }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, fontWeight: 600 }}>
              AVALIE NOSSO SERVIÇO
            </div>

            {avaliacaoEnviada ? (
              <div style={{ textAlign: "center", paddingTop: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#22c55e", marginBottom: 8 }}>
                  Obrigado pela avaliação!
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Sua opinião é muito importante para melhorarmos.
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 12, color: "#111" }}>
                  Avaliação: {Array(avaliacao.rating).fill("⭐").join("")}
                </div>
                {avaliacao.comentario && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, fontStyle: "italic" }}>
                    "{avaliacao.comentario}"
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    Como foi o atendimento?
                  </div>
                  <div className="stars" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${rating >= star ? "active" : ""}`}
                        onClick={() => setRating(star)}
                        style={{
                          color: rating >= star ? "#fbbf24" : "#ddd",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>
                    Comentário (opcional)
                  </div>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Conte-nos sua experiência..."
                    style={{
                      width: "100%",
                      minHeight: 80,
                      padding: 12,
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontFamily: "inherit",
                      fontSize: 12,
                      resize: "vertical",
                    }}
                  />
                </div>

                <button
                  onClick={handleEnviarAvaliacao}
                  disabled={savingAvaliacao || rating === 0}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: rating === 0 ? "#ddd" : "#22c55e",
                    color: rating === 0 ? "#999" : "white",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: rating === 0 ? "not-allowed" : "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {savingAvaliacao ? "Enviando..." : "✉️ Enviar Avaliação"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* RESUMO DO ORÇAMENTO */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 16,
          marginTop: 24
        }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
            Resumo
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            Orçamento: <strong>{orcamento.numero_formatado}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            Valor: <strong>{fmtBRL(orcamento.total || 0)}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Criado em: <strong>{fmtDate(orcamento.data_criacao)}</strong>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 24, color: "#888", fontSize: 12 }}>
        <p>Dúvidas? Entre em contato conosco</p>
        <p>📧 {orcamento.clientes?.telefone || "contato@vargasti.com.br"}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9ff 0%, #f0fdfa 100%)",
    padding: 20,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#1e293b",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    margin: "16px 0 8px",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  card: {
    maxWidth: 600,
    margin: "0 auto",
    background: "white",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
};
