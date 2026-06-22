import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Trash2, FileText, Search, Tag,
  Lock, Eye, EyeOff, ShieldAlert, ShieldCheck,
  LayoutList, LayoutGrid, Table2, ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/anotacoes")({
  head: () => ({ meta: [{ title: `Anotações · ${client.name}` }] }),
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
type ProtectionMode = "none" | "visible" | "hidden";
// visible = proteger e manter visível (título aparece, conteúdo pede senha)
// hidden  = proteger e ocultar (título oculto, exibe só "Anotação protegida")

const CATEGORIES = ["Geral", "Técnica", "Ideia", "Reunião", "Lembrete"];
const STATUSES = ["rascunho", "em análise", "aprovado", "arquivado"];
const STATUS_COLORS: Record<string, string> = {
  "rascunho": "text-muted-foreground border-muted-foreground/30",
  "em análise": "text-warning border-warning/30",
  "aprovado": "text-brand border-brand/30",
  "arquivado": "text-muted-foreground/50 border-muted-foreground/20",
};

// ── helpers ──────────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getPwdHash(tags: string): string | null {
  const m = (tags ?? "").match(/__pwd:([a-f0-9]+)/);
  return m ? m[1] : null;
}

function getProtectionMode(tags: string): ProtectionMode {
  if (!getPwdHash(tags)) return "none";
  return (tags ?? "").includes("__conf") ? "hidden" : "visible";
}

function setProtectionInTags(tags: string, hash: string, mode: Exclude<ProtectionMode, "none">): string {
  let t = (tags ?? "")
    .replace(/,?\s*__pwd:[a-f0-9]+/, "")
    .replace(/,?\s*__conf/, "")
    .trim();
  t = t ? `${t},__pwd:${hash}` : `__pwd:${hash}`;
  if (mode === "hidden") t += ",__conf";
  return t;
}

function removeProtectionFromTags(tags: string): string {
  return (tags ?? "")
    .replace(/,?\s*__pwd:[a-f0-9]+/, "")
    .replace(/,?\s*__conf/, "")
    .trim();
}

function displayTags(tags: string): string {
  return (tags ?? "")
    .replace(/__pwd:[a-f0-9]+/, "")
    .replace(/__conf/, "")
    .replace(/__type:[a-z]+/, "")
    .replace(/,\s*,/g, ",")
    .replace(/^,|,$/g, "")
    .trim();
}

type NoteType = "texto" | "planilha";

function getNoteType(tags: string): NoteType {
  return (tags ?? "").includes("__type:planilha") ? "planilha" : "texto";
}

function setNoteTypeInTags(tags: string, type: NoteType): string {
  let t = (tags ?? "").replace(/,?\s*__type:[a-z]+/, "").trim();
  if (type === "planilha") t = t ? `${t},__type:planilha` : "__type:planilha";
  return t;
}

type GridData = string[][];

function parseGrid(content: string, cols = 6, rows = 10): GridData {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
      return parsed as GridData;
    }
  } catch {}
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

// ── component ─────────────────────────────────────────────────────────────────

