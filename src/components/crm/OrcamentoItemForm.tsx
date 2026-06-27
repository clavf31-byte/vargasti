import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useServicos } from "@/hooks/useServicos";
import { usePecas } from "@/hooks/usePecas";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria?: string;
  tipo?: "servico" | "peca";
  servico_id?: string;
  peca_id?: string;
}

interface OrcamentoItemFormProps {
  onAdd: (item: OrcamentoItem) => void;
  onClose: () => void;
}

export function OrcamentoItemForm({ onAdd, onClose }: OrcamentoItemFormProps) {
  const { user } = useAuth();
  const { servicos, loadServicos: refetchServicos } = useServicos(user?.id);
  const { pecas, loadPecas: refetchPecas } = usePecas(user?.id);

  const [tipo, setTipo] = useState<"servico" | "peca">("servico");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoCustomizado, setPrecoCustomizado] = useState(false);
  const [preco, setPreco] = useState(0);

  const [showNewForm, setShowNewForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState(0);
  const [novoDescricao, setNovoDescricao] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    if (tipo === "servico" && servicos.length > 0) {
      setSelecionado(servicos[0]);
      setPreco(servicos[0].valor_padrao);
    } else if (tipo === "peca" && pecas.length > 0) {
      setSelecionado(pecas[0]);
      setPreco(pecas[0].valor_venda);
    }
  }, [tipo, servicos, pecas]);

  async function handleCreateNew() {
    if (!novoNome.trim() || novoPreco <= 0) { alert("Preencha todos os campos"); return; }
    setCreatingNew(true);
    try {
      if (tipo === "servico") {
        const { data } = await supabase.from("servicos").insert([{
          user_id: user!.id, nome: novoNome, valor_padrao: novoPreco, descricao: novoDescricao, ativo: true, unidade: "h", categoria: "Geral",
        }]).select();
        if (data?.[0]) { setSelecionado(data[0]); setPreco(data[0].valor_padrao); setShowNewForm(false); await refetchServicos?.(); }
      } else {
        const { data } = await supabase.from("pecas").insert([{
          user_id: user!.id, codigo: `PEC-${Date.now()}`, descricao: novoNome, categoria: novoDescricao || "Geral",
          valor_venda: novoPreco, valor_custo: novoPreco * 0.6, ativo: true,
        }]).select();
        if (data?.[0]) { setSelecionado(data[0]); setPreco(data[0].valor_venda); setShowNewForm(false); await refetchPecas?.(); }
      }
      setNovoNome(""); setNovoPreco(0); setNovoDescricao("");
    } catch (err) {
      alert("Erro ao criar: " + (err instanceof Error ? err.message : "Desconhecido"));
    } finally {
      setCreatingNew(false);
    }
  }

  function handleAdd() {
    if (!selecionado) return;
    const precoFinal = precoCustomizado ? preco : (tipo === "servico" ? selecionado.valor_padrao : selecionado.valor_venda);
    onAdd({
      descricao: selecionado.nome || selecionado.descricao,
      quantidade,
      preco_unitario: precoFinal,
      subtotal: quantidade * precoFinal,
      categoria: tipo === "servico" ? "Serviços" : "Produtos, peças e materiais",
      tipo,
      servico_id: tipo === "servico" ? selecionado.id : undefined,
      peca_id: tipo === "peca" ? selecionado.id : undefined,
    });
    onClose();
  }

  const listaItens = tipo === "servico" ? servicos : pecas;
  const precoFieldLabel = tipo === "servico" ? "Valor Padrão" : "Valor de Venda";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-graphite w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">Adicionar Item</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tipo de Item *</label>
            <div className="flex gap-2">
              {(["servico", "peca"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTipo(t); setSelecionado(null); }}
                  className={cn(
                    "flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors",
                    tipo === t
                      ? "bg-select text-white border-select"
                      : "bg-transparent text-foreground border-border hover:border-select/40"
                  )}
                >
                  {t === "servico" ? "Serviço" : "Peça/Material"}
                </button>
              ))}
            </div>
          </div>

          {showNewForm ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {tipo === "servico" ? "Nome do Serviço" : "Descrição da Peça"} *
                </label>
                <input type="text" value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
                  placeholder={tipo === "servico" ? "Ex: Suporte Técnico" : "Ex: Memória RAM 8GB"}
                  className="input-base w-full" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {tipo === "servico" ? "Valor Padrão" : "Valor de Venda"} *
                </label>
                <input type="number" value={novoPreco} onChange={(e) => setNovoPreco(parseFloat(e.target.value) || 0)}
                  min="0" step="0.01" className="input-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {tipo === "servico" ? "Descrição" : "Categoria"}
                </label>
                <input type="text" value={novoDescricao} onChange={(e) => setNovoDescricao(e.target.value)}
                  placeholder={tipo === "servico" ? "Descrição do serviço" : "Ex: Hardware"}
                  className="input-base w-full" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowNewForm(false); setNovoNome(""); setNovoPreco(0); setNovoDescricao(""); }}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleCreateNew} disabled={creatingNew}
                  className="flex-1 py-2.5 bg-select text-white rounded-lg text-sm font-semibold hover:bg-select/90 disabled:opacity-50 transition-colors">
                  {creatingNew ? "Criando..." : "Criar e Usar"}
                </button>
              </div>
            </div>
          ) : listaItens.length === 0 ? (
            <button type="button" onClick={() => setShowNewForm(true)}
              className="w-full py-3 bg-select text-white rounded-lg text-sm font-semibold hover:bg-select/90 transition-colors flex items-center justify-center gap-2">
              <Plus className="size-4" /> Criar {tipo === "servico" ? "Novo Serviço" : "Nova Peça"}
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {tipo === "servico" ? "Serviço" : "Peça/Material"} *
                </label>
                <button type="button" onClick={() => setShowNewForm(true)}
                  className="text-xs font-semibold text-select hover:text-select/80 flex items-center gap-1">
                  <Plus className="size-3" /> Novo
                </button>
              </div>
              <select
                value={selecionado?.id || ""}
                onChange={(e) => {
                  const item: any = (listaItens as any[]).find((i) => i.id === e.target.value);
                  setSelecionado(item);
                  if (item) { setPreco(tipo === "servico" ? item.valor_padrao : item.valor_venda); setPrecoCustomizado(false); }
                }}
                className="input-base w-full"
              >
                <option value="">Selecione...</option>
                {(listaItens as any[]).map((item) => (
                  <option key={item.id} value={item.id}>
                    {tipo === "servico" ? item.nome : `[${item.codigo}] ${item.descricao}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selecionado && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição</label>
                <div className="input-base w-full text-foreground text-sm opacity-70 cursor-default">
                  {tipo === "servico"
                    ? selecionado.descricao || "Sem descrição"
                    : `${selecionado.categoria} - ${selecionado.fabricante || "S/M"}`}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Quantidade *</label>
                <input type="number" value={quantidade}
                  onChange={(e) => setQuantidade(parseFloat(e.target.value) || 1)}
                  min="1" step={tipo === "servico" ? "0.5" : "1"} className="input-base w-full" />
                {tipo === "servico" && (
                  <p className="text-[11px] text-muted-foreground mt-1">Unidade: {selecionado.unidade}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">{precoFieldLabel}</label>
                  <button type="button" onClick={() => setPrecoCustomizado(!precoCustomizado)}
                    className="text-xs font-semibold text-select hover:text-select/80">
                    {precoCustomizado ? "Usar Padrão" : "Customizar"}
                  </button>
                </div>
                <input type="number" value={preco} onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                  step="0.01" disabled={!precoCustomizado}
                  className={cn("input-base w-full", !precoCustomizado && "opacity-50 cursor-not-allowed")} />
              </div>

              <div className="rounded-lg p-4 bg-select/5 border border-select/20">
                <div className="text-xs text-muted-foreground mb-1">Subtotal: {quantidade} × R$ {preco.toFixed(2)}</div>
                <div className="text-xl font-bold text-select">R$ {(quantidade * preco).toFixed(2)}</div>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleAdd}
                  className="flex-1 py-2.5 bg-select text-white rounded-lg text-sm font-semibold hover:bg-select/90 transition-colors">
                  Adicionar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
