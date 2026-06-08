import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, FileText } from "lucide-react";

export const Route = createFileRoute("/anotacoes")({
  head: () => ({ meta: [{ title: "Anotações · VargasTI" }] }),
  component: NotesPage,
});

type Note = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) loadNotes();
  }, [user]);

  async function loadNotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, content, updated_at")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });

    if (error) {
      setDbError(true);
    } else {
      const list = data ?? [];
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
    setStatus("idle");
  }

  async function createNote() {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: user!.id, title: "Nova anotação", content: "" })
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      selectNote(data);
    }
  }

  function scheduleAutoSave(noteId: string, newTitle: string, newContent: string) {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("notes")
        .update({
          title: newTitle,
          content: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .eq("user_id", user!.id);

      if (!error) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId ? { ...n, title: newTitle, content: newContent } : n
          )
        );
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
      }
    }, 1500);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (selected) scheduleAutoSave(selected.id, val, content);
  }

  function handleContentChange(val: string) {
    setContent(val);
    if (selected) scheduleAutoSave(selected.id, title, val);
  }

  async function deleteNote(id: string) {
    await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (selected?.id === id) {
      if (updated.length) selectNote(updated[0]);
      else {
        setSelected(null);
        setTitle("");
        setContent("");
        setStatus("idle");
      }
    }
  }

  if (dbError) {
    return (
      <AppShell>
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-foreground mb-6">Anotações</h1>
          <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Tabela{" "}
              <code className="font-mono text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                notes
              </code>{" "}
              não encontrada no Supabase.
            </p>
            <p className="text-xs text-muted-foreground">
              Execute o SQL de configuração no dashboard do Supabase para continuar.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 border-r border-border flex flex-col shrink-0 bg-surface">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Anotações</h2>
            <button
              onClick={createNote}
              className="size-7 rounded-md bg-brand/10 border border-brand/20 grid place-items-center text-brand hover:bg-brand/20 transition-colors"
              title="Nova anotação"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loading ? (
              <p className="text-xs text-muted-foreground px-3 py-6 text-center">
                Carregando...
              </p>
            ) : notes.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-6 text-center">
                Nenhuma anotação ainda.
              </p>
            ) : (
              notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-start gap-2.5 ${
                    selected?.id === note.id
                      ? "bg-brand/10 text-brand"
                      : "hover:bg-white/5 text-foreground/70"
                  }`}
                >
                  <FileText className="size-3.5 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {note.title || "Sem título"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(note.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-3 px-6 py-3 border-b border-border">
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Título da anotação"
                className="flex-1 bg-transparent text-lg font-semibold text-foreground focus:outline-none placeholder:text-muted-foreground min-w-0"
              />
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {status === "saving"
                  ? "Salvando..."
                  : status === "saved"
                  ? "Salvo"
                  : status === "error"
                  ? "Erro ao salvar"
                  : ""}
              </span>
              <button
                onClick={() => deleteNote(selected.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="Excluir anotação"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Comece a escrever..."
              className="flex-1 bg-transparent p-6 text-sm text-foreground resize-none focus:outline-none placeholder:text-muted-foreground font-mono leading-relaxed"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="size-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione ou crie uma anotação</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
