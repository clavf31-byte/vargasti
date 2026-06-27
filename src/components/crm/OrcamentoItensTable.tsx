import { Trash2, Plus } from "lucide-react";

interface OrcamentoItem {
  id?: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria?: string;
  tipo?: "servico" | "peca";
  servico_id?: string;
  peca_id?: string;
}

interface OrcamentoItensTableProps {
  itens: OrcamentoItem[];
  onAddItem: () => void;
  onUpdateItem: (index: number, item: OrcamentoItem) => void;
  onRemoveItem: (index: number) => void;
}

export function OrcamentoItensTable({ itens, onAddItem, onUpdateItem, onRemoveItem }: OrcamentoItensTableProps) {
  const total = itens.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground">Itens do Orçamento</label>
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus className="size-3.5" /> Adicionar Item
        </button>
      </div>

      {itens.length === 0 ? (
        <div className="bg-surface rounded-lg p-4 text-center text-sm text-muted-foreground border border-dashed border-border">
          Nenhum item adicionado
        </div>
      ) : (
        <div className="overflow-x-auto space-y-2">
          <div className="card-graphite overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-32">Categoria</th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16">Qtd</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Preço Unit.</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Subtotal</th>
                  <th className="px-3 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => onUpdateItem(idx, { ...item, descricao: e.target.value })}
                        placeholder="Descrição do item"
                        className="input-base w-full text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.categoria || "Produtos, peças e materiais"}
                        onChange={(e) => onUpdateItem(idx, { ...item, categoria: e.target.value })}
                        className="input-base w-full text-xs"
                      >
                        <option value="Serviços">Serviços</option>
                        <option value="Produtos, peças e materiais">Produtos, peças e materiais</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => {
                          const qty = parseFloat(e.target.value) || 0;
                          onUpdateItem(idx, { ...item, quantidade: qty, subtotal: qty * item.preco_unitario });
                        }}
                        placeholder="1"
                        className="input-base w-full text-xs text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.preco_unitario}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          onUpdateItem(idx, { ...item, preco_unitario: price, subtotal: item.quantidade * price });
                        }}
                        placeholder="0.00"
                        step="0.01"
                        className="input-base w-full text-xs text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-foreground text-xs">
                      R$ {item.subtotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => onRemoveItem(idx)} className="text-destructive hover:text-destructive/80 transition-colors" title="Remover item">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end px-3 py-2.5 bg-surface rounded-lg border-t-2 border-border">
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-0.5">Total:</div>
              <div className="text-2xl font-bold text-foreground">R$ {total.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
