import { Trash2, Plus } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Button } from "@/components/ui";

interface OrcamentoItem {
  id?: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface OrcamentoItensTableProps {
  itens: OrcamentoItem[];
  onAddItem: () => void;
  onUpdateItem: (index: number, item: OrcamentoItem) => void;
  onRemoveItem: (index: number) => void;
}

export function OrcamentoItensTable({
  itens,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: OrcamentoItensTableProps) {
  const total = itens.reduce((sum, item) => sum + item.subtotal, 0);

  const inputStyle = {
    width: "100%",
    padding: spacing.sm,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.sm,
    color: colors.text,
    fontSize: "13px",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <div style={{ marginBottom: spacing.md, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: "14px", color: colors.textSecondary, fontWeight: 600 }}>
          Itens do Orçamento
        </label>
        <Button variant="primary" size="sm" onClick={onAddItem}>
          <Plus size={16} /> Adicionar Item
        </Button>
      </div>

      {itens.length === 0 ? (
        <div style={{ padding: spacing.lg, textAlign: "center", color: colors.textSecondary, background: colors.backgroundSecondary, borderRadius: borderRadius.md }}>
          Nenhum item adicionado
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: spacing.md }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm, textAlign: "left", color: colors.textSecondary, fontSize: "12px", fontWeight: 600 }}>Descrição</th>
                <th style={{ padding: spacing.sm, textAlign: "center", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "80px" }}>Qtd</th>
                <th style={{ padding: spacing.sm, textAlign: "right", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "100px" }}>Preço Unit.</th>
                <th style={{ padding: spacing.sm, textAlign: "right", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "100px" }}>Subtotal</th>
                <th style={{ padding: spacing.sm, textAlign: "center", width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>
                    <input
                      type="text"
                      value={item.descricao}
                      onChange={(e) => onUpdateItem(idx, { ...item, descricao: e.target.value })}
                      placeholder="Descrição do item"
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: spacing.sm }}>
                    <input
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => {
                        const qty = parseFloat(e.target.value) || 0;
                        onUpdateItem(idx, {
                          ...item,
                          quantidade: qty,
                          subtotal: qty * item.preco_unitario,
                        });
                      }}
                      placeholder="1"
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: spacing.sm }}>
                    <input
                      type="number"
                      value={item.preco_unitario}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        onUpdateItem(idx, {
                          ...item,
                          preco_unitario: price,
                          subtotal: item.quantidade * price,
                        });
                      }}
                      placeholder="0.00"
                      step="0.01"
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: spacing.sm, textAlign: "right", color: colors.text, fontWeight: 600 }}>
                    R$ {item.subtotal.toFixed(2)}
                  </td>
                  <td style={{ padding: spacing.sm, textAlign: "center" }}>
                    <button
                      onClick={() => onRemoveItem(idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: colors.error,
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: `${spacing.md} ${spacing.lg}`,
              background: colors.backgroundSecondary,
              borderRadius: borderRadius.md,
              borderTop: `2px solid ${colors.border}`,
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.sm }}>
                Total:
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: colors.text }}>
                R$ {total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
