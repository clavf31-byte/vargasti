import { Trash2, Plus, Edit2 } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Button } from "@/components/ui";

interface Servico {
  id?: string;
  nome: string;
  categoria: string;
  valor_padrao: number;
  unidade: string;
  descricao?: string;
  ativo: boolean;
}

interface ServicosTableProps {
  servicos: Servico[];
  onAddServico: () => void;
  onEditServico: (servico: Servico) => void;
  onDeleteServico: (id: string) => void;
}

export function ServicosTable({
  servicos,
  onAddServico,
  onEditServico,
  onDeleteServico,
}: ServicosTableProps) {
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
          Serviços Cadastrados
        </h3>
        <Button variant="primary" size="sm" onClick={onAddServico}>
          <Plus size={16} /> Novo Serviço
        </Button>
      </div>

      {servicos.length === 0 ? (
        <div
          style={{
            padding: spacing.lg,
            textAlign: "center",
            color: colors.textSecondary,
            background: colors.backgroundSecondary,
            borderRadius: borderRadius.md,
          }}
        >
          Nenhum serviço cadastrado
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm, textAlign: "left", color: colors.textSecondary, fontSize: "12px", fontWeight: 600 }}>
                  Nome
                </th>
                <th style={{ padding: spacing.sm, textAlign: "left", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "100px" }}>
                  Categoria
                </th>
                <th style={{ padding: spacing.sm, textAlign: "right", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "100px" }}>
                  Valor Padrão
                </th>
                <th style={{ padding: spacing.sm, textAlign: "center", color: colors.textSecondary, fontSize: "12px", fontWeight: 600, width: "80px" }}>
                  Unidade
                </th>
                <th style={{ padding: spacing.sm, textAlign: "center", width: "80px" }}></th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm, color: colors.text }}>
                    <div style={{ fontSize: "13px", fontWeight: 500 }}>{servico.nome}</div>
                    {servico.descricao && (
                      <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "2px" }}>
                        {servico.descricao}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: spacing.sm, color: colors.textSecondary, fontSize: "12px" }}>
                    {servico.categoria}
                  </td>
                  <td style={{ padding: spacing.sm, color: colors.text, textAlign: "right", fontWeight: 600 }}>
                    R$ {servico.valor_padrao.toFixed(2)}
                  </td>
                  <td style={{ padding: spacing.sm, color: colors.textSecondary, textAlign: "center", fontSize: "12px" }}>
                    {servico.unidade}
                  </td>
                  <td style={{ padding: spacing.sm, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                      <button
                        onClick={() => onEditServico(servico)}
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
                        onClick={() => servico.id && onDeleteServico(servico.id)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
