import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard, EmptyState, Toolbar, FormModal, Btn } from "@/components/shared";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Pencil, Trash2, Check, FolderKanban, ExternalLink } from "lucide-react";

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
  "ideia":             "text-muted-foreground border-muted-foreground/30 bg-surface-2",
  "em desenvolvimento":"text-info border-info/30 bg-info/10",
  "testando":          "text-warning border-warning/30 bg-warning/10",
  "finalizado":        "text-brand border-brand/30 bg-brand/10",
  "arquivado":         "text-muted-foreground/50 border-muted-foreground/20 bg-surface-2/50",
};

const STATUS_DOTS: Record<string, string> = {
  "ideia":             "bg-muted-foreground/40",
  "em desenvolvimento":"bg-info",
  "testando":          "bg-warning",
  "finalizado":        "bg-brand",
  "arquivado":         "bg-muted-foreground/30",
};

const CATEGORIES = ["Frontend", "Backend", "DevOps", "Automação", "Infra", "Segurança", "Estudo", "Outros"];

const EMPTY_FORM: ProjectForm = {
  name: "", description: "", status: "ideia", category: "Outros",
  technologies: "", links: "", observations: "",
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

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects").select("*").eq("user_id", user!.id)
      .order("updated_at", { ascending: false });
    if (error) setDbError(true);
    else setProjects((data ?? []) as Project[]);
    setLoading(false);
  }

  function openCreate() { setForm(EMPTY_FORM); setModal({ open: true, editing: null }); }
  function openEdit(p: Project) {
    setForm({ name: p.name, description: p.description, status: p.status, category: p.category,
      technologies: p.technologies, links: p.links, observations: p.observations });
    setModal({ open: true, editing: p });
  }
  function closeModal() { setModal({ open: false, editing: null }); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (modal.editing) {
      const { error } = await supabase.from("projects")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", modal.editing.id).eq("user_id", user!.id);
      if (!error) {
        setProjects((prev) => prev.map((p) => (p.id === modal.editing!.id ? { ...p, ...form } : p)));
        closeModal();
      }
    } else {
      const { data, error } = await supabase.from("projects")
        .insert({ ...form, user_id: user!.id }).select().single();
      if (!error && data) { setProjects((prev) => [data as Project, ...prev]); closeModal(); }
    }
    setSaving(false);
  }

  async function deleteProject(id: string) {
    await supabase.from("projects").delete().eq("id", id).eq("user_id", user!.id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = projects.filter((p) => {
    const matchStatus = filterStatus === "todos" || p.status === filterStatus;
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const countByStatus = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = projects.filter((p) => p.status === s).length;
    return acc;
  }, {});

  const stats = [
    { label: "Total",      value: projects.length,                         colorClass: "text-foreground" },
    { label: "Em Dev",     value: countByStatus["em desenvolvimento"] ?? 0, colorClass: "text-info" },
    { label: "Finalizados",value: countByStatus["finalizado"] ?? 0,         colorClass: "text-brand" },
    { label: "Ideias",     value: countByStatus["ideia"] ?? 0,              colorClass: "text-muted-foreground" },
  ];

  if (dbError) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="bg-surface border border-border rounded-xl p-6 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Tabela <code className="text-brand bg-brand/10 px-1.5 py-0.5 rounded">projects</code> não encontrada.
            </p>
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
      <div className="p-4 md:p-5 space-y-4">
        <PageHeader
          category="Gestão"
          title="Projetos"
          icon={FolderKanban}
          iconClass="text-info"
          subtitle={`${projects.length} projeto${projects.length !== 1 ? "s" : ""} cadastrado${projects.length !== 1 ? "s" : ""}`}
          actions={
            <Btn onClick={openCreate} size="md">
              <Plus className="size-3.5" />
              Novo Projeto
            </Btn>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} colorClass={s.colorClass} />
          ))}
        </div>

        <Toolbar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Buscar projeto..."
        >
          <button
            onClick={() => setFilterStatus("todos")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
              filterStatus === "todos"
                ? "border-brand/30 text-brand bg-brand/10"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            Todos ({projects.length})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                filterStatus === s
                  ? STATUS_COLORS[s]
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span className={`size-1.5 rounded-full ${filterStatus === s ? STATUS_DOTS[s] : "bg-muted-foreground/40"}`} />
              {s}
              {countByStatus[s] > 0 && <span className="opacity-70">({countByStatus[s]})</span>}
            </button>
          ))}
        </Toolbar>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto encontrado"
            action={
              search === "" && filterStatus === "todos" ? (
                <button onClick={openCreate} className="text-[11px] text-brand hover:underline">
                  Criar primeiro projeto
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-surface border border-border rounded-xl p-4 hover:border-border/80 hover:bg-white/[0.02] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate leading-tight">{p.name}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] border rounded-lg px-2 py-0.5 mt-1.5 font-medium ${STATUS_COLORS[p.status] ?? ""}`}>
                      <span className={`size-1.5 rounded-full ${STATUS_DOTS[p.status] ?? "bg-muted-foreground/40"}`} />
                      {p.status}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors">
                      <Pencil className="size-3" />
                    </button>
                    <button onClick={() => deleteProject(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{p.description}</p>
                )}

                <div className="flex flex-wrap gap-1">
                  {p.category && (
                    <span className="text-[9px] text-muted-foreground bg-surface-2 border border-border rounded-lg px-1.5 py-0.5 font-medium">
                      {p.category}
                    </span>
                  )}
                  {p.technologies && p.technologies.split(",").slice(0, 3).map((t) => (
                    <span key={t} className="text-[9px] text-muted-foreground bg-surface-2 border border-border rounded-lg px-1.5 py-0.5">
                      {t.trim()}
                    </span>
                  ))}
                </div>

                {p.links && (
                  <a
                    href={p.links.split(",")[0]?.trim()}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1 text-[10px] text-brand hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="size-3" />
                    Ver link
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modal.open && (
        <FormModal
          title={modal.editing ? "Editar projeto" : "Novo projeto"}
          onClose={closeModal}
          footer={
            <>
              <Btn variant="secondary" onClick={closeModal}>Cancelar</Btn>
              <Btn onClick={save} disabled={saving || !form.name.trim()}>
                <Check className="size-3" />
                {saving ? "Salvando..." : modal.editing ? "Salvar" : "Criar"}
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Nome *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do projeto"
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descrição do projeto"
                rows={3}
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40 transition-all"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40 transition-all"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Tecnologias</label>
              <input
                value={form.technologies}
                onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))}
                placeholder="React, Node.js, Docker..."
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Links</label>
              <input
                value={form.links}
                onChange={(e) => setForm((f) => ({ ...f, links: e.target.value }))}
                placeholder="https://github.com/..."
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Observações</label>
              <textarea
                value={form.observations}
                onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
                placeholder="Notas adicionais..."
                rows={2}
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground transition-all"
              />
            </div>
          </div>
        </FormModal>
      )}
    </AppShell>
  );
}
