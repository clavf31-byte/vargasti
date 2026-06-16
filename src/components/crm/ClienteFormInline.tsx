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

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const InputField = ({
    label,
    field,
    type = "text",
  }: {
    label: string;
    field: keyof typeof formData;
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
        value={formData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
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
        <InputField label="Nome *" field="nome" />
        <InputField label="Email" type="email" field="email" />
        <InputField label="Telefone" field="telefone" />
        <InputField label="Empresa" field="empresa" />
        <InputField label="CPF/CNPJ" field="cnpj_cpf" />
        <InputField label="Endereço" field="endereco" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <InputField label="Cidade" field="cidade" />
          <InputField label="Estado" field="estado" />
        </div>

        <InputField label="CEP" field="cep" />

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
