import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { OrcamentoItensTable } from "./OrcamentoItensTable";
import { OrcamentoItemForm } from "./OrcamentoItemForm";
import { useOrcamentoItens } from "@/hooks/useOrcamentoItens";
import { gerarNumeroOrcamento, previewNumeroOrcamento } from "@/hooks/useOrcamentoNumero";

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
    numero_formatado: "",
    cliente_id: "",
    descricao: "",
    desconto: 0,
    impostos: 0,
    status_enum: "rascunho",
    data_vencimento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const { itens, total, addItem, updateItem, removeItem, saveItens } = useOrcamentoItens();

  useEffect(() => {
    if (!isOpen) return;
    setFormData((f) => ({ ...f, numero_formatado: "" }));
    previewNumeroOrcamento(userId).then((num) =>
      setFormData((f) => ({ ...f, numero_formatado: num }))
    );
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const subtotal = total;
  const totalComDescontoEImpostos = Math.max(
    0,
    subtotal - formData.desconto + formData.impostos
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Gerar número apenas ao salvar
      const numero = await gerarNumeroOrcamento(userId);

      const { error: insertError } = await supabase
        .from("orcamentos")
        .insert([
          {
            numero: numero,
            numero_formatado: numero,
            cliente_id: formData.cliente_id,
            notas: formData.descricao,
            total: totalComDescontoEImpostos,
            desconto: formData.desconto,
            impostos: formData.impostos,
            status: "rascunho",
            status_enum: formData.status_enum,
            data_vencimento: formData.data_vencimento || null,
            user_id: userId,
          },
        ]);

      if (insertError) throw insertError;

      // Get the created id from numero_formatado (ou fetch the latest)
      const { data: createdOrc, error: fetchError } = await supabase
        .from("orcamentos")
        .select("id")
        .eq("numero_formatado", numero)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;
      const orcamentoId = createdOrc.id;

      if (itens.length > 0) {
        await saveItens(orcamentoId);
      }

      setFormData({
        numero_formatado: "",
        cliente_id: "",
        descricao: "",
        desconto: 0,
        impostos: 0,
        status_enum: "rascunho",
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginBottom: spacing.lg }}>
          <div>
            <label style={labelStyle}>Número</label>
            <input
              type="text"
              value={formData.numero_formatado || "Gerando..."}
              disabled
              style={{
                ...inputStyle,
                opacity: 0.5,
                cursor: "not-allowed",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Cliente *</label>
            <select
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              style={inputStyle}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Descrição</label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            style={{
              ...inputStyle,
              minHeight: "80px",
              fontFamily: "inherit",
            }}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginBottom: spacing.lg }}>
          <div>
            <label style={labelStyle}>Desconto (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.desconto}
              onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Impostos (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.impostos}
              onChange={(e) => setFormData({ ...formData, impostos: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              style={inputStyle}
            />
          </div>
        </div>

        <OrcamentoItensTable
          itens={itens}
          onAddItem={() => setShowItemForm(true)}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
        />

        {showItemForm && (
          <OrcamentoItemForm
            onAdd={(item) => {
              addItem();
              const lastIdx = itens.length;
              updateItem(lastIdx, item);
              setShowItemForm(false);
            }}
            onClose={() => setShowItemForm(false)}
          />
        )}

        {/* Resumo de Totais */}
        <div
          style={{
            background: "rgba(13, 208, 215, 0.05)",
            border: `1px solid rgba(13, 208, 215, 0.2)`,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>
                Subtotal
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: colors.text }}>
                R$ {subtotal.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>
                Desconto
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: colors.error }}>
                -R$ {formData.desconto.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>
                Impostos
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: colors.error }}>
                +R$ {formData.impostos.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>
                Total Geral
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: colors.primary }}>
                R$ {totalComDescontoEImpostos.toFixed(2)}
              </div>
            </div>
          </div>
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
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !formData.cliente_id}
          >
            {loading ? "Criando..." : "Criar Orçamento"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
