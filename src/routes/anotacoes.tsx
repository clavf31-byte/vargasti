import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, FileText, Search, Tag, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";

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
type Modal =
  | null
  | { type: "set-password"; noteId: string }
  | { type: "unlock"; note: Note };

const CATEGORIES = ["Geral", "Técnica", "Ideia", "Reunião", "Lembrete"];
const STATUSES = ["rascunho", "em análise", "aprovado", "arquivado"];
const STATUS_COLORS: Record<string, string> = {
  "rascunho": "text-muted-foreground border-muted-foreground/30",
  "em análise": "text-warning border-warning/30",
  "aprovado": "text-brand border-brand/30",
  "arquivado": "text-muted-foreground/50 border-muted-foreground/20",
};

const PWD_RE = /__pwd:[a-f0-9]+/;
const CONF_RE = /,?\s*__conf/;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getPwdHash(tags: string): string | null {
  const m = tags.match(/__pwd:([a-f0-9]+)/);
  return m ? m[1] : null;
}

function addPwdHash(tags: string, hash: string): string {
  const clean = (tags ?? "").replace(/,?\s*__pwd:[a-f0-9]+/, "").trim();
  return clean ? `${clean},__pwd:${hash}` : `__pwd:${hash}`;
}

function removePwdHash(tags: string): string {
  return (tags ?? "").replace(/,?\s*__pwd:[a-f0-9]+/, "").trim();
}

function isConfidential(tags: string): boolean {
  return (tags ?? "").includes("__conf");
}

function addConfMarker(tags: string): string {
  return tags.includes("__conf") ? tags : (tags ? `${tags},__conf` : "__conf");
}

function removeConfMarker(tags: string): string {
  return (tags ?? "").replace(CONF_RE, "").trim();
}

function displayTags(tags: string): string {
  return (tags ?? "")
    .replace(PWD_RE, "")
    .replace(CONF_RE, "")
    .replace(/,\s*,/g, ",")
    .replace(/^,|,$/g, "")
    .trim();
}

