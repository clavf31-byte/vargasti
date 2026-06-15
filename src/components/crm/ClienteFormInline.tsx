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

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    type?: string;
  }) => (
    <div style={{ marginBottom: spacing.lg }}>
      <label
        style={{
          display: "block",
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: spacing.sm,
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: spacing.md,
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.md,
          color: colors.text,
          fontSize: "14px",
          boxSizing: "border-box",
        }}
      />
    </div>
  );

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
        <InputField
          label="Nome *"
          value={formData.nome}
          onChange={(val) => setFormData({ ...formData, nome: val })}
        />
        <InputField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(val) => setFormData({ ...formData, email: val })}
        />
        <InputField
          label="Telefone"
          value={formData.telefone}
          onChange={(val) => setFormData({ ...formData, telefone: val })}
        />
        <InputField
          label="Empresa"
          value={formData.empresa}
          onChange={(val) => setFormData({ ...formData, empresa: val })}
        />
        <InputField
          label="CPF/CNPJ"
          value={formData.cnpj_cpf}
          onChange={(val) => setFormData({ ...formData, cnpj_cpf: val })}
        />
        <InputField
          label="Endereço"
          value={formData.endereco}
          onChange={(val) => setFormData({ ...formData, endereco: val })}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <InputField
            label="Cidade"
            value={formData.cidade}
            onChange={(val) => setFormData({ ...formData, cidade: val })}
          />
          <InputField
            label="Estado"
            value={formData.estado}
            onChange={(val) => setFormData({ ...formData, estado: val })}
          />
        </div>

        <InputField
          label="CEP"
          value={formData.cep}
          onChange={(val) => setFormData({ ...formData, cep: val })}
        />

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
