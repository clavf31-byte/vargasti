import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import vargasLogo from "@/assets/vargasti-icon.png";

export const Route = createFileRoute("/contrato/acompanhamento/$id")({
  head: () => ({
    meta: [
      { title: `Acompanhamento de Contrato · ${client.name}` },
      { name: "og:title", content: `Acompanhamento de Contrato · ${client.name}` },
      { name: "og:description", content: "Visualize e acompanhe seu contrato" },
      { name: "og:type", content: "website" },
    ]
  }),
  component: AcompanhamentoContratoPage,
});

interface Contrato {
  id: string;
  titulo: string;
  conteudo: string;
  status: string;
  created_at: string;
  clientes?: { nome: string };
}

interface Signature {
  signed_by: string;
  signed_at: string;
}

function AcompanhamentoContratoPage() {
  const { id } = Route.useParams();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<Signature | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    loadContrato();
  }, [id]);

  const loadContrato = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, conteudo, status, created_at, clientes(nome)")
        .eq("id", id)
        .single();

      if (err) throw err;
      if (!data) throw new Error("Contrato não encontrado");

      setContrato(data);

      // Carregar assinatura existente
      const { data: sigData } = await (supabase as any)
        .from("contract_signatures")
        .select("signed_by, signed_at")
        .eq("contract_id", id)
        .order("signed_at", { ascending: false })
        .limit(1)
        .single();

      if (sigData) {
        setSignature(sigData);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar contrato";
      console.error("❌ Erro completo:", err);
      console.error("❌ Erro ao carregar contrato ID:", id);
      console.error("❌ Mensagem:", msg);
      setError(`${msg} (ID: ${id})`);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signerName.trim() || !acceptTerms) {
      alert("Preencha o nome e aceite os termos");
      return;
    }

    setSigning(true);
    try {
      const { error } = await (supabase as any)
        .from("contract_signatures")
        .insert([{
          contract_id: id,
          signed_by: signerName,
          email: signerEmail || null,
          client_ip: null,
        }]);

      if (error) throw error;

      // Atualizar contrato como assinado
      await (supabase as any)
        .from("contracts")
        .update({ signed_by: signerName, signed_at: new Date().toISOString(), status: "assinado" })
        .eq("id", id);

      setSignature({ signed_by: signerName, signed_at: new Date().toISOString() });
      setSignerName("");
      setSignerEmail("");
      setAcceptTerms(false);
      alert("Contrato assinado com sucesso!");
    } catch (err) {
      alert("Erro ao assinar: " + (err instanceof Error ? err.message : ""));
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#0bd0d7", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          Carregando contrato...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", color: "#dc2626" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "16px 0" }}>Erro</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          Contrato não encontrado
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .letterhead { border-bottom: 3px solid #0bd0d7; padding-bottom: 24px; margin-bottom: 32px; }
        .letterhead-content { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .letterhead-logo { height: 60px; }
        .letterhead-text h2 { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; }
        .letterhead-text p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
      `}</style>

      <div style={{ ...styles.header, paddingBottom: 0 }} className="letterhead">
        <div className="letterhead-content">
          <img src={vargasLogo} alt="VargasTI" className="letterhead-logo" />
          <div className="letterhead-text">
            <h2>VargasTI</h2>
            <p>Soluções em Tecnologia</p>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 12 }}>
          <p style={{ margin: "0 0 4px 0" }}>📧 suporte@vargasti.com.br</p>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px 0", color: "#1e293b" }}>Contrato</h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{contrato.titulo}</p>
        {contrato.clientes?.nome && <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>Cliente: <strong>{contrato.clientes.nome}</strong></p>}
      </div>

      <div style={styles.card}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Informações
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Cliente: <strong>{contrato.clientes?.nome || "—"}</strong>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Status: <strong>{contrato.status.charAt(0).toUpperCase() + contrato.status.slice(1)}</strong>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Data: <strong>{new Date(contrato.created_at).toLocaleDateString("pt-BR")}</strong>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 24 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
            Conteúdo do Contrato
          </div>
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 16,
            fontSize: 12,
            color: "#1e293b",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            lineHeight: "1.6",
            maxHeight: "600px",
            overflow: "auto",
          }}>
            {contrato.conteudo}
          </div>
        </div>

        {signature ? (
          <div style={{ marginTop: 32, padding: 16, background: "#f0fdf4", border: "2px solid #22c55e", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#22c55e", fontWeight: "bold", marginBottom: 8 }}>✅ CONTRATO ASSINADO</div>
            <p style={{ margin: "4px 0", fontSize: 13, color: "#1e293b" }}>
              <strong>Assinado por:</strong> {signature.signed_by}
            </p>
            <p style={{ margin: "4px 0", fontSize: 13, color: "#1e293b" }}>
              <strong>Data:</strong> {new Date(signature.signed_at).toLocaleDateString("pt-BR")} às {new Date(signature.signed_at).toLocaleTimeString("pt-BR")}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 32, padding: 20, background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#1e293b" }}>Assinar Contrato</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>Nome Completo *</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Seu nome completo"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>Email (opcional)</label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={{ marginTop: 3, cursor: "pointer" }}
              />
              <label style={{ fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                Declaro que li e aceito os termos deste contrato
              </label>
            </div>
            <button
              onClick={handleSign}
              disabled={signing || !signerName.trim() || !acceptTerms}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "#0bd0d7",
                color: "#000",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: signing || !signerName.trim() || !acceptTerms ? "not-allowed" : "pointer",
                opacity: signing || !signerName.trim() || !acceptTerms ? 0.5 : 1,
              }}
            >
              {signing ? "Assinando..." : "Assinar Contrato"}
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 24, color: "#888", fontSize: 12 }}>
        <p>Dúvidas? Entre em contato conosco</p>
        <p>📧 suporte@vargasti.com.br</p>
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
    maxWidth: 800,
    margin: "0 auto",
    background: "white",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
};
