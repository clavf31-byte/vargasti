import { Trash2, Plus, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function PecasTable({ pecas, onAddPeca, onEditPeca, onDeletePeca }: PecasTableProps) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Peças e Materiais</p>
        <button
          onClick={onAddPeca}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus className="size-3.5" /> Nova Peça
        </button>
      </div>

      {pecas.length === 0 ? (
        <div className="card-graphite border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma peça cadastrada
        </div>
      ) : (
        <div className="card-graphite overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Código</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Categoria</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Custo</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Venda</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20">Estoque</th>
                <th className="px-3 py-2.5 text-center w-16"></th>
              </tr>
            </thead>
            <tbody>
              {pecas.map((p) => {
                const margem = p.valor_venda - p.valor_custo;
                const margemPct = p.valor_custo > 0 ? (margem / p.valor_custo) * 100 : 0;
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-xs text-foreground">{p.codigo}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-foreground text-sm">{p.descricao}</div>
                      {p.fabricante && <div className="text-[11px] text-muted-foreground mt-0.5">{p.fabricante}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.categoria}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">R$ {p.valor_custo.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-semibold text-foreground text-sm">R$ {p.valor_venda.toFixed(2)}</div>
                      <div className={cn("text-[11px]", margemPct > 0 ? "text-brand" : "text-destructive")}>
                        +{margemPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className={cn("px-3 py-2.5 text-center font-semibold text-sm", p.estoque > 5 ? "text-foreground" : "text-destructive")}>
                      {p.estoque}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEditPeca(p)} className="text-select hover:text-select/80 transition-colors" title="Editar">
                          <Edit2 className="size-3.5" />
                        </button>
                        <button onClick={() => p.id && onDeletePeca(p.id)} className="text-destructive hover:text-destructive/80 transition-colors" title="Remover">
                          <Trash2 className="size-3.5" />
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
