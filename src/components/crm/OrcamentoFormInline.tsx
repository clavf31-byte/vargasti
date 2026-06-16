import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { OrcamentoItensTable } from "./OrcamentoItensTable";
import { useOrcamentoItens } from "@/hooks/useOrcamentoItens";

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
  const { itens, total, addItem, updateItem, removeItem, saveItens } = useOrcamentoItens();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from("orcamentos")
        .insert([
          {
            numero: formData.numero,
            cliente_id: formData.cliente_id,
            notas: formData.descricao,
            total: total || parseFloat(formData.total) || 0,
            status: formData.status,
            data_vencimento: formData.data_vencimento || null,
            user_id: userId,
          },
        ])
        .select();

      if (insertError) throw insertError;
      if (!insertedData || insertedData.length === 0) throw new Error("Erro ao criar orçamento");

      const orcamentoId = insertedData[0].id;

      if (itens.length > 0) {
        await saveItens(orcamentoId);
      }

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
      const errorMsg = err instanceof Error ? err.message : "Erro ao criar orçamento";
      setError(errorMsg);
      console.error("Erro ao criar orçamento:", { error: err, formData });
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
        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Número *</label>
          <input
            type="text"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Cliente *</label>
          <select
            value={formData.cliente_id}
            onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            style={inputStyle}
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
          <label style={labelStyle}>Descrição</label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            style={{
              ...inputStyle,
              minHeight: "100px",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Valor Total (R$)</label>
          <input
            type="number"
            value={formData.total}
            onChange={(e) => setFormData({ ...formData, total: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Data de Vencimento</label>
          <input
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
            style={inputStyle}
          />
        </div>

        <OrcamentoItensTable
          itens={itens}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
        />

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            style={inputStyle}
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
