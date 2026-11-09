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

function AcompanhamentoContratoPage() {
  const { id } = Route.useParams();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar contrato";
      console.error("❌ Erro:", msg);
      setError(msg);
    } finally {
      setLoading(false);
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
      `}</style>

      <div style={styles.header}>
        <img src={vargasLogo} alt="VargasTI" style={{ height: 40, marginBottom: 16 }} />
        <h1 style={styles.title}>Acompanhe Seu Contrato</h1>
        <p style={styles.subtitle}>Contrato: {contrato.titulo}</p>
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
