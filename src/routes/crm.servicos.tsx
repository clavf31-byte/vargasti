import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wrench } from "lucide-react";
import { useServicos } from "@/hooks/useServicos";
import { AppShell } from "@/components/AppShell";
import { ServicosTable } from "@/components/crm/ServicosTable";
import { PageHeader } from "@/components/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/servicos")({
  head: () => ({ meta: [{ title: `Serviços · CRM ${client.name}` }] }),
  component: ServicosPage,
});

function ServicosPage() {
  const { servicos, addServico, updateServico, deleteServico } = useServicos();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Serviços Técnicos",
    valor_padrao: 0,
    unidade: "Hora",
    descricao: "",
    ativo: true,
  });

  const categorias = ["Serviços Técnicos", "Instalação", "Redes", "Deslocamento", "Manutenção", "Suporte", "Consultoria"];
  const unidades = ["Hora", "Unidade", "Dia", "Semana", "Mês"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (editingId) {
        await updateServico(editingId, formData);
        setMessage("Serviço atualizado com sucesso!");
      } else {
        await addServico(formData);
        setMessage("Serviço criado com sucesso!");
      }
      setFormData({ nome: "", categoria: "Serviços Técnicos", valor_padrao: 0, unidade: "Hora", descricao: "", ativo: true });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setMessage("Erro ao salvar serviço");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(servico: any) {
    setFormData(servico);
    setEditingId(servico.id || null);
    setShowForm(true);
  }

  function handleAddNew() {
    setFormData({ nome: "", categoria: "Serviços Técnicos", valor_padrao: 0, unidade: "Hora", descricao: "", ativo: true });
    setEditingId(null);
    setShowForm(true);
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        <PageHeader
          category="CRM"
          title="Serviços"
          icon={Wrench}
          subtitle="Cadastro e gestão de serviços oferecidos"
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
              {editingId ? "Editar Serviço" : "Novo Serviço"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Hora Técnica Presencial"
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
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Valor Padrão (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_padrao}
                    onChange={(e) => setFormData({ ...formData, valor_padrao: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Unidade *</label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                    className="input-base w-full"
                  >
                    {unidades.map((un) => <option key={un} value={un}>{un}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição</label>
                <textarea
                  value={formData.descricao || ""}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do serviço"
                  rows={3}
                  className="input-base w-full resize-y"
                />
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

        <ServicosTable
          servicos={servicos}
          onAddServico={handleAddNew}
          onEditServico={handleEdit}
          onDeleteServico={deleteServico}
        />
      </div>
    </AppShell>
  );
}
