import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { setupCRMTables } from "@/lib/api/example.functions";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/setup")({
  component: AdminSetupPage,
});

function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  async function handleSetup() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await setupCRMTables();
      setResult(response);
      if (!response.success) {
        setError(response.error || "Erro desconhecido");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar tabelas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Setup do CRM" subtitle="Crie as tabelas necessárias" />

      <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem" }}>
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#1e40af" }}>🚀 Criar Tabelas do CRM</h2>
          <p style={{ color: "#1e40af", marginBottom: "1.5rem" }}>
            Clique no botão abaixo para criar todas as tabelas necessárias no Supabase:
          </p>

          <ul style={{ color: "#1e40af", marginBottom: "2rem", paddingLeft: "1.5rem" }}>
            <li>✅ clientes</li>
            <li>✅ orcamentos</li>
            <li>✅ pagamentos</li>
            <li>✅ email_logs</li>
            <li>✅ notas_fiscais</li>
            <li>✅ alertas</li>
          </ul>

          <button
            onClick={handleSetup}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 24px",
              background: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                Criando tabelas...
              </>
            ) : (
              "Criar Tabelas Agora"
            )}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "2rem",
              display: "flex",
              gap: "1rem",
            }}
          >
            <AlertCircle size={24} style={{ color: "#dc2626", flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#7f1d1d" }}>❌ Erro</h3>
              <p style={{ margin: 0, color: "#7f1d1d" }}>{error}</p>
            </div>
          </div>
        )}

        {result?.success && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "1rem",
              display: "flex",
              gap: "1rem",
            }}
          >
            <CheckCircle2 size={24} style={{ color: "#16a34a", flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#15803d" }}>✅ Sucesso!</h3>
              <p style={{ margin: "0 0 1rem 0", color: "#15803d" }}>{result.message}</p>
              <p style={{ margin: 0, color: "#15803d", fontSize: "14px" }}>
                Tabelas criadas: {result.tables.join(", ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
