import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useServicos } from "@/hooks/useServicos";
import { usePecas } from "@/hooks/usePecas";
import { X, Plus, Search, Wrench, Package } from "lucide-react";
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

  const [tipo, setTipo] = useState<"servico" | "peca" | "manual">("servico");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoCustomizado, setPrecoCustomizado] = useState(false);
  const [preco, setPreco] = useState(0);
  const [busca, setBusca] = useState("");
  const [colapsado, setColapsado] = useState(false);

  const [manualNome, setManualNome] = useState("");
  const [manualPreco, setManualPreco] = useState(0);

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

  function handleAddCatalogo() {
    if (!selecionado || tipo === "manual") return;
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

  function handleAddManual() {
    if (!manualNome.trim() || manualPreco <= 0) {
      alert("Preencha nome e preço");
      return;
    }
    onAdd({
      descricao: manualNome.trim(),
      quantidade,
      preco_unitario: manualPreco,
      subtotal: quantidade * manualPreco,
      categoria: "Item Manual",
    });
    onClose();
  }

  const termoBusca = busca.toLowerCase();
  const itensFiltrados = tipo === "servico"
    ? servicos.filter((item) =>
        item.nome.toLowerCase().includes(termoBusca) || item.descricao?.toLowerCase().includes(termoBusca),
      )
    : pecas.filter((item) =>
        item.codigo.toLowerCase().includes(termoBusca) || item.descricao.toLowerCase().includes(termoBusca),
      );
  const precoFieldLabel = tipo === "servico" ? "Valor Padrão" : "Valor de Venda";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-graphite w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Adicionar Item</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Como deseja adicionar?</label>
            <div className="flex gap-2">
              {(["servico", "peca", "manual"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTipo(t); setSelecionado(null); setBusca(""); }}
                  className={cn(
                    "flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5",
                    tipo === t
                      ? "bg-brand text-brand-foreground border-brand"
                      : "bg-transparent text-foreground border-border hover:border-brand/40"
                  )}
                >
                  {t === "servico" && <Wrench className="size-4" />}
                  {t === "peca" && <Package className="size-4" />}
                  {t === "manual" && <Plus className="size-4" />}
                  {t === "servico" ? "Serviço" : t === "peca" ? "Peça" : "Manual"}
                </button>
              ))}
            </div>
          </div>

          {tipo === "manual" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição do Item *</label>
                <input
                  type="text"
                  value={manualNome}
                  onChange={(e) => setManualNome(e.target.value)}
                  placeholder="Ex: Diagnóstico, Cabo especial, etc"
                  className="input-base w-full"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Valor *</label>
                  <input
                    type="number"
                    value={manualPreco}
                    onChange={(e) => setManualPreco(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="input-base w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Quantidade *</label>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseFloat(e.target.value) || 1)}
                    min="1"
                    step="0.5"
                    className="input-base w-full"
                  />
                </div>
              </div>
              <div className="rounded-lg p-3 bg-brand/5 border border-brand/20">
                <div className="text-xs text-muted-foreground mb-1">Subtotal: {quantidade} × R$ {manualPreco.toFixed(2)}</div>
                <div className="text-lg font-bold text-brand">R$ {(quantidade * manualPreco).toFixed(2)}</div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddManual}
                  className="flex-1 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          ) : showNewForm ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {tipo === "servico" ? "Nome do Serviço" : "Descrição da Peça"} *
                </label>
                <input type="text" value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
                  placeholder={tipo === "servico" ? "Ex: Suporte Técnico" : "Ex: Memória RAM 8GB"}
                  className="input-base w-full" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    {tipo === "servico" ? "Valor Padrão" : "Valor Venda"} *
                  </label>
                  <input type="number" value={novoPreco} onChange={(e) => setNovoPreco(parseFloat(e.target.value) || 0)}
                    min="0" step="0.01" className="input-base w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    {tipo === "servico" ? "Descrição" : "Categoria"}
                  </label>
                  <input type="text" value={novoDescricao} onChange={(e) => setNovoDescricao(e.target.value)}
                    placeholder={tipo === "servico" ? "Breve desc..." : "Ex: Hardware"}
                    className="input-base w-full" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowNewForm(false); setNovoNome(""); setNovoPreco(0); setNovoDescricao(""); }}
                  className="flex-1 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleCreateNew} disabled={creatingNew}
                  className="flex-1 py-2 bg-select text-white rounded-lg text-sm font-semibold hover:bg-select/90 disabled:opacity-50 transition-colors">
                  {creatingNew ? "Criando..." : "Criar e Usar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    📚 Catálogo de {tipo === "servico" ? "Serviços" : "Peças"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(true)}
                    className="text-xs font-semibold text-brand hover:text-brand/80 flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Criar Novo
                  </button>
                </div>

                {/* SEARCH */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={tipo === "servico" ? "Buscar por nome..." : "Buscar por SKU ou descrição..."}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="input-base w-full pl-9 text-xs"
                  />
                </div>

                {/* CATALOG CARDS */}
                {(tipo === "servico" ? servicos : pecas).length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowNewForm(true)}
                    className="w-full py-3 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="size-4" /> Criar {tipo === "servico" ? "Novo Serviço" : "Nova Peça"}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pb-2">
                    {itensFiltrados.length === 0 ? (
                      <div className="col-span-2 text-center py-6 text-sm text-muted-foreground">Nenhum item encontrado</div>
                    ) : (
                      itensFiltrados.map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelecionado(item);
                            setPreco(tipo === "servico" ? item.valor_padrao : item.valor_venda);
                            setPrecoCustomizado(false);
                          }}
                          className={cn(
                            "p-2 rounded-lg border transition-all text-left text-xs",
                            selecionado?.id === item.id
                              ? "bg-brand/10 border-brand text-foreground"
                              : "bg-surface/50 border-border hover:border-brand/40 text-muted-foreground"
                          )}
                        >
                          <div className="font-semibold text-foreground text-[11px] truncate">
                            {tipo === "servico" ? item.nome : `[${item.codigo}]`}
                          </div>
                          <div className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">
                            {tipo === "servico"
                              ? `${item.categoria}`
                              : `${item.categoria}`}
                          </div>
                          <div className="text-[10px] font-semibold text-brand mt-1">
                            R$ {(tipo === "servico" ? item.valor_padrao : item.valor_venda).toFixed(2)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
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

              <div className="grid grid-cols-2 gap-3">
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
                      {precoCustomizado ? "Padrão" : "Customizar"}
                    </button>
                  </div>
                  <input type="number" value={preco} onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                    step="0.01" disabled={!precoCustomizado}
                    className={cn("input-base w-full", !precoCustomizado && "opacity-50 cursor-not-allowed")} />
                </div>
              </div>

              <div className="rounded-lg p-3 bg-select/5 border border-select/20">
                <div className="text-xs text-muted-foreground mb-1">Subtotal: {quantidade} × R$ {preco.toFixed(2)}</div>
                <div className="text-lg font-bold text-select">R$ {(quantidade * preco).toFixed(2)}</div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleAddCatalogo}
                  className="flex-1 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors">
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
