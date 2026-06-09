import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Pencil, Trash2, X, Check, FolderKanban, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/projetos")({
  head: () => ({ meta: [{ title: "Projetos · VargasTI Lab" }] }),
  component: ProjetosPage,
});

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  category: string;
  technologies: string;
  links: string;
  observations: string;
  created_at: string;
  updated_at: string;
};

type ProjectForm = Omit<Project, "id" | "created_at" | "updated_at">;

const STATUSES = ["ideia", "em desenvolvimento", "testando", "finalizado", "arquivado"];
const STATUS_COLORS: Record<string, string> = {
  "ideia": "text-muted-foreground border-muted-foreground/30",
  "em desenvolvimento": "text-info border-info/30",
  "testando": "text-warning border-warning/30",
  "finalizado": "text-brand border-brand/30",
  "arquivado": "text-muted-foreground/50 border-muted-foreground/20",
};
const CATEGORIES = ["Frontend", "Backend", "DevOps", "Automação", "Infra", "Segurança", "Estudo", "Outros"];

const EMPTY_FORM: ProjectForm = {
  name: "",
  description: "",
  status: "ideia",
  category: "Outros",
  technologies: "",
  links: "",
  observations: "",
};

function ProjetosPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Project | null }>({ open: false, editing: null });
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });

    if (error) setDbError(true);
    else setProjects((data ?? []) as Project[]);
    setLoading(false);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  }

  function openEdit(p: Project) {
    setForm({ name: p.name, description: p.description, status: p.status, category: p.category, technologies: p.technologies, links: p.links, observations: p.observations });
    setModal({ open: true, editing: p });
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (modal.editing) {
      const { error } = await supabase
        .from("projects")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", modal.editing.id)
        .eq("user_id", user!.id);
      if (!error) {
        setProjects((prev) => prev.map((p) => p.id === modal.editing!.id ? { ...p, ...form } : p));
        setModal({ open: false, editing: null });
      }
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...form, user_id: user!.id })
        .select()
        .single();
      if (!error && data) {
        setProjects((prev) => [data as Project, ...prev]);
        setModal({ open: false, editing: null });
      }
    }
    setSaving(false);
  }

  async function deleteProject(id: string) {
    await supabase.from("projects").delete().eq("id", id).eq("user_id", user!.id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = projects.filter((p) => {
    const matchStatus = filterStatus === "todos" || p.status === filterStatus;
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (dbError) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="bg-surface border border-border rounded p-6 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Tabela <code className="text-brand bg-brand/10 px-1.5 py-0.5 rounded">projects</code> não encontrada.
            </p>
            <p className="text-[10px] text-muted-foreground">Execute o SQL de setup no dashboard do Supabase.</p>
            <pre className="text-left text-[9px] text-muted-foreground bg-background border border-border rounded p-3 mt-3 overflow-auto">
{`CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'ideia',
  category TEXT DEFAULT '',
  technologies TEXT DEFAULT '',
  links TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own" ON projects USING (auth.uid() = user_id);`}
            </pre>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Projetos</div>
            <h1 className="text-sm text-foreground">Gestão de Projetos</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 transition-colors"
          >
            <Plus className="size-3" /> Novo Projeto
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bg-surface border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground w-40"
          />
          <div className="flex gap-1">
            {["todos", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2 py-1 rounded text-[9px] border transition-colors ${
                  filterStatus === s
                    ? "border-brand/30 text-brand bg-brand/5"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        {loading ? (
          <p className="text-[10px] text-muted-foreground py-6 text-center">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderKanban className="size-8 mx-auto mb-2 opacity-20" />
            <p className="text-[10px]">Nenhum projeto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-surface border border-border rounded p-3 hover:border-brand/20 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs text-foreground truncate">{p.name}</h3>
                    <span className={`text-[8px] border rounded px-1.5 py-0.5 mt-1 inline-block ${STATUS_COLORS[p.status] || ""}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(p)} className="p-1 rounded text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors">
                      <Pencil className="size-3" />
                    </button>
                    <button onClick={() => deleteProject(p.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                {p.description && <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {p.category && <span className="text-[8px] text-muted-foreground bg-surface-2 border border-border rounded px-1.5 py-0.5">{p.category}</span>}
                  {p.technologies && p.technologies.split(",").slice(0, 3).map((t) => (
                    <span key={t} className="text-[8px] text-muted-foreground bg-surface-2 border border-border rounded px-1.5 py-0.5">{t.trim()}</span>
                  ))}
                </div>
                {p.links && (
                  <a href={p.links.split(",")[0]?.trim()} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-[9px] text-brand hover:underline" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="size-2.5" /> Link
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false, editing: null })}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative bg-surface border border-border rounded w-full max-w-md p-5 space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                {modal.editing ? "editar projeto" : "novo projeto"}
              </span>
              <button onClick={() => setModal({ open: false, editing: null })} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Nome *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome do projeto"
                  className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição do projeto"
                  rows={3}
                  className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-brand/50">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-brand/50">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Tecnologias</label>
                <input value={form.technologies} onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))}
                  placeholder="React, Node.js, Docker..."
                  className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Links</label>
                <input value={form.links} onChange={(e) => setForm((f) => ({ ...f, links: e.target.value }))}
                  placeholder="https://github.com/..."
                  className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Observações</label>
                <textarea value={form.observations} onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
                  placeholder="Notas adicionais..."
                  rows={2}
                  className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setModal({ open: false, editing: null })}
                className="px-3 py-1.5 rounded text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-50 transition-colors">
                <Check className="size-3" />
                {saving ? "Salvando..." : modal.editing ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
