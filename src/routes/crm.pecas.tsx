import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package } from "lucide-react";
import { usePecas } from "@/hooks/usePecas";
import { AppShell } from "@/components/AppShell";
import { PecasTable } from "@/components/crm/PecasTable";
import { PageHeader } from "@/components/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/pecas")({
  head: () => ({ meta: [{ title: `Peças · CRM ${client.name}` }] }),
  component: PecasPage,
});

function PecasPage() {
  const { pecas, addPeca, updatePeca, deletePeca } = usePecas();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    categoria: "Hardware",
    fabricante: "",
    valor_custo: 0,
    valor_venda: 0,
    estoque: 0,
    ativo: true,
  });

  const categorias = ["Hardware", "Software", "Cabeamento", "Conectores", "Fontes", "Memória", "Armazenamento", "Outros"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (editingId) {
        await updatePeca(editingId, formData);
        setMessage("Peça atualizada com sucesso!");
      } else {
        await addPeca(formData);
        setMessage("Peça criada com sucesso!");
      }
      setFormData({ codigo: "", descricao: "", categoria: "Hardware", fabricante: "", valor_custo: 0, valor_venda: 0, estoque: 0, ativo: true });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setMessage("Erro ao salvar peça");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(peca: any) {
    setFormData(peca);
    setEditingId(peca.id || null);
    setShowForm(true);
  }

  function handleAddNew() {
    setFormData({ codigo: "", descricao: "", categoria: "Hardware", fabricante: "", valor_custo: 0, valor_venda: 0, estoque: 0, ativo: true });
    setEditingId(null);
    setShowForm(true);
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
        <PageHeader
          category="CRM"
          title="Catálogo de Peças"
          icon={Package}
          subtitle="Gestão de peças, materiais e estoque"
        />

        {message && (
          <div className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium border",
            message.startsWith("Erro")
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-brand/10 border-brand/30 text-brand"
          )}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="card-graphite p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId ? "Editar Peça" : "Nova Peça"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Código *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ex: MEM-8GB"
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="input-base w-full"
                  >
                    {categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição *</label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Memória RAM 8GB DDR4"
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Fabricante</label>
                  <input
                    type="text"
                    value={formData.fabricante || ""}
                    onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                    placeholder="Ex: Kingston"
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Estoque (Qtd) *</label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Valor de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_custo}
                    onChange={(e) => setFormData({ ...formData, valor_custo: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Valor de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_venda}
                    onChange={(e) => setFormData({ ...formData, valor_venda: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="input-base w-full"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm rounded-lg bg-select text-white font-semibold hover:bg-select/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        )}

        <PecasTable
          pecas={pecas}
          onAddPeca={handleAddNew}
          onEditPeca={handleEdit}
          onDeletePeca={deletePeca}
        />
      </div>
    </AppShell>
  );
}