function NotesPage() {
  const { user } = useAuth();

  // lista e seleção
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"vertical" | "horizontal">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notesLayoutMode") as "vertical" | "horizontal" | null;
      // Always default to vertical, ignore horizontal from localStorage
      if (saved === "horizontal") {
        localStorage.removeItem("notesLayoutMode");
        return "vertical";
      }
      return saved || "vertical";
    }
    return "vertical";
  });

  useEffect(() => {
    localStorage.setItem("notesLayoutMode", layoutMode);
  }, [layoutMode]);

  // editor
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Geral");
  const [tags, setTags] = useState("");
  const [noteStatus, setNoteStatus] = useState("rascunho");
  const [noteType, setNoteType] = useState<NoteType>("texto");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // filtros
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCategory, setFilterCategory] = useState("todas");

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  useEffect(() => {
    if (!showNewMenu) return;
    const close = () => setShowNewMenu(false);
    const t = setTimeout(() => window.addEventListener("click", close), 0);
    return () => { clearTimeout(t); window.removeEventListener("click", close); };
  }, [showNewMenu]);

  // proteção por nota (apenas frontend — sessão atual)
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // inline unlock (exibido no editor, não modal global)
  const [unlockPwd, setUnlockPwd] = useState("");
  const [unlockPwdShow, setUnlockPwdShow] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  // modal definir proteção (aparece só ao arquivar)
  const [protModal, setProtModal] = useState<{ noteId: string } | null>(null);
  const [protChoice, setProtChoice] = useState<ProtectionMode>("none");
  const [protPwd, setProtPwd] = useState("");
  const [protPwdShow, setProtPwdShow] = useState(false);
  const [protError, setProtError] = useState("");

  useEffect(() => { if (user) loadNotes(); }, [user]);

  async function createNote(type: NoteType) {
    setShowNewMenu(false);
    const initialContent = type === "planilha"
      ? JSON.stringify(Array.from({ length: 10 }, () => Array(6).fill("")))
      : "";
    const initialTags = type === "planilha" ? "__type:planilha" : "";
    const { data, error } = await supabase.from("notes")
      .insert({
        user_id: user!.id,
        title: type === "planilha" ? "Nova planilha" : "Nova anotação",
        content: initialContent,
        category: "Geral",
        tags: initialTags,
        status: "rascunho",
      })
      .select().single();
    if (!error && data) {
      setNotes((prev) => [data as Note, ...prev]);
      openNote(data as Note);
    }
  }

  async function loadNotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes").select("*").eq("user_id", user!.id)
      .order("updated_at", { ascending: false });
    if (error) { setDbError(true); }
    else {
      const list = (data ?? []) as Note[];
      setNotes(list);
      if (list.length) openNote(list[0]);
    }
    setLoading(false);
  }

  function openNote(note: Note) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setDeleteConfirm(false);
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || "Geral");
    setTags(displayTags(note.tags ?? ""));
    setNoteStatus(note.status || "rascunho");
    setNoteType(getNoteType(note.tags ?? ""));
    setSaveStatus("idle");
    setUnlockPwd("");
    setUnlockPwdShow(false);
    setUnlockError("");
  }

  function scheduleAutoSave(noteId: string, updates: Partial<Note>) {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("notes")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", noteId).eq("user_id", user!.id);
      if (!error) {
        setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, ...updates } : n));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    }, 1200);
  }

  function handleFieldChange(field: string, val: string) {
    if (!selected) return;

    // ao arquivar → abrir modal de proteção
    if (field === "status" && val === "arquivado") {
      setNoteStatus(val);
      scheduleAutoSave(selected.id, { status: val });
      setProtModal({ noteId: selected.id });
      setProtChoice("none");
      setProtPwd("");
      setProtError("");
      return;
    }

    // ao desarquivar → remover proteção
    if (field === "status" && (selected.status === "arquivado")) {
      const currentNote = notes.find((n) => n.id === selected.id);
      const cleanTags = removeProtectionFromTags(currentNote?.tags ?? "");
      setNoteStatus(val);
      scheduleAutoSave(selected.id, { status: val, tags: cleanTags });
      setUnlocked((prev) => { const s = new Set(prev); s.delete(selected.id); return s; });
      setRevealed((prev) => { const s = new Set(prev); s.delete(selected.id); return s; });
      return;
    }

    const updates: Record<string, string> = {};
    if (field === "title")    { setTitle(val);    updates.title   = val; updates.content = content; }
    if (field === "content")  { setContent(val);  updates.title   = title; updates.content = val; }
    if (field === "category") { setCategory(val); updates.category = val; }
    if (field === "tags") {
      setTags(val);
      const currentNote = notes.find((n) => n.id === selected.id);
      const pwdHash = getPwdHash(currentNote?.tags ?? "");
      const confMark = (currentNote?.tags ?? "").includes("__conf") ? ",__conf" : "";
      const typeMark = (currentNote?.tags ?? "").includes("__type:planilha") ? ",__type:planilha" : "";
      updates.tags = pwdHash ? `${val},__pwd:${pwdHash}${confMark}${typeMark}` : `${val}${typeMark}`;
    }
    if (field === "type") {
      const newType = val as NoteType;
      setNoteType(newType);
      const currentNote = notes.find((n) => n.id === selected.id);
      const newTags = setNoteTypeInTags(currentNote?.tags ?? "", newType);
      updates.tags = newTags;
      if (newType === "planilha") {
        // só inicializa grid se ainda não é planilha
        if (getNoteType(currentNote?.tags ?? "") !== "planilha") {
          const emptyGrid: GridData = Array.from({ length: 10 }, () => Array(6).fill(""));
          updates.content = JSON.stringify(emptyGrid);
          setContent(updates.content);
        }
      } else {
        // voltando para texto: limpa o JSON do grid
        try {
          const p = JSON.parse(content);
          if (Array.isArray(p) && Array.isArray(p[0])) {
            updates.content = "";
            setContent("");
          }
        } catch {}
      }
    }
    if (field === "status") { setNoteStatus(val); updates.status = val; }
    scheduleAutoSave(selected.id, updates);
  }

  // ── confirmar proteção ──────────────────────────────────────────────────────
  async function handleSetProtection() {
    if (!protModal) return;

    if (protChoice === "none") {
      // sem proteção — remover marcadores antigos se houver
      const note = notes.find((n) => n.id === protModal.noteId);
      const cleanTags = removeProtectionFromTags(note?.tags ?? "");
      if (cleanTags !== note?.tags) {
        await supabase.from("notes")
          .update({ tags: cleanTags })
          .eq("id", protModal.noteId).eq("user_id", user!.id);
        setNotes((prev) => prev.map((n) => n.id === protModal.noteId ? { ...n, tags: cleanTags } : n));
      }
      setProtModal(null);
      return;
    }

    if (!protPwd.trim()) { setProtError("Digite uma senha."); return; }

    const hash = await sha256(protPwd.trim());
    const note = notes.find((n) => n.id === protModal.noteId);
    const newTags = setProtectionInTags(note?.tags ?? "", hash, protChoice);

    await supabase.from("notes")
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq("id", protModal.noteId).eq("user_id", user!.id);

    setNotes((prev) => prev.map((n) => n.id === protModal.noteId ? { ...n, tags: newTags } : n));

    // após definir senha → nota fica desbloqueada na sessão atual
    setUnlocked((prev) => new Set(prev).add(protModal.noteId));
    // para "visible" já é revelada; para "hidden" precisa de botão explícito
    if (protChoice === "visible") {
      setRevealed((prev) => new Set(prev).add(protModal.noteId));
    }

    setProtModal(null);
  }

  // ── desbloquear nota selecionada ───────────────────────────────────────────
  async function handleUnlock() {
    if (!selected) return;
    const noteData = notes.find((n) => n.id === selected.id) ?? selected;
    const stored = getPwdHash(noteData.tags ?? "");
    if (!stored) { setUnlocked((prev) => new Set(prev).add(selected.id)); return; }
    const hash = await sha256(unlockPwd.trim());
    if (hash !== stored) { setUnlockError("Senha incorreta."); return; }
    setUnlocked((prev) => new Set(prev).add(selected.id));
    setUnlockPwd("");
    setUnlockError("");
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id).eq("user_id", user!.id);
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (selected?.id === id) {
      if (updated.length) openNote(updated[0]);
      else { setSelected(null); setTitle(""); setContent(""); setSaveStatus("idle"); }
    }
  }

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = !search || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    const matchStatus = filterStatus === "todos" || (n.status || "rascunho") === filterStatus;
    const matchCat = filterCategory === "todas" || (n.category || "Geral") === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  if (dbError) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="bg-surface border border-border rounded p-6 text-center">
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
      <div className={`${layoutMode === "vertical" ? "flex-row" : "flex-col"} flex h-[calc(100vh-2.5rem)] overflow-hidden`}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className={`${layoutMode === "vertical" ? "w-64 border-r" : "h-40 border-b"} border-border flex ${layoutMode === "vertical" ? "flex-col" : "flex-row"} shrink-0 overflow-x-auto`} style={{ background: layoutMode === "vertical" ? "#07111c" : "#0a1422" }}>
          {/* Header da sidebar */}
          <div className={`px-3 pt-3 pb-2 border-b border-border space-y-2 ${layoutMode === "horizontal" ? "flex items-center gap-2" : ""}`}>
            <div className="flex items-center justify-between flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Anotações</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLayoutMode(layoutMode === "vertical" ? "horizontal" : "vertical")}
                  title={`Trocar para ${layoutMode === "vertical" ? "horizontal" : "vertical"}`}
                  className="p-1.5 rounded-lg bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
                >
                  {layoutMode === "vertical" ? <LayoutList className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
                </button>
              </div>
            </div>
            {layoutMode === "horizontal" && (
              <>
                <div className="flex gap-1.5">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground focus:outline-none focus:border-muted-foreground/40 appearance-none cursor-pointer">
                    <option value="todos">Todos status</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground focus:outline-none focus:border-muted-foreground/40 appearance-none cursor-pointer">
                    <option value="todas">Todas cat.</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="relative">
              <button
                onClick={() => setShowNewMenu((v) => !v)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-3 border border-border text-foreground text-[10px] font-medium hover:bg-surface-3/80 transition-colors"
              >
                <Plus className="size-3" />
                Nova
                <ChevronDown className="size-3 ml-0.5" />
              </button>
              {showNewMenu && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-xl overflow-hidden min-w-[130px]">
                  <button
                    onClick={() => createNote("texto")}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-surface-2 transition-colors"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    Texto
                  </button>
                  <button
                    onClick={() => createNote("planilha")}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-surface-2 transition-colors"
                  >
                    <Table2 className="size-3.5 text-muted-foreground" />
                    Planilha
                  </button>
                </div>
              )}
            </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar anotação..."
                className="w-full bg-background border border-border rounded-xl px-2.5 pl-7 py-1.5 text-xs focus:outline-none focus:border-muted-foreground/40 focus:ring-1 focus:ring-muted-foreground/20 placeholder:text-muted-foreground transition-all" />
            </div>
            {layoutMode === "vertical" && (
              <div className="flex gap-1.5">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground focus:outline-none focus:border-muted-foreground/40 appearance-none cursor-pointer">
                  <option value="todos">Todos status</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground focus:outline-none focus:border-muted-foreground/40 appearance-none cursor-pointer">
                  <option value="todas">Todas cat.</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

          <div className={`flex-1 ${layoutMode === "vertical" ? "overflow-y-auto" : "overflow-x-auto"} p-2 flex ${layoutMode === "vertical" ? "flex-col space-y-1" : "flex-row space-x-1"}`}>
            {loading ? (
              <p className="text-[10px] text-muted-foreground text-center py-8">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-8">Nenhuma nota</p>
            ) : filtered.map((note) => {
              const mode = getProtectionMode(note.tags ?? "");
              const locked = mode !== "none" && !unlocked.has(note.id);
              const isActive = selected?.id === note.id;
              return (
                <button key={note.id} onClick={() => openNote(note)}
                  className={`${layoutMode === "horizontal" ? "flex-shrink-0 min-w-[200px]" : "w-full"} text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-2.5 group ${
                    isActive
                      ? "bg-surface-2 border border-border shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                      : "hover:bg-surface-2/50 border border-transparent"
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {locked ? <Lock className="size-3.5" /> : <FileText className="size-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-medium leading-snug ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                      {locked && mode === "hidden" ? "Anotação protegida" : (note.title || "Sem título")}
                    </p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {!locked && note.category && note.category !== "Geral" && (
                        <span className="text-[9px] text-muted-foreground/60 bg-surface-2 rounded-md px-1.5 py-0.5">{note.category}</span>
                      )}
                      {!locked && note.status && note.status !== "rascunho" && (
                        <span className={`text-[9px] border rounded-md px-1.5 py-0.5 ${STATUS_COLORS[note.status] || ""}`}>
                          {note.status}
                        </span>
                      )}
                      {locked && mode === "visible" && (
                        <span className="text-[9px] border border-warning/30 text-warning rounded-md px-1.5 py-0.5">Protegida</span>
                      )}
                      {locked && mode === "hidden" && (
                        <span className="text-[9px] border border-muted-foreground/20 text-muted-foreground/50 rounded-md px-1.5 py-0.5">Oculta</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Editor ──────────────────────────────────────────────────────── */}
        {!selected ? (
          <div className={`flex-1 flex items-center justify-center ${layoutMode === "vertical" ? "border-l" : "border-t"} border-border`}>
            <div className="text-center text-muted-foreground">
              <FileText className="size-6 mx-auto mb-2 opacity-20" />
              <p className="text-[10px]">Selecione ou crie uma anotação</p>
            </div>
          </div>
        ) : (() => {
          const noteData = notes.find((n) => n.id === selected.id) ?? selected;
          const mode = getProtectionMode(noteData.tags ?? "");
          const isLocked = mode !== "none" && !unlocked.has(selected.id);
          const isHiddenRevealed = mode === "hidden" && unlocked.has(selected.id) && !revealed.has(selected.id);

          // ── Nota oculta + BLOQUEADA ────────────────────────────────────
          if (mode === "hidden" && isLocked) {
            return (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xs space-y-4 text-center">
                  <div className="size-14 rounded-2xl bg-surface border border-border grid place-items-center mx-auto">
                    <ShieldAlert className="size-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Anotação protegida</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Arquivada em {new Date(noteData.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="relative">
                      <input
                        type={unlockPwdShow ? "text" : "password"}
                        placeholder="Digite a senha"
                        value={unlockPwd}
                        onChange={(e) => { setUnlockPwd(e.target.value); setUnlockError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                        autoFocus
                        className={`w-full bg-surface border rounded-xl px-3 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${unlockError ? "border-destructive/50" : "border-border focus:border-brand/40"}`}
                      />
                      <button type="button" onClick={() => setUnlockPwdShow((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {unlockPwdShow ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                    {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
                    <button onClick={handleUnlock} disabled={!unlockPwd.trim()}
                      className="w-full py-2.5 text-sm bg-foreground text-background rounded-xl hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Desbloquear
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // ── Nota oculta + DESBLOQUEADA mas não revelada ───────────────
          if (isHiddenRevealed) {
            return (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xs space-y-4 text-center">
                  <div className="size-14 rounded-2xl bg-surface-2 border border-border grid place-items-center mx-auto">
                    <ShieldCheck className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Desbloqueado</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Clique para revelar o conteúdo desta sessão</p>
                  </div>
                  <button onClick={() => setRevealed((prev) => new Set(prev).add(selected.id))}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm bg-surface-2 border border-border text-foreground rounded-xl hover:bg-surface-3 transition-colors">
                    <Eye className="size-4" />
                    Revelar conteúdo
                  </button>
                </div>
              </div>
            );
          }

          // ── Editor normal (desbloqueado ou sem proteção) ───────────────
          return (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Barra de título */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
                <input value={title} onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Título da anotação" readOnly={isLocked}
                  className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none placeholder:text-muted-foreground/50 min-w-0" />
                <div className="flex items-center gap-1.5 shrink-0">
                  {saveStatus === "saving" && <span className="text-[9px] text-muted-foreground/60">salvando...</span>}
                  {saveStatus === "saved" && <span className="text-[9px] text-muted-foreground/80">salvo</span>}
                  {saveStatus === "error" && <span className="text-[9px] text-destructive">erro</span>}
                  {mode === "hidden" && unlocked.has(selected.id) && (
                    <button onClick={() => setRevealed((prev) => { const s = new Set(prev); s.delete(selected.id); return s; })}
                      title="Ocultar conteúdo"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
                      <EyeOff className="size-3.5" />
                    </button>
                  )}
                  {deleteConfirm ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-destructive">Excluir?</span>
                      <button
                        onClick={() => { deleteNote(selected.id); setDeleteConfirm(false); }}
                        className="px-2 py-1 rounded text-[10px] bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="px-2 py-1 rounded text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Metadados */}
              <div className="flex items-center gap-2 px-5 py-2 border-b border-border/60 flex-wrap">
                <select value={noteStatus} onChange={(e) => handleFieldChange("status", e.target.value)}
                  className={`bg-transparent border rounded-lg px-2 py-1 text-[10px] font-medium focus:outline-none appearance-none cursor-pointer transition-colors ${STATUS_COLORS[noteStatus] || "border-border text-muted-foreground"}`}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={category} onChange={(e) => handleFieldChange("category", e.target.value)}
                  className="bg-transparent border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground focus:outline-none focus:border-muted-foreground/40 appearance-none cursor-pointer transition-colors">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Tag className="size-3 text-muted-foreground/40 shrink-0" />
                  <input value={tags} onChange={(e) => handleFieldChange("tags", e.target.value)}
                    placeholder="tags separadas por vírgula..."
                    className="flex-1 bg-transparent text-[10px] text-muted-foreground focus:outline-none placeholder:text-muted-foreground/40 min-w-0" />
                </div>
              </div>

              {/* conteúdo com lock inline (modo visible) */}
              {mode === "visible" && isLocked ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                  <Lock className="size-5 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground text-center">
                    Conteúdo protegido. Digite a senha para continuar.
                  </p>
                  <div className="w-full max-w-xs space-y-2">
                    <div className="relative">
                      <input
                        type={unlockPwdShow ? "text" : "password"}
                        placeholder="Senha"
                        value={unlockPwd}
                        onChange={(e) => { setUnlockPwd(e.target.value); setUnlockError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                        autoFocus
                        className={`w-full bg-surface border rounded-xl px-3 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${unlockError ? "border-destructive/50" : "border-border focus:border-brand/40"}`}
                      />
                      <button type="button" onClick={() => setUnlockPwdShow((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {unlockPwdShow ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                    {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
                    <button onClick={handleUnlock} disabled={!unlockPwd.trim()}
                      className="w-full py-2 text-sm bg-brand text-brand-foreground rounded-xl hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Desbloquear
                    </button>
                  </div>
                </div>
              ) : noteType === "planilha" ? (
                <SpreadsheetEditor
                  key={selected.id}
                  content={content}
                  onChange={(val) => handleFieldChange("content", val)}
                />
              ) : (
                <textarea value={content} onChange={(e) => handleFieldChange("content", e.target.value)}
                  placeholder="Comece a escrever..."
                  className="flex-1 bg-transparent p-4 text-xs text-foreground resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed" />
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Modal: definir proteção ao arquivar ─────────────────────────────── */}
      {protModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Proteger esta anotação?</h2>
            </div>

            <div className="space-y-2">
              {([
                { value: "none",    label: "Não proteger",               desc: "Anotação arquivada fica visível normalmente" },
                { value: "visible", label: "Proteger e manter visível",  desc: "Título aparece, conteúdo exige senha" },
                { value: "hidden",  label: "Proteger e ocultar conteúdo", desc: "Exibe apenas \"Anotação protegida\", sem título" },
              ] as { value: ProtectionMode; label: string; desc: string }[]).map((opt) => (
                <label key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    protChoice === opt.value ? "border-brand/40 bg-brand/5" : "border-border hover:bg-white/5"
                  }`}>
                  <input type="radio" name="prot" value={opt.value}
                    checked={protChoice === opt.value}
                    onChange={() => { setProtChoice(opt.value as ProtectionMode); setProtError(""); }}
                    className="mt-0.5 accent-brand" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {protChoice !== "none" && (
              <div className="relative">
                <input type={protPwdShow ? "text" : "password"} placeholder="Digite a senha"
                  value={protPwd} onChange={(e) => { setProtPwd(e.target.value); setProtError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSetProtection()}
                  autoFocus
                  className={`w-full bg-white/5 border rounded-xl px-3 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${protError ? "border-destructive/50" : "border-border focus:border-brand/40"}`} />
                <button type="button" onClick={() => setProtPwdShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {protPwdShow ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                {protError && <p className="text-xs text-destructive mt-1">{protError}</p>}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setProtModal(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSetProtection}
                className="px-3 py-1.5 text-xs bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SpreadsheetEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (val: string) => void;
}) {
  const [grid, setGrid] = useState<GridData>(() => parseGrid(content));
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  function setCell(r: number, c: number, val: string) {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      onChange(JSON.stringify(next));
      return next;
    });
  }

  function addRow() {
    setGrid((prev) => {
      const cols = prev[0]?.length ?? 6;
      const next = [...prev, Array(cols).fill("")];
      onChange(JSON.stringify(next));
      return next;
    });
  }

  function addCol() {
    setGrid((prev) => {
      const next = prev.map((row) => [...row, ""]);
      onChange(JSON.stringify(next));
      return next;
    });
  }

  function handlePaste(e: React.ClipboardEvent, startR: number, startC: number) {
    const text = e.clipboardData.getData("text/plain");
    const pastedRows = text
      .split(/\r?\n/)
      .filter((line, i, arr) => !(i === arr.length - 1 && line === ""))
      .map((line) => line.split("\t"));

    if (pastedRows.length === 1 && pastedRows[0].length === 1) return; // colar texto simples normalmente

    e.preventDefault();
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      const neededRows = startR + pastedRows.length;
      const neededCols = startC + Math.max(...pastedRows.map((row) => row.length));

      while (next.length < neededRows) {
        next.push(Array(next[0]?.length ?? 6).fill(""));
      }
      if (neededCols > (next[0]?.length ?? 0)) {
        for (let i = 0; i < next.length; i++) {
          while (next[i].length < neededCols) next[i].push("");
        }
      }

      for (let pr = 0; pr < pastedRows.length; pr++) {
        for (let pc = 0; pc < pastedRows[pr].length; pc++) {
          next[startR + pr][startC + pc] = pastedRows[pr][pc];
        }
      }

      onChange(JSON.stringify(next));
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    const cols = grid[0]?.length ?? 6;
    if (e.key === "Tab") {
      e.preventDefault();
      if (c + 1 < cols) {
        inputRefs.current[r]?.[c + 1]?.focus();
      } else if (r + 1 < grid.length) {
        inputRefs.current[r + 1]?.[0]?.focus();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (r + 1 < grid.length) inputRefs.current[r + 1]?.[c]?.focus();
    } else if (e.key === "ArrowUp" && r > 0) {
      e.preventDefault();
      inputRefs.current[r - 1]?.[c]?.focus();
    } else if (e.key === "ArrowDown" && r + 1 < grid.length) {
      e.preventDefault();
      inputRefs.current[r + 1]?.[c]?.focus();
    }
  }

  const colLetters = (grid[0]?.length ?? 0);

  return (
    <div className="flex-1 overflow-auto p-2">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-8 min-w-[2rem] bg-secondary/40 border border-border/60" />
            {Array.from({ length: colLetters }, (_, c) => (
              <th key={c} className="min-w-[100px] bg-secondary/40 border border-border/60 px-2 py-1 text-[9px] font-semibold text-muted-foreground text-center">
                {String.fromCharCode(65 + c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              <td className="bg-secondary/20 border border-border/60 text-[9px] text-muted-foreground text-center w-8 select-none">
                {r + 1}
              </td>
              {row.map((cell, c) => (
                <td key={c} className="border border-border/60 p-0">
                  <input
                    ref={(el) => {
                      if (!inputRefs.current[r]) inputRefs.current[r] = [];
                      inputRefs.current[r][c] = el;
                    }}
                    value={cell}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, r, c)}
                    onPaste={(e) => handlePaste(e, r, c)}
                    className="w-full px-2 py-1 text-xs text-foreground bg-transparent focus:outline-none focus:bg-brand/5 min-w-[100px]"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-3 pl-8">
        <button
          onClick={addRow}
          className="text-[10px] text-muted-foreground hover:text-foreground border border-border/60 rounded px-2.5 py-1 transition-colors hover:bg-surface-2"
        >
          + Linha
        </button>
        <button
          onClick={addCol}
          className="text-[10px] text-muted-foreground hover:text-foreground border border-border/60 rounded px-2.5 py-1 transition-colors hover:bg-surface-2"
        >
          + Coluna
        </button>
      </div>
    </div>
  );
}
