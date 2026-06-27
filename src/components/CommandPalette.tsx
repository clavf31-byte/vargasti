import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search, Mail, FileSpreadsheet, MessageCircle, FolderKanban, NotebookPen,
  Files, Settings, LayoutDashboard, Users, Banknote, ScrollText, FileText,
  Building2, CalendarDays, type LucideIcon, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NAV_COMMANDS: { id: string; label: string; icon: LucideIcon; path: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "emails", label: "Email Agent", icon: Mail, path: "/ferramentas/emails" },
  { id: "excel", label: "Excel Tool", icon: FileSpreadsheet, path: "/ferramentas/excel" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, path: "/ferramentas/whatsapp" },
  { id: "projetos", label: "Projetos", icon: FolderKanban, path: "/projetos" },
  { id: "anotacoes", label: "Anotações", icon: NotebookPen, path: "/anotacoes" },
  { id: "agenda", label: "Agenda", icon: CalendarDays, path: "/agenda" },
  { id: "crm", label: "CRM", icon: Users, path: "/crm" },
  { id: "clientes", label: "Clientes", icon: Building2, path: "/crm/clientes" },
  { id: "contratos", label: "Contratos", icon: FileText, path: "/crm/contratos" },
  { id: "orcamentos", label: "Orçamentos", icon: ScrollText, path: "/crm/orcamentos" },
  { id: "pagamentos", label: "Pagamentos", icon: Banknote, path: "/crm/pagamentos" },
  { id: "arquivos", label: "Arquivos", icon: Files, path: "/arquivos" },
  { id: "config", label: "Configurações", icon: Settings, path: "/config" },
];

type ResultItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  path: string;
  group: string;
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [dbResults, setDbResults] = useState<ResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [cursor, setCursor] = useState(0);

  const filteredNav = useMemo<ResultItem[]>(() => {
    const q = search.toLowerCase();
    return NAV_COMMANDS.filter((c) => !q || c.label.toLowerCase().includes(q)).map((c) => ({
      ...c,
      group: "Páginas",
    }));
  }, [search]);

  const groupedDb = useMemo(() => {
    const map: Record<string, ResultItem[]> = {};
    for (const r of dbResults) {
      (map[r.group] ??= []).push(r);
    }
    return map;
  }, [dbResults]);

  const allItems = useMemo<ResultItem[]>(() => [...filteredNav, ...dbResults], [filteredNav, dbResults]);

  const handleSelect = useCallback(
    (path: string) => {
      navigate({ to: path as any });
      onClose();
      setSearch("");
      setDbResults([]);
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [search, dbResults.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        setSearch("");
        setDbResults([]);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === "Enter") {
        const item = allItems[cursor];
        if (item) handleSelect(item.path);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, allItems, cursor, handleSelect, onClose]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setDbResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const [clientesRes, contratosRes, orcamentosRes] = await Promise.all([
        supabase.from("clientes").select("id, nome, email").ilike("nome", `%${q}%`).limit(6),
        supabase.from("contracts").select("id, titulo, status").ilike("titulo", `%${q}%`).limit(4),
        supabase.from("orcamentos").select("id, numero_formatado, status").ilike("numero_formatado", `%${q}%`).limit(4),
      ]);

      const results: ResultItem[] = [
        ...(clientesRes.data ?? []).map((c) => ({
          id: `cliente-${c.id}`,
          label: c.nome,
          subtitle: c.email ?? undefined,
          icon: Building2 as LucideIcon,
          path: `/crm/clientes/${c.id}`,
          group: "Clientes",
        })),
        ...(contratosRes.data ?? []).map((c) => ({
          id: `contrato-${c.id}`,
          label: c.titulo,
          subtitle: c.status,
          icon: FileText as LucideIcon,
          path: `/crm/contratos/${c.id}`,
          group: "Contratos",
        })),
        ...(orcamentosRes.data ?? []).map((o) => ({
          id: `orc-${o.id}`,
          label: o.numero_formatado ?? "—",
          subtitle: o.status,
          icon: ScrollText as LucideIcon,
          path: `/crm/orcamentos/${o.id}`,
          group: "Orçamentos",
        })),
      ];

      setDbResults(results);
      setSearching(false);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          {searching ? (
            <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
          ) : (
            <Search className="size-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar páginas, clientes, contratos, orçamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground px-2 py-1 border border-border/30 rounded shrink-0">
            ESC
          </span>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="py-1">
              {filteredNav.length > 0 && (
                <Section label="Páginas">
                  {filteredNav.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <ResultRow
                        key={item.id}
                        item={item}
                        active={cursor === idx}
                        onSelect={() => handleSelect(item.path)}
                        onHover={() => setCursor(idx)}
                      />
                    );
                  })}
                </Section>
              )}

              {Object.entries(groupedDb).map(([group, items]) => (
                <Section key={group} label={group}>
                  {items.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <ResultRow
                        key={item.id}
                        item={item}
                        active={cursor === idx}
                        onSelect={() => handleSelect(item.path)}
                        onHover={() => setCursor(idx)}
                      />
                    );
                  })}
                </Section>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/50 bg-surface-2/30 flex items-center gap-4 text-[10px] text-muted-foreground/60">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>ESC fechar</span>
          {search.length === 1 && (
            <span className="ml-auto">Digite mais 1 caractere para buscar dados</span>
          )}
        </div>
      </div>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 -z-10" />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({
  item,
  active,
  onSelect,
  onHover,
}: {
  item: ResultItem;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
        active ? "bg-brand/10" : "hover:bg-surface-2"
      }`}
    >
      <item.icon
        className={`size-4 shrink-0 ${active ? "text-brand" : "text-muted-foreground"}`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${active ? "text-brand" : "text-foreground"}`}>
          {item.label}
        </p>
        {item.subtitle && (
          <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
        )}
      </div>
    </button>
  );
}
