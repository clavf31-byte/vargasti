import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { obterItemModelos } from "@/hooks/useItemModelos";
import { X, Search, Zap, Plus } from "lucide-react";
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
  tarefas?: string[];
}

interface OrcamentoItemFormProps {
  onAdd: (item: OrcamentoItem) => void;
  onClose: () => void;
}

export function OrcamentoItemForm({ onAdd, onClose }: OrcamentoItemFormProps) {
  const { user } = useAuth();

  const [tipo, setTipo] = useState<"modelos" | "manual">("modelos");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoCustomizado, setPrecoCustomizado] = useState(false);
  const [preco, setPreco] = useState(0);
  const [busca, setBusca] = useState("");

  const [manualNome, setManualNome] = useState("");
  const [manualPreco, setManualPreco] = useState(0);


  const [modelos, setModelos] = useState<any[]>([]);
  const [modelosLoading, setModelosLoading] = useState(false);

  useEffect(() => {
    if (tipo === "modelos") {
      carregarModelos();
    }
  }, [tipo]);

  async function carregarModelos() {
    if (!user) return;
    setModelosLoading(true);
    try {
      const dados = await obterItemModelos(user.id);
      setModelos(dados);
    } catch (err) {
      console.error("Erro ao carregar modelos:", err);
    } finally {
      setModelosLoading(false);
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

  function handleAddModelo() {
    if (!selecionado) return;
    const precoFinal = precoCustomizado ? preco : selecionado.preco_unitario;
    onAdd({
      descricao: selecionado.nome,
      quantidade,
      preco_unitario: precoFinal,
      subtotal: quantidade * precoFinal,
      categoria: selecionado.tipo === "servico" ? "Serviços" : "Produtos, peças e materiais",
      tipo: selecionado.tipo,
      tarefas: selecionado.tarefas || [],
    });
    onClose();
  }


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
              {(["modelos", "manual"] as const).map((t) => (
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
                  {t === "modelos" && <Zap className="size-4" />}
                  {t === "manual" && <Plus className="size-4" />}
                  {t === "modelos" ? "Meus Modelos" : "Manual"}
                </button>
              ))}
            </div>
          </div>

          {tipo === "modelos" ? (
            <>
              <div>
                {/* SEARCH */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar modelo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="input-base w-full pl-9 text-xs"
                  />
                </div>

                {/* MODELOS CARDS */}
                {modelosLoading ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">Carregando modelos...</div>
                ) : modelos.length === 0 ? (
                  <div className="w-full py-3 text-center text-sm text-muted-foreground">
                    Nenhum modelo criado ainda. Crie em "Modelos de Itens"
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* SERVIÇOS */}
                    {modelos.filter(m => m.tipo === "servico" && (m.nome.toLowerCase().includes(busca.toLowerCase()) || m.descricao?.toLowerCase().includes(busca.toLowerCase()))).length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                          🔧 Serviços
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {modelos
                            .filter((m) => m.tipo === "servico" && (m.nome.toLowerCase().includes(busca.toLowerCase()) || m.descricao?.toLowerCase().includes(busca.toLowerCase())))
                            .map((modelo: any) => (
                              <button
                                key={modelo.id}
                                type="button"
                                onClick={() => {
                                  setSelecionado(modelo);
                                  setPreco(modelo.preco_unitario);
                                  setPrecoCustomizado(false);
                                }}
                                className={cn(
                                  "p-2 rounded-lg border transition-all text-left text-xs",
                                  selecionado?.id === modelo.id
                                    ? "bg-brand/10 border-brand text-foreground"
                                    : "bg-surface/50 border-border hover:border-brand/40 text-muted-foreground"
                                )}
                              >
                                <div className="font-semibold text-foreground text-[11px] truncate">
                                  {modelo.nome}
                                </div>
                                <div className="text-[10px] font-semibold text-brand mt-1">
                                  R$ {modelo.preco_unitario.toFixed(2)}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* PEÇAS */}
                    {modelos.filter(m => m.tipo === "peca" && (m.nome.toLowerCase().includes(busca.toLowerCase()) || m.descricao?.toLowerCase().includes(busca.toLowerCase()))).length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                          📦 Peças
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {modelos
                            .filter((m) => m.tipo === "peca" && (m.nome.toLowerCase().includes(busca.toLowerCase()) || m.descricao?.toLowerCase().includes(busca.toLowerCase())))
                            .map((modelo: any) => (
                              <button
                                key={modelo.id}
                                type="button"
                                onClick={() => {
                                  setSelecionado(modelo);
                                  setPreco(modelo.preco_unitario);
                                  setPrecoCustomizado(false);
                                }}
                                className={cn(
                                  "p-2 rounded-lg border transition-all text-left text-xs",
                                  selecionado?.id === modelo.id
                                    ? "bg-brand/10 border-brand text-foreground"
                                    : "bg-surface/50 border-border hover:border-brand/40 text-muted-foreground"
                                )}
                              >
                                <div className="font-semibold text-foreground text-[11px] truncate">
                                  {modelo.nome}
                                </div>
                                <div className="text-[10px] font-semibold text-brand mt-1">
                                  R$ {modelo.preco_unitario.toFixed(2)}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : tipo === "manual" && (
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
          )}

          {selecionado && tipo !== "manual" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição</label>
                <div className="input-base w-full text-foreground text-sm opacity-70 cursor-default">
                  {selecionado.descricao || "Sem descrição"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Quantidade *</label>
                  <input type="number" value={quantidade}
                    onChange={(e) => setQuantidade(parseFloat(e.target.value) || 1)}
                    min="1" step={selecionado?.tipo === "servico" ? "0.5" : "1"} className="input-base w-full" />
                  {selecionado?.tipo === "servico" && (
                    <p className="text-[11px] text-muted-foreground mt-1">Unidade: {selecionado.unidade}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Preço</label>
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
                <button type="button" onClick={tipo === "modelos" ? handleAddModelo : handleAddCatalogo}
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
