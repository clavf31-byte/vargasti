import { Trash2, Plus, Wrench, Package } from "lucide-react";

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
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📦 Itens do Orçamento</label>
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
        <div className="space-y-2">
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-auto">Descrição</th>
                  <th className="px-3 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20">Qtd</th>
                  <th className="px-3 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Unitário</th>
                  <th className="px-3 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Total</th>
                  <th className="px-3 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {item.tipo === 'servico' ? (
                            <Wrench className="size-3.5 text-cyan-400 shrink-0" />
                          ) : (
                            <Package className="size-3.5 text-amber-400 shrink-0" />
                          )}
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) => onUpdateItem(idx, { ...item, descricao: e.target.value })}
                            placeholder="Descrição do item"
                            className="input-base flex-1 text-xs font-medium"
                          />
                        </div>
                        {item.peca_id && (
                          <div className="text-[10px] text-muted-foreground/60 ml-5">
                            SKU: {item.peca_id.slice(0, 8)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => {
                          const qty = parseFloat(e.target.value) || 0;
                          onUpdateItem(idx, { ...item, quantidade: qty, subtotal: qty * item.preco_unitario });
                        }}
                        placeholder="1"
                        className="input-base w-full text-xs text-center"
                        step="0.1"
                      />
                    </td>
                    <td className="px-3 py-3">
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
                    <td className="px-3 py-3 text-right font-semibold text-success text-xs">
                      R$ {item.subtotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Remover item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS SECTION */}
          <div className="grid grid-cols-2 gap-3 px-3 py-3 bg-surface/50 rounded-lg border border-border/50">
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Subtotal</div>
              <div className="text-lg font-semibold text-foreground">R$ {total.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">TOTAL</div>
              <div className="text-xl font-bold text-brand">R$ {total.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
