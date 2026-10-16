import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { Package, Trash2, Edit2, X, Plus } from "lucide-react";
import { obterItemModelos, criarItemModelo, atualizarItemModelo, deletarItemModelo } from "@/hooks/useItemModelos";

export const Route = createFileRoute("/crm/item-modelos")({
  head: () => ({ meta: [{ title: `Modelos de Itens · CRM ${client.name}` }] }),
  component: ItemModelosPage,
});

interface ItemModelo {
  id: string;
  nome: string;
  descricao?: string;
  tipo: "servico" | "peca";
  preco_unitario: number;
  unidade: string;
  created_at: string;
}

function ItemModelosPage() {
  const { user } = useAuth();
  const [modelos, setModelos] = useState<ItemModelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "servico" as "servico" | "peca",
    preco_unitario: 0,
    unidade: "Unidade",
  });

  useEffect(() => {
    if (user) carregarModelos();
  }, [user]);

  async function carregarModelos() {
    if (!user) return;
    setLoading(true);
    const data = await obterItemModelos(user.id);
    setModelos(data);
    setLoading(false);
  }

  function abrirNovoModal() {
    setEditandoId(null);
    setFormData({
      nome: "",
      descricao: "",
      tipo: "servico",
      preco_unitario: 0,
      unidade: "Unidade",
    });
    setShowModal(true);
  }

  function abrirEditarModal(modelo: ItemModelo) {
    setEditandoId(modelo.id);
    setFormData({
      nome: modelo.nome,
      descricao: modelo.descricao || "",
      tipo: modelo.tipo,
      preco_unitario: modelo.preco_unitario,
      unidade: modelo.unidade,
    });
    setShowModal(true);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !formData.nome.trim()) return;

    if (editandoId) {
      const result = await atualizarItemModelo(
        editandoId,
        formData.nome,
        formData.descricao,
        formData.tipo,
        formData.preco_unitario,
        formData.unidade
      );
      if (result.success) {
        setModelos(modelos.map((m) => (m.id === editandoId ? result.data : m)));
      }
    } else {
      const result = await criarItemModelo(
        user.id,
        formData.nome,
        formData.descricao,
        formData.tipo,
        formData.preco_unitario,
        formData.unidade
      );
      if (result.success) {
        setModelos([result.data, ...modelos]);
      }
    }

    setShowModal(false);
    setFormData({
      nome: "",
      descricao: "",
      tipo: "servico",
      preco_unitario: 0,
      unidade: "Unidade",
    });
  }

  async function handleDeletar(id: string) {
    if (!confirm("Tem certeza que quer deletar este modelo?")) return;
    const result = await deletarItemModelo(id);
    if (result.success) {
      setModelos(modelos.filter((m) => m.id !== id));
    }
  }

  const tipoIcon = (tipo: string) => tipo === "servico" ? "🔧" : "📦";
  const tipoLabel = (tipo: string) => tipo === "servico" ? "Serviço" : "Peça";

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Modelos de Itens"
          icon={Package}
          subtitle={`${modelos.length} modelo(s) criado(s)`}
          actions={
            <button
              onClick={abrirNovoModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="size-3.5" /> Novo Modelo
            </button>
          }
        />

        {loading ? (
          <div className="text-center text-muted-foreground">Carregando modelos...</div>
        ) : modelos.length === 0 ? (
          <div className="card-graphite border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum modelo criado. Crie um para reutilizar nos orçamentos!
          </div>
        ) : (
          <div className="space-y-3">
            {modelos.map((modelo) => (
              <div
                key={modelo.id}
                className="card-graphite p-6 hover:border-select/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {tipoIcon(modelo.tipo)} {modelo.nome}
                    </h3>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="bg-surface rounded px-2 py-1">
                        {tipoLabel(modelo.tipo)}
                      </span>
                      <span>R$ {modelo.preco_unitario.toFixed(2)}</span>
                      <span>{modelo.unidade}</span>
                    </div>
                    {modelo.descricao && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {modelo.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEditarModal(modelo)}
                      className="text-select hover:text-select/80 transition-colors p-1"
                      title="Editar"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDeletar(modelo.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors p-1"
                      title="Deletar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card-graphite p-6 w-full max-w-500px max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editandoId ? "Editar Modelo" : "Novo Modelo de Item"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipo: e.target.value as "servico" | "peca",
                      })
                    }
                    className="input-base w-full"
                  >
                    <option value="servico">Serviço</option>
                    <option value="peca">Peça</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Formatação Notebook"
                    className="input-base w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Ex: Formatação completa com backup..."
                  rows={2}
                  className="input-base w-full resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco_unitario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preco_unitario: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={formData.unidade}
                    onChange={(e) =>
                      setFormData({ ...formData, unidade: e.target.value })
                    }
                    placeholder="Ex: Hora, Un, Dia"
                    className="input-base w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-select text-white font-semibold hover:bg-select/90 transition-colors"
                >
                  {editandoId ? "Atualizar" : "Criar"} Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
