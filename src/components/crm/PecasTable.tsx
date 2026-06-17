import { Trash2, Plus, Edit2 } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Button } from "@/components/ui";

interface Peca {
  id?: string;
  codigo: string;
  descricao: string;
  categoria: string;
  fabricante?: string | null;
  valor_custo: number;
  valor_venda: number;
  estoque: number;
  ativo: boolean;
}

interface PecasTableProps {
  pecas: Peca[];
  onAddPeca: () => void;
  onEditPeca: (peca: Peca) => void;
  onDeletePeca: (id: string) => void;
}

export function PecasTable({
  pecas,
  onAddPeca,
  onEditPeca,
  onDeletePeca,
}: PecasTableProps) {
  return (
    <div style={{ marginTop: spacing.lg }}>
      <div
        style={{
          marginBottom: spacing.md,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ fontSize: "14px", color: colors.textSecondary, fontWeight: 600 }}>
          Peças e Materiais
        </h3>
        <Button variant="primary" size="sm" onClick={onAddPeca}>
          <Plus size={16} /> Nova Peça
        </Button>
      </div>

      {pecas.length === 0 ? (
        <div
          style={{
            padding: spacing.lg,
            textAlign: "center",
            color: colors.textSecondary,
            background: colors.backgroundSecondary,
            borderRadius: borderRadius.md,
          }}
        >
          Nenhuma peça cadastrada
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm, textAlign: "left", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "100px" }}>
                  Código
                </th>
                <th style={{ padding: spacing.sm, textAlign: "left", color: colors.textSecondary, fontSize: "12px", fontWeight: 600 }}>
                  Descrição
                </th>
                <th style={{ padding: spacing.sm, textAlign: "left", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "100px" }}>
                  Categoria
                </th>
                <th style={{ padding: spacing.sm, textAlign: "right", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "90px" }}>
                  Custo
                </th>
                <th style={{ padding: spacing.sm, textAlign: "right", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "90px" }}>
                  Venda
                </th>
                <th style={{ padding: spacing.sm, textAlign: "center", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "70px" }}>
                  Estoque
                </th>
                <th style={{ padding: spacing.sm, textAlign: "center", width: "80px" }}></th>
              </tr>
            </thead>
            <tbody>
              {pecas.map((peca) => {
                const margem = peca.valor_venda - peca.valor_custo;
                const margemPct = peca.valor_custo > 0 ? (margem / peca.valor_custo) * 100 : 0;

                return (
                  <tr key={peca.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: spacing.sm, color: colors.text, fontWeight: 600, fontSize: "12px" }}>
                      {peca.codigo}
                    </td>
                    <td style={{ padding: spacing.sm, color: colors.text }}>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{peca.descricao}</div>
                      {peca.fabricante && (
                        <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "2px" }}>
                          {peca.fabricante}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: spacing.sm, color: colors.textSecondary, fontSize: "12px" }}>
                      {peca.categoria}
                    </td>
                    <td style={{ padding: spacing.sm, color: colors.textSecondary, textAlign: "right", fontSize: "12px" }}>
                      R$ {peca.valor_custo.toFixed(2)}
                    </td>
                    <td style={{ padding: spacing.sm, color: colors.text, textAlign: "right", fontWeight: 600 }}>
                      <div>R$ {peca.valor_venda.toFixed(2)}</div>
                      <div style={{ fontSize: "11px", color: margemPct > 0 ? "#66bb6a" : "#ef5350" }}>
                        (+{margemPct.toFixed(0)}%)
                      </div>
                    </td>
                    <td
                      style={{
                        padding: spacing.sm,
                        color: peca.estoque > 5 ? colors.text : colors.error,
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {peca.estoque}
                    </td>
                    <td style={{ padding: spacing.sm, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button
                          onClick={() => onEditPeca(peca)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: colors.primary,
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => peca.id && onDeletePeca(peca.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: colors.error,
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
