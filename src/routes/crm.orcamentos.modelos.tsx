import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { Package, Trash2, Edit2, X, Plus } from "lucide-react";
import { obterModelos, criarModelo, atualizarModelo, deletarModelo } from "@/hooks/useOrcamentoModelos";

export const Route = createFileRoute("/crm/orcamentos/modelos")({
  head: () => ({ meta: [{ title: `Modelos de Orçamento · CRM ${client.name}` }] }),
  component: ModelosPage,
});

interface Modelo {
  id: string;
  nome: string;
  descricao?: string;
  itens: any[];
  created_at: string;
}

function ModelosPage() {
  const { user } = useAuth();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    itens: [{ descricao: "" }],
  });

  useEffect(() => {
    if (user) carregarModelos();
  }, [user]);

  async function carregarModelos() {
    if (!user) return;
    setLoading(true);
    const data = await obterModelos(user.id);
    setModelos(data);
    setLoading(false);
  }

  function abrirNovoModal() {
    setEditandoId(null);
    setFormData({ nome: "", descricao: "", itens: [{ descricao: "" }] });
    setShowModal(true);
  }

  function abrirEditarModal(modelo: Modelo) {
    setEditandoId(modelo.id);
    setFormData({
      nome: modelo.nome,
      descricao: modelo.descricao || "",
      itens: modelo.itens.length > 0 ? modelo.itens : [{ descricao: "" }],
    });
    setShowModal(true);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !formData.nome.trim()) return;

    const itensFiltrados = formData.itens.filter((i) => i.descricao?.trim());

    if (editandoId) {
      const result = await atualizarModelo(editandoId, formData.nome, formData.descricao, itensFiltrados);
      if (result.success) {
        setModelos(modelos.map((m) => (m.id === editandoId ? result.data : m)));
      }
    } else {
      const result = await criarModelo(user.id, formData.nome, formData.descricao, itensFiltrados);
      if (result.success) {
        setModelos([result.data, ...modelos]);
      }
    }

    setShowModal(false);
    setFormData({ nome: "", descricao: "", itens: [{ descricao: "" }] });
  }

  async function handleDeletar(id: string) {
    if (!confirm("Tem certeza que quer deletar este modelo?")) return;
    const result = await deletarModelo(id);
    if (result.success) {
      setModelos(modelos.filter((m) => m.id !== id));
    }
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Modelos de Orçamento"
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
            Nenhum modelo criado. Crie um para reutilizar na próxima vez!
          </div>
        ) : (
          <div className="space-y-3">
            {modelos.map((modelo) => (
              <div
                key={modelo.id}
                className="card-graphite p-6 hover:border-select/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{modelo.nome}</h3>
                    {modelo.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{modelo.descricao}</p>
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

                {modelo.itens.length > 0 && (
                  <div className="bg-surface/50 rounded-lg p-3 mb-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Itens incluídos:</div>
                    <div className="space-y-1">
                      {modelo.itens.map((item, idx) => (
                        <div key={idx} className="text-xs text-foreground flex items-center gap-2">
                          <span className="text-brand">✓</span>
                          {item.descricao}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(modelo.created_at).toLocaleDateString("pt-BR")}
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
                {editandoId ? "Editar Modelo" : "Novo Modelo de Orçamento"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Formatação Padrão"
                  className="input-base w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Formatação completa com backup..."
                  rows={2}
                  className="input-base w-full resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  📦 Itens do Modelo
                </label>
                <div className="space-y-2 bg-surface/30 p-3 rounded-lg mb-2">
                  {formData.itens.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => {
                          const novoItens = [...formData.itens];
                          novoItens[idx] = { ...novoItens[idx], descricao: e.target.value };
                          setFormData({ ...formData, itens: novoItens });
                        }}
                        placeholder="Nome do serviço ou peça"
                        className="input-base flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            itens: formData.itens.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-destructive hover:text-destructive/80 transition-colors p-1"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, itens: [...formData.itens, { descricao: "" }] })}
                  className="text-xs font-semibold text-brand hover:text-brand/80 transition-colors flex items-center gap-1"
                >
                  <Plus className="size-3.5" /> Adicionar Item
                </button>
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
