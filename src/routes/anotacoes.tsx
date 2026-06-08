import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, FileText, Search, Tag, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/anotacoes")({
  head: () => ({ meta: [{ title: "Anotações · VargasTI Lab" }] }),
  component: NotesPage,
});

type Note = {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  status?: string;
  updated_at: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const CATEGORIES = ["Geral", "Técnica", "Ideia", "Reunião", "Lembrete"];
const STATUSES = ["rascunho", "em análise", "aprovado", "arquivado"];
const STATUS_COLORS: Record<string, string> = {
  "rascunho": "text-muted-foreground border-muted-foreground/30",
  "em análise": "text-warning border-warning/30",
  "aprovado": "text-brand border-brand/30",
  "arquivado": "text-muted-foreground/50 border-muted-foreground/20",
};

function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Geral");
  const [tags, setTags] = useState("");
  const [noteStatus, setNoteStatus] = useState("rascunho");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCategory, setFilterCategory] = useState("todas");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) loadNotes();
  }, [user]);

  async function loadNotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });

    if (error) {
      setDbError(true);
    } else {
      const list = (data ?? []) as Note[];
      setNotes(list);
      if (list.length) selectNote(list[0]);
    }
    setLoading(false);
  }

  function selectNote(note: Note) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || "Geral");
    setTags(note.tags || "");
    setNoteStatus(note.status || "rascunho");
    setSaveStatus("idle");
  }

  async function createNote() {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: user!.id, title: "Nova anotação", content: "", category: "Geral", tags: "", status: "rascunho" })
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => [data as Note, ...prev]);
      selectNote(data as Note);
    }
  }

  function scheduleAutoSave(noteId: string, updates: Partial<Note>) {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("notes")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .eq("user_id", user!.id);

      if (!error) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n))
        );
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    }, 1200);
  }

  function handleFieldChange(field: string, val: string) {
    if (!selected) return;
    const updates: Record<string, string> = {};
    if (field === "title") { setTitle(val); updates.title = val; updates.content = content; }
    if (field === "content") { setContent(val); updates.title = title; updates.content = val; }
    if (field === "category") { setCategory(val); updates.category = val; }
    if (field === "tags") { setTags(val); updates.tags = val; }
    if (field === "status") { setNoteStatus(val); updates.status = val; }
    scheduleAutoSave(selected.id, updates);
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id).eq("user_id", user!.id);
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (selected?.id === id) {
      if (updated.length) selectNote(updated[0]);
      else { setSelected(null); setTitle(""); setContent(""); setSaveStatus("idle"); }
    }
  }

  const filtered = notes.filter((n) => {
    const matchSearch = search === "" || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || (n.status || "rascunho") === filterStatus;
    const matchCat = filterCategory === "todas" || (n.category || "Geral") === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  if (dbError) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="bg-surface border border-border rounded p-6 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Tabela <code className="text-brand bg-brand/10 px-1.5 py-0.5 rounded">notes</code> não encontrada.
            </p>
            <p className="text-[10px] text-muted-foreground">Execute o SQL de setup no dashboard do Supabase.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-border flex flex-col shrink-0 bg-surface">
          <div className="px-3 py-2 border-b border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">&gt;_notes</span>
              <button
                onClick={createNote}
                className="size-5 rounded bg-brand/10 border border-brand/20 grid place-items-center text-brand hover:bg-brand/20 transition-colors"
              >
                <Plus className="size-3" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-background border border-border rounded px-2 pl-6 py-1 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 bg-background border border-border rounded px-1 py-0.5 text-[9px] text-muted-foreground focus:outline-none focus:border-brand/50 appearance-none"
              >
                <option value="todos">todos</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 bg-background border border-border rounded px-1 py-0.5 text-[9px] text-muted-foreground focus:outline-none focus:border-brand/50 appearance-none"
              >
                <option value="todas">todas</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {loading ? (
              <p className="text-[10px] text-muted-foreground text-center py-6">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-6">Nenhuma nota</p>
            ) : (
              filtered.map((note) => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`w-full text-left px-2 py-2 rounded text-[10px] transition-colors flex items-start gap-2 ${
                    selected?.id === note.id
                      ? "bg-brand/10 text-brand border border-brand/20"
                      : "hover:bg-surface-2 text-muted-foreground border border-transparent"
                  }`}
                >
                  <FileText className="size-3 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px]">{note.title || "Sem título"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {note.category && (
                        <span className="text-[8px] text-muted-foreground/70">{note.category}</span>
                      )}
                      {note.status && note.status !== "rascunho" && (
                        <span className={`text-[8px] border rounded-sm px-1 ${STATUS_COLORS[note.status] || ""}`}>
                          {note.status}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
              <input
                value={title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Título"
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground min-w-0"
              />
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={noteStatus}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className={`bg-transparent border rounded px-1.5 py-0.5 text-[9px] focus:outline-none appearance-none ${STATUS_COLORS[noteStatus] || ""}`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={category}
                  onChange={(e) => handleFieldChange("category", e.target.value)}
                  className="bg-transparent border border-border rounded px-1.5 py-0.5 text-[9px] text-muted-foreground focus:outline-none appearance-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-[9px] text-muted-foreground">
                  {saveStatus === "saving" ? "salvando..." : saveStatus === "saved" ? "salvo" : saveStatus === "error" ? "erro" : ""}
                </span>
                <button
                  onClick={() => deleteNote(selected.id)}
                  className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
            <div className="px-4 py-1.5 border-b border-border flex items-center gap-2">
              <Tag className="size-3 text-muted-foreground shrink-0" />
              <input
                value={tags}
                onChange={(e) => handleFieldChange("tags", e.target.value)}
                placeholder="tags separadas por vírgula..."
                className="flex-1 bg-transparent text-[10px] text-muted-foreground focus:outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <textarea
              value={content}
              onChange={(e) => handleFieldChange("content", e.target.value)}
              placeholder="Comece a escrever..."
              className="flex-1 bg-transparent p-4 text-xs text-foreground resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="size-6 mx-auto mb-2 opacity-20" />
              <p className="text-[10px]">Selecione ou crie uma anotação</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
