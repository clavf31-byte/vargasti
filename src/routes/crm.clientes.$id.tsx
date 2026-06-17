import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/crm/clientes/$id")({
  head: () => ({ meta: [{ title: "Editar Cliente · CRM VargasTI" }] }),
  component: EditarClientePage,
});

type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cnpj_cpf?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

function EditarClientePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cnpj_cpf: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  useEffect(() => {
    if (!user || !id) return;
    loadCliente();
  }, [user, id]);

  async function loadCliente() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (err) throw err;

      setCliente(data as Cliente);
      setFormData({
        nome: data.nome || "",
        email: data.email || "",
        telefone: data.telefone || "",
        cnpj_cpf: data.cnpj_cpf || "",
        endereco: data.endereco || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        cep: data.cep || "",
      });
    } catch (err) {
      setError("Erro ao carregar cliente");
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
        .from("clientes")
        .update(formData)
        .eq("id", id)
        .eq("user_id", user!.id);

      if (err) throw err;

      setMessage("✅ Cliente atualizado com sucesso!");
      setTimeout(() => navigate({ to: "/crm/clientes" }), 1500);
    } catch (err) {
      setError("Erro ao salvar cliente");
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

  if (!cliente) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl }}>
          <p style={{ color: colors.error }}>Cliente não encontrado</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "800px", margin: "0 auto" }}>
        <button
          onClick={() => navigate({ to: "/crm/clientes" })}
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
          title="Editar Cliente"
          subtitle={cliente.nome}
          icon="👤"
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
            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>CPF/CNPJ</label>
              <input
                type="text"
                value={formData.cnpj_cpf}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj_cpf: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Endereço</label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: spacing.md,
                marginBottom: spacing.lg,
              }}
            >
              <div>
                <label style={labelStyle}>Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>CEP</label>
              <input
                type="text"
                value={formData.cep}
                onChange={(e) =>
                  setFormData({ ...formData, cep: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: spacing.md }}>
              <Button
                variant="secondary"
                onClick={() => navigate({ to: "/crm/clientes" })}
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
