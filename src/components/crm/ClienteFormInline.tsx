import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";

interface ClienteFormInlineProps {
  userId: string;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ClienteFormInline({
  userId,
  onSuccess,
  isOpen,
  onClose,
}: ClienteFormInlineProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    cnpj_cpf: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("clientes").insert([
        {
          ...formData,
          user_id: userId,
        },
      ]);

      if (insertError) throw insertError;

      setFormData({
        nome: "",
        email: "",
        telefone: "",
        empresa: "",
        cnpj_cpf: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente");
      console.error(err);
    } finally {
      setLoading(false);
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

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.lg,
          paddingBottom: spacing.lg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <h2 style={{ margin: 0, color: colors.text, fontSize: "18px" }}>
          Criar Novo Cliente
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: colors.textSecondary,
            fontSize: "24px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

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

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Nome *</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Telefone</label>
          <input
            type="text"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Empresa</label>
          <input
            type="text"
            value={formData.empresa}
            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>CPF/CNPJ</label>
          <input
            type="text"
            value={formData.cnpj_cpf}
            onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Endereço</label>
          <input
            type="text"
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <input
              type="text"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>CEP</label>
          <input
            type="text"
            value={formData.cep}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: spacing.md,
            marginTop: spacing.xl,
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading || !formData.nome}>
            {loading ? "Criando..." : "Criar Cliente"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
