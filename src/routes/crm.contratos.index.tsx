import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, LoadingState, Btn } from "@/components/shared";
import { Plus, Eye, Trash2, ScrollText, X, Copy, Edit2 } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/")({
  head: () => ({ meta: [{ title: `Contratos · CRM ${client.name}` }] }),
  component: ContratsPage,
});

interface Contrato {
  id: string;
  titulo: string;
  status: string;
  created_at: string;
  clientes?: { nome: string };
}

interface Template {
  id: string;
  nome: string;
  descricao: string;
  conteudo: string;
}

function extractVariables(conteudo: string): string[] {
  const matches = conteudo.match(/\{\{([^}]+)\}\}/g) || [];
  const names = matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim());
  return [...new Set(names)];
}

function ContratsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"contratos" | "modelos" | "novo">("contratos");
  
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", conteudo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [contRes, tempRes] = await Promise.all([
        (supabase as any).from("contracts").select("id, titulo, status, created_at, clientes(nome)").eq("user_id", user.id).order("created_at", { ascending: false }),
        (supabase as any).from("contract_templates").select("id, nome, descricao, conteudo").order("created_at", { ascending: false }),
      ]);
      setContratos(contRes.data || []);
      setTemplates(tempRes.data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContrato = async (id: string) => {
    if (!confirm("Deletar?")) return;
    try {
      await (supabase as any).from("contracts").delete().eq("id", id);
      loadData();
    } catch (e) {
      alert("Erro: " + (e instanceof Error ? e.message : ""));
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ nome: "", descricao: "", conteudo: "" });
  };

  const handleSaveTemplate = async () => {
    if (!user || !form.nome.trim() || !form.conteudo.trim()) {
      alert("Nome e conteúdo obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const variables = extractVariables(form.conteudo);
      if (editingId) {
        const { error } = await (supabase as any).from("contract_templates").update({ nome: form.nome, descricao: form.descricao, conteudo: form.conteudo, variaveis: variables }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("contract_templates").insert([{ user_id: user.id, nome: form.nome, descricao: form.descricao, conteudo: form.conteudo, ativo: true, variaveis: variables }]);
        if (error) throw error;
      }
      handleCloseForm();
      loadData();
    } catch (e) {
      alert("Erro: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Deletar?")) return;
    try {
      await (supabase as any).from("contract_templates").delete().eq("id", id);
      loadData();
    } catch (e) {
      alert("Erro: " + (e instanceof Error ? e.message : ""));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      rascunho: "bg-yellow/10 text-yellow border-yellow/30",
      enviado: "bg-blue/10 text-blue border-blue/30",
      aprovado: "bg-green/10 text-green border-green/30",
      finalizado: "bg-select/10 text-select border-select/30",
    };
    return colors[status] || "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30";
  };

  if (loading) return <AppShell><LoadingState /></AppShell>;

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader category="CRM" title="Contratos" icon={ScrollText} subtitle="Gestão completa" />

        {/* Abas */}
        <div className="flex gap-4 border-b border-border overflow-x-auto">
          {[
            { id: "contratos", label: `📋 Contratos (${contratos.length})` },
            { id: "modelos", label: `🎨 Modelos (${templates.length})` },
            { id: "novo", label: "➕ Novo" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-select text-select"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contratos */}
        {activeTab === "contratos" && (
          contratos.length === 0 ? (
            <EmptyState icon={ScrollText} title="Nenhum contrato" />
          ) : (
            <div className="card-graphite overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-left">Título</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-left">Cliente</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-left">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-left">Data</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40">
                      <td className="px-4 py-3 font-medium text-foreground">{c.titulo}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.clientes?.nome || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${getStatusColor(c.status)}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => navigate({ to: `/crm/contratos/${c.id}` })} className="text-select hover:text-select/80">
                          <Eye className="size-4" />
                        </button>
                        <button onClick={() => handleDeleteContrato(c.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Modelos */}
        {activeTab === "modelos" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Btn variant="primary" onClick={() => { setEditingId(null); setForm({ nome: "", descricao: "", conteudo: "" }); setIsFormOpen(true); }}>
                <Plus className="size-4" /> Novo Modelo
              </Btn>
            </div>

            {isFormOpen && (
              <div className="card-graphite p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{editingId ? "Editar" : "Novo"} Modelo</h3>
                  <button onClick={handleCloseForm}><X className="size-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="input-base" />
                  <input type="text" placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="input-base" />
                </div>
                <textarea placeholder="Conteúdo com {{variáveis}}" value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={10} className="input-base font-mono text-xs w-full resize-y" />
                {form.conteudo && extractVariables(form.conteudo).length > 0 && (
                  <div className="p-3 bg-surface-2 rounded-lg flex flex-wrap gap-2">
                    {extractVariables(form.conteudo).map((v) => (
                      <code key={v} className="bg-surface px-2 py-1 rounded text-[10px] text-select font-mono border border-select/20">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleSaveTemplate} disabled={saving} className="px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50">
                    {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
                  </button>
                  <button onClick={handleCloseForm} className="px-4 py-2.5 border border-border rounded-lg hover:bg-surface-2">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {templates.length === 0 ? (
              <EmptyState icon={ScrollText} title="Nenhum modelo" />
            ) : (
              <div className="card-graphite overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-left">Nome</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-left">Descrição</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-surface-2/40">
                        <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{t.descricao || "—"}</td>
                        <td className="px-4 py-3 flex justify-center gap-2">
                          <button
                            onClick={() => { setEditingId(t.id); setForm({ nome: t.nome, descricao: t.descricao, conteudo: t.conteudo }); setIsFormOpen(true); }}
                            className="text-select hover:text-select/80"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setForm({ nome: `${t.nome} (cópia)`, descricao: t.descricao, conteudo: t.conteudo }); setIsFormOpen(true); }}
                            className="text-blue hover:text-blue/80"
                          >
                            <Copy className="size-4" />
                          </button>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Novo */}
        {activeTab === "novo" && (
          <div className="card-graphite p-8 text-center">
            <button
              onClick={() => navigate({ to: "/crm/contratos/novo" })}
              className="px-8 py-4 bg-brand text-brand-foreground text-lg font-semibold rounded-lg hover:bg-brand/90"
            >
              ➕ Criar Novo Contrato
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
