import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, LoadingState, Btn } from "@/components/shared";
import { Plus, Edit2, Trash2, ClipboardList, X, Copy } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/modelos")({
  head: () => ({ meta: [{ title: `Modelos de Contratos · CRM ${client.name}` }] }),
  component: ModelosPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
  conteudo: string;
  ativo: boolean;
  created_at: string;
}

function extractVariables(conteudo: string): string[] {
  const matches = conteudo.match(/\{\{([^}]+)\}\}/g) || [];
  const names = matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim());
  return [...new Set(names)];
}

function ModelosPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", conteudo: "" });
  const [saving, setSaving] = useState(false);

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contract_templates")
        .select("id, nome, descricao, conteudo, ativo, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (e) {
      console.error("Erro ao carregar modelos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, [user]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ nome: "", descricao: "", conteudo: "" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setEditingId(template.id);
    setForm({ nome: template.nome, descricao: template.descricao, conteudo: template.conteudo });
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ nome: "", descricao: "", conteudo: "" });
  };

  const handleSave = async () => {
    if (!user || !form.nome.trim() || !form.conteudo.trim()) {
      alert("Nome e conteúdo são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const variables = extractVariables(form.conteudo);

      if (editingId) {
        const { error } = await (supabase as any)
          .from("contract_templates")
          .update({ nome: form.nome, descricao: form.descricao, conteudo: form.conteudo, variaveis: variables })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("contract_templates")
          .insert([{ user_id: user.id, nome: form.nome, descricao: form.descricao, conteudo: form.conteudo, ativo: true, variaveis: variables }]);
        if (error) throw error;
      }

      handleClose();
      loadTemplates();
    } catch (e) {
      alert("Erro: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este modelo?")) return;
    try {
      const { error } = await (supabase as any).from("contract_templates").delete().eq("id", id);
      if (error) throw error;
      loadTemplates();
    } catch (e) {
      alert("Erro ao deletar: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    }
  };

  const handleClone = (template: Template) => {
    setEditingId(null);
    setForm({ nome: `${template.nome} (cópia)`, descricao: template.descricao, conteudo: template.conteudo });
    setIsFormOpen(true);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Modelos de Contrato"
          icon={ClipboardList}
          subtitle={`${templates.length} modelo(s)`}
          actions={
            <Btn variant="primary" onClick={handleOpenNew}>
              <Plus className="size-4" /> Novo Modelo
            </Btn>
          }
        />

        {isFormOpen && (
          <div className="card-graphite p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "Editar Modelo" : "Novo Modelo"}</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="input-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição</label>
                <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="input-base w-full" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Conteúdo *</label>
              <p className="text-[11px] text-muted-foreground mb-1.5">Use: {`{{cliente_nome}}`}, {`{{data}}`}, {`{{valor}}`}, etc.</p>
              <textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={10} className="input-base w-full font-mono text-xs resize-y" />

              {form.conteudo && extractVariables(form.conteudo).length > 0 && (
                <div className="mt-3 p-3 bg-surface-2 rounded-lg">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-2">Variáveis detectadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {extractVariables(form.conteudo).map((v) => (
                      <code key={v} className="bg-surface px-2 py-1 rounded text-[10px] text-select font-mono border border-select/20">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors">
                {saving ? "Salvando..." : editingId ? "Salvar Mudanças" : "Criar Modelo"}
              </button>
              <button onClick={handleClose} className="px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : templates.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nenhum modelo criado ainda" />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Nome</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Descrição</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.descricao || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenEdit(t)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors" title="Editar">
                          <Edit2 className="size-3" /> Editar
                        </button>
                        <button onClick={() => handleClone(t)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-blue/30 text-blue bg-blue/10 rounded-lg hover:bg-blue/20 transition-colors" title="Clonar">
                          <Copy className="size-3" /> Clonar
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors" title="Deletar">
                          <Trash2 className="size-3" /> Deletar
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
    </AppShell>
  );
}
