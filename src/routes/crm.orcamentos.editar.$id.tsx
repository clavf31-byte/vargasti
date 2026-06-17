import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/crm/orcamentos/editar/$id")({
  head: () => ({ meta: [{ title: "Editar Orçamento · CRM VargasTI" }] }),
  component: EditarOrcamentoPage,
});

type Orcamento = {
  id: string;
  numero_formatado: string;
  cliente_id: string;
  total: number;
  desconto?: number;
  impostos?: number;
  data_vencimento: string;
  notas: string;
  status_enum: string;
};

function EditarOrcamentoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    desconto: 0,
    impostos: 0,
    data_vencimento: "",
    notas: "",
  });

  useEffect(() => {
    if (!user || !id) return;
    loadOrcamento();
  }, [user, id]);

  async function loadOrcamento() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (err) throw err;

      setOrcamento(data as Orcamento);
      setFormData({
        desconto: data.desconto || 0,
        impostos: data.impostos || 0,
        data_vencimento: data.data_vencimento || "",
        notas: data.notas || "",
      });
    } catch (err) {
      setError("Erro ao carregar orçamento");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { error: err } = await supabase
        .from("orcamentos")
        .update({
          desconto: formData.desconto,
          impostos: formData.impostos,
          data_vencimento: formData.data_vencimento || null,
          notas: formData.notas,
        })
        .eq("id", id)
        .eq("user_id", user!.id);

      if (err) throw err;

      setMessage("✅ Orçamento atualizado com sucesso!");
      setTimeout(
        () => navigate({ to: `/crm/orcamentos/${id}` }),
        1500
      );
    } catch (err) {
      setError("Erro ao salvar orçamento");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: spacing.md,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: "14px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "14px",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 600 as const,
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl }}>
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        </div>
      </AppShell>
    );
  }

  if (!orcamento) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl }}>
          <p style={{ color: colors.error }}>Orçamento não encontrado</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "800px", margin: "0 auto" }}>
        <button
          onClick={() => navigate({ to: `/crm/orcamentos/${id}` })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            background: "transparent",
            border: "none",
            color: colors.primary,
            cursor: "pointer",
            marginBottom: spacing.lg,
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={18} />
          Voltar
        </button>

        <PageHeader
          title="Editar Orçamento"
          subtitle={orcamento.numero_formatado}
          icon="📋"
        />

        <Card>
          {error && (
            <div
              style={{
                background: "rgba(211, 47, 47, 0.1)",
                border: `1px solid ${colors.error}`,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
                color: colors.error,
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                background: "rgba(76, 175, 80, 0.1)",
                border: `1px solid ${colors.success}`,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
                color: colors.success,
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: spacing.lg,
                marginBottom: spacing.lg,
              }}
            >
              <div>
                <label style={labelStyle}>Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.desconto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      desconto: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Impostos (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.impostos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impostos: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Data de Vencimento</label>
              <input
                type="date"
                value={formData.data_vencimento}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    data_vencimento: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Descrição/Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                style={{
                  ...inputStyle,
                  minHeight: "100px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: spacing.md }}>
              <Button
                variant="secondary"
                onClick={() => navigate({ to: `/crm/orcamentos/${id}` })}
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
