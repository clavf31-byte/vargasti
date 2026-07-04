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
  AlignLeft, AlignCenter, AlignRight, Palette, CheckSquare, Type,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type CellFmt = { b?: boolean; i?: boolean; a?: "l" | "c" | "r"; s?: number };

const TEXT_FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28];
const SHEET_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36];

function getTextFontSize(tags: string): number {
  const m = (tags ?? "").match(/__fs:(\d+)/);
  return m ? parseInt(m[1]) : 13;
}

function setTextFontSizeInTags(tags: string, size: number): string {
  const t = (tags ?? "").replace(/,?\s*__fs:\d+/, "").trim();
  return size === 13 ? t : (t ? `${t},__fs:${size}` : `__fs:${size}`);
}

type SheetData = {
  v: 2;
  rows: string[][];
  fmt: Record<string, CellFmt>;
  cw: number[];
};

function emptySheet(cols = 6, rows = 10): SheetData {
  return { v: 2, rows: Array.from({ length: rows }, () => Array(cols).fill("")), fmt: {}, cw: Array(cols).fill(120) };
}

function parseSheet(content: string): SheetData {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.v === 2) return parsed as SheetData;
    if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
      return { v: 2, rows: parsed as string[][], fmt: {}, cw: Array((parsed[0] as string[]).length).fill(120) };
    }
  } catch {}
  return emptySheet();
}

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos status" },
  ...STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
];
const CATEGORY_OPTIONS = [
  { value: "todas", label: "Todas cat." },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

function FilterDropdown({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex-1 border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground flex items-center justify-between gap-1 focus:outline-none hover:border-muted-foreground/40 bg-surface-2 min-w-0">
          <span className="truncate">{current?.label ?? value}</span>
          <ChevronDown className="size-2.5 opacity-60 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[130px]">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => onChange(o.value)}
            className={value === o.value ? "font-semibold" : ""}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // sincronizar conteúdo ao abrir nota (não a cada keystroke)
  useEffect(() => {
    if (contentEditableRef.current && selected && content !== undefined) {
      contentEditableRef.current.innerHTML = content;
    }
  }, [selected?.id]);

  // toolbar formatting
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentEditableRef.current?.focus();
  };

  const applyColor = (color: string) => {
    document.execCommand("foreColor", false, color);
    contentEditableRef.current?.focus();
  };

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
    const initialContent = type === "planilha" ? JSON.stringify(emptySheet()) : "";
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
          updates.content = JSON.stringify(emptySheet());
          setContent(updates.content);
        }
      } else {
        // voltando para texto: limpa o JSON do grid
        try {
          const p = JSON.parse(content);
          if ((Array.isArray(p) && Array.isArray(p[0])) || (p && p.v === 2)) {
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
        <div className={`bg-background ${layoutMode === "vertical" ? "w-64 border-r" : "h-40 border-b"} border-border flex ${layoutMode === "vertical" ? "flex-col" : "flex-row"} shrink-0 overflow-x-auto`}>
          {/* Header da sidebar */}
          <div className={`px-3 pt-3 pb-2 border-b border-border space-y-2 ${layoutMode === "horizontal" ? "flex items-center gap-2" : ""}`}>
            <div className="flex items-center justify-between flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Anotações</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLayoutMode(layoutMode === "vertical" ? "horizontal" : "vertical")}
                  title={`Trocar para ${layoutMode === "vertical" ? "horizontal" : "vertical"}`}
                  className="p-1.5 rounded-lg bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                >
                  {layoutMode === "vertical" ? <LayoutList className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
                </button>
              </div>
            </div>
            {layoutMode === "horizontal" && (
              <div className="flex gap-1.5">
                <FilterDropdown options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
                <FilterDropdown options={CATEGORY_OPTIONS} value={filterCategory} onChange={setFilterCategory} />
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setShowNewMenu((v) => !v)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-2 border border-border text-foreground text-[10px] font-medium hover:bg-surface-2/80 transition-colors"
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
                <FilterDropdown options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
                <FilterDropdown options={CATEGORY_OPTIONS} value={filterCategory} onChange={setFilterCategory} />
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
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm bg-surface-2 border border-border text-foreground rounded-xl hover:bg-surface-2 transition-colors">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`border rounded-lg px-2 py-1 text-[10px] font-medium cursor-pointer transition-colors flex items-center gap-1 focus:outline-none ${STATUS_COLORS[noteStatus] || "border-border text-muted-foreground"}`}>
                      {noteStatus.charAt(0).toUpperCase() + noteStatus.slice(1)}
                      <ChevronDown className="size-2.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[120px]">
                    {STATUSES.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => handleFieldChange("status", s)}
                        className={s === noteStatus ? "font-semibold" : ""}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground cursor-pointer transition-colors flex items-center gap-1 focus:outline-none hover:border-muted-foreground/40">
                      {category}
                      <ChevronDown className="size-2.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[110px]">
                    {CATEGORIES.map((c) => (
                      <DropdownMenuItem key={c} onClick={() => handleFieldChange("category", c)}
                        className={c === category ? "font-semibold" : ""}>
                        {c}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {noteType !== "planilha" && (
                  <select
                    value={getTextFontSize(tags)}
                    onChange={(e) => handleFieldChange("tags", setTextFontSizeInTags(tags, parseInt(e.target.value)))}
                    title="Tamanho da fonte"
                    className="bg-transparent border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground focus:outline-none appearance-none cursor-pointer"
                  >
                    {TEXT_FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
                  </select>
                )}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Tag className="size-3 text-muted-foreground/40 shrink-0" />
                  <input value={displayTags(tags)} onChange={(e) => handleFieldChange("tags", e.target.value)}
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
                <div className="flex-1 flex flex-col">
                  {/* Toolbar de formatação */}
                  <div className="flex items-center gap-1 px-4 py-2 border-b border-border/60 bg-surface-2/30">
                    <button onClick={() => applyFormat("strikethrough")} title="Riscado (Alt+Shift+5)"
                      className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Type className="size-4" />
                    </button>
                    <div className="w-px h-4 bg-border/40" />
                    <button onClick={() => applyColor("#ef4444")} title="Vermelho"
                      className="w-6 h-6 rounded hover:scale-110 transition-transform" style={{ background: "#ef4444" }} />
                    <button onClick={() => applyColor("#f59e0b")} title="Laranja"
                      className="w-6 h-6 rounded hover:scale-110 transition-transform" style={{ background: "#f59e0b" }} />
                    <button onClick={() => applyColor("#3b82f6")} title="Azul"
                      className="w-6 h-6 rounded hover:scale-110 transition-transform" style={{ background: "#3b82f6" }} />
                    <button onClick={() => applyColor("#10b981")} title="Verde"
                      className="w-6 h-6 rounded hover:scale-110 transition-transform" style={{ background: "#10b981" }} />
                    <button onClick={() => applyColor(getComputedStyle(document.documentElement).getPropertyValue('--foreground'))} title="Resetar cor"
                      className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors text-xs">✕</button>
                    <div className="w-px h-4 bg-border/40" />
                    <button onClick={() => applyFormat("insertUnorderedList")} title="Lista"
                      className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors">
                      <CheckSquare className="size-4" />
                    </button>
                  </div>
                  {/* Editor */}
                  <div ref={contentEditableRef} contentEditable suppressContentEditableWarning
                    onInput={(e) => handleFieldChange("content", e.currentTarget.innerHTML)}
                    style={{ fontSize: `${getTextFontSize(tags)}px` }}
                    className="flex-1 bg-transparent p-4 text-foreground focus:outline-none placeholder:text-muted-foreground leading-relaxed overflow-y-auto"
                  />
                </div>
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
  const [sheet, setSheet] = useState<SheetData>(() => parseSheet(content));
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [sel, setSel] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const isDragging = useRef(false);
  const resizingRef = useRef<{ col: number; startX: number; startW: number } | null>(null);
  const sheetRef = useRef(sheet);
  useEffect(() => { sheetRef.current = sheet; }, [sheet]);

  function commit(next: SheetData) {
    setSheet(next);
    onChange(JSON.stringify(next));
  }

  function setCell(r: number, c: number, val: string) {
    const rows = sheet.rows.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : [...row]
    );
    commit({ ...sheet, rows });
  }

  function addRow() {
    const cols = sheet.rows[0]?.length ?? 6;
    commit({ ...sheet, rows: [...sheet.rows, Array(cols).fill("")] });
  }

  function addCol() {
    commit({
      ...sheet,
      rows: sheet.rows.map((row) => [...row, ""]),
      cw: [...sheet.cw, 120],
    });
  }

  function handlePaste(e: React.ClipboardEvent, startR: number, startC: number) {
    const text = e.clipboardData.getData("text/plain");
    const pastedRows = text
      .split(/\r?\n/)
      .filter((line, i, arr) => !(i === arr.length - 1 && line === ""))
      .map((line) => line.split("\t"));

    if (pastedRows.length === 1 && pastedRows[0].length === 1) return;

    e.preventDefault();
    const rows = sheet.rows.map((row) => [...row]);
    const cw = [...sheet.cw];
    const neededRows = startR + pastedRows.length;
    const neededCols = startC + Math.max(...pastedRows.map((r) => r.length));

    while (rows.length < neededRows) rows.push(Array(rows[0]?.length ?? 6).fill(""));
    if (neededCols > (rows[0]?.length ?? 0)) {
      for (let i = 0; i < rows.length; i++) while (rows[i].length < neededCols) rows[i].push("");
      while (cw.length < neededCols) cw.push(120);
    }
    for (let pr = 0; pr < pastedRows.length; pr++)
      for (let pc = 0; pc < pastedRows[pr].length; pc++)
        rows[startR + pr][startC + pc] = pastedRows[pr][pc];

    commit({ ...sheet, rows, cw });
  }

  // Selection range (normalized)
  const selRange = sel ? {
    minR: Math.min(sel.r1, sel.r2), maxR: Math.max(sel.r1, sel.r2),
    minC: Math.min(sel.c1, sel.c2), maxC: Math.max(sel.c1, sel.c2),
  } : activeCell ? { minR: activeCell[0], maxR: activeCell[0], minC: activeCell[1], maxC: activeCell[1] } : null;

  function inSel(r: number, c: number) {
    return selRange ? r >= selRange.minR && r <= selRange.maxR && c >= selRange.minC && c <= selRange.maxC : false;
  }

  // Formatting — applies to all cells in selection
  const getFmt = (r: number, c: number): CellFmt => sheet.fmt[`${r},${c}`] ?? {};

  const activeFmt: CellFmt = selRange ? (() => {
    let b = true, i = true;
    let a: "l" | "c" | "r" | undefined = sheet.fmt[`${selRange.minR},${selRange.minC}`]?.a;
    let first = true;
    for (let r = selRange.minR; r <= selRange.maxR; r++) {
      for (let c = selRange.minC; c <= selRange.maxC; c++) {
        const f = sheet.fmt[`${r},${c}`] ?? {};
        if (!f.b) b = false;
        if (!f.i) i = false;
        if (!first && f.a !== a) a = undefined;
        first = false;
      }
    }
    return { b, i, a };
  })() : {};

  function applyFmt(key: "b" | "i") {
    if (!selRange) return;
    const allOn = (() => {
      for (let r = selRange.minR; r <= selRange.maxR; r++)
        for (let c = selRange.minC; c <= selRange.maxC; c++)
          if (!sheet.fmt[`${r},${c}`]?.[key]) return false;
      return true;
    })();
    const newFmt = { ...sheet.fmt };
    for (let r = selRange.minR; r <= selRange.maxR; r++)
      for (let c = selRange.minC; c <= selRange.maxC; c++) {
        const k = `${r},${c}`;
        newFmt[k] = { ...(newFmt[k] ?? {}), [key]: !allOn };
      }
    commit({ ...sheet, fmt: newFmt });
  }

  function applySize(s: number) {
    if (!selRange) return;
    const newFmt = { ...sheet.fmt };
    for (let r = selRange.minR; r <= selRange.maxR; r++)
      for (let c = selRange.minC; c <= selRange.maxC; c++) {
        const k = `${r},${c}`;
        newFmt[k] = { ...(newFmt[k] ?? {}), s };
      }
    commit({ ...sheet, fmt: newFmt });
  }

  function applyAlign(a: "l" | "c" | "r") {
    if (!selRange) return;
    const single = selRange.minR === selRange.maxR && selRange.minC === selRange.maxC;
    const toggle = single && sheet.fmt[`${selRange.minR},${selRange.minC}`]?.a === a;
    const newFmt = { ...sheet.fmt };
    for (let r = selRange.minR; r <= selRange.maxR; r++)
      for (let c = selRange.minC; c <= selRange.maxC; c++) {
        const k = `${r},${c}`;
        newFmt[k] = { ...(newFmt[k] ?? {}), a: toggle ? undefined : a };
      }
    commit({ ...sheet, fmt: newFmt });
  }

  function handleKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    const cols = sheet.rows[0]?.length ?? 6;
    const numRows = sheet.rows.length;
    if (e.ctrlKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setSel({ r1: 0, c1: 0, r2: numRows - 1, c2: cols - 1 });
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "b") { e.preventDefault(); applyFmt("b"); return; }
    if (e.ctrlKey && e.key.toLowerCase() === "i") { e.preventDefault(); applyFmt("i"); return; }

    if (e.key === "Tab") {
      e.preventDefault();
      if (c + 1 < cols) inputRefs.current[r]?.[c + 1]?.focus();
      else if (r + 1 < numRows) inputRefs.current[r + 1]?.[0]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (r + 1 < numRows) inputRefs.current[r + 1]?.[c]?.focus();
    } else if (e.key === "ArrowUp") {
      if (e.shiftKey && sel) { e.preventDefault(); setSel((s) => s ? { ...s, r2: Math.max(0, s.r2 - 1) } : null); }
      else if (r > 0) { e.preventDefault(); inputRefs.current[r - 1]?.[c]?.focus(); }
    } else if (e.key === "ArrowDown") {
      if (e.shiftKey && sel) { e.preventDefault(); setSel((s) => s ? { ...s, r2: Math.min(numRows - 1, s.r2 + 1) } : null); }
      else if (r + 1 < numRows) { e.preventDefault(); inputRefs.current[r + 1]?.[c]?.focus(); }
    } else if (e.key === "ArrowLeft" && e.shiftKey && sel) {
      e.preventDefault(); setSel((s) => s ? { ...s, c2: Math.max(0, s.c2 - 1) } : null);
    } else if (e.key === "ArrowRight" && e.shiftKey && sel) {
      e.preventDefault(); setSel((s) => s ? { ...s, c2: Math.min(cols - 1, s.c2 + 1) } : null);
    }
  }

  // Column resize + drag selection cleanup
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const rs = resizingRef.current;
      if (!rs) return;
      const newW = Math.max(50, rs.startW + e.clientX - rs.startX);
      setSheet((prev) => {
        const cw = [...prev.cw];
        cw[rs.col] = newW;
        return { ...prev, cw };
      });
    }
    function onUp() {
      if (resizingRef.current) {
        resizingRef.current = null;
        onChange(JSON.stringify(sheetRef.current));
      }
      isDragging.current = false;
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [onChange]);

  const numCols = sheet.rows[0]?.length ?? 6;
  const hasSelection = selRange !== null;
  const activeFontSize = selRange ? (sheet.fmt[`${selRange.minR},${selRange.minC}`]?.s ?? 12) : 12;

  const btnCls = (active: boolean) =>
    `px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center justify-center ${
      active
        ? "bg-brand text-white border-brand"
        : "text-muted-foreground border-border hover:border-brand/40 disabled:opacity-30"
    }`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/60 bg-secondary/20 shrink-0">
        <button onClick={() => applyFmt("b")} disabled={!hasSelection} className={btnCls(!!activeFmt.b)} title="Negrito (Ctrl+B)">
          <span className="font-black text-[12px]">B</span>
        </button>
        <button onClick={() => applyFmt("i")} disabled={!hasSelection} className={btnCls(!!activeFmt.i)} title="Itálico (Ctrl+I)">
          <span className="italic text-[12px]">I</span>
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button onClick={() => applyAlign("l")} disabled={!hasSelection} className={btnCls(activeFmt.a === "l")} title="Alinhar à esquerda">
          <AlignLeft className="size-3.5" />
        </button>
        <button onClick={() => applyAlign("c")} disabled={!hasSelection} className={btnCls(activeFmt.a === "c")} title="Centralizar">
          <AlignCenter className="size-3.5" />
        </button>
        <button onClick={() => applyAlign("r")} disabled={!hasSelection} className={btnCls(activeFmt.a === "r")} title="Alinhar à direita">
          <AlignRight className="size-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <select
          value={activeFontSize}
          onChange={(e) => applySize(parseInt(e.target.value))}
          disabled={!hasSelection}
          title="Tamanho da fonte"
          className="text-[11px] text-muted-foreground bg-transparent border border-border rounded px-1 py-0.5 focus:outline-none cursor-pointer disabled:opacity-30"
        >
          {SHEET_FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex gap-1.5">
          <button onClick={addRow} className="text-[10px] text-muted-foreground hover:text-foreground border border-border/60 rounded px-2 py-1 transition-colors hover:bg-surface-2">
            + Linha
          </button>
          <button onClick={addCol} className="text-[10px] text-muted-foreground hover:text-foreground border border-border/60 rounded px-2 py-1 transition-colors hover:bg-surface-2">
            + Coluna
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-2 select-none">
        <table className="border-collapse text-xs" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="w-8 bg-secondary/40 border border-border/60" />
              {Array.from({ length: numCols }, (_, c) => (
                <th
                  key={c}
                  className="relative bg-secondary/40 border border-border/60 px-2 py-1 text-[9px] font-semibold text-muted-foreground text-center select-none overflow-hidden"
                  style={{ width: sheet.cw[c] ?? 120 }}
                >
                  {String.fromCharCode(65 + c)}
                  <span
                    onMouseDown={(e) => {
                      e.preventDefault();
                      resizingRef.current = { col: c, startX: e.clientX, startW: sheet.cw[c] ?? 120 };
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-brand/30"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, r) => (
              <tr key={r}>
                <td className="bg-secondary/20 border border-border/60 text-[9px] text-muted-foreground text-center w-8 select-none">
                  {r + 1}
                </td>
                {row.map((cell, c) => {
                  const fmt = getFmt(r, c);
                  const isActive = activeCell?.[0] === r && activeCell?.[1] === c;
                  const selected = inSel(r, c);
                  return (
                    <td
                      key={c}
                      className={`border border-border/60 p-0 ${
                        isActive
                          ? "outline outline-1 outline-brand/70 outline-offset-[-1px] bg-brand/5"
                          : selected ? "bg-brand/15" : ""
                      }`}
                      onMouseDown={(e) => {
                        if (resizingRef.current) return;
                        if (e.shiftKey && sel) {
                          e.preventDefault();
                          setSel({ ...sel, r2: r, c2: c });
                          return;
                        }
                        isDragging.current = true;
                        setSel({ r1: r, c1: c, r2: r, c2: c });
                        setActiveCell([r, c]);
                        inputRefs.current[r]?.[c]?.focus();
                      }}
                      onMouseEnter={() => {
                        if (isDragging.current) {
                          setSel((s) => s ? { ...s, r2: r, c2: c } : null);
                        }
                      }}
                    >
                      <input
                        ref={(el) => {
                          if (!inputRefs.current[r]) inputRefs.current[r] = [];
                          inputRefs.current[r][c] = el;
                        }}
                        value={cell}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                        onPaste={(e) => handlePaste(e, r, c)}
                        onFocus={() => {
                          setActiveCell([r, c]);
                          if (!isDragging.current) setSel({ r1: r, c1: c, r2: r, c2: c });
                        }}
                        style={{
                          fontWeight: fmt.b ? "bold" : "normal",
                          fontStyle: fmt.i ? "italic" : "normal",
                          textAlign: fmt.a === "c" ? "center" : fmt.a === "r" ? "right" : "left",
                          fontSize: `${fmt.s ?? 12}px`,
                          width: "100%",
                          userSelect: "text",
                        }}
                        className="px-2 py-1 text-foreground bg-transparent focus:outline-none"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
