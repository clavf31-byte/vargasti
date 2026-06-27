import { Trash2, Plus, Edit2 } from "lucide-react";

interface Servico {
  id?: string;
  nome: string;
  categoria: string;
  valor_padrao: number;
  unidade: string;
  descricao?: string | null;
  ativo: boolean;
}

interface ServicosTableProps {
  servicos: Servico[];
  onAddServico: () => void;
  onEditServico: (servico: Servico) => void;
  onDeleteServico: (id: string) => void;
}

export function ServicosTable({ servicos, onAddServico, onEditServico, onDeleteServico }: ServicosTableProps) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serviços Cadastrados</p>
        <button
          onClick={onAddServico}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus className="size-3.5" /> Novo Serviço
        </button>
      </div>

      {servicos.length === 0 ? (
        <div className="card-graphite border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado
        </div>
      ) : (
        <div className="card-graphite overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Categoria</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Valor Padrão</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20">Unidade</th>
                <th className="px-3 py-2.5 text-center w-16"></th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground text-sm">{s.nome}</div>
                    {s.descricao && <div className="text-[11px] text-muted-foreground mt-0.5">{s.descricao}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.categoria}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-foreground">R$ {s.valor_padrao.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">{s.unidade}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onEditServico(s)} className="text-select hover:text-select/80 transition-colors" title="Editar">
                        <Edit2 className="size-3.5" />
                      </button>
                      <button onClick={() => s.id && onDeleteServico(s.id)} className="text-destructive hover:text-destructive/80 transition-colors" title="Remover">
                        <Trash2 className="size-3.5" />
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
