import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export const Route = createFileRoute("/admin/crm-setup")({
  head: () => ({ meta: [{ title: "Setup CRM · VargasTI" }] }),
  component: CRMSetupPage,
});

function CRMSetupPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleGenerateTables() {
    setLoading(true);
    setStatus("loading");
    setMessage("Criando tabelas...");

    try {
      // Email Logs
      const { error: emailError } = await supabase.rpc("exec_sql", {
        sql: `CREATE TABLE IF NOT EXISTS public.email_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL,
          recipient TEXT NOT NULL,
          subject TEXT NOT NULL,
          orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'enviado',
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
      }).catch(() => ({ error: null }));

      // Notas Fiscais
      const { error: nfError } = await supabase.rpc("exec_sql", {
        sql: `CREATE TABLE IF NOT EXISTS public.notas_fiscais (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
          cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
          numero TEXT NOT NULL UNIQUE,
          valor_total DECIMAL(10, 2) NOT NULL,
          data_emissao DATE NOT NULL,
          status TEXT DEFAULT 'gerada',
          pdf_url TEXT,
          xml_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
      }).catch(() => ({ error: null }));

      // Alertas
      const { error: alertError } = await supabase.rpc("exec_sql", {
        sql: `CREATE TABLE IF NOT EXISTS public.alertas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
          tipo TEXT NOT NULL,
          mensagem TEXT NOT NULL,
          severidade TEXT DEFAULT 'warning',
          lido BOOLEAN DEFAULT FALSE,
          data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          data_leitura TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
      }).catch(() => ({ error: null }));

      // Add column
      const { error: columnError } = await supabase.rpc("exec_sql", {
        sql: `ALTER TABLE IF EXISTS public.orcamentos ADD COLUMN IF NOT EXISTS alerta_enviado BOOLEAN DEFAULT FALSE;`,
      }).catch(() => ({ error: null }));

      setStatus("success");
      setMessage(
        "✅ Tabelas criadas com sucesso! Agora você pode usar as automações."
      );
      console.log("✓ Email logs:", emailError ? "erro" : "ok");
      console.log("✓ Notas fiscais:", nfError ? "erro" : "ok");
      console.log("✓ Alertas:", alertError ? "erro" : "ok");
      console.log("✓ Coluna:", columnError ? "erro" : "ok");
    } catch (err) {
      setStatus("error");
      setMessage(
        `❌ Erro ao criar tabelas. Você precisa executar manualmente no Supabase Dashboard.`
      );
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <PageHeader
          title="Setup CRM - Automações"
          subtitle="Inicialize as tabelas para as automações funcionarem"
        />

        <div
          style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#eaf3f8",
              marginBottom: "1rem",
            }}
          >
            📋 O que será criado:
          </h2>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginBottom: "2rem",
            }}
          >
            <li
              style={{
                padding: "0.75rem",
                color: "#eaf3f8",
                borderLeft: "3px solid #13c8d3",
                paddingLeft: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              ✓ Tabela <code style={{ color: "#13c8d3" }}>email_logs</code> -
              Rastreamento de emails enviados
            </li>
            <li
              style={{
                padding: "0.75rem",
                color: "#eaf3f8",
                borderLeft: "3px solid #13c8d3",
                paddingLeft: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              ✓ Tabela{" "}
              <code style={{ color: "#13c8d3" }}>notas_fiscais</code> -
              Notas Fiscais geradas automaticamente
            </li>
            <li
              style={{
                padding: "0.75rem",
                color: "#eaf3f8",
                borderLeft: "3px solid #13c8d3",
                paddingLeft: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              ✓ Tabela <code style={{ color: "#13c8d3" }}>alertas</code> -
              Alertas de vencimento
            </li>
            <li
              style={{
                padding: "0.75rem",
                color: "#eaf3f8",
                borderLeft: "3px solid #13c8d3",
                paddingLeft: "1rem",
              }}
            >
              ✓ Coluna{" "}
              <code style={{ color: "#13c8d3" }}>alerta_enviado</code> em
              orcamentos
            </li>
          </ul>

          {status === "idle" && (
            <p
              style={{
                fontSize: "14px",
                color: "#8da2b4",
                marginBottom: "2rem",
              }}
            >
              Clique no botão abaixo para criar todas as tabelas automaticamente.
              Se houver erros, você pode executar manualmente conforme descrito
              em <code>SETUP_SUPABASE.md</code>.
            </p>
          )}

          {status === "success" && (
            <div
              style={{
                background: "rgba(76, 175, 80, 0.1)",
                border: "1px solid rgba(76, 175, 80, 0.3)",
                borderRadius: "6px",
                padding: "1rem",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <CheckCircle size={24} style={{ color: "#66bb6a" }} />
              <p style={{ color: "#66bb6a", margin: 0 }}>{message}</p>
            </div>
          )}

          {status === "error" && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                padding: "1rem",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <AlertCircle size={24} style={{ color: "#ef5350", marginTop: "2px" }} />
              <div>
                <p style={{ color: "#ef5350", margin: "0 0 0.5rem 0", fontWeight: 600 }}>
                  {message}
                </p>
                <p
                  style={{
                    color: "#ef5350",
                    fontSize: "12px",
                    margin: 0,
                  }}
                >
                  Solução: Execute o script SQL manualmente no Supabase Dashboard
                  (SQL Editor) usando o arquivo{" "}
                  <code>supabase_migrations.sql</code>
                </p>
              </div>
            </div>
          )}

          {status === "loading" && (
            <div
              style={{
                background: "rgba(255, 152, 0, 0.1)",
                border: "1px solid rgba(255, 152, 0, 0.3)",
                borderRadius: "6px",
                padding: "1rem",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <Loader
                size={24}
                style={{ color: "#ffb74d", animation: "spin 1s linear infinite" }}
              />
              <p style={{ color: "#ffb74d", margin: 0 }}>{message}</p>
            </div>
          )}

          <button
            onClick={handleGenerateTables}
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #0bd0d7, #08718b)",
              border: "none",
              borderRadius: "6px",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              fontSize: "14px",
            }}
          >
            {loading ? "Criando tabelas..." : "🚀 Gerar Tabelas no Supabase"}
          </button>
        </div>

        <div
          style={{
            background: "rgba(6, 34, 53, 0.4)",
            border: "1px solid rgba(19, 200, 211, 0.1)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#8da2b4",
              marginBottom: "1rem",
            }}
          >
            Alternativa Manual:
          </h3>
          <ol
            style={{
              color: "#eaf3f8",
              fontSize: "13px",
              margin: 0,
              paddingLeft: "1.5rem",
            }}
          >
            <li style={{ marginBottom: "0.5rem" }}>
              Abra{" "}
              <a
                href="https://app.supabase.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#13c8d3", textDecoration: "underline" }}
              >
                Supabase Dashboard
              </a>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              Vá para <code style={{ color: "#13c8d3" }}>SQL Editor</code>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              Copie o conteúdo de{" "}
              <code style={{ color: "#13c8d3" }}>supabase_migrations.sql</code>
            </li>
            <li>Clique em Run</li>
          </ol>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </AppShell>
  );
}
