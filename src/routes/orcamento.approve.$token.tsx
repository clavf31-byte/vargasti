import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { obterOrcamentoPorToken, aprovarOrcamento, rejeitarOrcamento } from "@/hooks/useOrcamentoApproval";
import vargasLogo from "@/assets/vargasti-icon.png";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/orcamento/approve/$token")({
  head: () => ({ meta: [{ title: "Aprovar Orçamento · VargasTI" }] }),
  component: ApproveOrcamentoPage,
});

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

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
    obterOrcamentoPorToken(token).then((data) => {
      if (!data) setError("Orçamento não encontrado ou link inválido.");
      else setOrcamento(data);
      setLoading(false);
    });
  }, [token]);

  async function handleAprovar() {
    setProcessing(true);
    const result = await aprovarOrcamento(token);
    if (result.success) setStatus("approved");
    else setError(result.error || "Erro ao aprovar.");
    setProcessing(false);
  }

  async function handleRejeitar() {
    if (!rejectionMotivo.trim()) { setError("Informe um motivo para a rejeição."); return; }
    setProcessing(true);
    const result = await rejeitarOrcamento(token, rejectionMotivo);
    if (result.success) setStatus("rejected");
    else setError(result.error || "Erro ao rejeitar.");
    setProcessing(false);
  }

  const subtotal = (orcamento?.itens || []).reduce((s: number, i: any) => s + (i.subtotal || 0), 0);

  // ── LOADING ──
  if (loading) return (
    <div style={styles.page}>
      <div style={{ textAlign: "center", color: "#64748b" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#0bd0d7", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        Carregando orçamento...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );

  // ── ERRO ──
  if (error && !orcamento) return (
    <div style={styles.page}>
      <div style={{ ...styles.card, padding: 40, textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
        <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px", display: "block" }} />
        <h2 style={{ color: "#1a2332", marginBottom: 8 }}>Link inválido</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>{error}</p>
      </div>
    </div>
  );

  // ── APROVADO ──
  if (status === "approved") return (
    <div style={styles.page}>
      <Logo />
      <div style={{ ...styles.card, padding: 48, textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle2 size={36} color="white" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a2332", marginBottom: 8 }}>Orçamento Aprovado!</h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
          Obrigado por aprovar o orçamento <strong>#{orcamento?.numero_formatado}</strong>.<br />
          A equipe VargasTI entrará em contato em breve.
        </p>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16, textAlign: "left", fontSize: 13, color: "#166534" }}>
          <strong>Resumo:</strong><br />
          Cliente: {orcamento?.cliente?.nome || "—"}<br />
          Orçamento: #{orcamento?.numero_formatado}<br />
          Valor aprovado: {fmtBRL(orcamento?.total || 0)}
        </div>
      </div>
    </div>
  );

  // ── REJEITADO ──
  if (status === "rejected") return (
    <div style={styles.page}>
      <Logo />
      <div style={{ ...styles.card, padding: 48, textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#ef4444,#dc2626)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <XCircle size={36} color="white" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a2332", marginBottom: 8 }}>Orçamento Recusado</h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
          O orçamento <strong>#{orcamento?.numero_formatado}</strong> foi recusado.<br />
          A equipe VargasTI receberá sua mensagem e entrará em contato.
        </p>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 16, textAlign: "left", fontSize: 13, color: "#991b1b" }}>
          <strong>Motivo:</strong><br />
          <em>{rejectionMotivo}</em>
        </div>
      </div>
    </div>
  );

  const desconto = orcamento?.desconto || 0;

  // ── PRINCIPAL ──
  return (
    <div style={styles.page}>
      {/* Logo */}
      <Logo />

      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* HERO */}
        <div style={styles.card}>
          <div style={styles.hero}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0bd0d7", marginBottom: 6 }}>Orçamento</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f0f9ff", marginBottom: 4 }}>#{orcamento?.numero_formatado}</div>
            <div style={{ fontSize: 13, color: "#7db8cc" }}>Para: <strong style={{ color: "#c0dde9" }}>{orcamento?.cliente?.nome || "—"}</strong></div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 20 }}>
              <span style={{ fontSize: 16, color: "#0bd0d7", fontWeight: 600 }}>R$</span>
              <span style={{ fontSize: 40, fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                {(orcamento?.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" as const }}>
              <span style={styles.badge}><span style={styles.badgeDot} />Aguardando aprovação</span>
              <span style={styles.badge}>Válido por 7 dias</span>
            </div>
          </div>

          <div style={{ padding: "28px 32px" }}>

            {/* INFO GRID */}
            <div style={styles.infoGrid}>
              <div style={styles.infoCell}>
                <div style={styles.infoLabel}>Cliente</div>
                <div style={styles.infoValue}>{orcamento?.cliente?.nome || "—"}</div>
              </div>
              <div style={styles.infoCell}>
                <div style={styles.infoLabel}>Emissão</div>
                <div style={styles.infoValue}>{orcamento?.created_at ? fmtDate(orcamento.created_at) : "—"}</div>
              </div>
              {orcamento?.notas && (
                <div style={{ ...styles.infoCell, gridColumn: "span 2", borderRight: "none" }}>
                  <div style={styles.infoLabel}>Observações</div>
                  <div style={{ ...styles.infoValue, fontWeight: 400, color: "#475569" }}>{orcamento.notas}</div>
                </div>
              )}
            </div>

            {/* ITENS */}
            {orcamento?.itens?.length > 0 && (
              <>
                <div style={styles.sectionTitle}>Itens do orçamento</div>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, marginBottom: 24 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e8edf2" }}>
                      {["Descrição", "Qtd", "Unitário", "Subtotal"].map((h, i) => (
                        <th key={h} style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#94a3b8", textAlign: i === 0 ? "left" as const : "right" as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orcamento.itens.map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontSize: 14, color: "#1a2332", fontWeight: 500 }}>{item.descricao}</td>
                        <td style={{ padding: "12px", fontSize: 14, color: "#64748b", textAlign: "right" as const }}>{item.quantidade}</td>
                        <td style={{ padding: "12px", fontSize: 14, color: "#64748b", textAlign: "right" as const }}>{fmtBRL(item.preco_unitario || 0)}</td>
                        <td style={{ padding: "12px", fontSize: 14, color: "#1a2332", fontWeight: 600, textAlign: "right" as const }}>{fmtBRL(item.subtotal || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* TOTAIS */}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px 18px", marginBottom: 28 }}>
              {desconto > 0 && (
                <>
                  <div style={styles.totalRow}><span>Subtotal</span><span>{fmtBRL(subtotal)}</span></div>
                  <div style={styles.totalRow}><span>Desconto</span><span style={{ color: "#22c55e" }}>− {fmtBRL(desconto)}</span></div>
                </>
              )}
              <div style={{ ...styles.totalRow, borderTop: desconto > 0 ? "1px solid #e2e8f0" : "none", marginTop: desconto > 0 ? 8 : 0, paddingTop: desconto > 0 ? 12 : 0, fontSize: 16, fontWeight: 700, color: "#0c2a3e" }}>
                <span>Total</span>
                <span style={{ color: "#0891b2" }}>{fmtBRL(orcamento?.total || 0)}</span>
              </div>
            </div>

            {/* ERRO */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#dc2626", fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ height: 1, background: "#f1f5f9", margin: "0 -32px 24px" }} />

            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, textAlign: "center" as const }}>
              Revise as informações acima e escolha uma opção:
            </p>

            {/* FORM REJEIÇÃO */}
            {showRejectionForm && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Motivo da recusa</label>
                <textarea
                  value={rejectionMotivo}
                  onChange={(e) => setRejectionMotivo(e.target.value)}
                  placeholder="Explique brevemente o motivo..."
                  style={{ width: "100%", minHeight: 80, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const }}
                />
              </div>
            )}

            {/* BOTÕES */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {showRejectionForm ? (
                <>
                  <button onClick={() => setShowRejectionForm(false)} style={styles.btnSecondary}>← Voltar</button>
                  <button onClick={handleRejeitar} disabled={processing} style={{ ...styles.btnReject, opacity: processing ? 0.6 : 1 }}>
                    {processing ? "Recusando..." : "Confirmar Recusa"}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowRejectionForm(true)} style={styles.btnReject}>Recusar</button>
                  <button onClick={handleAprovar} disabled={processing} style={{ ...styles.btnApprove, opacity: processing ? 0.6 : 1 }}>
                    {processing ? "Aprovando..." : "✓ Aprovar Orçamento"}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <p style={{ textAlign: "center" as const, fontSize: 12, color: "#94a3b8", marginTop: 20, lineHeight: 1.7 }}>
          Dúvidas? Entre em contato: <a href="mailto:contato@vargasti.com.br" style={{ color: "#0891b2" }}>contato@vargasti.com.br</a><br />
          Este orçamento tem validade de <strong>7 dias</strong> a partir da data de emissão.
        </p>

      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
        <img src={vargasLogo} alt="VargasTI" style={{ width: 80, height: 80, objectFit: "contain", marginRight: -8 }} />
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1, margin: 0 }}>
            <span style={{ color: "#1a2332" }}>Vargas</span><span style={{ color: "#13c8d3" }}>TI</span>
          </h1>
          <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(19,200,211,0.8)", letterSpacing: "0.04em", margin: 0 }}>Soluções que conectam</p>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>Você recebeu um orçamento para revisão</p>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "#f0f4f8",
    minHeight: "100vh",
    padding: "32px 16px 64px",
    display: "flex" as const,
    flexDirection: "column" as const,
  },
  card: {
    background: "white",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,.07), 0 8px 24px rgba(0,0,0,.06)",
    marginBottom: 16,
  },
  hero: {
    background: "linear-gradient(135deg, #0f1e2e 0%, #0c2a3e 100%)",
    padding: "32px 32px 28px",
  },
  badge: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 5,
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
    background: "rgba(11,208,215,.12)",
    border: "1px solid rgba(11,208,215,.2)",
    color: "#7dd3db",
  },
  badgeDot: {
    display: "inline-block" as const,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#0bd0d7",
  },
  infoGrid: {
    display: "grid" as const,
    gridTemplateColumns: "1fr 1fr",
    border: "1px solid #e8edf2",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 24,
  },
  infoCell: {
    padding: "14px 18px",
    borderRight: "1px solid #e8edf2",
    borderBottom: "1px solid #e8edf2",
  },
  infoLabel: { fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: 600, color: "#1a2332" },
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 12 },
  totalRow: { display: "flex" as const, justifyContent: "space-between" as const, fontSize: 13, color: "#64748b", padding: "4px 0" },
  btnApprove: {
    display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
    padding: "15px 24px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
    border: "none", background: "linear-gradient(135deg, #0bd0d7, #0891b2)", color: "white",
    boxShadow: "0 4px 14px rgba(11,208,215,.3)",
  },
  btnReject: {
    display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
    padding: "15px 24px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
    background: "white", color: "#ef4444", border: "1.5px solid #fecaca",
  },
  btnSecondary: {
    display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
    padding: "15px 24px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
    background: "white", color: "#64748b", border: "1.5px solid #e2e8f0",
  },
};
