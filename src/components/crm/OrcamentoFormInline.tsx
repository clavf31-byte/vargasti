import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";

interface OrcamentoFormInlineProps {
  userId: string;
  clientes: Array<{ id: string; nome: string }>;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function OrcamentoFormInline({
  userId,
  clientes,
  onSuccess,
  isOpen,
  onClose,
}: OrcamentoFormInlineProps) {
  const [formData, setFormData] = useState({
    numero: "",
    cliente_id: "",
    descricao: "",
    total: "",
    status: "rascunho",
    data_vencimento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("orcamentos").insert([
        {
          numero: formData.numero,
          cliente_id: formData.cliente_id,
          descricao: formData.descricao,
          total: parseFloat(formData.total) || 0,
          status: formData.status,
          data_vencimento: formData.data_vencimento || null,
          user_id: userId,
        },
      ]);

      if (insertError) throw insertError;

      setFormData({
        numero: "",
        cliente_id: "",
        descricao: "",
        total: "",
        status: "rascunho",
        data_vencimento: "",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar orçamento");
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
          Criar Novo Orçamento
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
          label="Número *"
          value={formData.numero}
          onChange={(val) => setFormData({ ...formData, numero: val })}
          type="text"
        />

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
            Cliente *
          </label>
          <select
            value={formData.cliente_id}
            onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            style={{
              width: "100%",
              padding: spacing.md,
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              color: colors.text,
              fontSize: "14px",
            }}
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

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
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            style={{
              width: "100%",
              padding: spacing.md,
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              color: colors.text,
              fontSize: "14px",
              minHeight: "100px",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        <InputField
          label="Valor Total (R$)"
          type="number"
          value={formData.total}
          onChange={(val) => setFormData({ ...formData, total: val })}
        />

        <InputField
          label="Data de Vencimento"
          type="date"
          value={formData.data_vencimento}
          onChange={(val) => setFormData({ ...formData, data_vencimento: val })}
        />

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
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            style={{
              width: "100%",
              padding: spacing.md,
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              color: colors.text,
              fontSize: "14px",
            }}
          >
            <option value="rascunho">Rascunho</option>
            <option value="enviado">Enviado</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
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
          <Button variant="primary" type="submit" disabled={loading || !formData.numero}>
            {loading ? "Criando..." : "Criar Orçamento"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
