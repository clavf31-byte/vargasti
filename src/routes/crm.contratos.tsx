import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Plus, Eye, Send, FileUp, Trash2 } from "lucide-react";

export const Route = createFileRoute("/crm/contratos")({
  head: () => ({ meta: [{ title: "Contratos · CRM VargasTI" }] }),
  component: ContratosPage,
});

interface Contrato {
  id: string;
  titulo: string;
  cliente_id: string;
  clientes?: { nome: string };
  status: string;
  email_enviado_em?: string;
  assinado_em?: string;
  created_at: string;
}

function ContratosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContratos = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, titulo, cliente_id, clientes(nome), status, email_enviado_em, assinado_em, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContratos(data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContratos();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este contrato?")) return;
    try {
      await supabase.from("contracts").delete().eq("id", id);
      loadContratos();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      rascunho: colors.textSecondary,
      enviado: colors.primary,
      assinado: colors.success,
    };
    return map[status] || colors.text;
  };

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1400px", margin: "0 auto" }}>
        <PageHeader
          title="Contratos"
          subtitle={`${contratos.length} contrato(s)`}
          action={
            <Button variant="primary" onClick={() => navigate({ to: "/crm/contratos/novo" })}>
              <Plus size={18} /> Novo Contrato
            </Button>
          }
          icon="📜"
        />

        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        ) : contratos.length === 0 ? (
          <Card>
            <p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>
              Nenhum contrato criado
            </p>
          </Card>
        ) : (
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Título
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Cliente
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Data
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "center", color: colors.textSecondary, fontWeight: 600 }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td style={{ padding: spacing.md, color: colors.text, fontWeight: 500 }}>{c.titulo}</td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>
                        {(c.clientes as any)?.nome || "-"}
                      </td>
                      <td style={{ padding: spacing.md, color: getStatusColor(c.status), fontWeight: 600 }}>
                        {c.status === "rascunho" && "📝 Rascunho"}
                        {c.status === "enviado" && "📧 Enviado"}
                        {c.status === "assinado" && "✅ Assinado"}
                      </td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td style={{ padding: spacing.md, textAlign: "center", display: "flex", gap: spacing.sm, justifyContent: "center" }}>
                        <button
                          onClick={() => navigate({ to: `/crm/contratos/${c.id}` })}
                          style={{
                            background: colors.background,
                            border: `1px solid ${colors.border}`,
                            color: colors.primary,
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: borderRadius.sm,
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "flex",
                            gap: "4px",
                            alignItems: "center",
                          }}
                        >
                          <Eye size={14} /> Ver
                        </button>
                        {c.status === "rascunho" && (
                          <button
                            onClick={() => navigate({ to: `/crm/contratos/${c.id}/enviar` })}
                            style={{
                              background: colors.background,
                              border: `1px solid ${colors.primary}`,
                              color: colors.primary,
                              padding: `${spacing.sm} ${spacing.md}`,
                              borderRadius: borderRadius.sm,
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              gap: "4px",
                              alignItems: "center",
                            }}
                          >
                            <Send size={14} /> Enviar
                          </button>
                        )}
                        {c.status === "enviado" && (
                          <button
                            onClick={() => navigate({ to: `/crm/contratos/${c.id}/receber` })}
                            style={{
                              background: colors.background,
                              border: `1px solid ${colors.success}`,
                              color: colors.success,
                              padding: `${spacing.sm} ${spacing.md}`,
                              borderRadius: borderRadius.sm,
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              gap: "4px",
                              alignItems: "center",
                            }}
                          >
                            <FileUp size={14} /> Receber
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{
                            background: colors.background,
                            border: `1px solid ${colors.error}`,
                            color: colors.error,
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: borderRadius.sm,
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