function isLocked(note: Note): boolean {
  return (note.status === "arquivado" || note.status === "archived") &&
    !!getPwdHash(note.tags ?? "");
}

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
  const [modal, setModal] = useState<Modal>(null);
  const [modalPwd, setModalPwd] = useState("");
  const [modalPwdShow, setModalPwdShow] = useState(false);
  const [modalConf, setModalConf] = useState(false);
  const [modalError, setModalError] = useState("");
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
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
    if (isLocked(note) && !unlocked.has(note.id)) {
      setModal({ type: "unlock", note });
      setModalPwd("");
      setModalError("");
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || "Geral");
    setTags(displayTags(note.tags ?? ""));
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
        setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n)));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    }, 1200);
  }

  function handleFieldChange(field: string, val: string) {
    if (!selected) return;

    if (field === "status" && val === "arquivado") {
      setNoteStatus(val);
      scheduleAutoSave(selected.id, { status: val });
      setModal({ type: "set-password", noteId: selected.id });
      setModalPwd("");
      setModalConf(false);
      setModalError("");
      return;
    }

    if (field === "status" && selected.status === "arquivado") {
      let newTags = removePwdHash(notes.find((n) => n.id === selected.id)?.tags ?? "");
      newTags = removeConfMarker(newTags);
      setNoteStatus(val);
      scheduleAutoSave(selected.id, { status: val, tags: newTags });
      setUnlocked((prev) => { const s = new Set(prev); s.delete(selected.id); return s; });
      setRevealed((prev) => { const s = new Set(prev); s.delete(selected.id); return s; });
      return;
    }

    const updates: Record<string, string> = {};
    if (field === "title") { setTitle(val); updates.title = val; updates.content = content; }
    if (field === "content") { setContent(val); updates.title = title; updates.content = val; }
    if (field === "category") { setCategory(val); updates.category = val; }
    if (field === "tags") {
      setTags(val);
      const existingHash = getPwdHash(notes.find((n) => n.id === selected.id)?.tags ?? "");
      updates.tags = existingHash ? `${val},__pwd:${existingHash}` : val;
    }
    if (field === "status") { setNoteStatus(val); updates.status = val; }
    scheduleAutoSave(selected.id, updates);
  }

  async function handleSetPassword() {
    if (!modal || modal.type !== "set-password") return;
    if (!modalPwd.trim()) {
      setModal(null);
      return;
    }
    const hash = await sha256(modalPwd.trim());
    const note = notes.find((n) => n.id === modal.noteId);
    let newTags = addPwdHash(note?.tags ?? "", hash);
    if (modalConf) newTags = addConfMarker(newTags);
    else newTags = removeConfMarker(newTags);
    await supabase
      .from("notes")
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq("id", modal.noteId)
      .eq("user_id", user!.id);
    setNotes((prev) => prev.map((n) => n.id === modal.noteId ? { ...n, tags: newTags } : n));
    if (selected?.id === modal.noteId) {
      setUnlocked((prev) => new Set(prev).add(modal.noteId));
      if (!modalConf) setRevealed((prev) => new Set(prev).add(modal.noteId));
    }
    setModal(null);
  }

  async function handleUnlock() {
    if (!modal || modal.type !== "unlock") return;
    const stored = getPwdHash(modal.note.tags ?? "");
    if (!stored) { setModal(null); selectNote(modal.note); return; }
    const hash = await sha256(modalPwd.trim());
    if (hash !== stored) {
      setModalError("Senha incorreta.");
      return;
    }
    setUnlocked((prev) => new Set(prev).add(modal.note.id));
    setModal(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const note = modal.note;
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || "Geral");
    setTags(displayTags(note.tags ?? ""));
    setNoteStatus(note.status || "rascunho");
    setSaveStatus("idle");
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
              <span className="text-xs font-medium text-muted-foreground">Anotações</span>
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
              filtered.map((note) => {
                const locked = isLocked(note) && !unlocked.has(note.id);
                return (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`w-full text-left px-2 py-2 rounded text-[10px] transition-colors flex items-start gap-2 ${
                      selected?.id === note.id
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "hover:bg-surface-2 text-muted-foreground border border-transparent"
                    }`}
                  >
                    {locked ? (
                      <Lock className="size-3 mt-0.5 shrink-0 text-muted-foreground/50" />
                    ) : (
                      <FileText className="size-3 mt-0.5 shrink-0" />
                    )}
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
                );
              })
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
              {isLocked(selected) && unlocked.has(selected.id) && (
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                  <Lock className="size-3" />
                  <span>protegida</span>
                </div>
              )}
            </div>
            {isConfidential(notes.find((n) => n.id === selected.id)?.tags ?? "") &&
             unlocked.has(selected.id) &&
             !revealed.has(selected.id) ? (
              <div className="flex-1 relative flex items-center justify-center">
                <textarea
                  value={content}
                  readOnly
                  className="absolute inset-0 w-full h-full bg-transparent p-4 text-xs text-foreground resize-none focus:outline-none leading-relaxed select-none pointer-events-none blur-sm"
                />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="size-10 rounded-full bg-surface border border-border grid place-items-center">
                    <ShieldAlert className="size-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-xs text-muted-foreground">Conteúdo confidencial</p>
                  <button
                    onClick={() => setRevealed((prev) => new Set(prev).add(selected.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 border border-brand/20 text-brand text-xs rounded-lg hover:bg-brand/20 transition-colors"
                  >
                    <Eye className="size-3.5" />
                    Revelar conteúdo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 relative">
                <textarea
                  value={content}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  placeholder="Comece a escrever..."
                  className="w-full h-full bg-transparent p-4 text-xs text-foreground resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed absolute inset-0"
                />
                {isConfidential(notes.find((n) => n.id === selected.id)?.tags ?? "") &&
                 unlocked.has(selected.id) &&
                 revealed.has(selected.id) && (
                  <button
                    onClick={() => setRevealed((prev) => { const s = new Set(prev); s.delete(selected.id); return s; })}
                    title="Ocultar conteúdo"
                    className="absolute top-2 right-3 p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-surface-2 transition-colors"
                  >
                    <EyeOff className="size-3.5" />
                  </button>
                )}
              </div>
            )}
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

      {/* Modal: definir senha ao arquivar */}
      {modal?.type === "set-password" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Proteger com senha</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Defina uma senha para esta anotação arquivada. Deixe em branco para arquivar sem proteção.
            </p>
            <div className="relative">
              <input
                type={modalPwdShow ? "text" : "password"}
                placeholder="Senha (opcional)"
                value={modalPwd}
                onChange={(e) => setModalPwd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                autoFocus
                className="w-full bg-white/5 border border-border rounded-xl px-3 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setModalPwdShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {modalPwdShow ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={modalConf}
                onChange={(e) => setModalConf(e.target.checked)}
                className="size-3.5 rounded accent-brand"
              />
              <div>
                <p className="text-xs text-foreground">Conteúdo confidencial</p>
                <p className="text-[10px] text-muted-foreground">Ocultar texto na tela até revelar manualmente</p>
              </div>
            </label>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
              >
                Pular
              </button>
              <button
                onClick={handleSetPassword}
                disabled={!modalPwd.trim()}
                className="px-3 py-1.5 text-xs bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Proteger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: desbloquear nota */}
      {modal?.type === "unlock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Nota protegida</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{modal.note.title || "Sem título"}</span>
              {" "}está protegida. Digite a senha para acessar.
            </p>
            <div className="relative">
              <input
                type={modalPwdShow ? "text" : "password"}
                placeholder="Senha"
                value={modalPwd}
                onChange={(e) => { setModalPwd(e.target.value); setModalError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                autoFocus
                className={`w-full bg-white/5 border rounded-xl px-3 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${modalError ? "border-destructive/50 focus:border-destructive/60" : "border-border focus:border-brand/40"}`}
              />
              <button
                type="button"
                onClick={() => setModalPwdShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {modalPwdShow ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {modalError && (
              <p className="text-xs text-destructive">{modalError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnlock}
                disabled={!modalPwd.trim()}
                className="px-3 py-1.5 text-xs bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
